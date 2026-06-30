import { useState } from 'react';

interface Props {
  onLogin: (pin: string) => Promise<boolean>;
}

export default function Login({ onLogin }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await onLogin(pin);
    if (!ok) setError('PIN invalido. Verifica e intenta de nuevo.');
    setLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M10 40L24 8L38 40" stroke="#C4872A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 28h18" stroke="#C4872A" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="login-title">MastrFlow</h1>
        <p className="login-subtitle">Restaurant Management System</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <label className="field-label">PIN</label>
            <input
              className="field-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              autoFocus
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={loading || pin.length < 4}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-hint">MastrFlow v1.0 - Powered by Tauri</p>
      </div>
    </div>
  );
}
