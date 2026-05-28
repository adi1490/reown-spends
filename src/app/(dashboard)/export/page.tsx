'use client';

import React, { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Download,
  FileText,
  Table,
  FileCode,
  FileCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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
  margin: 0,
};

type Format = 'xlsx' | 'csv' | 'md' | 'pdf';

const FORMAT_OPTIONS: Array<{ fmt: Format; label: string; subtitle: string; Icon: React.ComponentType<any> }> = [
  { fmt: 'xlsx', label: 'Excel Sheet', subtitle: 'Styled .xlsx with formulas', Icon: Table },
  { fmt: 'csv', label: 'CSV Data', subtitle: 'Plain comma-delimited', Icon: FileCode },
  { fmt: 'md', label: 'Markdown', subtitle: 'GFM compliant table', Icon: FileText },
  { fmt: 'pdf', label: 'Print PDF', subtitle: 'A4 layout optimized', Icon: FileCheck },
];

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState<Format>('xlsx');
  const [exportScope, setExportScope] = useState<'all' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    const params = new URLSearchParams({ format: selectedFormat });
    if (exportScope === 'range') {
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
    }
    window.open(`/api/expenses/export?${params.toString()}`, '_blank');
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
          Export Ledger
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 300 }}>
          Compile and download expense records in your preferred format.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }} className="grid-cols-1 md:grid-cols-[1fr_280px]">
        {/* Left: Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Format selection */}
          <div style={card}>
            <p style={{ ...sectionLabel, marginBottom: '16px' }}>Step 1 — Choose File Format</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              {FORMAT_OPTIONS.map(({ fmt, label, subtitle, Icon }) => {
                const isActive = selectedFormat === fmt;
                return (
                  <div
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: isActive ? 'rgba(254,185,4,0.08)' : 'var(--bg-base)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-base)'; }}
                  >
                    <Icon size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.3 }}>{subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope */}
          <div style={card}>
            <p style={{ ...sectionLabel, marginBottom: '16px' }}>Step 2 — Choose Data Scope</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {(['all', 'range'] as const).map(scope => (
                <button
                  key={scope}
                  onClick={() => setExportScope(scope)}
                  style={{
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: exportScope === scope ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: exportScope === scope ? 'var(--accent)' : 'var(--bg-base)',
                    color: exportScope === scope ? 'var(--accent-fg)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {scope === 'all' ? 'All Transactions' : 'Custom Range'}
                </button>
              ))}
            </div>

            {exportScope === 'range' && (
              <div
                className="animate-slideDown"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ ...sectionLabel }}>Start Date</p>
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ ...sectionLabel }}>End Date</p>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
                </div>
              </div>
            )}
          </div>

          {/* Download CTA */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || (exportScope === 'range' && (!startDate || !endDate))}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              opacity: isDownloading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background-color 0.15s ease',
              boxShadow: '0 4px 16px rgba(254,185,4,0.25)',
            }}
            onMouseEnter={e => { if (!isDownloading) e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            {isDownloading
              ? <div style={{ width: '18px', height: '18px', border: '2px solid var(--accent-fg)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              : <Download size={18} />}
            <span>{isDownloading ? 'Preparing file...' : 'Compile & Download Ledger'}</span>
          </button>
        </div>

        {/* Right: Guidelines */}
        <div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Export Guidelines</h3>
            </div>

            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { bold: 'Instant build:', text: 'Exports are compiled directly in-memory and delivered to your browser without queue delays.' },
                { bold: 'Excel-ready:', text: 'Amount fields are formatted as currency numbers, enabling quick sum evaluations.' },
                { bold: 'A4 PDF layout:', text: 'Column ratios and margins are optimized for portrait A4 without truncating data.' },
                { bold: 'Audit logged:', text: 'Each export is registered in the system backup log schema.' },
              ].map(({ bold, text }) => (
                <li key={bold} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 300 }}>
                  <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bold}</strong> {text}
                </li>
              ))}
            </ul>

            <div style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(254,185,4,0.06)',
              border: '1px solid rgba(254,185,4,0.20)',
            }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Session Authenticated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
