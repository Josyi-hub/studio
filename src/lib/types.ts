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
  | 'Income' // Added Income as a category for tracking
  | 'Other';

export interface Category {
  name: CategoryName;
  icon: LucideIcon;
  color: string;
}

export interface Expense {
  id: string;
  date: string; // ISO string format (e.g., "2023-10-26T10:00:00.000Z")
  amount: number;
  category: CategoryName;
  description?: string;
}

export interface Budget {
  id: string; // Using string ID for budgets as well
  category: CategoryName;
  amount: number;
  spentAmount?: number; // Optional: to track spending against budget directly
}

export interface MonthlyIncome {
  amount: number;
}

// For chart data
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}
