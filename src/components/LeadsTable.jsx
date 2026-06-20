import { useState, useMemo, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { supabase } from '../supabaseClient';

const STATUS_CONFIG = {
  GREEN: {
    label: 'Interested',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  RED: {
    label: 'Not Interested',
    classes: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-rose-500/10',
    dot: 'bg-rose-500',
  },
  YELLOW: {
    label: 'Follow-Up',
    classes: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-500/10',
    dot: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pending',
    classes: 'bg-slate-50 text-slate-600 border-slate-200/60 ring-slate-500/10',
    dot: 'bg-slate-400',
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ring-1 ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded-lg animate-shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function LeadsTable({ 
  leads, 
  loading, 
  error, 
  onRetry,
  selectedBatch,
  setSelectedBatch,
  uniqueBatches,
  selectedStatus
}) {
  const [exporting, setExporting] = useState(false);
  
  // Audio & Summary Modal State
  const [activeAudio, setActiveAudio] = useState(null);
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, text: '' });

  // Filter leads based on selected batch AND selected status
  const displayedLeads = useMemo(() => {
    let filtered = leads;
    if (selectedBatch !== 'All') {
      filtered = filtered.filter(l => l.batch_id === selectedBatch);
    }
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(l => l.status === selectedStatus);
    }
    return filtered;
  }, [leads, selectedBatch, selectedStatus]);

  const handleExport = async () => {
    try {
      setExporting(true);

      if (!displayedLeads || displayedLeads.length === 0) {
        alert('No leads available to export with current filters.');
        return;
      }

      // Map and format the data using strictly what's visible
      const formattedData = displayedLeads.map(lead => ({
        "Customer Name": lead.customer_name || 'N/A',
        "Phone Number": lead.phone_number || 'N/A',
        "Call Status": lead.status === 'PENDING' ? 'Pending' : 'Completed',
        "Call Duration (Seconds)": '-',
        "AI Summary / Note": lead.transcript_summary || '-',
        "Verdict": lead.status === 'GREEN' ? 'Interested' : 
                   lead.status === 'RED' ? 'Not Interested' : 
                   lead.status === 'YELLOW' ? 'Follow-up' : 'N/A',
      }));

      // Create a workbook and append the worksheet
      const worksheet = xlsx.utils.json_to_sheet(formattedData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Leads Report");

      // Set column widths for readability
      const colWidths = [
        { wch: 25 }, // Customer Name
        { wch: 20 }, // Phone Number
        { wch: 15 }, // Call Status
        { wch: 25 }, // Call Duration
        { wch: 40 }, // AI Summary / Note
        { wch: 20 }, // Verdict
      ];
      worksheet['!cols'] = colWidths;

      // Trigger auto-download
      const filenameBatch = selectedBatch === 'All' ? 'All_Campaigns' : selectedBatch;
      const filenameStatus = selectedStatus === 'ALL' ? 'All_Statuses' : selectedStatus;
      xlsx.writeFile(workbook, `AstraCall_${filenameBatch}_${filenameStatus}.xlsx`);
      
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export leads. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Lead Tracker</h2>
            <p className="text-xs text-slate-400">Real-time status of all your leads</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!loading && (
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {displayedLeads.length} {displayedLeads.length === 1 ? 'lead' : 'leads'}
            </span>
          )}
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
              exporting || loading
                ? 'bg-indigo-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
            }`}
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Generating Excel...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="hidden sm:inline">Download Response Sheet (.xlsx)</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Filter Dropdown */}
      {!loading && !error && uniqueBatches.length > 0 && (
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
          <label htmlFor="batch-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Campaign Batch:
          </label>
          <div className="relative">
            <select
              id="batch-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-4 py-1.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm min-w-[200px]"
            >
              <option value="All">All Campaigns</option>
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Connection Error</p>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full" id="leads-table">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Recording
                </th>
                <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Summary
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : displayedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5M3.75 7.5h16.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">No leads yet</p>
                    <p className="text-xs text-slate-400">Upload an Excel file above to get started</p>
                  </td>
                </tr>
              ) : (
                displayedLeads.map((lead, idx) => (
                  <tr
                    key={lead.id || idx}
                    className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold text-slate-800">{lead.email}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-slate-600">{lead.customer_name}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-slate-500 font-mono tabular-nums">{lead.phone_number}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {lead.recording_url ? (
                        activeAudio === lead.id ? (
                          <div className="flex items-center gap-2">
                            <audio src={lead.recording_url} controls autoPlay className="h-8 w-32" />
                            <button onClick={() => setActiveAudio(null)} className="text-slate-400 hover:text-slate-600">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveAudio(lead.id)}
                            title="Play Recording"
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                          >
                            🎧
                          </button>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {lead.transcript_summary ? (
                        <button
                          onClick={() => setSummaryModal({ isOpen: true, text: lead.transcript_summary })}
                          title="View Summary"
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          📄
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Summary Modal */}
      {summaryModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                📄 AI Call Summary
              </div>
              <button
                onClick={() => setSummaryModal({ isOpen: false, text: '' })}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-white text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {summaryModal.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
