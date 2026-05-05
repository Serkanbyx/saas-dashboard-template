import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'saas:theme';
const THEMES = ['light', 'dark', 'system'];

export const ThemeContext = createContext(null);

const isTheme = (value) => THEMES.includes(value);

const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(theme) ? theme : 'system';
  } catch {
    return 'system';
  }
};

const getSystemTheme = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getResolvedTheme = (theme) => (theme === 'system' ? getSystemTheme() : theme);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(getStoredTheme()));

  const setTheme = useCallback((nextTheme) => {
    const safeTheme = isTheme(nextTheme) ? nextTheme : 'system';

    setThemeState(safeTheme);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
    } catch {
      // Storage can be unavailable in private browsing or restricted environments.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

    const applyTheme = () => {
      const nextResolvedTheme = getResolvedTheme(theme);
      const isDark = nextResolvedTheme === 'dark';

      document.documentElement.classList.toggle('dark', isDark);
      setResolvedTheme(nextResolvedTheme);
    };

    applyTheme();

    if (theme !== 'system' || !mediaQuery) {
      return undefined;
    }

    mediaQuery.addEventListener('change', applyTheme);

    return () => {
      mediaQuery.removeEventListener('change', applyTheme);
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
