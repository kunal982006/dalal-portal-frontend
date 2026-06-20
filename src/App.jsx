import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Navbar from './components/Navbar';
import UploadCard from './components/UploadCard';
import LeadsTable from './components/LeadsTable';
import StatsBar from './components/StatsBar';

const API_BASE = 'https://astracall-backend.onrender.com/api';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = no session
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── Auth Listener ──────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Leads Fetching ─────────────────────────
  const fetchLeads = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await axios.get(`${API_BASE}/leads`);
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setFetchError('Unable to connect to the server. Make sure the backend is running.');
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return; // Don't fetch if not logged in
    fetchLeads();
    // Poll every 15s for live updates
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, [fetchLeads, session]);

  // ── Loading State ──────────────────────────
  if (session === undefined) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  // ── Auth Gate ──────────────────────────────
  if (!session) {
    return <Login />;
  }

  // ── Authenticated Dashboard ────────────────
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Navbar session={session} apiBase={API_BASE} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatsBar leads={leads} loading={loadingLeads} />
        </div>

        {/* Upload Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <UploadCard apiBase={API_BASE} onUploadSuccess={fetchLeads} />
        </div>

        {/* Leads Table */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <LeadsTable leads={leads} loading={loadingLeads} error={fetchError} onRetry={fetchLeads} />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400 border-t border-slate-100">
        <p>© {new Date().getFullYear()} AstraCall · Dalal Portal — Built for the Hustle</p>
      </footer>
    </div>
  );
}
