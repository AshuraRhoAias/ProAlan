import { useState } from 'react';

interface Props {
  onLogin: (name: string, pin: string) => Promise<boolean>;
  loading?: boolean;
  serverError?: string;
}

export default function Login({ onLogin, loading = false, serverError = '' }: Props) {
  const [name, setName]   = useState('');
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Ingresa tu usuario'); return; }
    if (!pin)         { setError('Ingresa tu PIN'); return; }
    const ok = await onLogin(name.trim(), pin);
    if (!ok) setError(serverError || 'Usuario o PIN incorrecto');
  };

  const pressPin = (v: string) => setPin(p => p.length < 4 ? p + v : p);
  const delPin   = ()          => setPin(p => p.slice(0, -1));

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
            <label className="field-label">Usuario</label>
            <input
              className="field-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre de usuario"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="field-group">
            <label className="field-label">PIN</label>
            <div className="pin-display">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={`pin-dot ${i < pin.length ? 'pin-dot-filled' : ''}`} />
              ))}
            </div>
            <div className="pin-grid">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <button
                  key={i} type="button"
                  className={`pin-key${k === '' ? ' pin-key-empty' : ''}`}
                  onClick={() => k === '⌫' ? delPin() : k !== '' ? pressPin(k) : undefined}
                  disabled={k === '' || loading}
                >{k}</button>
              ))}
            </div>
          </div>

          {(error || serverError) && <p className="login-error">{error || serverError}</p>}

          <button className="btn-primary w-full" type="submit" disabled={loading || !name || !pin}>
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>

        <p className="login-hint">MastrFlow v1.0 · Powered by Tauri</p>
      </div>
    </div>
  );
}
