import { useState } from 'react';

export default function GodLogin() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuthenticating(true);
    setError('');

    // Simulate a brief delay for dramatic effect
    setTimeout(() => {
      if (passcode === 'Shinde@GodMode') {
        localStorage.setItem('god_mode_auth', 'true');
        window.location.href = '/god-dashboard';
      } else {
        setError('ACCESS DENIED. Invalid passcode.');
        setAuthenticating(false);
      }
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#000000' }}
    >
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,0,0,0.02) 0px, rgba(255,0,0,0.02) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="w-full max-w-sm relative z-20">
        {/* Terminal header */}
        <div
          className="px-5 py-3 rounded-t-xl border border-b-0 flex items-center gap-2"
          style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.15)' }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#dc2626' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#333' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#333' }} />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase ml-2" style={{ color: '#dc2626' }}>
            CLASSIFIED — ASTRACALL
          </span>
        </div>

        {/* Main card */}
        <div
          className="rounded-b-xl border border-t-0 p-8"
          style={{ background: 'rgba(10,5,5,0.95)', borderColor: 'rgba(220,38,38,0.15)' }}
        >
          {/* Icon */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.05))',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="#dc2626" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'monospace' }}>
              GOD MODE
            </h1>
            <p className="text-[11px] font-mono tracking-widest mt-1" style={{ color: '#7f1d1d' }}>
              AUTHORIZED PERSONNEL ONLY
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: '#dc2626' }}>
                MASTER PASSCODE
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder="• • • • • • • • • •"
                className="w-full px-4 py-3.5 rounded-xl text-sm font-mono text-white placeholder-gray-600 focus:outline-none transition-all"
                style={{
                  background: 'rgba(220,38,38,0.06)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(220,38,38,0.2)'}`,
                }}
                autoFocus
                disabled={authenticating}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                ⛔ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={authenticating || !passcode}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold font-mono tracking-wider uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: authenticating
                  ? 'rgba(220,38,38,0.2)'
                  : 'linear-gradient(135deg, #dc2626, #991b1b)',
                color: '#fff',
                boxShadow: authenticating ? 'none' : '0 4px 20px rgba(220,38,38,0.35)',
                border: '1px solid rgba(220,38,38,0.3)',
              }}
            >
              {authenticating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AUTHENTICATING...
                </span>
              ) : (
                'ENTER SYSTEM →'
              )}
            </button>
          </form>

          <p className="text-center text-[10px] font-mono mt-6" style={{ color: '#3f1515' }}>
            UNAUTHORIZED ACCESS WILL BE LOGGED
          </p>
        </div>
      </div>
    </div>
  );
}
