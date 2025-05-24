
// src/hooks/use-local-storage.ts
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// This hook is no longer the primary way to store user-specific application data
// now that Firebase/Firestore is implemented for logged-in users.
// It can still be used for non-user-specific, browser-level preferences if needed,
// or be deprecated/removed if all data moves to Firestore.

// For now, keeping it as is, but its usage in the app pages will be replaced by
// useUserAppSettings, useUserExpenses, useUserBudgets.

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
