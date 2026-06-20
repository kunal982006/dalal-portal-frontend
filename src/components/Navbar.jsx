import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import RechargeModal from './RechargeModal';

export default function Navbar({ session, apiBase }) {
  const [walletBalance, setWalletBalance] = useState(null);
  const [showRecharge, setShowRecharge] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userEmail = session?.user?.email;

  // Fetch wallet balance for the logged-in user
  useEffect(() => {
    if (!userEmail || !apiBase) return;

    const fetchBalance = async () => {
      try {
        const res = await axios.get(`${apiBase}/leads/balance/${encodeURIComponent(userEmail)}`);
        setWalletBalance(res.data.wallet_balance);
      } catch {
        setWalletBalance(null);
      }
    };

    fetchBalance();
    // Refresh balance every 30s
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [userEmail, apiBase]);

  const handleBalanceUpdate = (newBalance) => {
    setWalletBalance(newBalance);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse-ring" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  AstraCall
                </h1>
                <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                  Dalal Portal
                </p>
              </div>
            </div>

            {/* Right Side — Wallet + Status + User + Logout */}
            <div className="flex items-center gap-3">
              {/* Wallet Balance Badge — Clickable */}
              {walletBalance !== null && (
                <button
                  id="wallet-badge-btn"
                  onClick={() => setShowRecharge(true)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    walletBalance < 11.00
                      ? 'bg-rose-50 border-rose-200/60 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="Click to add money"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
                  </svg>
                  Wallet: ₹{parseFloat(walletBalance).toFixed(2)}
                  {walletBalance < 11.00 && ' (Low)'}
                  <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-700">System Online</span>
              </div>

              {/* User email badge */}
              {userEmail && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-500 max-w-[140px] truncate">{userEmail}</span>
                </div>
              )}

              {/* Logout Button */}
              <button
                id="logout-button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200/60 hover:bg-red-100 hover:border-red-300 transition-all duration-200 cursor-pointer"
                title="Sign Out"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        apiBase={apiBase}
        onBalanceUpdate={handleBalanceUpdate}
      />
    </>
  );
}
