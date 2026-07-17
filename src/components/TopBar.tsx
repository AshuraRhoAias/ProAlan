import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClock } from '../hooks/useAuth';
import { useTheme, THEMES } from '../context/ThemeContext';
import type { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function TopBar({ user, onLogout }: Props) {
  const clock = useClock();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeId, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lightThemes = THEMES.filter(t => !t.isDark);
  const darkThemes = THEMES.filter(t => t.isDark);

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ position: 'relative' }} ref={menuRef}>
        <div
          className="topbar-brand-area"
          onClick={() => setMenuOpen(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
        >
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <path d="M8 32L20 8L32 32" stroke="#C4872A" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 24h16" stroke="#C4872A" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div className="topbar-brand">MastrFlow</div>
            <div className="topbar-user">{user.name}</div>
          </div>
          <span style={{ fontSize: 10, color: '#a09070', marginLeft: 2 }}>▾</span>
        </div>

        {menuOpen && (
          <div className="user-menu-popup">
            <div style={{ padding: '0 0 10px' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.role} · {user.restaurant}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div className="theme-row-label" style={{ marginBottom: 6 }}>Theme</div>
              <div className="theme-row-label" style={{ marginBottom: 4, fontSize: 9 }}>LIGHT</div>
              <div className="theme-swatches">
                {lightThemes.map(t => (
                  <button
                    key={t.id}
                    className={`theme-swatch ${themeId === t.id ? 'active' : ''}`}
                    style={{ background: t.accent }}
                    onClick={() => { setTheme(t.id); setMenuOpen(false); }}
                    title={t.name}
                  >
                    {themeId === t.id && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </button>
                ))}
              </div>
              <div className="theme-row-label" style={{ marginTop: 8, marginBottom: 4, fontSize: 9 }}>DARK</div>
              <div className="theme-swatches">
                {darkThemes.map(t => (
                  <button
                    key={t.id}
                    className={`theme-swatch ${themeId === t.id ? 'active' : ''}`}
                    style={{ background: t.accent }}
                    onClick={() => { setTheme(t.id); setMenuOpen(false); }}
                    title={t.name}
                  >
                    {themeId === t.id && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
              <button
                className="btn-ghost w-full"
                onClick={() => { onLogout(); setMenuOpen(false); }}
                style={{ textAlign: 'left', fontSize: 13 }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="topbar-clock">{clock}</div>

      <div className="topbar-actions">
        <button className={`topbar-icon-btn ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')} title="Tables">
          <GridIcon />
        </button>
        <button className={`topbar-icon-btn ${location.pathname === '/kitchen' ? 'active' : ''}`} onClick={() => navigate('/kitchen')} title="Kitchen">
          <ChefIcon />
        </button>
        <button className={`topbar-icon-btn ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate('/settings')} title="Settings">
          <GearIcon />
        </button>
      </div>
    </header>
  );
}

function GridIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="11" y="1" width="6" height="6" rx="1"/><rect x="1" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>;
}

function ChefIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><circle cx="9" cy="6" r="4" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5 10h8l-1 6H6l-1-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M6 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}

function GearIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><circle cx="9" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
