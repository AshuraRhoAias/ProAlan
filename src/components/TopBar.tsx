import { useNavigate, useLocation } from 'react-router-dom';
import { useClock } from '../hooks/useAuth';
import type { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function TopBar({ user, onLogout }: Props) {
  const clock = useClock();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="topbar-left" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <path d="M8 32L20 8L32 32" stroke="#C4872A" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M12 24h16" stroke="#C4872A" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div>
          <div className="topbar-brand">MastrFlow</div>
          <div className="topbar-user">{user.name}</div>
        </div>
      </div>

      <div className="topbar-clock">{clock}</div>

      <div className="topbar-actions">
        <button
          className={`topbar-icon-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
          title="Tables"
        >
          <GridIcon />
        </button>
        <button
          className={`topbar-icon-btn ${location.pathname === '/kitchen' ? 'active' : ''}`}
          onClick={() => navigate('/kitchen')}
          title="Kitchen"
        >
          <ChefIcon />
        </button>
        <button
          className={`topbar-icon-btn ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <GearIcon />
        </button>
        <button className="topbar-icon-btn" onClick={onLogout} title="Logout">
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="11" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="11" width="6" height="6" rx="1"/>
      <rect x="11" y="11" width="6" height="6" rx="1"/>
    </svg>
  );
}

function ChefIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="6" r="4" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M5 10h8l-1 6H6l-1-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M6 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 3H3a1 1 0 00-1 1v10a1 1 0 001 1h4"/>
      <path d="M12 12l3-3-3-3M15 9H6"/>
    </svg>
  );
}
