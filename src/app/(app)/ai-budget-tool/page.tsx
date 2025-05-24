
"use client";

import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Info, Settings } from "lucide-react";
import Link from 'next/link';
import useLocalStorage from "@/hooks/use-local-storage";
import type { Expense, Budget, AppSettings, CategoryName } from "@/lib/types";
import { EXPENSE_CATEGORIES, DEFAULT_APP_SETTINGS } from "@/lib/constants";
import { suggestBudgetAdjustments, type SuggestBudgetAdjustmentsInput, type SuggestBudgetAdjustmentsOutput } from '@/ai/flows/suggest-budget-adjustments';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function AiBudgetToolPage() {
  const [expenses] = useLocalStorage<Expense[]>('expenses', []);
  const [budgets] = useLocalStorage<Budget[]>('budgets', EXPENSE_CATEGORIES.map(c => ({ id: c.name, category: c.name, amount: 0 })));
  const [appSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  
  const [suggestions, setSuggestions] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    if (appSettings.monthlyIncome <= 0) {
      toast({
        title: "Income Required",
        description: "Please set your monthly income in Settings before generating suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuggestions(null);

    const input: SuggestBudgetAdjustmentsInput = {
      income: appSettings.monthlyIncome,
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

  const totalAggregatedExpenses = Object.values(aggregatedExpenses).reduce((s,v)=>s+v,0);
  const activeExpenseCategoriesCount = Object.keys(aggregatedExpenses).filter(k => aggregatedExpenses[k as CategoryName] > 0).length;
  const activeBudgetGoalsCount = Object.keys(currentBudgetGoals).filter(k => currentBudgetGoals[k as CategoryName] > 0).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" /> AI Budget Advisor</CardTitle>
          <CardDescription>
            Get personalized budget adjustment suggestions powered by AI based on your income, spending habits, and goals.
            Ensure your expenses and budgets are up-to-date for the best advice. 
            {!isClient && <Skeleton className="inline-block h-4 w-48" />}
            {isClient && `Your current income is set to ${formatCurrency(appSettings.monthlyIncome, appSettings.language, appSettings.currency)}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isClient && appSettings.monthlyIncome <= 0 && (
             <Alert variant="warning">
              <Info className="h-4 w-4" />
              <AlertTitle>Monthly Income Not Set</AlertTitle>
              <AlertDescription>
                Please set your monthly income in the <Link href="/settings" className="font-medium text-primary hover:underline">Settings page</Link> to enable AI suggestions.
              </AlertDescription>
            </Alert>
          )}
          {!isClient && (
             <Alert variant="warning">
              <Info className="h-4 w-4" />
              <AlertTitle><Skeleton className="h-4 w-40" /></AlertTitle>
              <AlertDescription>
                 <Skeleton className="h-4 w-full mb-1" />
                 <Skeleton className="h-4 w-3/4" />
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={handleGetSuggestions} disabled={isLoading || (isClient && appSettings.monthlyIncome <= 0) || !isClient} className="w-full md:w-auto text-base py-3 px-6">
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
                <p className="text-muted-foreground">The AI couldn't find specific suggestions for your current data. Try adjusting your expenses or budget goals, or ensure your income is set in Settings.</p>
            )}
          </CardContent>
        </Card>
      )}
       {!isLoading && !suggestions && isClient && appSettings.monthlyIncome > 0 && (
         <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground">
           <Info className="h-4 w-4 text-accent" />
           <AlertTitle>Ready to Optimize?</AlertTitle>
           <AlertDescription>
             Click the "Get AI Suggestions" button above to receive personalized advice.
             The AI will analyze your current income (<strong>{formatCurrency(appSettings.monthlyIncome, appSettings.language, appSettings.currency)}</strong>),
             your total expenses (<strong>{formatCurrency(totalAggregatedExpenses, appSettings.language, appSettings.currency)}</strong> from {activeExpenseCategoriesCount} categories),
             and your budget goals (from {activeBudgetGoalsCount} categories).
           </AlertDescription>
         </Alert>
       )}
        {!isLoading && !suggestions && !isClient && (
          <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground">
           <Info className="h-4 w-4 text-accent" />
           <AlertTitle><Skeleton className="h-5 w-36" /></AlertTitle>
           <AlertDescription>
             <Skeleton className="h-4 w-full mb-1" />
             <Skeleton className="h-4 w-full mb-1" />
             <Skeleton className="h-4 w-3/4" />
           </AlertDescription>
         </Alert>
        )}
    </div>
  );
}

    