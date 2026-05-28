'use client';

import React, { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  History, 
  User, 
  Calendar, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Edit2,
  MinusCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileJson
} from 'lucide-react';

interface AuditLog {
  id: string;
  performed_by: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  entity: string;
  entity_id: string;
  snapshot: any;
  timestamp: string;
  actor_name: string;
  actor_email: string;
}

interface Actor {
  id: string;
  name: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [selectedActor, setSelectedActor] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        actor: selectedActor,
        action: selectedAction,
        startDate,
        endDate
      });

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch activity logs.');
      const data = await res.json();
      setLogs(data.logs);
      setActors(data.users);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedActor, selectedAction, startDate, endDate]);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(prev => prev === logId ? null : logId);
  };

  const getActionBadge = (action: 'CREATED' | 'UPDATED' | 'DELETED') => {
    switch (action) {
      case 'CREATED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-[#2e7d32]/10 border border-[#2e7d32]/20 text-[#2e7d32] flex items-center gap-1">
            <PlusCircle size={10} />
            <span>Created</span>
          </span>
        );
      case 'UPDATED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-[#feb904]/10 border border-[#feb904]/20 text-[#cda005] dark:text-[#feb904] flex items-center gap-1">
            <Edit2 size={10} />
            <span>Updated</span>
          </span>
        );
      case 'DELETED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-danger/10 border border-danger/20 text-danger flex items-center gap-1">
            <MinusCircle size={10} />
            <span>Deleted</span>
          </span>
        );
    }
  };

  const renderSummaryText = (log: AuditLog) => {
    const snap = log.snapshot;
    
    if (log.action === 'CREATED') {
      return (
        <span className="text-text-primary">
          Added <span className="font-bold font-tabular">₹{snap.amount?.toLocaleString('en-IN')}</span> for{' '}
          <span className="font-semibold">{snap.vendor}</span> under <span className="underline decoration-accent/40 decoration-2">{snap.category}</span>
        </span>
      );
    } else if (log.action === 'DELETED') {
      return (
        <span className="text-text-primary">
          Deleted record <span className="font-bold">{snap.vendor}</span> which cost{' '}
          <span className="font-bold font-tabular">₹{snap.amount?.toLocaleString('en-IN')}</span>
        </span>
      );
    } else if (log.action === 'UPDATED') {
      const before = snap.before || {};
      const after = snap.after || {};
      
      const changes: string[] = [];
      if (before.amount !== after.amount) {
        changes.push(`amount (₹${before.amount} → ₹${after.amount})`);
      }
      if (before.vendor !== after.vendor) {
        changes.push(`vendor (${before.vendor} → ${after.vendor})`);
      }
      if (before.category !== after.category) {
        changes.push(`category (${before.category} → ${after.category})`);
      }

      const summaryStr = changes.length > 0 ? `Changed ${changes.join(', ')}` : `Modified details for ${after.vendor}`;

      return (
        <span className="text-text-primary">
          Updated entry for <span className="font-semibold">{after.vendor}</span>. <span className="text-text-secondary text-xs italic">{summaryStr}</span>
        </span>
      );
    }

    return <span className="text-text-secondary">Modified expense entry</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
          Audit Trail
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-light">
          A fully transparent, chronological transaction log of all operations performed by the founders.
        </p>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="bg-bg-surface border border-border rounded-3xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock size={16} className="text-accent" />
            <span>Total Logged Operations:{' '}</span>
            <span className="font-bold text-text-primary font-tabular bg-bg-subtle border border-border px-2.5 py-0.5 rounded-lg text-xs">
              {totalCount}
            </span>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              showFilters || selectedActor || selectedAction || startDate || endDate
                ? 'bg-accent/10 border-accent text-[#cda005] dark:text-[#feb904]'
                : 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filter Feed</span>
          </button>
        </div>

        {/* Filters Body */}
        {showFilters && (
          <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-slideDown">
            {/* Filter by Actor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Performed By</label>
              <CustomSelect
                options={[
                  { value: '', label: 'All Founders' },
                  ...actors.map(act => ({ value: act.id, label: act.name }))
                ]}
                value={selectedActor}
                onChange={(val) => { setSelectedActor(val); setPage(1); }}
              />
            </div>

            {/* Filter by Action */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Action Type</label>
              <CustomSelect
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'CREATED', label: 'CREATED' },
                  { value: 'UPDATED', label: 'UPDATED' },
                  { value: 'DELETED', label: 'DELETED' }
                ]}
                value={selectedAction}
                onChange={(val) => { setSelectedAction(val); setPage(1); }}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Logged From</label>
              <DatePicker
                value={startDate}
                onChange={(val) => { setStartDate(val); setPage(1); }}
                placeholder="Logged From"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Logged To</label>
              <DatePicker
                value={endDate}
                onChange={(val) => { setEndDate(val); setPage(1); }}
                placeholder="Logged To"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Chronological Feed */}
      <div className="space-y-4">
        {isLoading ? (
          /* Skeletons */
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-bg-surface border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          /* Empty Feed */
          <div className="bg-bg-surface border border-border rounded-3xl py-16 text-center space-y-3 shadow-sm">
            <div className="inline-flex p-4 bg-bg-subtle border border-border rounded-3xl text-text-secondary">
              <History size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No activities logged</h3>
            <p className="text-sm text-text-secondary font-light max-w-sm mx-auto">
              We couldn't locate any events matching your selected filter guidelines.
            </p>
          </div>
        ) : (
          /* Logs Stream list */
          <div className="space-y-3">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              
              return (
                <div 
                  key={log.id}
                  className="bg-bg-surface border border-border rounded-3xl overflow-hidden shadow-sm hover:border-accent/40 transition-all duration-200"
                >
                  {/* Summary Card Header bar */}
                  <div 
                    onClick={() => toggleExpand(log.id)}
                    className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* User initials circle */}
                      <div className="w-10 h-10 rounded-xl bg-bg-subtle border border-border flex items-center justify-center font-bold text-sm text-accent shrink-0 shadow-inner select-none">
                        {log.actor_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-text-primary">{log.actor_name}</span>
                          {getActionBadge(log.action)}
                        </div>
                        <p className="text-sm font-light leading-relaxed mt-1 text-text-secondary truncate">
                          {renderSummaryText(log)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto text-xs text-text-secondary">
                      <span className="font-tabular font-light">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Kolkata'
                        })}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded JSON Diffs view panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-border/80 bg-bg-subtle/30 animate-fadeIn">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                          <FileJson size={14} className="text-accent" />
                          <span>Audit State Diff</span>
                        </h4>

                        <div className="relative rounded-2xl border border-border bg-bg-subtle p-4 overflow-x-auto max-h-[300px]">
                          <pre className="text-xs font-mono text-text-primary leading-relaxed whitespace-pre font-tabular">
                            {JSON.stringify(log.snapshot, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination footer controls */}
        {!isLoading && logs.length > 0 && (
          <div className="flex items-center justify-between p-4 border border-border rounded-3xl bg-bg-surface text-xs">
            <span className="text-text-secondary font-light">
              Showing <span className="font-bold text-text-primary font-tabular">{(page - 1) * 50 + 1}</span> to{' '}
              <span className="font-bold text-text-primary font-tabular">{Math.min(page * 50, totalCount)}</span> of{' '}
              <span className="font-bold text-text-primary font-tabular">{totalCount}</span> logs
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
    </div>
  );
}
