
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // For financial context
import { Textarea } from "@/components/ui/textarea"; // For financial context
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Info } from "lucide-react";
import Link from 'next/link';
import { useUserExpenses } from "@/hooks/use-user-expenses";
import { useUserBudgets } from "@/hooks/use-user-budgets";
import { useUserAppSettings } from "@/hooks/use-user-app-settings";
import type { Expense, Budget, CategoryName, SuggestBudgetAdjustmentsInput, SuggestBudgetAdjustmentsOutput } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { suggestBudgetAdjustments } from '@/ai/flows/suggest-budget-adjustments';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';


export default function AiBudgetToolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { expenses, loading: expensesLoading } = useUserExpenses();
  const { budgets, loading: budgetsLoading } = useUserBudgets();
  const { appSettings, loading: settingsLoading, error: settingsError } = useUserAppSettings();
  
  const [suggestions, setSuggestions] = useState<Record<string, string> | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [financialContext, setFinancialContext] = useState<string>(""); // New state for financial context
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (settingsError) {
      toast({ title: "Settings Error", description: `Could not load app settings for AI tool: ${settingsError.message}`, variant: "destructive" });
    }
  }, [settingsError, toast]);

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

    setIsLoadingAi(true);
    setSuggestions(null);

    const input: SuggestBudgetAdjustmentsInput = {
      income: appSettings.monthlyIncome,
      expenses: aggregatedExpenses,
      budgetGoals: currentBudgetGoals,
      language: appSettings.language || 'en-US', // Pass language
      financialContext: financialContext || undefined, // Pass financial context
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
      setIsLoadingAi(false);
    }
  };

  const totalAggregatedExpenses = Object.values(aggregatedExpenses).reduce((s,v)=>s+v,0);
  const activeExpenseCategoriesCount = Object.keys(aggregatedExpenses).filter(k => aggregatedExpenses[k as CategoryName] > 0).length;
  const activeBudgetGoalsCount = Object.keys(currentBudgetGoals).filter(k => currentBudgetGoals[k as CategoryName] > 0).length;
  
  const overallLoading = authLoading || expensesLoading || budgetsLoading || settingsLoading;

  if (overallLoading && !appSettings) { // Initial page skeleton
     return (
       <div className="space-y-6">
         <Card>
           <CardHeader>
             <Skeleton className="h-8 w-3/4 mb-2" />
             <Skeleton className="h-4 w-full mb-1" />
             <Skeleton className="h-4 w-2/3" />
           </CardHeader>
           <CardContent className="space-y-4">
             <Skeleton className="h-10 w-1/2" /> 
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-12 w-1/3" />
           </CardContent>
         </Card>
         <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground">
           <Info className="h-4 w-4 text-accent" />
           <AlertTitle><Skeleton className="h-5 w-36" /></AlertTitle>
           <AlertDescription>
             <Skeleton className="h-4 w-full mb-1" />
             <Skeleton className="h-4 w-full mb-1" />
             <Skeleton className="h-4 w-3/4" />
           </AlertDescription>
         </Alert>
       </div>
     );
  }

  if (!user && !authLoading) return null; // Or a login prompt

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" /> AI Budget Advisor</CardTitle>
          <CardDescription>
            Get personalized budget adjustment suggestions powered by AI based on your income, spending habits, and goals.
            Ensure your expenses and budgets are up-to-date for the best advice. 
            Your current income is set to {formatCurrency(appSettings.monthlyIncome, appSettings.language, appSettings.currency)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {appSettings.monthlyIncome <= 0 && !overallLoading && (
             <Alert variant="warning">
              <Info className="h-4 w-4" />
              <AlertTitle>Monthly Income Not Set</AlertTitle>
              <AlertDescription>
                Please set your monthly income in the <Link href="/settings" className="font-medium text-primary hover:underline">Settings page</Link> to enable AI suggestions.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="financialContext">Financial Goals/Context (Optional)</Label>
            <Textarea
              id="financialContext"
              placeholder="e.g., Saving for a vacation, trying to pay off debt, general budgeting help..."
              value={financialContext}
              onChange={(e) => setFinancialContext(e.target.value)}
              className="min-h-[80px]"
              disabled={isLoadingAi || overallLoading}
            />
            <p className="text-xs text-muted-foreground">
              Providing more context helps the AI give you more relevant advice.
            </p>
          </div>
          <Button 
            onClick={handleGetSuggestions} 
            disabled={isLoadingAi || overallLoading || appSettings.monthlyIncome <= 0} 
            className="w-full md:w-auto text-base py-3 px-6"
          >
            {isLoadingAi ? (
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

      {isLoadingAi && ( // Show skeleton for suggestions area while AI is thinking
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 text-primary" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Alert key={`skel-sugg-${i}`} className="bg-background shadow-sm">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle><Skeleton className="h-5 w-1/3" /></AlertTitle>
                <AlertDescription><Skeleton className="h-4 w-full" /></AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoadingAi && suggestions && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">AI-Powered Suggestions</CardTitle>
            <CardDescription>Here are some ideas to optimize your budget based on your input:</CardDescription>
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
                <p className="text-muted-foreground">The AI couldn&apos;t find specific suggestions for your current data. Try adjusting your expenses or budget goals, or ensure your income is set in Settings.</p>
            )}
          </CardContent>
        </Card>
      )}
       {!isLoadingAi && !suggestions && !overallLoading && appSettings.monthlyIncome > 0 && (
         <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground">
           <Info className="h-4 w-4 text-accent" />
           <AlertTitle>Ready to Optimize?</AlertTitle>
           <AlertDescription>
             Click the "Get AI Suggestions" button above to receive personalized advice.
             The AI will analyze your current income (<strong>{formatCurrency(appSettings.monthlyIncome, appSettings.language, appSettings.currency)}</strong>),
             your total expenses (<strong>{formatCurrency(totalAggregatedExpenses, appSettings.language, appSettings.currency)}</strong> from {activeExpenseCategoriesCount} categories),
             your budget goals (from {activeBudgetGoalsCount} categories), and any financial context you provide.
           </AlertDescription>
         </Alert>
       )}
    </div>
  );
}
