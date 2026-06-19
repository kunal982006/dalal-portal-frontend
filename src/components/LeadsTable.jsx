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

export default function LeadsTable({ leads, loading, error, onRetry }) {
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
        {!loading && (
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          </span>
        )}
      </div>

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
                  Client Name
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
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
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
                leads.map((lead, idx) => (
                  <tr
                    key={lead.id || idx}
                    className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold text-slate-800">{lead.client_name}</span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
