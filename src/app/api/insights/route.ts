import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate') || '';
    const endDateParam = searchParams.get('endDate') || '';

    const supabase = getSupabaseAdmin();

    // 1. Fetch all expenses
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching insights expenses:', error.message);
      return NextResponse.json({ error: 'Could not compute insights.' }, { status: 500 });
    }

    const allExpenses = expenses || [];

    // Filter expenses by active date range (for summary cards and target range charts)
    let filteredExpenses = allExpenses;
    if (startDateParam) {
      filteredExpenses = filteredExpenses.filter(e => e.date >= startDateParam);
    }
    if (endDateParam) {
      filteredExpenses = filteredExpenses.filter(e => e.date <= endDateParam);
    }

    // 2. Compute Summary Cards
    // Total Spent (Filtered)
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Current Month & Last Month Spent (using local/UTC dates)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const thisMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    
    // Get last month details
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthStr = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}`;

    const thisMonthExpenses = allExpenses.filter(e => e.date.startsWith(thisMonthStr));
    const lastMonthExpenses = allExpenses.filter(e => e.date.startsWith(lastMonthStr));

    const thisMonthSpent = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const lastMonthSpent = lastMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Largest Expense (Filtered)
    let largestExpense = { amount: 0, vendor: 'N/A' };
    if (filteredExpenses.length > 0) {
      const sortedByAmount = [...filteredExpenses].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      largestExpense = {
        amount: parseFloat(sortedByAmount[0].amount),
        vendor: sortedByAmount[0].vendor
      };
    }

    // 3. Compute Monthly Spend Bar Chart (Last 12 Months - chronological)
    const monthlyMap: Record<string, number> = {};
    // Seed last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // "Aug 2025"
      monthlyMap[key] = 0;
    }

    allExpenses.forEach(e => {
      const expDate = new Date(e.date);
      const key = expDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += parseFloat(e.amount);
      }
    });

    const monthlyHistory = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount: parseFloat(amount.toFixed(2))
    }));

    // 4. Compute Category Breakdown (Pie/Doughnut Chart - Filtered)
    const categoryMap: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + parseFloat(e.amount);
    });

    const categoryDistribution = Object.entries(categoryMap).map(([category, amount]) => {
      const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      return {
        category,
        amount: parseFloat(amount.toFixed(2)),
        percentage: parseFloat(pct.toFixed(1))
      };
    }).sort((a, b) => b.amount - a.amount);

    // 5. Compute Payment Source Breakdown (Bar Chart - Filtered)
    const sourceMap: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      sourceMap[e.paid_by] = (sourceMap[e.paid_by] || 0) + parseFloat(e.amount);
    });

    const sourceDistribution = Object.entries(sourceMap).map(([source, amount]) => ({
      source,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    // 6. Compute Spend Over Time Line Chart (Cumulative Spending Curve - Filtered)
    const dateMap: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      dateMap[e.date] = (dateMap[e.date] || 0) + parseFloat(e.amount);
    });

    const sortedDates = Object.keys(dateMap).sort();
    let cumulative = 0;
    const cumulativeSeries = sortedDates.map(date => {
      cumulative += dateMap[date];
      return {
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        amount: parseFloat(cumulative.toFixed(2))
      };
    });

    return NextResponse.json({
      summary: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        thisMonthSpent: parseFloat(thisMonthSpent.toFixed(2)),
        lastMonthSpent: parseFloat(lastMonthSpent.toFixed(2)),
        largestExpense
      },
      charts: {
        monthlyHistory,
        categoryDistribution,
        sourceDistribution,
        cumulativeSeries
      }
    });
  } catch (err: any) {
    console.error('Unhandled insights computing error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
