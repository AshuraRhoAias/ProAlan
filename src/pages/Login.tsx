import { useState, useEffect, useRef, useCallback } from 'react';
import { authApi } from '../services/api';

interface Props {
  onLogin: (token: string, user: { id: number; name: string; role: string }) => void;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','←','0','✓'];

export default function Login({ onLogin }: Props) {
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX = 20;
  const MIN = 4;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = useCallback(async (currentPin: string) => {
    if (currentPin.length < MIN) {
      setError(`El PIN debe tener al menos ${MIN} dígitos`);
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login('', currentPin);
      onLogin(res.token, res.user);
    } catch {
      setError('PIN incorrecto');
      setPin('');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  const pressKey = useCallback((key: string) => {
    if (loading) return;
    if (key === '←') {
      setPin(p => p.slice(0, -1));
      setError('');
    } else if (key === '✓') {
      submit(pin);
    } else {
      setPin(p => {
        if (p.length >= MAX) return p;
        const next = p + key;
        setError('');
        return next;
      });
    }
  }, [loading, pin, submit]);

  // Soporte teclado físico
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        pressKey(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        pressKey('←');
      } else if (e.key === 'Enter') {
        pressKey('✓');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pressKey]);

  // Foco automático para evitar que el usuario tenga que hacer click
  useEffect(() => { inputRef.current?.focus(); }, []);

  const dots = Array.from({ length: Math.max(pin.length, MIN) }, (_, i) => (
    <span key={i} className={`pin-dot ${i < pin.length ? 'pin-dot-filled' : ''}`} />
  ));

  return (
    <div className="login-bg">
      <div className={`login-card ${shake ? 'login-shake' : ''}`}>
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M10 40L24 8L38 40" stroke="#C4872A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 28h18" stroke="#C4872A" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="login-title">MastrFlow</h1>
        <p className="login-subtitle">Ingresa tu PIN</p>

        {/* Campo oculto — mantiene el foco para recibir eventos de teclado */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          aria-hidden="true"
        />

        {/* Indicador de dígitos */}
        <div className="pin-dots">{dots}</div>

        {error && <p className="login-error">{error}</p>}

        {/* Teclado numérico visual */}
        <div className="numpad">
          {KEYS.map(key => (
            <button
              key={key}
              className={`numpad-key ${key === '✓' ? 'numpad-confirm' : ''} ${key === '←' ? 'numpad-back' : ''}`}
              onClick={() => pressKey(key)}
              disabled={loading || (key !== '←' && key !== '✓' && pin.length >= MAX)}
              aria-label={key === '←' ? 'Borrar' : key === '✓' ? 'Confirmar' : key}
            >
              {loading && key === '✓' ? <SpinIcon /> : key}
            </button>
          ))}
        </div>

        <p className="login-hint">PIN de {MIN}–{MAX} dígitos · Teclado físico soportado</p>
      </div>
    </div>
  );
}

function SpinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}
