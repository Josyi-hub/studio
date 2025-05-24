"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Info } from "lucide-react";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Expense, Budget, MonthlyIncome, CategoryName } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { suggestBudgetAdjustments, type SuggestBudgetAdjustmentsInput, type SuggestBudgetAdjustmentsOutput } from '@/ai/flows/suggest-budget-adjustments';
import { useToast } from '@/hooks/use-toast';

export default function AiBudgetToolPage() {
  const [expenses] = useLocalStorage<Expense[]>('expenses', []);
  const [budgets] = useLocalStorage<Budget[]>('budgets', EXPENSE_CATEGORIES.map(c => ({ id: c.name, category: c.name, amount: 0 })));
  const [monthlyIncome, setMonthlyIncome] = useLocalStorage<MonthlyIncome>('monthlyIncome', { amount: 0 });
  
  const [suggestions, setSuggestions] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const aggregatedExpenses = useMemo(() => {
    const agg: Record<CategoryName, number> = {} as Record<CategoryName, number>;
    EXPENSE_CATEGORIES.forEach(cat => agg[cat.name] = 0);
    expenses.forEach(exp => {
      if (agg[exp.category] !== undefined) {
        agg[exp.category] += exp.amount;
      }
    });
    return agg;
  }, [expenses]);

  const currentBudgetGoals = useMemo(() => {
    const goals: Record<CategoryName, number> = {} as Record<CategoryName, number>;
    budgets.forEach(budget => {
      goals[budget.category] = budget.amount;
    });
    return goals;
  }, [budgets]);

  const handleGetSuggestions = async () => {
    if (monthlyIncome.amount <= 0) {
      toast({
        title: "Income Required",
        description: "Please set your monthly income before generating suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuggestions(null);

    const input: SuggestBudgetAdjustmentsInput = {
      income: monthlyIncome.amount,
      expenses: aggregatedExpenses,
      budgetGoals: currentBudgetGoals,
    };

    try {
      const result: SuggestBudgetAdjustmentsOutput = await suggestBudgetAdjustments(input);
      if (result && result.suggestions) {
        setSuggestions(result.suggestions);
        toast({ title: "Suggestions Generated!", description: "AI has provided budget adjustment ideas." });
      } else {
        throw new Error("No suggestions returned from AI.");
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast({
        title: "Error Generating Suggestions",
        description: "Could not fetch suggestions from AI. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value);
    setMonthlyIncome({ amount: isNaN(newAmount) ? 0 : newAmount });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" /> AI Budget Advisor</CardTitle>
          <CardDescription>
            Get personalized budget adjustment suggestions powered by AI based on your income, spending habits, and goals.
            Ensure your expenses and budgets are up-to-date for the best advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="monthlyIncome" className="text-base font-medium">Your Monthly Income</Label>
            <Input
              id="monthlyIncome"
              type="number"
              placeholder="Enter your total monthly income"
              value={monthlyIncome.amount || ''}
              onChange={handleIncomeChange}
              className="mt-1 text-lg p-2"
            />
             <p className="text-xs text-muted-foreground mt-1">This helps the AI understand your financial capacity.</p>
          </div>
          <Button onClick={handleGetSuggestions} disabled={isLoading || monthlyIncome.amount <= 0} className="w-full md:w-auto text-base py-3 px-6">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">AI-Powered Suggestions</CardTitle>
            <CardDescription>Here are some ideas to optimize your budget:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(suggestions).map(([category, suggestion]) => (
              <Alert key={category} className="bg-background shadow-sm">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="font-semibold text-primary">{category}</AlertTitle>
                <AlertDescription>{suggestion}</AlertDescription>
              </Alert>
            ))}
            {Object.keys(suggestions).length === 0 && (
                <p className="text-muted-foreground">The AI couldn't find specific suggestions for your current data. Try adjusting your income, expenses, or budget goals.</p>
            )}
          </CardContent>
        </Card>
      )}
       {!isLoading && !suggestions && monthlyIncome.amount > 0 && (
         <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground">
           <Info className="h-4 w-4 text-accent" />
           <AlertTitle>Ready to Optimize?</AlertTitle>
           <AlertDescription>
             Click the "Get AI Suggestions" button above to receive personalized advice.
             The AI will analyze your current income (<strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthlyIncome.amount)}</strong>),
             your total expenses (<strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Object.values(aggregatedExpenses).reduce((s,v)=>s+v,0))}</strong> from {Object.keys(aggregatedExpenses).filter(k => aggregatedExpenses[k as CategoryName] > 0).length} categories),
             and your budget goals (from {Object.keys(currentBudgetGoals).filter(k => currentBudgetGoals[k as CategoryName] > 0).length} categories).
           </AlertDescription>
         </Alert>
       )}
    </div>
  );
}
