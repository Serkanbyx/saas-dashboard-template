import { useEffect } from 'react';

const normalizeKey = (key) => key.toLowerCase().trim();

const parseCombo = (combo) => {
  const keys = combo.split('+').map(normalizeKey);

  return {
    altKey: keys.includes('alt'),
    ctrlKey: keys.includes('ctrl') || keys.includes('control'),
    metaKey: keys.includes('meta') || keys.includes('cmd') || keys.includes('mod'),
    shiftKey: keys.includes('shift'),
    key: keys.find((key) => !['alt', 'ctrl', 'control', 'meta', 'cmd', 'mod', 'shift'].includes(key)),
    usesMod: keys.includes('mod'),
  };
};

const isComboMatch = (event, combo) => {
  const parsedCombo = parseCombo(combo);
  const hasModKey = event.ctrlKey || event.metaKey;

  return (
    normalizeKey(event.key) === parsedCombo.key
    && event.altKey === parsedCombo.altKey
    && event.shiftKey === parsedCombo.shiftKey
    && (parsedCombo.usesMod ? hasModKey : event.ctrlKey === parsedCombo.ctrlKey)
    && (parsedCombo.usesMod ? true : event.metaKey === parsedCombo.metaKey)
  );
};

export const useHotkey = (combo, handler) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isComboMatch(event, combo)) {
        return;
      }

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combo, handler]);
};
