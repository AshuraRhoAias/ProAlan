import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import TopBar from './components/TopBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kitchen from './pages/Kitchen';
import Settings from './pages/Settings';

function ProtectedLayout({ user, onLogout }: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  onLogout: () => void;
}) {
  return (
    <div className="app-layout">
      <TopBar user={user} onLogout={onLogout} />
      <main className="app-main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard restaurantName={user.restaurant} />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { user, login, logout } = useAuth();

  return (
    <BrowserRouter>
      {user ? (
        <ProtectedLayout user={user} onLogout={logout} />
      ) : (
        <Login onLogin={login} />
      )}
    </BrowserRouter>
  );
}
