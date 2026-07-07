import { useState, useEffect } from 'react';
import type { User } from '../types';

const TOKEN_KEY   = 'mastrflow_token';
const SESSION_KEY = 'mastrflow_session';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, apiUser: { id: number; name: string; role: string }) => {
    const u: User = {
      id: String(apiUser.id),
      name: apiUser.name,
      role: apiUser.role as User['role'],
      restaurant: 'MastrFlow',
    };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return { user, login, logout };
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-US', { hour12: false });
}
