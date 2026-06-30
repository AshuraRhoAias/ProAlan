import { useState, useEffect } from 'react';
import { authApi } from '../services/api';

const SESSION_KEY = 'mastrflow_session';
const TOKEN_KEY   = 'mastrflow_token';

export interface User {
  id: string;
  name: string;
  role: string;
  restaurant: string;
}

function storedUser(): User | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'); } catch { return null; }
}

export function useAuth() {
  const [user, setUser]       = useState<User | null>(storedUser);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !storedUser()) {
      authApi.me()
        .then(u => {
          const full: User = { id: String(u.id), name: u.name, role: u.role, restaurant: 'MastrFlow' };
          localStorage.setItem(SESSION_KEY, JSON.stringify(full));
          setUser(full);
        })
        .catch(() => logout());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (name: string, pin: string): Promise<boolean> => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await authApi.login(name, pin);
      localStorage.setItem(TOKEN_KEY, res.token);
      const full: User = { id: String(res.user.id), name: res.user.name, role: res.user.role, restaurant: 'MastrFlow' };
      localStorage.setItem(SESSION_KEY, JSON.stringify(full));
      setUser(full);
      return true;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Error de conexión con el servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return { user, login, logout, loading, authError };
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('es-MX', { hour12: false });
}
