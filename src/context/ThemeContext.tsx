import { createContext, useContext, useEffect, useState } from 'react';
import { getCookie, setCookie } from '../lib/cookies';

export interface ThemeConfig {
  id: string;
  name: string;
  isDark: boolean;
  accent: string; // for swatch preview
  vars: Record<string, string>;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'warm', name: 'Warm', isDark: false, accent: '#C4872A',
    vars: { '--amber': '#C4872A', '--bg': '#f0ece4', '--bg-card': '#ffffff', '--brown-dark': '#2a2118', '--text-dark': '#1a1208', '--text-mid': '#4a3728', '--text-muted': '#8a7060', '--border': '#e0d8cc', '--amber-pale': '#f5ede0', '--amber-light': '#e8d5b7' },
  },
  {
    id: 'forest', name: 'Forest', isDark: false, accent: '#2a7a3a',
    vars: { '--amber': '#2a7a3a', '--bg': '#f0f4f0', '--bg-card': '#ffffff', '--brown-dark': '#1a2e1a', '--text-dark': '#0f1f0f', '--text-mid': '#2a4a2a', '--text-muted': '#6a8a6a', '--border': '#ccd8cc', '--amber-pale': '#e8f5e8', '--amber-light': '#c8e8c8' },
  },
  {
    id: 'ocean', name: 'Ocean', isDark: false, accent: '#2a6aaa',
    vars: { '--amber': '#2a6aaa', '--bg': '#f0f2f8', '--bg-card': '#ffffff', '--brown-dark': '#1a2040', '--text-dark': '#0f1428', '--text-mid': '#2a3a6a', '--text-muted': '#6a7aa0', '--border': '#ccd0e8', '--amber-pale': '#e8f0ff', '--amber-light': '#c8d8f8' },
  },
  {
    id: 'rose', name: 'Rose', isDark: false, accent: '#aa2a6a',
    vars: { '--amber': '#aa2a6a', '--bg': '#faf0f4', '--bg-card': '#ffffff', '--brown-dark': '#401020', '--text-dark': '#280810', '--text-mid': '#6a1a3a', '--text-muted': '#a06a80', '--border': '#e8ccd8', '--amber-pale': '#ffe8f0', '--amber-light': '#f8c8dc' },
  },
  {
    id: 'slate', name: 'Slate', isDark: false, accent: '#4a6a8a',
    vars: { '--amber': '#4a6a8a', '--bg': '#f0f2f4', '--bg-card': '#ffffff', '--brown-dark': '#1a2028', '--text-dark': '#0f1420', '--text-mid': '#3a4a5a', '--text-muted': '#6a7a8a', '--border': '#ccd0d8', '--amber-pale': '#e8eef4', '--amber-light': '#c8d8e8' },
  },
  {
    id: 'dark-warm', name: 'Dark Warm', isDark: true, accent: '#d4973a',
    vars: { '--amber': '#d4973a', '--bg': '#1a1410', '--bg-card': '#241c14', '--brown-dark': '#0f0c08', '--text-dark': '#f0e8d8', '--text-mid': '#c8b090', '--text-muted': '#907060', '--border': '#3a2e20', '--amber-pale': '#2a2010', '--amber-light': '#3a2c18' },
  },
  {
    id: 'dark-forest', name: 'Dark Forest', isDark: true, accent: '#3a9a4a',
    vars: { '--amber': '#3a9a4a', '--bg': '#101810', '--bg-card': '#182018', '--brown-dark': '#080f08', '--text-dark': '#d8f0d8', '--text-mid': '#90c090', '--text-muted': '#607860', '--border': '#203a20', '--amber-pale': '#102010', '--amber-light': '#183018' },
  },
  {
    id: 'dark-ocean', name: 'Dark Ocean', isDark: true, accent: '#3a7acc',
    vars: { '--amber': '#3a7acc', '--bg': '#101420', '--bg-card': '#181c30', '--brown-dark': '#080c18', '--text-dark': '#d8e0f8', '--text-mid': '#9098c8', '--text-muted': '#606888', '--border': '#20283a', '--amber-pale': '#101828', '--amber-light': '#182038' },
  },
  {
    id: 'dark-rose', name: 'Dark Rose', isDark: true, accent: '#cc3a8a',
    vars: { '--amber': '#cc3a8a', '--bg': '#1a1016', '--bg-card': '#241520', '--brown-dark': '#0f080e', '--text-dark': '#f8d8e8', '--text-mid': '#c890a8', '--text-muted': '#886070', '--border': '#3a2030', '--amber-pale': '#201018', '--amber-light': '#301520' },
  },
  {
    id: 'dark-slate', name: 'Dark Slate', isDark: true, accent: '#5a8aaa',
    vars: { '--amber': '#5a8aaa', '--bg': '#121418', '--bg-card': '#1a1e24', '--brown-dark': '#080a0e', '--text-dark': '#d8dce8', '--text-mid': '#909cb0', '--text-muted': '#60707e', '--border': '#282e38', '--amber-pale': '#161c24', '--amber-light': '#1e2630' },
  },
];

const STORAGE_KEY = 'mastrflow_theme';

interface ThemeCtx {
  themeId: string;
  setTheme: (id: string) => void;
  themes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeCtx>({ themeId: 'warm', setTheme: () => {}, themes: THEMES });

function applyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const el = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => el.style.setProperty(k, v));
  el.setAttribute('data-theme', themeId);
  document.body.style.background = theme.vars['--bg'];
  document.body.style.color = theme.vars['--text-dark'];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => getCookie(STORAGE_KEY) ?? 'warm');

  useEffect(() => { applyTheme(themeId); }, [themeId]);

  const setTheme = (id: string) => {
    setCookie(STORAGE_KEY, id);
    setThemeId(id);
  };

  return <ThemeContext.Provider value={{ themeId, setTheme, themes: THEMES }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
