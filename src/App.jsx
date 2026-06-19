import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import UploadCard from './components/UploadCard';
import LeadsTable from './components/LeadsTable';
import StatsBar from './components/StatsBar';

const API_BASE = 'https://astracall-backend.onrender.com/api';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [fetchError, setFetchError] = useState(null);

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
    fetchLeads();
    // Poll every 15s for live updates
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Navbar />

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
