import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function RechargeModal({ isOpen, onClose, apiBase, onBalanceUpdate }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  if (!isOpen) return null;

  const handleAmountPreset = (val) => {
    setAmount(String(val));
    setMessage(null);
  };

  const handlePayNow = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      setMessage({ type: 'error', text: 'Please enter an amount of at least ₹1.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Get logged-in user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        setLoading(false);
        return;
      }

      // 2. Create order on backend
      const orderRes = await axios.post(`${apiBase}/payment/create-order`, {
        amount: numAmount,
      });

      const { order_id, currency } = orderRes.data;

      // 3. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(numAmount * 100),
        currency: currency || 'INR',
        name: 'AstraCall',
        description: `Wallet Recharge — ₹${numAmount}`,
        order_id: order_id,
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await axios.post(`${apiBase}/payment/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: user.email,
              amount: numAmount,
            });

            setMessage({ type: 'success', text: verifyRes.data.message || 'Payment successful!' });
            onBalanceUpdate?.(verifyRes.data.new_balance);
            setAmount('');

            // Auto-close after 2 seconds on success
            setTimeout(() => {
              onClose();
              setMessage(null);
            }, 2000);
          } catch (verifyErr) {
            const errMsg = verifyErr.response?.data?.error || 'Payment verification failed.';
            setMessage({ type: 'error', text: errMsg });
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setMessage({ type: 'error', text: response.error?.description || 'Payment failed. Please try again.' });
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to initiate payment.';
      setMessage({ type: 'error', text: errMsg });
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
      setMessage(null);
      setAmount('');
    }
  };

  return (
    <div className="recharge-overlay" onClick={handleBackdropClick}>
      <div className="recharge-modal">
        {/* Close Button */}
        <button
          className="recharge-close"
          onClick={() => { if (!loading) { onClose(); setMessage(null); setAmount(''); } }}
          disabled={loading}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="recharge-header">
          <div className="recharge-header-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="recharge-title">Add Money to Wallet</h2>
          <p className="recharge-subtitle">Top up your AstraCall wallet instantly via Razorpay</p>
        </div>

        {/* Preset Amounts */}
        <div className="recharge-presets">
          {PRESET_AMOUNTS.map((val) => (
            <button
              key={val}
              type="button"
              className={`recharge-preset-btn ${amount === String(val) ? 'active' : ''}`}
              onClick={() => handleAmountPreset(val)}
              disabled={loading}
            >
              ₹{val}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="recharge-input-group">
          <span className="recharge-input-prefix">₹</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setMessage(null); }}
            disabled={loading}
            className="recharge-input"
            id="recharge-amount-input"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`recharge-message ${message.type}`}>
            {message.type === 'success' ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Pay Now Button */}
        <button
          className="recharge-pay-btn"
          onClick={handlePayNow}
          disabled={loading || !amount}
          id="recharge-pay-now-btn"
        >
          {loading ? (
            <span className="recharge-pay-loading">
              <svg className="recharge-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Processing...
            </span>
          ) : (
            <span className="recharge-pay-label">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              {amount ? `Pay ₹${amount}` : 'Pay Now'}
            </span>
          )}
        </button>

        {/* Footer */}
        <p className="recharge-footer">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Secured by Razorpay · 256-bit SSL Encryption
        </p>
      </div>
    </div>
  );
}
