import { useState, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function UploadCard({ apiBase, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFile(null);
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
    } else {
      setMessage({ type: 'error', text: 'Only .xlsx files are allowed.' });
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select an Excel (.xlsx) file.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // Get the logged-in user's email from Supabase session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('email', user.email);
      formData.append('file', file);

      const res = await axios.post(`${apiBase}/leads/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
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
            <p className="text-xs text-slate-400">Import your lead list and start AI calling instantly</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* File Upload */}
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
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !file}
          id="upload-start-calling-btn"
          className="w-full relative py-3 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:from-blue-600 disabled:hover:to-indigo-600 disabled:active:scale-100"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading & Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Upload & Start Calling
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
