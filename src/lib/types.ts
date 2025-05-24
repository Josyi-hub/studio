
import type { LucideIcon } from 'lucide-react';

export type CategoryName =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Utilities'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Education'
  | 'Savings'
  | 'Income'
  | 'Other';

export interface Category {
  name: CategoryName;
  icon: LucideIcon;
  color: string;
}

export interface Expense {
  id: string; // Firestore document ID
  userId?: string; // To associate with a user, though path implies this
  date: string; // ISO string format (e.g., "2023-10-26T10:00:00.000Z")
  amount: number;
  category: CategoryName;
  description?: string;
}

export interface Budget {
  id: string; // Firestore document ID (can be same as category name for simplicity)
  userId?: string; // To associate with a user
  category: CategoryName;
  amount: number;
  spentAmount?: number; 
}

export interface AppSettings {
  monthlyIncome: number;
  currency: string; 
  language: string; 
  // userId field is not needed here if these settings are stored under /users/{userId}/settings/appSettings
}

// For chart data
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

// For AI Flow
export interface SuggestBudgetAdjustmentsInput {
  income: number;
  expenses: Record<string, number>;
  budgetGoals: Record<string, number>;
  language: string; // Added language
  financialContext?: string; // Added financial context
}

export interface SuggestBudgetAdjustmentsOutput {
 suggestions: Record<string, string>;
}
