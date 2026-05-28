'use client';

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  FileCode, 
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv' | 'md' | 'pdf'>('xlsx');
  const [exportScope, setExportScope] = useState<'all' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    
    const params = new URLSearchParams({
      format: selectedFormat
    });

    if (exportScope === 'range') {
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
    }

    // Trigger download in new tab
    const exportUrl = `/api/expenses/export?${params.toString()}`;
    window.open(exportUrl, '_blank');

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  const getFormatCardStyle = (fmt: 'xlsx' | 'csv' | 'md' | 'pdf') => {
    const active = selectedFormat === fmt;
    return `p-5 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer select-none hover-lift ${
      active
        ? 'bg-accent/15 border-accent text-[#cda005] dark:text-[#feb904] ring-4 ring-accent/15 font-bold'
        : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
    }`;
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
          Export Platform
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-light">
          Consolidate expense records and download them in your preferred format.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Config Panel */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. Format Selection Card */}
          <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <span>Step 1: Choose File Format</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Excel Card */}
              <div onClick={() => setSelectedFormat('xlsx')} className={getFormatCardStyle('xlsx')}>
                <Table size={32} className="text-[#feb904] mb-2" />
                <span className="text-xs font-semibold">Excel Sheet</span>
                <span className="text-[9px] text-text-muted mt-1 leading-tight font-light">Full styled .xlsx</span>
              </div>

              {/* CSV Card */}
              <div onClick={() => setSelectedFormat('csv')} className={getFormatCardStyle('csv')}>
                <FileCode size={32} className="text-[#feb904] mb-2" />
                <span className="text-xs font-semibold">CSV Data</span>
                <span className="text-[9px] text-text-muted mt-1 leading-tight font-light">Plain comma-delimited</span>
              </div>

              {/* MD Card */}
              <div onClick={() => setSelectedFormat('md')} className={getFormatCardStyle('md')}>
                <FileText size={32} className="text-[#feb904] mb-2" />
                <span className="text-xs font-semibold">Markdown</span>
                <span className="text-[9px] text-text-muted mt-1 leading-tight font-light">GFM Compliant table</span>
              </div>

              {/* PDF Card */}
              <div onClick={() => setSelectedFormat('pdf')} className={getFormatCardStyle('pdf')}>
                <FileCheck size={32} className="text-[#feb904] mb-2" />
                <span className="text-xs font-semibold">A4 Print PDF</span>
                <span className="text-[9px] text-text-muted mt-1 leading-tight font-light">A4 Margins optimized</span>
              </div>
            </div>
          </div>

          {/* 2. Scope Selection Card */}
          <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Step 2: Choose Data Scope
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportScope('all')}
                className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-accent text-accent-fg border-accent shadow-md shadow-accent/15'
                    : 'bg-bg-subtle/50 border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                }`}
              >
                Export All Transactions
              </button>
              <button
                onClick={() => setExportScope('range')}
                className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  exportScope === 'range'
                    ? 'bg-accent text-accent-fg border-accent shadow-md shadow-accent/15'
                    : 'bg-bg-subtle/50 border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                }`}
              >
                Export Custom Range
              </button>
            </div>

            {exportScope === 'range' && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-bg-subtle border border-border/80 animate-fadeIn">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-border bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-border bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Download CTA Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || (exportScope === 'range' && (!startDate || !endDate))}
            className="w-full py-4 rounded-2xl font-bold bg-[#feb904] text-black hover:bg-[#e0a403] focus:ring-4 focus:ring-accent/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/25"
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download size={18} />
                <span>Compile & Download Ledger</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </div>

        {/* Right Column: Information Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Sparkles size={16} className="text-accent" />
              <span>Export Guidelines</span>
            </h3>

            <ul className="space-y-3.5 text-xs text-text-secondary leading-relaxed font-light list-disc pl-4">
              <li>
                <strong>Immediate compiling:</strong> Exports are built directly in memory and triggered in your local browser instantaneously without queue delays.
              </li>
              <li>
                <strong>Excel Formula Ready:</strong> Numeric amount fields are formatted as clean currency numbers, enabling quick spreadsheet sum evaluations.
              </li>
              <li>
                <strong>A4 Clean Layout:</strong> A4 PDFs explicitly shrink column ratios and margins to fit tables comfortably in portrait width without truncating information.
              </li>
              <li>
                <strong>Audit Compliance:</strong> Each file download is strictly registered in the database backup log schema.
              </li>
            </ul>

            <div className="pt-4 border-t border-border flex items-center gap-3 text-xs text-[#feb904] font-medium bg-[#feb904]/5 p-3 rounded-2xl">
              <ShieldCheck size={20} className="shrink-0" />
              <span>Session Authenticated</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
