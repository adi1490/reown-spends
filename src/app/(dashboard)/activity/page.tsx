'use client';

import React, { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  History,
  SlidersHorizontal,
  PlusCircle,
  Edit2,
  MinusCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileJson,
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
  actor_username: string;
}

interface Actor {
  id: string;
  name: string;
}

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

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedActor, setSelectedActor] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
        endDate,
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

  useEffect(() => { fetchLogs(); }, [page, selectedActor, selectedAction, startDate, endDate]);

  const toggleExpand = (logId: string) =>
    setExpandedLogId(prev => (prev === logId ? null : logId));

  const ACTION_CONFIG = {
    CREATED: { bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)', color: '#2e7d32', Icon: PlusCircle, label: 'Created' },
    UPDATED: { bg: 'rgba(254,185,4,0.10)', border: 'rgba(254,185,4,0.25)', color: '#b8870a', Icon: Edit2, label: 'Updated' },
    DELETED: { bg: 'rgba(186,26,26,0.08)', border: 'rgba(186,26,26,0.2)', color: 'var(--danger)', Icon: MinusCircle, label: 'Deleted' },
  };

  const getActionBadge = (action: keyof typeof ACTION_CONFIG) => {
    const cfg = ACTION_CONFIG[action];
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '100px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        flexShrink: 0,
      }}>
        <cfg.Icon size={10} />
        {cfg.label}
      </span>
    );
  };

  const renderSummaryText = (log: AuditLog) => {
    const snap = log.snapshot;
    if (log.action === 'CREATED') {
      return (
        <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
          Added{' '}
          <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            ₹{snap.amount?.toLocaleString('en-IN')}
          </strong>
          {' '}for{' '}
          <strong style={{ fontWeight: 600 }}>{snap.vendor}</strong>
          {' '}under{' '}
          <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(254,185,4,0.5)' }}>{snap.category}</span>
        </span>
      );
    } else if (log.action === 'DELETED') {
      return (
        <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
          Deleted record{' '}
          <strong style={{ fontWeight: 600 }}>{snap.vendor}</strong>
          {' '}which cost{' '}
          <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{snap.amount?.toLocaleString('en-IN')}</strong>
        </span>
      );
    } else if (log.action === 'UPDATED') {
      const before = snap.before || {};
      const after = snap.after || {};
      const changes: string[] = [];
      if (before.amount !== after.amount) changes.push(`amount (₹${before.amount} → ₹${after.amount})`);
      if (before.vendor !== after.vendor) changes.push(`vendor (${before.vendor} → ${after.vendor})`);
      if (before.category !== after.category) changes.push(`category (${before.category} → ${after.category})`);
      const summaryStr = changes.length > 0 ? `Changed ${changes.join(', ')}` : `Modified details`;
      return (
        <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
          Updated entry for{' '}
          <strong style={{ fontWeight: 600 }}>{after.vendor}</strong>.{' '}
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>{summaryStr}</span>
        </span>
      );
    }
    return <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Modified expense entry</span>;
  };

  const hasActiveFilters = selectedActor || selectedAction || startDate || endDate;

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
          Audit Trail
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 300 }}>
          Chronological log of all platform operations performed by the founders.
        </p>
      </div>

      {/* Filter toolbar */}
      <div style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Clock size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>Total Operations:</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-container)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '12px',
            }}>
              {totalCount}
            </span>
          </div>

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
              borderColor: (showFilters || hasActiveFilters) ? 'var(--accent)' : 'var(--border)',
              backgroundColor: (showFilters || hasActiveFilters) ? 'rgba(254,185,4,0.08)' : 'transparent',
              color: (showFilters || hasActiveFilters) ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Filter Feed</span>
          </button>
        </div>

        {showFilters && (
          <div
            className="animate-slideDown"
            style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={sectionLabel}>Performed By</p>
              <CustomSelect
                options={[
                  { value: '', label: 'All Founders' },
                  ...actors.map(a => ({ value: a.id, label: a.name })),
                ]}
                value={selectedActor}
                onChange={val => { setSelectedActor(val); setPage(1); }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={sectionLabel}>Action Type</p>
              <CustomSelect
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'CREATED', label: 'CREATED' },
                  { value: 'UPDATED', label: 'UPDATED' },
                  { value: 'DELETED', label: 'DELETED' },
                ]}
                value={selectedAction}
                onChange={val => { setSelectedAction(val); setPage(1); }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={sectionLabel}>Logged From</p>
              <DatePicker value={startDate} onChange={val => { setStartDate(val); setPage(1); }} placeholder="Start date" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={sectionLabel}>Logged To</p>
              <DatePicker value={endDate} onChange={val => { setEndDate(val); setPage(1); }} placeholder="End date" />
            </div>
          </div>
        )}
      </div>

      {/* Logs feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '64px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', opacity: 1 - i * 0.15 }} />
          ))
        ) : logs.length === 0 ? (
          <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px' }}>
              <History size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>No activities found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontWeight: 300 }}>
              No events match your selected filters.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                style={{
                  ...card,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    {/* Initials */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-container)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      flexShrink: 0,
                      userSelect: 'none',
                    }}>
                      {log.actor_name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                          {log.actor_name}
                        </span>
                        {getActionBadge(log.action)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 300 }}>
                        {renderSummaryText(log)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata',
                      })}
                    </span>
                    {isExpanded ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="animate-slideDown"
                    style={{
                      borderTop: '1px solid var(--border)',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <FileJson size={13} style={{ color: 'var(--accent)' }} />
                      <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                        Audit State Snapshot
                      </h4>
                    </div>
                    <div style={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)', padding: '14px', maxHeight: '280px', overflowX: 'auto', overflowY: 'auto' }}>
                      <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre' }}>
                        {JSON.stringify(log.snapshot, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Pagination */}
        {!isLoading && logs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Showing{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{(page - 1) * 50 + 1}</strong>
              {' '}–{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{Math.min(page * 50, totalCount)}</strong>
              {' '}of{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalCount}</strong>
              {' '}logs
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
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', padding: '0 8px' }}>
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
    </div>
  );
}
