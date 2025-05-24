import type { Category, CategoryName, Budget, AppSettings } from './types';
import {
  Utensils, Car, Home, Lightbulb, Film, HeartPulse, ShoppingBag,
  BookOpen, PiggyBank, Landmark, GripVertical, DollarSign, Globe, Banknote
} from 'lucide-react';

export const APP_NAME = "SpendWise";

export const CATEGORIES_CONFIG: Record<CategoryName, Omit<Category, 'name'>> = {
  'Food': { icon: Utensils, color: 'var(--chart-1)' },
  'Transport': { icon: Car, color: 'var(--chart-2)' },
  'Housing': { icon: Home, color: 'var(--chart-3)' },
  'Utilities': { icon: Lightbulb, color: 'var(--chart-4)' },
  'Entertainment': { icon: Film, color: 'var(--chart-5)' },
  'Health': { icon: HeartPulse, color: 'var(--chart-1)' },
  'Shopping': { icon: ShoppingBag, color: 'var(--chart-2)' },
  'Education': { icon: BookOpen, color: 'var(--chart-3)' },
  'Savings': { icon: PiggyBank, color: 'var(--chart-4)' },
  'Income': { icon: DollarSign, color: 'var(--chart-5)'},
  'Other': { icon: GripVertical, color: 'var(--chart-5)' },
};

export const ALL_CATEGORIES: Category[] = (Object.keys(CATEGORIES_CONFIG) as CategoryName[]).map(name => ({
  name,
  ...CATEGORIES_CONFIG[name],
}));

export const EXPENSE_CATEGORIES: Category[] = ALL_CATEGORIES.filter(c => c.name !== 'Income');

export const DEFAULT_BUDGETS: Budget[] = EXPENSE_CATEGORIES.map(cat => ({
  id: cat.name,
  category: cat.name,
  amount: 0,
  spentAmount: 0,
}));

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: Landmark },
  { href: '/expenses', label: 'Expenses', icon: ShoppingBag },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: Film },
  { href: '/ai-budget-tool', label: 'AI Budget Tool', icon: Lightbulb },
];

export const getCategoryIcon = (categoryName: CategoryName) => {
  return CATEGORIES_CONFIG[categoryName]?.icon || GripVertical;
};

// New constants for currency and language
export const SUPPORTED_CURRENCIES: Array<{ code: string; name: string; symbol?: string, icon?: LucideIcon }> = [
  { code: 'USD', name: 'US Dollar', symbol: '$', icon: Banknote },
  { code: 'EUR', name: 'Euro', symbol: '€', icon: Banknote },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'FCFA', icon: Banknote },
];

export const SUPPORTED_LANGUAGES: Array<{ code: string; name: string; icon?: LucideIcon }> = [
  { code: 'en-US', name: 'English', icon: Globe },
  { code: 'fr-FR', name: 'Français', icon: Globe },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  monthlyIncome: 0,
  currency: 'USD',
  language: 'en-US',
};

// Helper to get currency symbol or code (though Intl.NumberFormat handles symbols well)
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};
