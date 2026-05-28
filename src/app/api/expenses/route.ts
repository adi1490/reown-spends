import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';

// 1. GET /api/expenses — Fetch paginated ledger entries with advanced searching and filtering
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || '';
    const categoriesParam = searchParams.get('categories') || '';
    const paidByParam = searchParams.get('paid_by') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = getSupabaseAdmin();
    
    // Construct base query
    // Join with 'users' to show the user's name as 'logged_by_name'
    let query = supabase
      .from('expenses')
      .select('*, users(name)', { count: 'exact' });

    // Full-text search
    if (search) {
      query = query.or(`vendor.ilike.%${search}%,description.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    // Categories filter (comma-separated multi-select)
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (categories.length > 0) {
        query = query.in('category', categories);
      }
    }

    // Paid By filter (comma-separated multi-select)
    if (paidByParam) {
      const paidBy = paidByParam.split(',').map(p => p.trim()).filter(Boolean);
      if (paidBy.length > 0) {
        query = query.in('paid_by', paidBy);
      }
    }

    // Date range picker filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Sorting columns: date, amount, category, paid_by
    const allowedSortColumns = ['date', 'amount', 'category', 'paid_by'];
    const actualSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'date';
    const actualSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.order(actualSortBy, { ascending: actualSortOrder === 'asc' });

    // Pagination bounds
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: expenses, count, error } = await query;

    if (error) {
      console.error('Database query error:', error.message);
      return NextResponse.json({ error: 'Could not fetch expenses.' }, { status: 500 });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Map response to include user name directly for frontend ease
    const mappedExpenses = (expenses || []).map((exp: any) => ({
      ...exp,
      logged_by_name: exp.users?.name || 'Unknown User',
      users: undefined // remove nested join object
    }));

    return NextResponse.json({
      expenses: mappedExpenses,
      totalCount,
      page,
      totalPages,
      limit
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/expenses:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// 2. POST /api/expenses — Create a new expense entry and log it in the audit trail
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

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
    today.setHours(23, 59, 59, 999); // Allow today's dates
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

    // 1. Insert new expense
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert({
        date,
        amount: numAmount,
        category,
        paid_by,
        vendor,
        description,
        notes: notes || null,
        receipt_path: receipt_path || null,
        receipt_name: receipt_name || null,
        logged_by: user.userId
      })
      .select('*, users(name)')
      .single();

    if (insertError || !newExpense) {
      console.error('Error inserting expense:', insertError?.message);
      return NextResponse.json({ error: 'Could not create expense entry.' }, { status: 500 });
    }

    // Map user name for response
    const formattedExpense = {
      ...newExpense,
      logged_by_name: newExpense.users?.name || user.name,
      users: undefined
    };

    // 2. Insert transaction into audit_log
    const { error: logError } = await supabase
      .from('audit_log')
      .insert({
        performed_by: user.userId,
        action: 'CREATED',
        entity: 'expense',
        entity_id: formattedExpense.id,
        snapshot: formattedExpense
      });

    if (logError) {
      console.error('Audit trail logging failed for CREATE:', logError.message);
      // We don't fail the entire response, since the database write succeeded
    }

    return NextResponse.json({ success: true, expense: formattedExpense }, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/expenses:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
