'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomSelect } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  FileText,
  Image as ImageIcon,
  Trash2,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Check,
} from 'lucide-react';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  paid_by: string;
  vendor: string;
  description: string;
  notes: string | null;
  receipt_path: string | null;
  receipt_name: string | null;
  logged_by: string;
  logged_by_name: string;
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

// ─── Shared style objects ───
const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  fontFamily: 'var(--font-sans)',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPaidBy, setSelectedPaidBy] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [activeDrawer, setActiveDrawer] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [signedReceiptUrl, setSignedReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search,
        categories: selectedCategories.join(','),
        paid_by: selectedPaidBy.join(','),
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch ledger.');
      const data = await res.json();
      setExpenses(data.expenses);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [page, search, selectedCategories, selectedPaidBy, startDate, endDate, sortBy, sortOrder]);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const openDetail = async (expense: Expense) => {
    setSelectedExpense(expense);
    setSignedReceiptUrl(null);
    setActiveDrawer('detail');
    try {
      const res = await fetch(`/api/expenses/${expense.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedExpense(full);
        if (full.receipt_signed_url) setSignedReceiptUrl(full.receipt_signed_url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormDate(expense.date);
    setFormAmount(expense.amount.toString());
    setFormCategory(expense.category);
    setFormPaidBy(expense.paid_by);
    setFormVendor(expense.vendor);
    setFormDescription(expense.description);
    setFormNotes(expense.notes || '');
    setAttachmentPath(expense.receipt_path);
    setAttachmentName(expense.receipt_name);
    setErrors({});
    setActiveDrawer('edit');
  };

  const openCreate = () => {
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormAmount('');
    setFormCategory(CATEGORIES[0]);
    setFormPaidBy(PAYMENT_SOURCES[0].value);
    setFormVendor('');
    setFormDescription('');
    setFormNotes('');
    setAttachmentPath(null);
    setAttachmentName(null);
    setErrors({});
    setActiveDrawer('create');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File exceeds 10 MB.'); return; }
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

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formDate) errs.date = 'Date is required.';
    else {
      const d = new Date(formDate);
      const today = new Date(); today.setHours(23, 59, 59, 999);
      if (d > today) errs.date = 'Date cannot be in the future.';
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than 0.';
    if (!formVendor.trim()) errs.vendor = 'Paid To is required.';
    else if (formVendor.length > 120) errs.vendor = 'Cannot exceed 120 characters.';
    if (!formDescription.trim()) errs.description = 'Description is required.';
    else if (formDescription.length > 500) errs.description = 'Cannot exceed 500 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormSubmitLoading(true);
    try {
      const payload = {
        date: formDate,
        amount: parseFloat(formAmount),
        category: formCategory,
        paid_by: formPaidBy,
        vendor: formVendor.trim(),
        description: formDescription.trim(),
        notes: formNotes.trim() || null,
        receipt_path: attachmentPath,
        receipt_name: attachmentName,
      };
      const isEdit = activeDrawer === 'edit';
      const res = await fetch(
        isEdit ? `/api/expenses/${selectedExpense?.id}` : '/api/expenses',
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed.');
      fetchExpenses();
      setActiveDrawer(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/expenses/${selectedExpense.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setShowDeleteConfirm(false);
      setActiveDrawer(null);
      fetchExpenses();
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getSourceLabel = (val: string) =>
    PAYMENT_SOURCES.find((p) => p.value === val)?.label || val;

  const triggerExport = (format: 'xlsx' | 'csv' | 'md' | 'pdf') => {
    const params = new URLSearchParams({ format, search, categories: selectedCategories.join(','), paid_by: selectedPaidBy.join(','), startDate, endDate });
    window.open(`/api/expenses/export?${params.toString()}`, '_blank');
  };

  const sortIcon = (field: string) => sortBy === field
    ? <ArrowUpDown size={12} style={{ color: 'var(--accent)' }} />
    : <ArrowUpDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />;

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  // ─── Shared drawer panel ───
  const DrawerOverlay = ({ children }: { children: React.ReactNode }) => (
    <div
      className="animate-fadeIn mobile-drawer-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div style={{ flex: 1 }} onClick={() => setActiveDrawer(null)} />
      <div
        className="animate-slideLeft mobile-drawer-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            Expense Ledger
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 300 }}>
            View, search, filter, and export expense records.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-fg)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-dim)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* ─── Search & Toolbar ─── */}
      <div style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search vendor, description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputStyle, paddingLeft: '36px' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderColor: (showFilters || selectedCategories.length > 0 || selectedPaidBy.length > 0 || startDate || endDate)
                  ? 'var(--accent)' : 'var(--border)',
                backgroundColor: (showFilters || selectedCategories.length > 0 || selectedPaidBy.length > 0 || startDate || endDate)
                  ? 'rgba(254,185,4,0.08)' : 'transparent',
                color: (showFilters || selectedCategories.length > 0 || selectedPaidBy.length > 0 || startDate || endDate)
                  ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <Filter size={14} />
              <span>Filters</span>
              {(selectedCategories.length + selectedPaidBy.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)) > 0 && (
                <span style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  backgroundColor: 'var(--accent)', color: 'var(--accent-fg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 800,
                }}>
                  {selectedCategories.length + selectedPaidBy.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Export dropdown — click to open/close */}
            <div ref={exportMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExportMenu(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: showExportMenu ? 'var(--bg-subtle)' : 'transparent',
                  color: showExportMenu ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
              >
                <Download size={14} />
                <span>Export</span>
              </button>
              {showExportMenu && (
                <div
                  className="animate-scaleIn"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 6px)',
                    width: '180px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                    padding: '4px',
                    zIndex: 50,
                  }}
                >
                  {[
                    { fmt: 'xlsx' as const, label: 'Excel (.xlsx)' },
                    { fmt: 'csv' as const, label: 'CSV (.csv)' },
                    { fmt: 'md' as const, label: 'Markdown (.md)' },
                    { fmt: 'pdf' as const, label: 'Print PDF (.pdf)' },
                  ].map(({ fmt, label }) => (
                    <button
                      key={fmt}
                      onClick={() => { triggerExport(fmt); setShowExportMenu(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: fmt === 'pdf' ? 'var(--danger)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div
            className="animate-slideDown"
            style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}
          >
            {/* Category multi-select chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={sectionLabel}>Categories</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-base)', maxHeight: '130px', overflowY: 'auto' }}>
                {CATEGORIES.map(cat => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategories(prev => active ? prev.filter(c => c !== cat) : [...prev, cat]); setPage(1); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '100px',
                        border: '1px solid',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: active ? 'rgba(254,185,4,0.10)' : 'var(--bg-surface)',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment sources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={sectionLabel}>Payment Sources</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-base)', maxHeight: '130px', overflowY: 'auto' }}>
                {PAYMENT_SOURCES.map(src => {
                  const active = selectedPaidBy.includes(src.value);
                  return (
                    <button
                      key={src.value}
                      onClick={() => { setSelectedPaidBy(prev => active ? prev.filter(s => s !== src.value) : [...prev, src.value]); setPage(1); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '7px',
                        border: '1px solid',
                        fontSize: '12px',
                        fontWeight: 400,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: active ? 'rgba(254,185,4,0.08)' : 'var(--bg-surface)',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <span>{src.label}</span>
                      {active && <Check size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={sectionLabel}>Date Range</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: 0 }}>From</p>
                  <DatePicker value={startDate} onChange={(v) => { setStartDate(v); setPage(1); }} placeholder="Start date" />
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: 0 }}>To</p>
                  <DatePicker value={endDate} onChange={(v) => { setEndDate(v); setPage(1); }} placeholder="End date" />
                </div>
                {(selectedCategories.length > 0 || selectedPaidBy.length > 0 || startDate || endDate) && (
                  <button
                    onClick={() => { setSelectedCategories([]); setSelectedPaidBy([]); setStartDate(''); setEndDate(''); setPage(1); }}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(186,26,26,0.3)',
                      backgroundColor: 'transparent',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Expense Table ─── */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: '52px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px' }}>
              <AlertCircle size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>No records found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontWeight: 300 }}>
              No expenses match your current filters or search query.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Date', field: 'date' },
                    { label: 'Paid To', field: null },
                    { label: 'Category', field: 'category' },
                    { label: 'Paid From', field: 'paid_by' },
                    { label: 'Amount (INR)', field: 'amount', right: true },
                    { label: 'Receipt', field: null, center: true },
                    { label: 'Logged By', field: null },
                  ].map(({ label, field, right, center }) => (
                    <th
                      key={label}
                      onClick={field ? () => handleSort(field) : undefined}
                      style={{
                        padding: '12px 16px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        textAlign: right ? 'right' : center ? 'center' : 'left',
                        cursor: field ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {label}
                        {field && sortIcon(field)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, i) => (
                  <tr
                    key={expense.id}
                    onClick={() => openDetail(expense)}
                    style={{
                      borderBottom: i < expenses.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {expense.vendor}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        backgroundColor: 'var(--bg-container)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {expense.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getSourceLabel(expense.paid_by)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {expense.receipt_path ? (
                        <span style={{
                          display: 'inline-flex',
                          padding: '5px',
                          borderRadius: '7px',
                          backgroundColor: 'rgba(254,185,4,0.10)',
                          border: '1px solid rgba(254,185,4,0.25)',
                          color: 'var(--accent)',
                        }}>
                          {expense.receipt_name?.endsWith('.pdf') ? <FileText size={14} /> : <ImageIcon size={14} />}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {expense.logged_by_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && expenses.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-subtle)',
            fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Showing{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{(page - 1) * 25 + 1}</strong>
              {' '}–{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{Math.min(page * 25, totalCount)}</strong>
              {' '}of{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalCount}</strong>
              {' '}entries
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{
                  padding: '6px',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.4 : 1,
                  display: 'flex',
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', padding: '0 8px' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{
                  padding: '6px',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.4 : 1,
                  display: 'flex',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Drawer ─── */}
      {activeDrawer === 'detail' && selectedExpense && (
        <DrawerOverlay>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={sectionLabel}>Expense Summary</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedExpense.vendor}
              </h2>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {/* Amount display */}
            <div style={{ textAlign: 'center', padding: '24px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <p style={{ ...sectionLabel, textAlign: 'center', marginBottom: '8px' }}>Total Transacted</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
                ₹{selectedExpense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Data grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={sectionLabel}>Transaction Date</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: '6px 0 0' }}>
                  {new Date(selectedExpense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p style={sectionLabel}>Category</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', margin: '6px 0 0' }}>
                  {selectedExpense.category}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={sectionLabel}>Paid From</p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', margin: '6px 0 0' }}>
                {getSourceLabel(selectedExpense.paid_by)}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={sectionLabel}>Description</p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '6px 0 0', lineHeight: 1.6, fontWeight: 300 }}>
                {selectedExpense.description}
              </p>
            </div>

            {selectedExpense.notes && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={sectionLabel}>Internal Notes</p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  margin: '6px 0 0',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  padding: '12px',
                  backgroundColor: 'rgba(254,185,4,0.06)',
                  border: '1px solid rgba(254,185,4,0.15)',
                  borderRadius: '8px',
                }}>
                  {selectedExpense.notes}
                </p>
              </div>
            )}

            {/* Receipt */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={sectionLabel}>Receipt / Invoice</p>
              {selectedExpense.receipt_path ? (
                <div style={{ marginTop: '10px', padding: '16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(254,185,4,0.12)', color: 'var(--accent)', flexShrink: 0 }}>
                      {selectedExpense.receipt_name?.endsWith('.pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedExpense.receipt_name}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Secure cloud storage</p>
                    </div>
                  </div>
                  {signedReceiptUrl && (
                    selectedExpense.receipt_name?.endsWith('.pdf') ? (
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <FileCheck size={24} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                        <a
                          href={signedReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-fg)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          View Full PDF
                        </a>
                      </div>
                    ) : (
                      <img src={signedReceiptUrl} alt="Receipt" style={{ maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', width: '100%' }} />
                    )
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0', fontStyle: 'italic' }}>
                  No receipt attached to this transaction.
                </p>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => openEdit(selectedExpense)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px', borderRadius: '9px', border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            >
              <Edit3 size={15} /> Edit Entry
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px', borderRadius: '9px', border: '1px solid rgba(186,26,26,0.25)',
                backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(186,26,26,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </DrawerOverlay>
      )}

      {/* ─── Create / Edit Drawer ─── */}
      {(activeDrawer === 'create' || activeDrawer === 'edit') && (
        <DrawerOverlay>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={sectionLabel}>{activeDrawer === 'edit' ? 'Edit Transaction' : 'Create Expense'}</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                {activeDrawer === 'edit' ? 'Modify Ledger Entry' : 'Log Startup Expense'}
              </h2>
            </div>
            <button onClick={() => setActiveDrawer(null)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {/* Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Date Occurred</label>
              <DatePicker value={formDate} onChange={setFormDate} placeholder="Pick a date" />
              {errors.date && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.date}</p>}
            </div>

            {/* Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Amount (INR)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '14px' }}>₹</span>
                <input
                  type="number" step="0.01" placeholder="0.00"
                  value={formAmount} onChange={e => setFormAmount(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '28px', fontFamily: 'var(--font-mono)', fontWeight: 600, borderColor: errors.amount ? 'var(--danger)' : 'var(--border)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = errors.amount ? 'var(--danger)' : 'var(--border)')}
                />
              </div>
              {errors.amount && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.amount}</p>}
            </div>

            {/* Paid To */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Paid To</label>
              <input
                type="text" placeholder="e.g. AWS, Swiggy, Uber"
                value={formVendor} onChange={e => setFormVendor(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.vendor ? 'var(--danger)' : 'var(--border)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = errors.vendor ? 'var(--danger)' : 'var(--border)')}
              />
              {errors.vendor && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.vendor}</p>}
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Category</label>
              <CustomSelect options={CATEGORIES.map(c => ({ value: c, label: c }))} value={formCategory} onChange={setFormCategory} />
            </div>

            {/* Paid From */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Paid From</label>
              <CustomSelect options={PAYMENT_SOURCES} value={formPaidBy} onChange={setFormPaidBy} />
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Description</label>
              <textarea
                rows={3} placeholder="What was this expense for?"
                value={formDescription} onChange={e => setFormDescription(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, borderColor: errors.description ? 'var(--danger)' : 'var(--border)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = errors.description ? 'var(--danger)' : 'var(--border)')}
              />
              {errors.description && <p style={{ fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{errors.description}</p>}
            </div>

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={sectionLabel}>Internal Notes (Optional)</label>
              <textarea
                rows={2} placeholder="Notes for other founders..."
                value={formNotes} onChange={e => setFormNotes(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Receipt */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={sectionLabel}>Receipt Attachment</label>
              {attachmentPath ? (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(254,185,4,0.06)', border: '1px solid rgba(254,185,4,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ padding: '6px', backgroundColor: 'var(--accent)', borderRadius: '6px', color: 'var(--accent-fg)', flexShrink: 0 }}>
                      {attachmentName?.endsWith('.pdf') ? <FileText size={14} /> : <ImageIcon size={14} />}
                    </span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {attachmentName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAttachmentPath(null); setAttachmentName(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '20px', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" style={{ display: 'none' }} />
                  {isUploading
                    ? <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    : <UploadCloud size={22} style={{ color: 'var(--text-muted)' }} />}
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    {isUploading ? 'Uploading...' : 'Click to attach image or PDF'}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button" onClick={() => setActiveDrawer(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitLoading || isUploading}
                style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: formSubmitLoading ? 0.7 : 1 }}
              >
                {formSubmitLoading ? 'Saving...' : activeDrawer === 'edit' ? 'Save Changes' : 'Add Expense'}
              </button>
            </div>
          </form>
        </DrawerOverlay>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {showDeleteConfirm && (
        <div
          className="animate-fadeIn mobile-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="animate-scaleIn"
            style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Trash2 size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>Confirm Delete</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.6, fontWeight: 300 }}>
              Are you sure you want to permanently delete this expense? This action is irreversible and will be recorded in the audit trail.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--danger)', color: 'var(--danger-fg)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
