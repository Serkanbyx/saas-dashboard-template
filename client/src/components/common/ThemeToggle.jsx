import { Monitor, Moon, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const activeTheme = useMemo(
    () => THEME_OPTIONS.find((option) => option.value === theme) || THEME_OPTIONS[2],
    [theme],
  );

  const Icon = activeTheme.icon;

  const handleCycleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex((option) => option.value === theme);
    const nextTheme = THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length].value;

    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleCycleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-brand-500 dark:hover:text-brand-50 dark:focus:ring-offset-gray-950"
      aria-label={`Change theme. Current theme is ${activeTheme.label}.`}
      title={`Theme: ${activeTheme.label}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{activeTheme.label}</span>
      {theme === 'system' ? (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {resolvedTheme}
        </span>
      ) : null}
    </button>
  );
};
