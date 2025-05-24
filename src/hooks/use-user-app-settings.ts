
// src/hooks/use-user-app-settings.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, DocumentReference, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_APP_SETTINGS } from '@/lib/constants';

interface UseUserAppSettingsReturn {
  appSettings: AppSettings;
  setAppSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useUserAppSettings(): UseUserAppSettingsReturn {
  const { user, loading: authLoading } = useAuth();
  const [appSettings, setLocalAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getSettingsRef = useCallback((): DocumentReference<AppSettings> | null => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'settings', 'appSettings') as DocumentReference<AppSettings>;
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLocalAppSettings(DEFAULT_APP_SETTINGS); // Reset to default if user logs out
      setLoading(false);
      return;
    }

    setLoading(true);
    const settingsRef = getSettingsRef();
    if (!settingsRef) {
        setLoading(false);
        return;
    }

    const unsubscribe: Unsubscribe = onSnapshot(settingsRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setLocalAppSettings(docSnap.data() as AppSettings);
        } else {
          // No settings found, use defaults and save them for new user
          setDoc(settingsRef, DEFAULT_APP_SETTINGS)
            .then(() => setLocalAppSettings(DEFAULT_APP_SETTINGS))
            .catch(e => {
                console.error("Error initializing default settings in Firestore:", e);
                setError(e as Error);
            });
        }
        setLoading(false);
      }, 
      (err) => {
        console.error("Error fetching app settings from Firestore:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, getSettingsRef]);

  const updateAppSettings = useCallback(async (newSettingsPartial: Partial<AppSettings>) => {
    const settingsRef = getSettingsRef();
    if (!settingsRef || !user) {
      setError(new Error("User not authenticated or settings reference not available."));
      return;
    }
    
    setLoading(true);
    try {
      // Merge with current settings to ensure all fields are present
      const updatedSettings = { ...appSettings, ...newSettingsPartial };
      await setDoc(settingsRef, updatedSettings, { merge: true }); // Use merge to update, not overwrite
      setLocalAppSettings(updatedSettings); // Optimistically update local state
    } catch (e) {
      console.error("Error updating app settings in Firestore:", e);
      setError(e as Error);
      // Potentially revert optimistic update or show error to user
    } finally {
      setLoading(false);
    }
  }, [user, appSettings, getSettingsRef]);


  return { appSettings, setAppSettings: updateAppSettings, loading: loading || authLoading, error };
}
