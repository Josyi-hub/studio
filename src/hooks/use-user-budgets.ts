
// src/hooks/use-user-budgets.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, onSnapshot, query, CollectionReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { Budget } from '@/lib/types';
import { DEFAULT_BUDGETS } from '@/lib/constants'; // To initialize for new users

interface UseUserBudgetsReturn {
  budgets: Budget[];
  updateBudget: (categoryName: string, amount: number) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useUserBudgets(): UseUserBudgetsReturn {
  const { user, loading: authLoading } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getBudgetsColRef = useCallback((): CollectionReference | null => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'budgets');
  }, [user]);
  
  const initializeDefaultBudgetsForUser = useCallback(async (userId: string) => {
    const budgetsColRef = collection(db, 'users', userId, 'budgets');
    const promises = DEFAULT_BUDGETS.map(budget => {
      const budgetDocRef = doc(budgetsColRef, budget.category); // Use category name as doc ID
      // Firestore uses 'id' for document ID, so we use budget.category for our ID concept here.
      // The actual document ID will be budget.category.
      return setDoc(budgetDocRef, { category: budget.category, amount: budget.amount, id: budget.category });
    });
    await Promise.all(promises);
    return DEFAULT_BUDGETS;
  }, []);


  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setBudgets(DEFAULT_BUDGETS); // Reset to default if user logs out
      setLoading(false);
      return;
    }

    setLoading(true);
    const budgetsColRef = getBudgetsColRef();
     if (!budgetsColRef) {
        setLoading(false);
        return;
    }

    const q = query(budgetsColRef);
    const unsubscribe = onSnapshot(q, 
      async (querySnapshot) => {
        if (querySnapshot.empty && user) {
          // Initialize budgets for a new user or if they don't exist
          try {
            const initializedBudgets = await initializeDefaultBudgetsForUser(user.uid);
            setBudgets(initializedBudgets);
          } catch (e) {
            console.error("Error initializing default budgets in Firestore:", e);
            setError(e as Error);
          }
        } else {
          const userBudgets: Budget[] = [];
          querySnapshot.forEach((docSnap) => {
            userBudgets.push({ id: docSnap.id, ...docSnap.data() } as Budget);
          });
           // Ensure all default categories are present, even if amount is 0
          const fullBudgetList = DEFAULT_BUDGETS.map(defaultBudget => {
            const existingBudget = userBudgets.find(ub => ub.category === defaultBudget.category);
            return existingBudget || { ...defaultBudget, id: defaultBudget.category }; // Use category as ID
          });
          setBudgets(fullBudgetList);
        }
        setLoading(false);
      }, 
      (err) => {
        console.error("Error fetching budgets from Firestore:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, getBudgetsColRef, initializeDefaultBudgetsForUser]);

  const updateBudget = useCallback(async (categoryName: string, amount: number) => {
    if (!user) {
      setError(new Error("User not authenticated."));
      return;
    }
    const budgetDocRef = doc(db, 'users', user.uid, 'budgets', categoryName); // Use category name as doc ID
    
    setLoading(true);
    try {
      // The budget ID for Firestore is the categoryName. The 'id' field in our Budget type might be redundant or can mirror categoryName.
      await setDoc(budgetDocRef, { category: categoryName, amount, id: categoryName }, { merge: true });
      // Optimistic update or rely on onSnapshot
    } catch (e) {
      console.error("Error updating budget in Firestore:", e);
      setError(e as Error);
    } finally {
      setLoading(false); // Firestore listener will update UI, so loading can be reset
    }
  }, [user]);

  return { budgets, updateBudget, loading: loading || authLoading, error };
}
