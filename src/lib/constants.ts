import type { Category, CategoryName } from './types';
import { 
  Utensils, Car, Home, Lightbulb, Film, HeartPulse, ShoppingBag, 
  BookOpen, PiggyBank, Landmark, GripVertical, DollarSign 
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
  'Income': { icon: DollarSign, color: 'var(--chart-5)'}, // Specific icon for Income
  'Other': { icon: GripVertical, color: 'var(--chart-5)' },
};

export const ALL_CATEGORIES: Category[] = (Object.keys(CATEGORIES_CONFIG) as CategoryName[]).map(name => ({
  name,
  ...CATEGORIES_CONFIG[name],
}));

export const EXPENSE_CATEGORIES: Category[] = ALL_CATEGORIES.filter(c => c.name !== 'Income');

export const DEFAULT_BUDGETS: Budget[] = EXPENSE_CATEGORIES.map(cat => ({
  id: cat.name, // Use category name as ID for simplicity
  category: cat.name,
  amount: 0, // Default to 0, user can set this
  spentAmount: 0,
}));

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: Landmark },
  { href: '/expenses', label: 'Expenses', icon: ShoppingBag },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: Film }, // Placeholder, should be BarChart3 or similar
  { href: '/ai-budget-tool', label: 'AI Budget Tool', icon: Lightbulb }, // Placeholder, should be Sparkles or BrainCircuit
];

// For icon mapping if needed separately
export const getCategoryIcon = (categoryName: CategoryName) => {
  return CATEGORIES_CONFIG[categoryName]?.icon || GripVertical;
};
