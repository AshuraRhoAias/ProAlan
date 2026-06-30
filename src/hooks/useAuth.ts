import { useState, useEffect } from 'react';
import type { User } from '../types';
import { apiFetch, ApiError, getToken, setToken, clearToken } from '../lib/api';

const SESSION_KEY = 'mastrflow_session';

interface LoginResponse {
  token: string;
  user: { id: number; name: string; role: User['role'] };
}

interface RestaurantResponse {
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si hay un token guardado pero la sesion local se perdio, intenta restaurarla
  useEffect(() => {
    if (user || !getToken()) return;
    apiFetch<{ id: number; name: string; role: User['role'] }>('/auth/me')
      .then(me => {
        const u: User = { id: String(me.id), name: me.name, role: me.role, restaurant: '' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        setUser(u);
      })
      .catch(() => clearToken());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    setError('');
    setLoading(true);
    try {
      const { token, user: apiUser } = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      setToken(token);

      let restaurantName = 'My Restaurant';
      try {
        const restaurant = await apiFetch<RestaurantResponse>('/restaurant');
        restaurantName = restaurant?.name ?? restaurantName;
      } catch {
        // No bloquea el login si falla esta llamada secundaria
      }

      const u: User = {
        id: String(apiUser.id),
        name: apiUser.name,
        role: apiUser.role,
        restaurant: restaurantName,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      setUser(u);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
      clearToken();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return { user, login, logout, error, loading };
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-US', { hour12: false });
}
