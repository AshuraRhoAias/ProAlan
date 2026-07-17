const DEFAULT_DAYS = 30;

export function setCookie(name: string, value: string, days = DEFAULT_DAYS) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getJSON<T>(name: string, fallback: T): T {
  const raw = getCookie(name);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function setJSON(name: string, value: unknown, days = DEFAULT_DAYS) {
  setCookie(name, JSON.stringify(value), days);
}
