import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type ThemePreference = 'auto' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'auto') return getSystemTheme();
  return pref;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const getInitialPreference = (): ThemePreference => {
    const saved = localStorage.getItem('theme-preference') as ThemePreference | null;
    if (saved && ['auto', 'light', 'dark'].includes(saved)) return saved;
    const oldTheme = localStorage.getItem('theme') as string | null;
    if (oldTheme === 'dark' || oldTheme === 'light') return oldTheme;
    return 'auto';
  };

  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(getInitialPreference()));

  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    const root = document.documentElement;
    const body = document.body;
    body.style.opacity = '0.7';
    body.style.transition = 'opacity 0.3s ease';

    if (resolved === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }

    requestAnimationFrame(() => {
      body.style.opacity = '1';
    });
    setTimeout(() => { body.style.transition = ''; }, 300);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(preference);
    setTheme(resolved);
    localStorage.setItem('theme-preference', preference);
    applyTheme(resolved);
  }, [preference, applyTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (preference !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference, applyTheme]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setPreference(pref);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(prev => {
      if (prev === 'light') return 'dark';
      return 'light';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, preference, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};