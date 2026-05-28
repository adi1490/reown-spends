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
  Calendar,
  Layers,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Eye,
  Check,
  UploadCloud,
  FileCheck
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
  'Miscellaneous'
];

const PAYMENT_SOURCES = [
  { value: 'Company Business Account', label: '🏢 Company Account' },
  { value: 'Vishnu (Personal)', label: '👤 Vishnu – Personal' },
  { value: 'Puneet (Personal)', label: '👤 Puneet – Personal' },
  { value: 'Narasimha (Personal)', label: '👤 Narasimha – Personal' },
  { value: 'Prasanna (Personal)', label: '👤 Prasanna – Personal' }
];

export default function ExpensesPage() {
  // Ledger state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPaidBy, setSelectedPaidBy] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Toggle helpers
  const [showFilters, setShowFilters] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form inputs state
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPaidBy, setFormPaidBy] = useState(PAYMENT_SOURCES[0].value);
  const [formVendor, setFormVendor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  
  // File Attachment State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [signedReceiptUrl, setSignedReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch expense list
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
        sortOrder
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

  useEffect(() => {
    fetchExpenses();
  }, [page, search, selectedCategories, selectedPaidBy, startDate, endDate, sortBy, sortOrder]);

  // Open single expense detail
  const openDetail = async (expense: Expense) => {
    setSelectedExpense(expense);
    setSignedReceiptUrl(null);
    setActiveDrawer('detail');
    
    // Fetch details with signed receipts
    try {
      const res = await fetch(`/api/expenses/${expense.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedExpense(fullData);
        if (fullData.receipt_signed_url) {
          setSignedReceiptUrl(fullData.receipt_signed_url);
        }
      }
    } catch (err) {
      console.error('Error fetching signed receipt:', err);
    }
  };

  // Open Edit Drawer
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
    setAttachmentFile(null);
    setErrors({});
    setActiveDrawer('edit');
  };

  // Open Create Drawer
  const openCreate = () => {
    // Default form values
    const todayStr = new Date().toISOString().substring(0, 10);
    setFormDate(todayStr);
    setFormAmount('');
    setFormCategory(CATEGORIES[0]);
    setFormPaidBy(PAYMENT_SOURCES[0].value);
    setFormVendor('');
    setFormDescription('');
    setFormNotes('');
    setAttachmentFile(null);
    setAttachmentPath(null);
    setAttachmentName(null);
    setErrors({});
    setActiveDrawer('create');
  };

  // Handle file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10 MB limit.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Invalid file format. Only JPG, PNG, and PDF are accepted.');
      return;
    }

    setAttachmentFile(file);
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
      setAttachmentFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPath(null);
    setAttachmentName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Validate inputs
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formDate) errs.date = 'Date is required.';
    else {
      const d = new Date(formDate);
      const today = new Date();
      today.setHours(23,59,59,999);
      if (d > today) errs.date = 'Date cannot be in the future.';
    }

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than 0.';
    if (!formVendor.trim()) errs.vendor = 'Vendor is required.';
    else if (formVendor.length > 120) errs.vendor = 'Vendor cannot exceed 120 characters.';

    if (!formDescription.trim()) errs.description = 'Description is required.';
    else if (formDescription.length > 500) errs.description = 'Description cannot exceed 500 characters.';

    if (formNotes.length > 500) errs.notes = 'Notes cannot exceed 500 characters.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Expense Create/Update
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
        receipt_name: attachmentName
      };

      const isEdit = activeDrawer === 'edit';
      const endpoint = isEdit ? `/api/expenses/${selectedExpense?.id}` : '/api/expenses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed.');

      // Refresh and close
      fetchExpenses();
      setActiveDrawer(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Delete Expense
  const handleDelete = async () => {
    if (!selectedExpense) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: 'DELETE'
      });
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

  // Multi-select helpers
  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setPage(1);
  };

  const handlePaidByToggle = (source: string) => {
    setSelectedPaidBy(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
    setPage(1);
  };

  // Trigger browser download for exports
  const triggerExport = (format: 'xlsx' | 'csv' | 'md' | 'pdf') => {
    const params = new URLSearchParams({
      format,
      search,
      categories: selectedCategories.join(','),
      paid_by: selectedPaidBy.join(','),
      startDate,
      endDate
    });
    
    // Open in new tab or download
    window.open(`/api/expenses/export?${params.toString()}`, '_blank');
  };

  const getSourceLabel = (val: string) => {
    return PAYMENT_SOURCES.find(p => p.value === val)?.label || val;
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
            Expense Ledger
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-light">
            View, search, filter, and export the startup expense registers.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-accent text-accent-fg font-bold hover:bg-[#e0a403] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-accent/15"
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 2. Search & Toolbar Controls */}
      <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Full Text Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search vendor, description, notes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                showFilters || selectedCategories.length > 0 || selectedPaidBy.length > 0 || startDate || endDate
                  ? 'bg-accent/10 border-accent text-[#cda005] dark:text-[#feb904]'
                  : 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
              }`}
            >
              <Filter size={16} />
              <span>Filters</span>
              {(selectedCategories.length + selectedPaidBy.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)) > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-accent-fg flex items-center justify-center text-[10px] font-bold">
                  {selectedCategories.length + selectedPaidBy.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Export Dropdown Trigger Button */}
            <div className="relative group">
              <button
                className="px-4 py-2.5 rounded-xl border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Export View</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-bg-surface border border-border shadow-lg p-2 hidden group-hover:block hover:block z-50 animate-fadeIn">
                <button 
                  onClick={() => triggerExport('xlsx')} 
                  className="w-full text-left px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer font-medium flex items-center gap-2"
                >
                  Excel Worksheet (.xlsx)
                </button>
                <button 
                  onClick={() => triggerExport('csv')} 
                  className="w-full text-left px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer font-medium flex items-center gap-2"
                >
                  Plain Data CSV (.csv)
                </button>
                <button 
                  onClick={() => triggerExport('md')} 
                  className="w-full text-left px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer font-medium flex items-center gap-2"
                >
                  Markdown Table (.md)
                </button>
                <button 
                  onClick={() => triggerExport('pdf')} 
                  className="w-full text-left px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer font-medium flex items-center gap-2 animate-pulse text-[#d94f3d] dark:text-[#e05c4a]"
                >
                  A4 Print PDF (.pdf)
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 2b. Expandable Advanced Filter Drawer */}
        {showFilters && (
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideDown">
            {/* Category Multi-select */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Layers size={12} />
                <span>Categories</span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-1 border border-border/40 rounded-2xl bg-bg-subtle/30">
                {CATEGORIES.map(cat => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer border ${
                        active 
                          ? 'bg-accent/15 border-accent text-[#cda005] dark:text-[#feb904] font-bold' 
                          : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-subtle'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paid By Multi-select */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <CreditCard size={12} />
                <span>Payment Sources</span>
              </label>
              <div className="flex flex-col gap-1.5 p-2 border border-border/40 rounded-2xl bg-bg-subtle/30 max-h-[140px] overflow-y-auto">
                {PAYMENT_SOURCES.map(source => {
                  const active = selectedPaidBy.includes(source.value);
                  return (
                    <button
                      key={source.value}
                      onClick={() => handlePaidByToggle(source.value)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border flex items-center justify-between ${
                        active 
                          ? 'bg-accent/15 border-accent text-[#cda005] dark:text-[#feb904] font-bold' 
                          : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-subtle'
                      }`}
                    >
                      <span>{source.label}</span>
                      {active && <Check size={12} className="text-[#feb904]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Date Range</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] text-text-muted">Start Date</p>
                    <DatePicker
                      value={startDate}
                      onChange={(val) => { setStartDate(val); setPage(1); }}
                      placeholder="Start Date"
                      className="p-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-text-muted">End Date</p>
                    <DatePicker
                      value={endDate}
                      onChange={(val) => { setEndDate(val); setPage(1); }}
                      placeholder="End Date"
                      className="p-2"
                    />
                  </div>
                </div>
              </div>

              {(selectedCategories.length > 0 || selectedPaidBy.length > 0 || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedPaidBy([]);
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  className="w-full text-center py-2 rounded-xl text-xs border border-danger/30 hover:bg-danger/10 text-danger font-bold cursor-pointer transition-all"
                >
                  Clear Active Filters
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 3. Expense Ledger Data Table / List */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        
        {isLoading ? (
          /* Loading skeletons */
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 w-full bg-bg-subtle animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-4">
            <div className="inline-flex p-4 bg-bg-subtle border border-border rounded-2xl text-text-secondary mb-2">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No records found</h3>
            <p className="text-sm text-text-secondary font-light max-w-sm mx-auto">
              We couldn't find any expenses matching your active filters or query. Try refining your parameters!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-subtle/30">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary cursor-pointer select-none" onClick={() => { setSortBy('date'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortBy === 'date' && <ArrowUpDown size={12} className="text-accent" />}
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary">Paid To</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary cursor-pointer select-none" onClick={() => { setSortBy('category'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortBy === 'category' && <ArrowUpDown size={12} className="text-accent" />}
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary cursor-pointer select-none" onClick={() => { setSortBy('paid_by'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1.5">
                      <span>Paid From</span>
                      {sortBy === 'paid_by' && <ArrowUpDown size={12} className="text-accent" />}
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-right cursor-pointer select-none" onClick={() => { setSortBy('amount'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span>Amount (INR)</span>
                      {sortBy === 'amount' && <ArrowUpDown size={12} className="text-accent" />}
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-center">Receipt</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {expenses.map((expense) => (
                  <tr 
                    key={expense.id}
                    onClick={() => openDetail(expense)}
                    className="hover-lift hover:bg-bg-subtle/50 transition-all duration-300 cursor-pointer text-sm"
                  >
                    {/* Date */}
                    <td className="p-4 font-tabular text-text-secondary font-medium">
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    {/* Vendor */}
                    <td className="p-4 font-bold text-text-primary truncate max-w-[150px]">
                      {expense.vendor}
                    </td>
                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-bg-subtle text-text-secondary border border-border/80">
                        {expense.category}
                      </span>
                    </td>
                    {/* Paid By */}
                    <td className="p-4 text-xs font-medium text-text-secondary truncate max-w-[160px]">
                      {getSourceLabel(expense.paid_by)}
                    </td>
                    {/* Amount */}
                    <td className="p-4 text-right font-bold font-tabular text-text-primary">
                      ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* Attachment Icon */}
                    <td className="p-4 text-center">
                      {expense.receipt_path ? (
                        <span className="inline-flex p-1.5 rounded-lg bg-accent/10 border border-accent/25 text-[#cda005] dark:text-[#feb904]">
                          {expense.receipt_name?.endsWith('.pdf') ? <FileText size={16} /> : <ImageIcon size={16} />}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    {/* Logged By */}
                    <td className="p-4 text-xs text-text-secondary font-light">
                      {expense.logged_by_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && expenses.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-bg-subtle/20 text-xs">
            <span className="text-text-secondary font-light">
              Showing <span className="font-bold text-text-primary font-tabular">{(page - 1) * 25 + 1}</span> to{' '}
              <span className="font-bold text-text-primary font-tabular">{Math.min(page * 25, totalCount)}</span> of{' '}
              <span className="font-bold text-text-primary font-tabular">{totalCount}</span> entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-border bg-bg-surface text-text-secondary disabled:opacity-50 disabled:pointer-events-none hover:bg-bg-subtle cursor-pointer transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold font-tabular px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-border bg-bg-surface text-text-secondary disabled:opacity-50 disabled:pointer-events-none hover:bg-bg-subtle cursor-pointer transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. EXPENSE DETAILS DRAWER */}
      {activeDrawer === 'detail' && selectedExpense && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
          {/* Close click area */}
          <div className="flex-1" onClick={() => setActiveDrawer(null)} />
          
          <div className="w-full max-w-[500px] h-full bg-bg-surface border-l border-border flex flex-col shadow-2xl animate-slideLeft transition-colors duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-bg-subtle/30">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Expense Summary
                </span>
                <h2 className="text-xl font-bold text-text-primary truncate mt-0.5" title={selectedExpense.vendor}>
                  {selectedExpense.vendor}
                </h2>
              </div>
              <button 
                onClick={() => setActiveDrawer(null)}
                className="p-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Giant Amount Display */}
              <div className="text-center py-6 px-4 rounded-2xl bg-bg-subtle/50 border border-border/80">
                <span className="text-xs text-text-secondary font-light uppercase tracking-wider">Total Transacted</span>
                <p className="text-3xl font-extrabold text-text-primary font-tabular mt-1.5">
                  ₹{selectedExpense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Transaction Date</p>
                  <p className="text-text-primary mt-1 font-semibold font-tabular">
                    {new Date(selectedExpense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Category Segment</p>
                  <p className="text-text-primary mt-1 font-semibold">{selectedExpense.category}</p>
                </div>
                <div className="col-span-2 border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Paid From</p>
                  <p className="text-text-primary mt-1 font-semibold">{getSourceLabel(selectedExpense.paid_by)}</p>
                </div>
                <div className="col-span-2 border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Brief Description</p>
                  <p className="text-text-primary mt-1.5 font-light leading-relaxed whitespace-pre-wrap">{selectedExpense.description}</p>
                </div>
                {selectedExpense.notes && (
                  <div className="col-span-2 border-t border-border pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Internal Partnership Notes</p>
                    <p className="text-text-primary mt-1.5 font-light leading-relaxed bg-[#feb904]/5 border border-[#feb904]/15 rounded-2xl p-3 text-xs italic">{selectedExpense.notes}</p>
                  </div>
                )}
              </div>

              {/* Receipt Attachment Panel */}
              <div className="border-t border-border pt-6 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Invoice / Receipt Attachment</p>
                {selectedExpense.receipt_path ? (
                  <div className="p-4 rounded-2xl bg-bg-subtle border border-border space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/15 text-[#cda005] dark:text-[#feb904]">
                        {selectedExpense.receipt_name?.endsWith('.pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-primary truncate">{selectedExpense.receipt_name}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5 font-light">Supabase Secure Cloud Storage</p>
                      </div>
                    </div>

                    {/* Receipt Preview */}
                    {signedReceiptUrl && (
                      <div className="relative border border-border/80 rounded-2xl overflow-hidden bg-bg-base flex items-center justify-center p-2 min-h-[140px] max-h-[220px]">
                        {selectedExpense.receipt_name?.endsWith('.pdf') ? (
                          <div className="text-center p-6 space-y-2">
                            <FileCheck size={28} className="mx-auto text-[#feb904]" />
                            <p className="text-xs text-text-secondary">PDF Document loaded</p>
                            <a href={signedReceiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-accent text-black font-bold text-[10px] hover-lift shadow-sm">
                              View Full PDF
                            </a>
                          </div>
                        ) : (
                          <img src={signedReceiptUrl} alt="Receipt Thumbnail" className="max-h-[200px] object-contain rounded-lg shadow-sm" />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary italic">No receipt attached to this transaction ledger.</p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-border bg-bg-subtle/20 grid grid-cols-2 gap-4">
              <button 
                onClick={() => openEdit(selectedExpense)}
                className="py-3 rounded-2xl border border-border bg-bg-surface text-text-primary font-bold hover:bg-bg-subtle transition-all cursor-pointer shadow-sm hover-lift flex items-center justify-center gap-2"
              >
                <Edit3 size={16} />
                <span>Edit Entry</span>
              </button>
              
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="py-3 rounded-2xl bg-danger/10 hover:bg-danger/20 text-danger font-bold transition-all cursor-pointer shadow-sm hover-lift flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>Delete Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE & EDIT DRAWER SHEET FORM */}
      {(activeDrawer === 'create' || activeDrawer === 'edit') && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
          {/* Close click area */}
          <div className="flex-1" onClick={() => setActiveDrawer(null)} />
          
          <div className="w-full max-w-[500px] h-full bg-bg-surface border-l border-border flex flex-col shadow-2xl animate-slideLeft transition-colors duration-300">
            {/* Form Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-bg-subtle/30">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  {activeDrawer === 'edit' ? 'Edit Transaction Ledger' : 'Create New Expense'}
                </span>
                <h2 className="text-xl font-bold text-text-primary mt-0.5">
                  {activeDrawer === 'edit' ? 'Modify Ledger Entry' : 'Log Startup Expense'}
                </h2>
              </div>
              <button 
                onClick={() => setActiveDrawer(null)}
                className="p-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Date occurred</label>
                <DatePicker
                  value={formDate}
                  onChange={setFormDate}
                  placeholder="Pick a date"
                  className={errors.date ? 'border-danger' : 'border-border'}
                />
                {errors.date && <p className="text-xs text-danger font-medium mt-1">{errors.date}</p>}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Transaction Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold font-tabular text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 rounded-2xl border bg-bg-subtle/50 text-text-primary text-sm font-tabular font-bold focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all ${
                      errors.amount ? 'border-danger' : 'border-border'
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-danger font-medium mt-1">{errors.amount}</p>}
              </div>

              {/* Paid To Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Paid To</label>
                <input
                  type="text"
                  required
                  placeholder="Paid to (e.g. AWS, Swiggy, Ola)"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className={`w-full p-3 rounded-2xl border bg-bg-subtle/50 text-text-primary text-sm focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all ${
                    errors.vendor ? 'border-danger' : 'border-border'
                  }`}
                />
                {errors.vendor && <p className="text-xs text-danger font-medium mt-1">{errors.vendor}</p>}
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Category Segment</label>
                <CustomSelect
                  options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                  value={formCategory}
                  onChange={setFormCategory}
                />
              </div>

              {/* Paid From Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Paid From</label>
                <CustomSelect
                  options={PAYMENT_SOURCES}
                  value={formPaidBy}
                  onChange={setFormPaidBy}
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Brief Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what this expense covers..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={`w-full p-3 rounded-2xl border bg-bg-subtle/50 text-text-primary text-sm focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all ${
                    errors.description ? 'border-danger' : 'border-border'
                  }`}
                />
                {errors.description && <p className="text-xs text-danger font-medium mt-1">{errors.description}</p>}
              </div>

              {/* Internal notes textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Internal Partner Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add optional notes for the other founders..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full p-3 rounded-2xl border bg-bg-subtle/50 text-text-primary text-sm focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all ${
                    errors.notes ? 'border-danger' : 'border-border'
                  }`}
                />
                {errors.notes && <p className="text-xs text-danger font-medium mt-1">{errors.notes}</p>}
              </div>

              {/* Storage Attachment Upload */}
              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Receipt / Invoice Attachment</label>
                
                {attachmentPath ? (
                  /* File attached display */
                  <div className="p-3 rounded-2xl bg-[#feb904]/5 border border-[#feb904]/15 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 rounded-xl bg-accent text-black shrink-0">
                        {attachmentName?.endsWith('.pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate max-w-[200px]" title={attachmentName || ''}>
                          {attachmentName}
                        </p>
                        <p className="text-[10px] text-text-secondary font-light">Successfully uploaded</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-danger hover:bg-danger/10 cursor-pointer transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  /* File upload action */
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:bg-bg-subtle/30 cursor-pointer transition-all hover:border-accent/80 flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    
                    {isUploading ? (
                      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UploadCloud size={28} className="text-text-secondary" />
                        <p className="text-xs font-bold text-text-primary">Click to select receipt file</p>
                        <p className="text-[10px] text-text-secondary font-light leading-relaxed">
                          Accepted JPG, PNG, or PDF formats up to 10 MB limit
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit footer actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  disabled={formSubmitLoading}
                  className="px-5 py-3 rounded-2xl border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading || isUploading}
                  className="px-6 py-3 rounded-2xl bg-accent text-accent-fg font-bold hover:bg-[#e0a403] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-accent/15"
                >
                  {formSubmitLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{activeDrawer === 'edit' ? 'Save Changes' : 'Confirm Ledger'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SINGLE DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-[90%] max-w-[400px] bg-bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-scaleIn transition-colors duration-300">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 text-danger">
              <Trash2 size={20} />
              <span>Confirm Delete</span>
            </h3>
            
            <p className="text-sm text-text-secondary font-light mt-3 leading-relaxed">
              Are you absolutely sure you want to permanently delete this expense ledger entry? This transaction will be archived in the audit logs, and any attached receipt will be erased.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle font-bold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-danger text-danger-fg font-bold text-xs hover:bg-[#b53c2d] cursor-pointer shadow-md shadow-danger/10 transition-all"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Delete Entry</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
