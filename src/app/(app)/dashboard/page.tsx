
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, DollarSign, CreditCard, Target, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUserExpenses } from "@/hooks/use-user-expenses";
import { useUserBudgets } from "@/hooks/use-user-budgets";
import { useUserAppSettings } from "@/hooks/use-user-app-settings";
import type { Expense, Budget } from "@/lib/types";
import { getCategoryIcon } from "@/lib/constants";
import { format, parseISO, isValid } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { expenses, loading: expensesLoading } = useUserExpenses();
  const { budgets, loading: budgetsLoading } = useUserBudgets();
  const { appSettings, loading: settingsLoading } = useUserAppSettings();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudgetGlobal = appSettings.monthlyIncome - totalExpenses;

  const budgetsWithSpent = budgets.map(budget => {
    const spent = expenses
      .filter(exp => exp.category === budget.category)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { ...budget, spentAmount: spent };
  });
  
  const recentExpenses = [...expenses].sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    if (!isValid(dateA)) return 1; // push invalid dates to end
    if (!isValid(dateB)) return -1;
    return dateB.getTime() - dateA.getTime();
  }).slice(0, 5);

  const isLoading = authLoading || expensesLoading || budgetsLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-28 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
               <Skeleton className="h-6 w-40 mb-1" />
               <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) return null; // Or a login prompt

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(appSettings.monthlyIncome, appSettings.language, appSettings.currency)}</div>
            <p className="text-xs text-muted-foreground">Current monthly income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, appSettings.language, appSettings.currency)}</div>
            {/* <p className="text-xs text-muted-foreground"> vs last month </p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudgetGlobal < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(remainingBudgetGlobal, appSettings.language, appSettings.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on income vs expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest 5 expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No transactions yet.</p>
                <Button asChild variant="outline">
                  <Link href="/expenses"><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.map((expense) => {
                    const CategoryIcon = getCategoryIcon(expense.category);
                    const expenseDate = parseISO(expense.date);
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="font-medium">{expense.description || expense.category}</div>
                          <div className="text-sm text-muted-foreground hidden md:inline">
                            {isValid(expenseDate) ? format(expenseDate, "MMM d, yyyy") : "Invalid Date"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <CategoryIcon className="h-3 w-3" />
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.amount, appSettings.language, appSettings.currency)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {recentExpenses.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/expenses">View All Expenses <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>How you&apos;re tracking against your category budgets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetsWithSpent.filter(b => b.amount > 0).length === 0 ? (
               <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No budgets set.</p>
                <Button asChild variant="outline">
                  <Link href="/budgets"><PlusCircle className="mr-2 h-4 w-4" /> Set Budgets</Link>
                </Button>
              </div>
            ) : (
              budgetsWithSpent.filter(b => b.amount > 0).map((budget) => {
                const progress = budget.amount > 0 ? ((budget.spentAmount || 0) / budget.amount) * 100 : 0;
                const CategoryIcon = getCategoryIcon(budget.category);
                return (
                  <div key={budget.category}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center">
                        <CategoryIcon className="h-4 w-4 mr-2 text-muted-foreground"/>
                        {budget.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(budget.spentAmount || 0, appSettings.language, appSettings.currency)} / {formatCurrency(budget.amount, appSettings.language, appSettings.currency)}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" indicatorClassName={progress > 100 ? 'bg-destructive' : (progress > 75 ? 'bg-yellow-500' : 'bg-primary')} />
                    {progress > 100 && <p className="text-xs text-destructive mt-1">Overspent by {formatCurrency((budget.spentAmount || 0) - budget.amount, appSettings.language, appSettings.currency)}</p>}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
