"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, DollarSign, CreditCard, Target, PlusCircle } from "lucide-react";
import Link from "next/link";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Expense, Budget, MonthlyIncome } from "@/lib/types";
import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/lib/constants";
import { format } from 'date-fns';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function DashboardPage() {
  const [expenses] = useLocalStorage<Expense[]>('expenses', []);
  const [budgets] = useLocalStorage<Budget[]>('budgets', EXPENSE_CATEGORIES.map(c => ({ id: c.name, category: c.name, amount: 0, spentAmount: 0 })));
  const [monthlyIncome] = useLocalStorage<MonthlyIncome>('monthlyIncome', { amount: 0 });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalBudget = budgets.reduce((sum, bud) => sum + bud.amount, 0);
  const remainingBudgetGlobal = monthlyIncome.amount - totalExpenses;

  // Calculate spent amount for each budget category
  const budgetsWithSpent = budgets.map(budget => {
    const spent = expenses
      .filter(exp => exp.category === budget.category)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { ...budget, spentAmount: spent };
  });
  
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyIncome.amount)}</div>
            <p className="text-xs text-muted-foreground">Current monthly income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {/* Placeholder for comparison, e.g. vs last month */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudgetGlobal < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(remainingBudgetGlobal)}
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
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="font-medium">{expense.description || expense.category}</div>
                          <div className="text-sm text-muted-foreground hidden md:inline">
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <CategoryIcon className="h-3 w-3" />
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
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
            <CardDescription>How you're tracking against your category budgets.</CardDescription>
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
                const progress = budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0;
                const CategoryIcon = getCategoryIcon(budget.category);
                return (
                  <div key={budget.category}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center">
                        <CategoryIcon className="h-4 w-4 mr-2 text-muted-foreground"/>
                        {budget.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(budget.spentAmount || 0)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    {progress > 100 && <p className="text-xs text-destructive mt-1">Overspent by {formatCurrency((budget.spentAmount || 0) - budget.amount)}</p>}
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
