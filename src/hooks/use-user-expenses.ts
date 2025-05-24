
// src/hooks/use-user-expenses.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, CollectionReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { Expense } from '@/lib/types';

interface UseUserExpensesReturn {
  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'userId'>) => Promise<string | null>;
  updateExpense: (id: string, expenseData: Partial<Omit<Expense, 'id' | 'userId'>>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useUserExpenses(): UseUserExpensesReturn {
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getExpensesColRef = useCallback((): CollectionReference<Omit<Expense, 'id'>> | null => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'expenses') as CollectionReference<Omit<Expense, 'id'>>;
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setExpenses([]); // Clear expenses if user logs out
      setLoading(false);
      return;
    }

    setLoading(true);
    const expensesColRef = getExpensesColRef();
    if (!expensesColRef) {
        setLoading(false);
        return;
    }
    
    const q = query(expensesColRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const userExpenses: Expense[] = [];
        querySnapshot.forEach((doc) => {
          userExpenses.push({ id: doc.id, ...doc.data() } as Expense);
        });
        setExpenses(userExpenses);
        setLoading(false);
      }, 
      (err) => {
        console.error("Error fetching expenses from Firestore:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, getExpensesColRef]);

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>): Promise<string | null> => {
    const expensesColRef = getExpensesColRef();
    if (!expensesColRef || !user) {
      setError(new Error("User not authenticated or expenses collection reference not available."));
      return null;
    }
    
    setLoading(true);
    try {
      const docRef = await addDoc(expensesColRef, expenseData);
      return docRef.id;
    } catch (e) {
      console.error("Error adding expense to Firestore:", e);
      setError(e as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getExpensesColRef]);

  const updateExpense = useCallback(async (id: string, expenseData: Partial<Omit<Expense, 'id'>>) => {
    if (!user) {
      setError(new Error("User not authenticated."));
      return;
    }
    const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
    
    setLoading(true);
    try {
      await updateDoc(expenseDocRef, expenseData);
    } catch (e) {
      console.error("Error updating expense in Firestore:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) {
      setError(new Error("User not authenticated."));
      return;
    }
    const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);

    setLoading(true);
    try {
      await deleteDoc(expenseDocRef);
    } catch (e) {
      console.error("Error deleting expense from Firestore:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { expenses, addExpense, updateExpense, deleteExpense, loading: loading || authLoading, error };
}
