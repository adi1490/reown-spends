'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomSelect } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  CheckCircle,
  UploadCloud,
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
} from 'recharts';

interface Summary {
  totalSpent: number;
  thisMonthSpent: number;
  lastMonthSpent: number;
  largestExpense: { amount: number; vendor: string };
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
  'Miscellaneous',
];

const PAYMENT_SOURCES = [
  { value: 'Company Business Account', label: '🏢 Company Account' },
  { value: 'Vishnu (Personal)', label: '👤 Vishnu – Personal' },
  { value: 'Puneet (Personal)', label: '👤 Puneet – Personal' },
  { value: 'Narasimha (Personal)', label: '👤 Narasimha – Personal' },
  { value: 'Prasanna (Personal)', label: '👤 Prasanna – Personal' },
];

const DATE_PRESET_OPTIONS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const CHART_COLORS = [
  '#feb904', '#7c5800', '#615e5a', '#4361ee', '#2ec4b6',
  '#e71d36', '#7209b7', '#f72585', '#3a0ca3', '#4caf50',
];

// ─── Shared card style ───
const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '24px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalSpent: 0,
    thisMonthSpent: 0,
    lastMonthSpent: 0,
    largestExpense: { amount: 0, vendor: 'N/A' },
  });
  const [charts, setCharts] = useState<InsightsCharts>({
    monthlyHistory: [],
    categoryDistribution: [],
    sourceDistribution: [],
    cumulativeSeries: [],
  });

  const [datePreset, setDatePreset] = useState('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const fmt = (d: Date) => d.toISOString().substring(0, 10);

    switch (datePreset) {
      case 'this-month':
        setStartDate(fmt(new Date(y, m, 1)));
        setEndDate(fmt(new Date(y, m + 1, 0)));
        break;
      case 'last-month':
        setStartDate(fmt(new Date(y, m - 1, 1)));
        setEndDate(fmt(new Date(y, m, 0)));
        break;
      case 'last-3-months':
        setStartDate(fmt(new Date(y, m - 3, today.getDate())));
        setEndDate(fmt(today));
        break;
      case 'last-6-months':
        setStartDate(fmt(new Date(y, m - 6, today.getDate())));
        setEndDate(fmt(today));
        break;
      case 'this-year':
        setStartDate(fmt(new Date(y, 0, 1)));
        setEndDate(fmt(today));
        break;
      case 'custom':
        return;
      default:
        setStartDate('');
        setEndDate('');
    }
  }, [datePreset]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/insights?${params.toString()}`);
      if (!res.ok) throw new Error('Could not retrieve insights.');
      const data = await res.json();
      setSummary(data.summary);
      setCharts(data.charts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) fetchInsights(); }, [mounted, startDate, endDate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
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
    const errs: Record<string, string> = {};
    if (!formDate) errs.date = 'Date is required.';
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'Amount must be > 0.';
    if (!formVendor.trim()) errs.vendor = 'Paid To is required.';
    if (!formDescription.trim()) errs.description = 'Description is required.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

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
          receipt_name: attachmentName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add expense.');

      setToastSuccess(true);
      setShowQuickAdd(false);
      fetchInsights();
      setFormAmount(''); setFormVendor(''); setFormDescription('');
      setFormNotes(''); setAttachmentPath(null); setAttachmentName(null);
      setTimeout(() => setToastSuccess(false), 4000);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openQuickAdd = () => {
    setFormDate(new Date().toISOString().substring(0, 10));
    setErrors({});
    setShowQuickAdd(true);
  };

  if (!mounted) return null;

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ─── Success Toast ─── */}
      {toastSuccess && (
        <div
          className="animate-slideDown"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 200,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            maxWidth: '340px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={18} style={{ color: 'var(--accent-fg)' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Expense Added
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0', fontWeight: 300 }}>
              Successfully registered in the ledger.
            </p>
          </div>
        </div>
      )}

      {/* ─── Page Header + Date Filter ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Dashboard & Insights
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 300 }}>
            Real-time aggregated financial intelligence.
          </p>
        </div>

        {/* Date range selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '8px',
            position: 'relative',
          }}
        >
          <div style={{ minWidth: '150px' }}>
            <CustomSelect
              options={DATE_PRESET_OPTIONS}
              value={datePreset}
              onChange={setDatePreset}
            />
          </div>

          {datePreset === 'custom' && (
            <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ minWidth: '130px' }}>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Start" />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
              <div style={{ minWidth: '130px' }}>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="End" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Spent */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'border-color 0.2s ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <p style={sectionLabel}>Total Transacted</p>
          {isLoading ? (
            <div style={{ height: '36px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              ₹{Math.floor(summary.totalSpent).toLocaleString('en-IN')}
            </p>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} style={{ color: 'var(--accent)' }} />
            Aggregate of selected range
          </p>
        </div>

        {/* This Month */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'border-color 0.2s ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <p style={sectionLabel}>This Calendar Month</p>
          {isLoading ? (
            <div style={{ height: '36px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }} />
          ) : (
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              ₹{Math.floor(summary.thisMonthSpent).toLocaleString('en-IN')}
            </p>
          )}
          {!isLoading && (
            <p style={{ fontSize: '11px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px',
              color: summary.thisMonthSpent >= summary.lastMonthSpent ? 'var(--danger)' : 'var(--success)' }}>
              {summary.thisMonthSpent >= summary.lastMonthSpent
                ? <TrendingUp size={12} />
                : <TrendingDown size={12} />}
              {summary.thisMonthSpent >= summary.lastMonthSpent ? 'Up' : 'Down'} from last month
            </p>
          )}
        </div>

        {/* Last Month */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'border-color 0.2s ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <p style={sectionLabel}>Last Calendar Month</p>
          {isLoading ? (
            <div style={{ height: '36px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }} />
          ) : (
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              ₹{Math.floor(summary.lastMonthSpent).toLocaleString('en-IN')}
            </p>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Prior full-cycle total
          </p>
        </div>

        {/* Largest Transaction */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'border-color 0.2s ease' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <p style={sectionLabel}>Largest Transaction</p>
          {isLoading ? (
            <div style={{ height: '36px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }} />
          ) : (
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              ₹{Math.floor(summary.largestExpense.amount).toLocaleString('en-IN')}
            </p>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Paid to: <strong style={{ color: 'var(--text-primary)' }}>{summary.largestExpense.vendor}</strong>
          </p>
        </div>
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}
        className="lg:grid-cols-[2fr_1fr]"
      >
        {/* Monthly Bar Chart */}
        <div style={card}>
          <p style={{ ...sectionLabel, marginBottom: '20px' }}>12-Month Financial Burn Trend</p>
          <div style={{ height: '260px' }}>
            {isLoading ? (
              <div style={{ height: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeWidth={0.5} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-sans)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-subtle)', opacity: 0.7 }}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 600 }}
                    formatter={(value: any) => [`₹${value?.toLocaleString('en-IN') || '0'}`, 'Monthly Burn']}
                  />
                  <Bar dataKey="amount" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Donut */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...sectionLabel, marginBottom: '16px' }}>Category Allocation</p>
          {isLoading ? (
            <div style={{ height: '180px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }} />
          ) : charts.categoryDistribution.length === 0 ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
              No data available
            </div>
          ) : (
            <div style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryDistribution}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={76}
                    paddingAngle={2}
                  >
                    {charts.categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: any, name: any, props: any) => [
                      `₹${value.toLocaleString('en-IN')} (${props.payload.percentage}%)`, name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {charts.categoryDistribution.slice(0, 4).map((entry, index) => (
              <div key={entry.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.category}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                  {entry.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2 ─── */}
      <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 lg:grid-cols-2">
        {/* Cumulative Line */}
        <div style={card}>
          <p style={{ ...sectionLabel, marginBottom: '20px' }}>Cumulative Spend Curve</p>
          <div style={{ height: '220px' }}>
            {isLoading ? (
              <div style={{ height: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }} />
            ) : charts.cumulativeSeries.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                No data compiled
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.cumulativeSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeWidth={0.5} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: any) => [`₹${value?.toLocaleString('en-IN') || '0'}`, 'Cumulative']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--accent)' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Source Distribution */}
        <div style={card}>
          <p style={{ ...sectionLabel, marginBottom: '20px' }}>Funding Ratios per Source</p>
          {isLoading ? (
            <div style={{ height: '220px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }} />
          ) : charts.sourceDistribution.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
              No data compiled
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
              {charts.sourceDistribution.map((entry, index) => {
                const total = charts.sourceDistribution.reduce((s, e) => s + e.amount, 0);
                const pct = total > 0 ? Math.round((entry.amount / total) * 100) : 0;
                return (
                  <div key={entry.source} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
                        {entry.source.split('(')[0].trim()}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                        ₹{entry.amount.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-container)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '100px',
                        backgroundColor: CHART_COLORS[(index + 1) % CHART_COLORS.length],
                        width: `${pct}%`,
                        transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── FAB ─── */}
      <button
        onClick={openQuickAdd}
        aria-label="Quick add expense"
        className="fab-btn"
        style={{
          position: 'fixed',
          zIndex: 40,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-fg)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(254,185,4,0.35)',
          transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(254,185,4,0.45)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(254,185,4,0.35)';
        }}
      >
        <Plus size={22} />
      </button>

      {/* ─── Quick Add Modal ─── */}
      {showQuickAdd && (
        <div
          className="animate-fadeIn mobile-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowQuickAdd(false); }}
        >
          <div
            className="animate-scaleIn"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                  Instant Transaction Log
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  Quick Add Expense
                </h3>
              </div>
              <button
                onClick={() => setShowQuickAdd(false)}
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleQuickAddSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={sectionLabel}>Date Occurred</label>
                <DatePicker
                  value={formDate}
                  onChange={setFormDate}
                  placeholder="Pick a date"
                />
                {errors.date && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.date}</p>}
              </div>

              {/* Amount */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={sectionLabel}>Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="input-base font-tabular"
                  style={{ borderColor: errors.amount ? 'var(--danger)' : 'var(--border)' }}
                />
                {errors.amount && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.amount}</p>}
              </div>

              {/* Paid To */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={sectionLabel}>Paid To</label>
                <input
                  type="text"
                  placeholder="e.g. AWS, Swiggy, Zomato"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="input-base"
                  style={{ borderColor: errors.vendor ? 'var(--danger)' : 'var(--border)' }}
                />
                {errors.vendor && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.vendor}</p>}
              </div>

              {/* Category + Paid From — side-by-side on wide, stacked on narrow */}
              <div className="form-two-col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={sectionLabel}>Category</label>
                  <CustomSelect
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                    value={formCategory}
                    onChange={setFormCategory}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={sectionLabel}>Paid From</label>
                  <CustomSelect
                    options={PAYMENT_SOURCES}
                    value={formPaidBy}
                    onChange={setFormPaidBy}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={sectionLabel}>Description</label>
                <input
                  type="text"
                  placeholder="What was purchased?"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input-base"
                  style={{ borderColor: errors.description ? 'var(--danger)' : 'var(--border)' }}
                />
                {errors.description && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.description}</p>}
              </div>

              {/* Receipt Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <label style={sectionLabel}>Receipt Attachment</label>
                {attachmentPath ? (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(254,185,4,0.06)',
                    border: '1px solid rgba(254,185,4,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {attachmentName}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAttachmentPath(null); setAttachmentName(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                    />
                    {isUploading ? (
                      <div style={{ width: '16px', height: '16px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <UploadCloud size={15} />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Click to attach image or PDF'}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || isUploading}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-fg)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: formLoading || isUploading ? 'not-allowed' : 'pointer',
                    opacity: formLoading || isUploading ? 0.7 : 1,
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!formLoading) e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; }}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
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
