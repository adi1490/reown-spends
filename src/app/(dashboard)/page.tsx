'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomSelect } from '@/components/ui/select';
import { 
  TrendingUp, 
  Layers, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Plus, 
  Check, 
  ChevronRight,
  TrendingDown,
  ChevronDown,
  CheckCircle,
  ShieldAlert,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface Summary {
  totalSpent: number;
  thisMonthSpent: number;
  lastMonthSpent: number;
  largestExpense: {
    amount: number;
    vendor: string;
  };
}

interface InsightsCharts {
  monthlyHistory: Array<{ month: string; amount: number }>;
  categoryDistribution: Array<{ category: string; amount: number; percentage: number }>;
  sourceDistribution: Array<{ source: string; amount: number }>;
  cumulativeSeries: Array<{ date: string; amount: number }>;
}

const CATEGORIES = [
  'Marketing & Promotions',
  'Tech & Infrastructure',
  'Legal & Compliance',
  'Software & Tools',
  'Travel & Transport',
  'Food & Meals',
  'Office & Supplies',
  'Banking & Finance',
  'Salaries & Stipends',
  'Miscellaneous'
];

const PAYMENT_SOURCES = [
  { value: 'Company Business Account', label: '🏢 Company Account' },
  { value: 'Vishnu (Personal)', label: '👤 Vishnu – Personal' },
  { value: 'Puneet (Personal)', label: '👤 Puneet – Personal' },
  { value: 'Narasimha (Personal)', label: '👤 Narasimha – Personal' },
  { value: 'Prasanna (Personal)', label: '👤 Prasanna – Personal' }
];

const DATE_PRESET_OPTIONS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

// Curated charting color palette
const CHART_COLORS = [
  '#feb904', // Amber Primary
  '#4361ee', // Tech Blue
  '#2ec4b6', // Mint
  '#e71d36', // Coral Danger
  '#7209b7', // Indigo
  '#f72585', // Pink
  '#3a0ca3', // Deep Blue
  '#ff9f1c', // Orange
  '#4caf50', // Emerald Green
  '#9c27b0'  // Violet
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalSpent: 0,
    thisMonthSpent: 0,
    lastMonthSpent: 0,
    largestExpense: { amount: 0, vendor: 'N/A' }
  });
  const [charts, setCharts] = useState<InsightsCharts>({
    monthlyHistory: [],
    categoryDistribution: [],
    sourceDistribution: [],
    cumulativeSeries: []
  });

  // Global Date Filter State
  const [datePreset, setDatePreset] = useState('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Quick Add Dialog
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPaidBy, setFormPaidBy] = useState(PAYMENT_SOURCES[0].value);
  const [formVendor, setFormVendor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [toastSuccess, setToastSuccess] = useState(false);

  // Set date ranges depending on the preset chosen
  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let start = '';
    let end = '';

    const formatDate = (d: Date) => d.toISOString().substring(0, 10);

    switch (datePreset) {
      case 'this-month':
        start = formatDate(new Date(currentYear, currentMonth, 1));
        end = formatDate(new Date(currentYear, currentMonth + 1, 0));
        break;
      case 'last-month':
        start = formatDate(new Date(currentYear, currentMonth - 1, 1));
        end = formatDate(new Date(currentYear, currentMonth, 0));
        break;
      case 'last-3-months':
        start = formatDate(new Date(currentYear, currentMonth - 3, today.getDate()));
        end = formatDate(today);
        break;
      case 'last-6-months':
        start = formatDate(new Date(currentYear, currentMonth - 6, today.getDate()));
        end = formatDate(today);
        break;
      case 'this-year':
        start = formatDate(new Date(currentYear, 0, 1));
        end = formatDate(today);
        break;
      case 'custom':
        // Keep current custom bounds or default to month
        return;
      default:
        start = '';
        end = '';
    }

    setStartDate(start);
    setEndDate(end);
  }, [datePreset]);

  // Fetch insights calculations
  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/insights?${params.toString()}`);
      if (!res.ok) throw new Error('Could not retrieve insights data.');
      const data = await res.json();
      setSummary(data.summary);
      setCharts(data.charts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchInsights();
    }
  }, [mounted, startDate, endDate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      setAttachmentPath(data.path);
      setAttachmentName(data.name);
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Simple validation
    const errs: Record<string, string> = {};
    if (!formDate) errs.date = 'Date is required.';
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'Amount must be > 0.';
    if (!formVendor.trim()) errs.vendor = 'Vendor is required.';
    if (!formDescription.trim()) errs.description = 'Description is required.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          amount: amt,
          category: formCategory,
          paid_by: formPaidBy,
          vendor: formVendor.trim(),
          description: formDescription.trim(),
          notes: formNotes.trim() || null,
          receipt_path: attachmentPath,
          receipt_name: attachmentName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add expense.');

      // Success
      setToastSuccess(true);
      setShowQuickAdd(false);
      fetchInsights(); // Refresh
      
      // Reset form
      setFormAmount('');
      setFormVendor('');
      setFormDescription('');
      setFormNotes('');
      setAttachmentPath(null);
      setAttachmentName(null);

      setTimeout(() => setToastSuccess(false), 4000);
    } catch (err: any) {
      alert('Error adding: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openQuickAdd = () => {
    setFormDate(new Date().toISOString().substring(0, 10));
    setErrors({});
    setShowQuickAdd(true);
  };

  const getSourceLabel = (val: string) => {
    return PAYMENT_SOURCES.find(p => p.value === val)?.label || val;
  };

  // Safe client side charts renderer
  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-fadeIn pb-12 relative">
      
      {/* 1. Page Header with global date filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
            Dashboard & Insights
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-light">
            Welcome to reOWN Spends. Real-time aggregated financial intelligence.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-bg-surface border border-border p-2 rounded-2xl flex flex-wrap items-center gap-2 shadow-sm self-start xl:self-auto max-w-full z-[100]">
          <CustomSelect
            options={DATE_PRESET_OPTIONS}
            value={datePreset}
            onChange={setDatePreset}
            className="min-w-[150px]"
          />

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 rounded-lg border border-border bg-bg-subtle text-text-primary text-[10px] focus:outline-none"
              />
              <span className="text-text-muted text-[10px]">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 rounded-lg border border-border bg-bg-subtle text-text-primary text-[10px] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {toastSuccess && (
        <div className="fixed top-8 right-8 z-[200] bg-bg-surface border border-accent/35 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-slideDown max-w-sm">
          <div className="p-2 rounded-xl bg-accent text-black shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary">Ledger Entry Created!</p>
            <p className="text-[10px] text-text-secondary mt-0.5 font-light">
              Your new expense was successfully registered in the database.
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Total Spent */}
        <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#feb904]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Total transacted</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-bg-subtle animate-pulse rounded-lg mt-2" />
            ) : (
              <h3 className="text-2xl font-extrabold text-text-primary font-tabular tracking-tight mt-2">
                ₹{summary.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            )}
          </div>
          <p className="text-[10px] text-text-secondary mt-4 font-light flex items-center gap-1">
            <TrendingUp size={12} className="text-[#feb904]" />
            <span>Aggregate summation of range</span>
          </p>
        </div>

        {/* KPI 2: This Month */}
        <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4361ee]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">This Calendar Month</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-bg-subtle animate-pulse rounded-lg mt-2" />
            ) : (
              <h3 className="text-2xl font-extrabold text-text-primary font-tabular tracking-tight mt-2">
                ₹{summary.thisMonthSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            )}
          </div>
          {/* Trend Indicator */}
          {!isLoading && (
            <p className="text-[10px] text-text-secondary mt-4 font-light flex items-center gap-1">
              {summary.thisMonthSpent >= summary.lastMonthSpent ? (
                <>
                  <TrendingUp size={12} className="text-[#e71d36]" />
                  <span>Up from last month</span>
                </>
              ) : (
                <>
                  <TrendingDown size={12} className="text-[#2ec4b6]" />
                  <span>Down from last month</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* KPI 3: Last Month */}
        <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2ec4b6]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Last Calendar Month</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-bg-subtle animate-pulse rounded-lg mt-2" />
            ) : (
              <h3 className="text-2xl font-extrabold text-text-primary font-tabular tracking-tight mt-2">
                ₹{summary.lastMonthSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            )}
          </div>
          <p className="text-[10px] text-text-secondary mt-4 font-light">
            Prior monthly full-cycle total
          </p>
        </div>

        {/* KPI 4: Largest Single Spent */}
        <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e71d36]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Largest transaction</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-bg-subtle animate-pulse rounded-lg mt-2" />
            ) : (
              <h3 className="text-2xl font-extrabold text-text-primary font-tabular tracking-tight mt-2">
                ₹{summary.largestExpense.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            )}
          </div>
          <p className="text-[10px] text-text-secondary mt-4 truncate font-light" title={summary.largestExpense.vendor}>
            Paid to: <span className="font-bold text-text-primary">{summary.largestExpense.vendor}</span>
          </p>
        </div>

      </div>

      {/* 3. Aggregated Charts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* Chart 1: Monthly Spend Bar Chart (Chronological History) */}
        <div className="lg:col-span-4 bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">12-Month Financial Burn Trend</h4>
          
          <div className="h-[280px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-bg-subtle animate-pulse rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-subtle)', opacity: 0.5 }}
                    contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '16px' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ color: '#feb904', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: any) => [`₹${value?.toLocaleString('en-IN') || '0.00'}`, 'Monthly Burn']}
                  />
                  <Bar dataKey="amount" fill="#feb904" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Category Distribution Pie/Doughnut Chart */}
        <div className="lg:col-span-2 bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Category Allocation Ratios</h4>

          {isLoading ? (
            <div className="h-[200px] w-full bg-bg-subtle animate-pulse rounded-2xl" />
          ) : charts.categoryDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-text-secondary italic">No data allocation</div>
          ) : (
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryDistribution}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {charts.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value: any, name: any, props: any) => [`₹${value.toLocaleString('en-IN')} (${props.payload.percentage}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Custom legend list */}
          <div className="space-y-1.5 overflow-y-auto max-h-[110px] pr-2 pt-2 border-t border-border">
            {charts.categoryDistribution.slice(0, 4).map((entry, index) => (
              <div key={entry.category} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="text-text-secondary truncate font-medium">{entry.category}</span>
                </div>
                <span className="font-bold text-text-primary font-tabular">
                  {entry.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Cumulative Spend Over Time Line Chart */}
        <div className="lg:col-span-3 bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Cumulative Spend Curve</h4>
          
          <div className="h-[260px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-bg-subtle animate-pulse rounded-2xl" />
            ) : charts.cumulativeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary italic">No data compiled</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.cumulativeSeries} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '16px' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ color: '#feb904', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: any) => [`₹${value?.toLocaleString('en-IN') || '0.00'}`, 'Cumulative Spent']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#feb904" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Payment Source Distribution Bar Chart */}
        <div className="lg:col-span-3 bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Funding Ratios per Source</h4>
          
          <div className="h-[260px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-bg-subtle animate-pulse rounded-2xl" />
            ) : charts.sourceDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary italic">No data compiled</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.sourceDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                  <YAxis type="category" dataKey="source" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={120} axisLine={false} tickLine={false} tickFormatter={(v) => v.split(' ')[0]} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '16px' }}
                    itemStyle={{ color: '#feb904', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: any) => [`₹${value?.toLocaleString('en-IN') || '0.00'}`, 'Funding amount']}
                  />
                  <Bar dataKey="amount" fill="#feb904" radius={[0, 6, 6, 0]} maxBarSize={30}>
                    {charts.sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 4. Floating Action Button (FAB) for Quick Add */}
      <button
        onClick={openQuickAdd}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-accent text-accent-fg hover:bg-[#e0a403] active:scale-[0.95] flex items-center justify-center shadow-2xl transition-all cursor-pointer hover-lift font-bold"
        aria-label="Add expense instantly"
      >
        <Plus size={24} />
      </button>

      {/* 5. QUICK ADD DIALOG OVERLAY */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-[90%] max-w-[480px] bg-bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-2xl animate-scaleIn overflow-y-auto max-h-[85vh] transition-colors duration-300">
            
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Instant Transaction Log</span>
                <h3 className="text-lg font-bold text-text-primary mt-0.5">Quick Add Expense</h3>
              </div>
              <button 
                onClick={() => setShowQuickAdd(false)}
                className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary cursor-pointer hover:bg-bg-subtle transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Date occurred</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border bg-bg-subtle text-text-primary text-xs focus:outline-none focus:border-accent ${
                    errors.date ? 'border-danger' : 'border-border'
                  }`}
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="₹0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border bg-bg-subtle text-text-primary text-xs font-bold font-tabular focus:outline-none focus:border-accent ${
                    errors.amount ? 'border-danger' : 'border-border'
                  }`}
                />
              </div>

              {/* Paid To */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Paid To</label>
                <input
                  type="text"
                  required
                  placeholder="Paid to (e.g. AWS, Swiggy, Uber)"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border bg-bg-subtle text-text-primary text-xs focus:outline-none focus:border-accent ${
                    errors.vendor ? 'border-danger' : 'border-border'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Category</label>
                  <CustomSelect
                    options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                    value={formCategory}
                    onChange={setFormCategory}
                  />
                </div>

                {/* Paid From */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Paid From</label>
                  <CustomSelect
                    options={PAYMENT_SOURCES}
                    value={formPaidBy}
                    onChange={setFormPaidBy}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Description</label>
                <input
                  type="text"
                  required
                  placeholder="What was purchased?"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border bg-bg-subtle text-text-primary text-xs focus:outline-none focus:border-accent ${
                    errors.description ? 'border-danger' : 'border-border'
                  }`}
                />
              </div>

              {/* Storage File Upload */}
              <div className="space-y-1.5 border-t border-border pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Receipt Attachment</label>
                {attachmentPath ? (
                  <div className="p-2 rounded-xl bg-accent/5 border border-accent/25 flex items-center justify-between text-xs">
                    <span className="truncate font-bold text-text-primary">{attachmentName}</span>
                    <button type="button" onClick={() => { setAttachmentPath(null); setAttachmentName(null); }} className="text-danger hover:underline">Remove</button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:bg-bg-subtle/50 text-[10px] flex items-center justify-center gap-2"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UploadCloud size={14} className="text-text-secondary" />
                        <span>{isUploading ? 'Uploading...' : 'Click to attach image/PDF'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-bg-subtle text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold hover:bg-[#e0a403] text-xs cursor-pointer shadow-md"
                >
                  {formLoading ? 'Submitting...' : 'Add Expense'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
