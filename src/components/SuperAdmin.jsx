import { useState, useEffect } from 'react';
import axios from 'axios';

const ADMIN_SECRET = 'astracall-god-mode-2026';

export default function SuperAdmin({ apiBase }) {
  // If not authenticated, kick back to login
  if (localStorage.getItem('god_mode_auth') !== 'true') {
    window.location.href = '/god-login';
    return null;
  }

  const handleGodLogout = () => {
    localStorage.removeItem('god_mode_auth');
    window.location.href = '/god-login';
  };
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recharge modal state
  const [rechargeModal, setRechargeModal] = useState({ isOpen: false, email: '', amount: '' });
  const [recharging, setRecharging] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState(null);

  const fetchClients = async () => {
    try {
      setError(null);
      const res = await axios.get(`${apiBase}/admin/clients`, {
        headers: { 'x-admin-secret': ADMIN_SECRET }
      });
      setClients(res.data);
    } catch (err) {
      console.error('Failed to fetch admin clients:', err);
      setError('Failed to load client data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeModal.amount);
    if (!amount || amount <= 0) {
      setRechargeMsg({ type: 'error', text: 'Enter a valid positive amount.' });
      return;
    }

    setRecharging(true);
    setRechargeMsg(null);

    try {
      const res = await axios.post(`${apiBase}/admin/recharge`, {
        email: rechargeModal.email,
        amount
      }, {
        headers: { 'x-admin-secret': ADMIN_SECRET }
      });

      setRechargeMsg({ type: 'success', text: res.data.message });

      // Instantly update local state
      setClients(prev => prev.map(c =>
        c.email === rechargeModal.email
          ? { ...c, wallet_balance: res.data.new_balance }
          : c
      ));

      setTimeout(() => {
        setRechargeModal({ isOpen: false, email: '', amount: '' });
        setRechargeMsg(null);
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Recharge failed.';
      setRechargeMsg({ type: 'error', text: errMsg });
    } finally {
      setRecharging(false);
    }
  };

  const totalWallet = clients.reduce((sum, c) => sum + parseFloat(c.wallet_balance || 0), 0);
  const totalLeads = clients.reduce((sum, c) => sum + parseInt(c.total_leads || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 40%, #0d0d0d 100%)' }}>
      {/* God Mode Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(20,5,5,0.85)', borderColor: 'rgba(220,38,38,0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 4px 15px rgba(220,38,38,0.35)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                  GOD MODE
                </h1>
                <p className="text-[11px] font-medium tracking-wider uppercase leading-none mt-0.5" style={{ color: '#ef4444' }}>
                  Super Admin Panel
                </p>
              </div>
            </div>
            <button
              onClick={handleGodLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Logout God Mode
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* God Mode Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl p-5 border overflow-hidden relative" style={{ background: 'rgba(20,10,10,0.6)', borderColor: 'rgba(220,38,38,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #f87171)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#f87171' }}>Total Clients</p>
            <p className="text-3xl font-extrabold text-white tabular-nums">{clients.length}</p>
          </div>
          <div className="rounded-2xl p-5 border overflow-hidden relative" style={{ background: 'rgba(20,10,10,0.6)', borderColor: 'rgba(220,38,38,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#fbbf24' }}>Total Wallet Pool</p>
            <p className="text-3xl font-extrabold text-white tabular-nums">₹{totalWallet.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl p-5 border overflow-hidden relative" style={{ background: 'rgba(20,10,10,0.6)', borderColor: 'rgba(220,38,38,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#a78bfa' }}>Total Leads Processed</p>
            <p className="text-3xl font-extrabold text-white tabular-nums">{totalLeads}</p>
          </div>
        </div>

        {/* Client Leaderboard Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(20,10,10,0.5)', borderColor: 'rgba(220,38,38,0.15)' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(220,38,38,0.1)', background: 'rgba(30,10,10,0.5)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">🏆</span>
              <h2 className="text-base font-bold text-white">Global Client Leaderboard</h2>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
              Live Data
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(220,38,38,0.3)', borderTopColor: 'transparent' }} />
              <p className="text-sm mt-3" style={{ color: '#fca5a5' }}>Loading God Mode data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>#</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>Client Email</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>Wallet Balance</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>Total Leads</th>
                    <th className="px-6 py-3 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr key={client.email} className="transition-colors duration-150" style={{ borderBottom: '1px solid rgba(220,38,38,0.06)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-6 py-3.5 text-sm font-bold" style={{ color: '#fca5a5' }}>{index + 1}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-medium text-white">{client.email}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-sm font-bold tabular-nums ${parseFloat(client.wallet_balance) < 11 ? '' : ''}`}
                          style={{ color: parseFloat(client.wallet_balance) < 11 ? '#f87171' : '#4ade80' }}
                        >
                          ₹{parseFloat(client.wallet_balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-white tabular-nums">{client.total_leads}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => setRechargeModal({ isOpen: true, email: client.email, amount: '' })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}
                        >
                          💰 Recharge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Recharge Modal */}
      {rechargeModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl border overflow-hidden" style={{ background: '#1a0a0a', borderColor: 'rgba(220,38,38,0.2)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(220,38,38,0.1)', background: 'rgba(30,10,10,0.8)' }}>
              <h3 className="text-sm font-bold text-white">💰 Manual Recharge</h3>
              <button
                onClick={() => { setRechargeModal({ isOpen: false, email: '', amount: '' }); setRechargeMsg(null); }}
                className="p-1 rounded-md transition-colors cursor-pointer"
                style={{ color: '#fca5a5' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#fca5a5' }}>Client</label>
                <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
                  {rechargeModal.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#fca5a5' }}>Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={rechargeModal.amount}
                  onChange={(e) => setRechargeModal(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
                  autoFocus
                />
              </div>

              {rechargeMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${rechargeMsg.type === 'success' ? 'text-green-300' : 'text-red-300'}`}
                  style={{ background: rechargeMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${rechargeMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}
                >
                  {rechargeMsg.text}
                </div>
              )}

              <button
                onClick={handleRecharge}
                disabled={recharging || !rechargeModal.amount}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 4px 15px rgba(220,38,38,0.3)' }}
              >
                {recharging ? 'Processing...' : `Recharge ₹${rechargeModal.amount || '0'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-sm border-t" style={{ color: '#7f1d1d', borderColor: 'rgba(220,38,38,0.1)' }}>
        <p>🔒 AstraCall God Mode — For Admin Eyes Only</p>
      </footer>
    </div>
  );
}
