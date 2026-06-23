import { useState, useEffect } from 'react';
import type { User } from '../types';

const SESSION_KEY = 'mastrflow_session';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = (username: string, password: string): boolean => {
    // Mock auth — replace with real API call
    if (username && password.length >= 4) {
      const u: User = {
        id: '1',
        name: username,
        role: 'manager',
        restaurant: 'BURGER MAFIA',
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      setUser(u);
      return true;
    }
    return false;
  };

  const logout = () => {
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
