import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';

// Helper type for Next.js App Router context params
interface Context {
  params: Promise<{ id: string }>;
}

// 1. GET /api/expenses/[id] — Retrieve detailed view of a single expense and sign its receipt
export async function GET(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*, users(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching single expense:', error.message);
      return NextResponse.json({ error: 'Could not fetch expense detail.' }, { status: 500 });
    }

    if (!expense) {
      return NextResponse.json({ error: 'Expense record not found.' }, { status: 404 });
    }

    let receiptSignedUrl: string | null = null;

    // Generate short-lived signed URL for private bucket attachments
    if (expense.receipt_path) {
      const { data: signedData, error: signError } = await supabase
        .storage
        .from('receipts')
        .createSignedUrl(expense.receipt_path, 3600); // 60 minutes

      if (signError) {
        console.warn('Failed to sign receipt URL:', signError.message);
      } else if (signedData) {
        receiptSignedUrl = signedData.signedUrl;
      }
    }

    const formattedExpense = {
      ...expense,
      logged_by_name: expense.users?.name || 'Unknown User',
      users: undefined,
      receipt_signed_url: receiptSignedUrl
    };

    return NextResponse.json(formattedExpense);
  } catch (err: any) {
    console.error('Unexpected error in GET /api/expenses/[id]:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// 2. PUT /api/expenses/[id] — Update an expense, handle attachments, and log the diff
export async function PUT(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { date, amount, category, paid_by, vendor, description, notes, receipt_path, receipt_name } = body;

    // Field Validations
    if (!date || !amount || !category || !paid_by || !vendor || !description) {
      return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number greater than 0.' }, { status: 400 });
    }

    const parsedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(parsedDate.getTime()) || parsedDate > today) {
      return NextResponse.json({ error: 'Date cannot be in the future.' }, { status: 400 });
    }

    if (vendor.length > 120) {
      return NextResponse.json({ error: 'Vendor name cannot exceed 120 characters.' }, { status: 400 });
    }

    if (description.length > 500) {
      return NextResponse.json({ error: 'Description cannot exceed 500 characters.' }, { status: 400 });
    }

    if (notes && notes.length > 500) {
      return NextResponse.json({ error: 'Internal notes cannot exceed 500 characters.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch original record for "before" snapshot
    const { data: originalExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*, users(name)')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !originalExpense) {
      console.error('Error fetching original record for edit:', fetchError?.message);
      return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
    }

    const beforeState = {
      ...originalExpense,
      logged_by_name: originalExpense.users?.name || 'Unknown User',
      users: undefined
    };

    // 2. Perform database update
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update({
        date,
        amount: numAmount,
        category,
        paid_by,
        vendor,
        description,
        notes: notes || null,
        receipt_path: receipt_path !== undefined ? receipt_path : originalExpense.receipt_path,
        receipt_name: receipt_name !== undefined ? receipt_name : originalExpense.receipt_name,
        updated_at: new Date().toISOString()
      })
      .select('*, users(name)')
      .single();

    if (updateError || !updatedExpense) {
      console.error('Error updating record:', updateError?.message);
      return NextResponse.json({ error: 'Could not update expense details.' }, { status: 500 });
    }

    const afterState = {
      ...updatedExpense,
      logged_by_name: updatedExpense.users?.name || user.name,
      users: undefined
    };

    // 3. Log UPDATED transaction to the audit trail
    const { error: logError } = await supabase
      .from('audit_log')
      .insert({
        performed_by: user.userId,
        action: 'UPDATED',
        entity: 'expense',
        entity_id: id,
        snapshot: {
          before: beforeState,
          after: afterState
        }
      });

    if (logError) {
      console.error('Audit trail logging failed for UPDATE:', logError.message);
    }

    return NextResponse.json({ success: true, expense: afterState });
  } catch (err: any) {
    console.error('Unexpected error in PUT /api/expenses/[id]:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// 3. DELETE /api/expenses/[id] — Delete an expense and delete its attachment from Supabase Storage
export async function DELETE(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    // 1. Fetch original record for "deleted" snapshot and to retrieve receipt path
    const { data: originalExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*, users(name)')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !originalExpense) {
      console.error('Error fetching record for deletion:', fetchError?.message);
      return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
    }

    const deletedState = {
      ...originalExpense,
      logged_by_name: originalExpense.users?.name || 'Unknown User',
      users: undefined
    };

    // 2. Delete attachment from Storage if present
    if (originalExpense.receipt_path) {
      const { error: storageError } = await supabase
        .storage
        .from('receipts')
        .remove([originalExpense.receipt_path]);

      if (storageError) {
        console.warn('Could not delete receipt file from storage:', storageError.message);
      } else {
        console.log('Successfully deleted associated receipt file:', originalExpense.receipt_path);
      }
    }

    // 3. Delete expense from database
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting expense:', deleteError.message);
      return NextResponse.json({ error: 'Could not delete expense record.' }, { status: 500 });
    }

    // 4. Log DELETED transaction to the audit trail
    const { error: logError } = await supabase
      .from('audit_log')
      .insert({
        performed_by: user.userId,
        action: 'DELETED',
        entity: 'expense',
        entity_id: id,
        snapshot: deletedState
      });

    if (logError) {
      console.error('Audit trail logging failed for DELETE:', logError.message);
    }

    return NextResponse.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/expenses/[id]:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
