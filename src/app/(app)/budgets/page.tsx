"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Edit, Save, Target } from "lucide-react";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Budget, Expense, CategoryName, AppSettings } from "@/lib/types";
import { EXPENSE_CATEGORIES, getCategoryIcon, DEFAULT_BUDGETS, DEFAULT_APP_SETTINGS } from "@/lib/constants";
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', DEFAULT_BUDGETS);
  const [expenses] = useLocalStorage<Expense[]>('expenses', []);
  const [appSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [editingBudgets, setEditingBudgets] = useState<Record<CategoryName, string>>({});
  const { toast } = useToast();

  const handleAmountChange = (category: CategoryName, value: string) => {
    setEditingBudgets(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveBudget = (category: CategoryName) => {
    const newAmount = parseFloat(editingBudgets[category]);
    if (isNaN(newAmount) || newAmount < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number for the budget.", variant: "destructive" });
      return;
    }
    setBudgets(prev => prev.map(b => b.category === category ? { ...b, amount: newAmount } : b));
    setEditingBudgets(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    toast({ title: "Budget Saved", description: `Budget for ${category} has been updated.` });
  };

  const calculateSpentAmount = (category: CategoryName) => {
    return expenses
      .filter(exp => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Budgets</CardTitle>
        <CardDescription>Set and adjust your monthly spending limits for each category.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {EXPENSE_CATEGORIES.map((categoryConfig) => {
          const budget = budgets.find(b => b.category === categoryConfig.name) || { id: categoryConfig.name, category: categoryConfig.name, amount: 0 };
          const spentAmount = calculateSpentAmount(categoryConfig.name);
          const progress = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
          const isEditing = editingBudgets[categoryConfig.name] !== undefined;
          const CategoryIcon = getCategoryIcon(categoryConfig.name);

          return (
            <div key={categoryConfig.name} className="p-4 border rounded-lg shadow-sm bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CategoryIcon className="h-6 w-6 mr-3 text-muted-foreground" />
                  <h3 className="text-lg font-medium">{categoryConfig.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => isEditing ? handleSaveBudget(categoryConfig.name) : handleAmountChange(categoryConfig.name, budget.amount.toString())}
                >
                  {isEditing ? <Save className="h-5 w-5 text-primary" /> : <Edit className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor={`budget-${categoryConfig.name}`} className="sr-only">Budget Amount</Label>
                  <Input
                    id={`budget-${categoryConfig.name}`}
                    type="number"
                    step="1"
                    min="0"
                    value={editingBudgets[categoryConfig.name]}
                    onChange={(e) => handleAmountChange(categoryConfig.name, e.target.value)}
                    className="w-1/2"
                    aria-label={`Budget for ${categoryConfig.name}`}
                  />
                  <span className="text-muted-foreground">/ month</span>
                </div>
              ) : (
                <p className="text-2xl font-semibold text-primary">{formatCurrency(budget.amount, appSettings.language, appSettings.currency)}
                  <span className="text-sm font-normal text-muted-foreground"> / month</span>
                </p>
              )}

              {budget.amount > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Spent: {formatCurrency(spentAmount, appSettings.language, appSettings.currency)}</span>
                    <span>Remaining: {formatCurrency(budget.amount - spentAmount, appSettings.language, appSettings.currency)}</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" 
                    indicatorClassName={progress > 100 ? 'bg-destructive' : (progress > 75 ? 'bg-yellow-500' : 'bg-primary')}
                  />
                  {progress > 100 && <p className="text-xs text-destructive mt-1">Overspent by {formatCurrency(spentAmount - budget.amount, appSettings.language, appSettings.currency)}</p>}
                </div>
              )}
              {budget.amount === 0 && !isEditing && (
                 <p className="text-xs text-muted-foreground mt-1">No budget set for this category.</p>
              )}
            </div>
          );
        })}
         {EXPENSE_CATEGORIES.length === 0 && (
           <div className="text-center py-10">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No categories available to set budgets for.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
