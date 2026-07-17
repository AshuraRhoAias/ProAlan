import { getCookie, setCookie, removeCookie } from './cookies';
import type { User } from '../types';

export const TOKEN_KEY = 'mastrflow_token';
const SESSION_KEY = 'mastrflow_session';

export function getStoredToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = getCookie(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
}

export function storeSession(token: string, user: User) {
  setCookie(TOKEN_KEY, token);
  setCookie(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  removeCookie(TOKEN_KEY);
  removeCookie(SESSION_KEY);
}
