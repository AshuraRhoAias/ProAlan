import { useState, useEffect } from 'react';
import type { User } from '../types';
import { getStoredUser, storeSession, clearSession } from '../lib/authStorage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const login = (token: string, apiUser: { id: number; name: string; role: string }) => {
    const u: User = {
      id: String(apiUser.id),
      name: apiUser.name,
      role: apiUser.role as User['role'],
      restaurant: 'MastrFlow',
    };
    storeSession(token, u);
    setUser(u);
  };

  const logout = () => {
    clearSession();
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
