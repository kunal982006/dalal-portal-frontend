import { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export default function UploadCard({ apiBase, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Column Mapper State
  const [showMapper, setShowMapper] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [mappedName, setMappedName] = useState('');
  const [mappedPhone, setMappedPhone] = useState('');

  // Quick Dial State
  const [quickDialName, setQuickDialName] = useState('');
  const [quickDialPhone, setQuickDialPhone] = useState('');
  const [quickDialing, setQuickDialing] = useState(false);
  const [quickDialMessage, setQuickDialMessage] = useState(null);

  const handleQuickDial = async (e) => {
    e.preventDefault();
    if (!quickDialName || !quickDialPhone) {
      setQuickDialMessage({ type: 'error', text: 'Please fill out both fields.' });
      return;
    }

    setQuickDialing(true);
    setQuickDialMessage(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setQuickDialMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        setQuickDialing(false);
        return;
      }

      const res = await axios.post(`${apiBase}/leads/single-dial`, {
        email: user.email,
        customerName: quickDialName,
        phoneNumber: quickDialPhone
      });

      setQuickDialMessage({ type: 'success', text: res.data.message || 'Target added to queue!' });
      setQuickDialName('');
      setQuickDialPhone('');
      onUploadSuccess?.();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Dial failed. Please try again.';
      setQuickDialMessage({ type: 'error', text: errMsg });
    } finally {
      setQuickDialing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setHeaders([]);
    setSheetData([]);
    setMappedName('');
    setMappedPhone('');
    setShowMapper(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setMessage(null);
      parseExcelHeaders(droppedFile);
    } else {
      setMessage({ type: 'error', text: 'Only .xlsx files are allowed.' });
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMessage(null);
      parseExcelHeaders(selected);
    }
  };

  // Read Excel in-browser and extract headers
  const parseExcelHeaders = (excelFile) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          setMessage({ type: 'error', text: 'The Excel file appears to be empty.' });
          return;
        }

        const extractedHeaders = Object.keys(jsonData[0]);
        setHeaders(extractedHeaders);
        setSheetData(jsonData);

        // Auto-detect common column names
        const nameLower = extractedHeaders.find(h =>
          ['customer name', 'name', 'customer_name', 'client_name', 'full name', 'fullname'].includes(h.toLowerCase())
        );
        const phoneLower = extractedHeaders.find(h =>
          ['phone number', 'phone', 'phone_number', 'mobile', 'contact', 'mobile number'].includes(h.toLowerCase())
        );

        setMappedName(nameLower || '');
        setMappedPhone(phoneLower || '');
        setShowMapper(true);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        setMessage({ type: 'error', text: 'Failed to read the Excel file.' });
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  // Process mapped data and send to backend
  const handleMappedUpload = async () => {
    if (!mappedName || !mappedPhone) {
      setMessage({ type: 'error', text: 'Please map both Customer Name and Phone Number columns.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        setUploading(false);
        return;
      }

      // Build structured leads array
      const leads = sheetData.map(row => {
        const customData = {};
        for (const key of headers) {
          if (key !== mappedName && key !== mappedPhone) {
            customData[key] = row[key] ?? '';
          }
        }
        return {
          customerName: row[mappedName] || '',
          phoneNumber: String(row[mappedPhone] || '').trim(),
          customData
        };
      }).filter(l => l.customerName && l.phoneNumber);

      if (leads.length === 0) {
        setMessage({ type: 'error', text: 'No valid leads found after mapping. Check your column selection.' });
        setUploading(false);
        return;
      }

      const res = await axios.post(`${apiBase}/leads/upload`, {
        email: user.email,
        leads
      });

      setMessage({ type: 'success', text: res.data.message || 'Leads uploaded successfully!' });
      resetForm();
      onUploadSuccess?.();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Upload failed. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bulk Upload Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Leads</h2>
              <p className="text-xs text-slate-400">Import your lead list and map columns intelligently</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* File Upload Zone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Excel File <span className="text-rose-500">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'drop-zone-active'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · {sheetData.length} rows detected</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Only .xlsx files supported</p>
                </>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {message.type === 'success' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              {message.text}
            </div>
          )}

          {/* Upload button (only when mapper is NOT shown — acts as fallback) */}
          {!showMapper && (
            <button
              type="button"
              disabled={!file}
              onClick={() => file && parseExcelHeaders(file)}
              className="w-full relative py-3 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Upload & Map Columns
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Dial Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.671zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-5.834L6.166 6.166M14.25 14.25A2.25 2.25 0 1012 12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quick Dial</h2>
              <p className="text-xs text-slate-400">Instantly add a single target to the queue</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleQuickDial} className="p-6 space-y-5 flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={quickDialName}
                onChange={(e) => setQuickDialName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                disabled={quickDialing}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={quickDialPhone}
                onChange={(e) => setQuickDialPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                disabled={quickDialing}
              />
            </div>
          </div>

          {quickDialMessage && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                quickDialMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {quickDialMessage.type === 'success' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              {quickDialMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={quickDialing || !quickDialName || !quickDialPhone}
            className="w-full mt-auto relative py-3 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:from-emerald-600 disabled:hover:to-teal-600 disabled:active:scale-100"
          >
            {quickDialing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Dialing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Call Now 🚀
              </span>
            )}
          </button>
        </form>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Column Mapping Modal */}
      {/* ═══════════════════════════════════════════ */}
      {showMapper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.2)' }}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.05)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart Column Mapper</h3>
                  <p className="text-[11px] text-slate-400">Map your Excel columns to required fields</p>
                </div>
              </div>
              <button
                onClick={() => setShowMapper(false)}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: '#94a3b8' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Info badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <span>Detected <strong className="text-indigo-300">{headers.length}</strong> columns and <strong className="text-indigo-300">{sheetData.length}</strong> rows. Unmapped columns become custom Vapi variables.</span>
              </div>

              {/* Preview of detected headers */}
              <div className="flex flex-wrap gap-1.5">
                {headers.map((h) => (
                  <span key={h} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.15)' }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Mapping Dropdowns */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#818cf8' }}>
                    Customer Name Column <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mappedName}
                    onChange={(e) => setMappedName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white focus:outline-none appearance-none cursor-pointer"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <option value="" style={{ background: '#1e293b' }}>— Select Column —</option>
                    {headers.map(h => (
                      <option key={h} value={h} style={{ background: '#1e293b' }}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#818cf8' }}>
                    Phone Number Column <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mappedPhone}
                    onChange={(e) => setMappedPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white focus:outline-none appearance-none cursor-pointer"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <option value="" style={{ background: '#1e293b' }}>— Select Column —</option>
                    {headers.map(h => (
                      <option key={h} value={h} style={{ background: '#1e293b' }}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom vars preview */}
              {mappedName && mappedPhone && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4ade80' }}>Custom Vapi Variables</p>
                  <div className="flex flex-wrap gap-1.5">
                    {headers.filter(h => h !== mappedName && h !== mappedPhone).map(h => (
                      <span key={h} className="px-2 py-0.5 rounded-md text-[11px] font-mono" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>
                        {`{{${h}}}`}
                      </span>
                    ))}
                    {headers.filter(h => h !== mappedName && h !== mappedPhone).length === 0 && (
                      <span className="text-[11px] text-slate-500">No extra columns detected.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: 'rgba(99,102,241,0.1)', background: 'rgba(15,23,42,0.5)' }}>
              <button
                onClick={() => setShowMapper(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}
              >
                Cancel
              </button>
              <button
                onClick={handleMappedUpload}
                disabled={uploading || !mappedName || !mappedPhone}
                className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ⚡ Confirm & Start Calling ({sheetData.length} leads)
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
