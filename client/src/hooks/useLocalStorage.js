import { useCallback, useEffect, useState } from 'react';

const readStoredValue = (key, initialValue) => {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch {
    return initialValue;
  }
};

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore unavailable storage, such as private browsing restrictions.
    }
  }, [key, value]);

  const updateValue = useCallback((nextValue) => {
    setValue((currentValue) => (
      typeof nextValue === 'function' ? nextValue(currentValue) : nextValue
    ));
  }, []);

  return [value, updateValue];
};
