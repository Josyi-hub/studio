
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, CalendarIcon, CreditCard, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from "date-fns";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUserExpenses } from "@/hooks/use-user-expenses";
import { useUserAppSettings } from "@/hooks/use-user-app-settings";
import type { Expense, CategoryName } from "@/lib/types";
import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/lib/constants";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';


const expenseSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "Date is required." }),
  amount: z.coerce.number().min(0.01, "Amount must be positive."),
  category: z.enum(EXPENSE_CATEGORIES.map(c => c.name) as [CategoryName, ...CategoryName[]], { required_error: "Category is required." }),
  description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { expenses, addExpense, updateExpense, deleteExpense, loading: expensesLoading, error: expensesError } = useUserExpenses();
  const { appSettings, loading: settingsLoading } = useUserAppSettings();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (expensesError) {
      toast({ title: "Expenses Error", description: `Could not load expenses: ${expensesError.message}`, variant: "destructive" });
    }
  }, [expensesError, toast]);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      description: "",
    },
  });

  React.useEffect(() => {
    if (!isDialogOpen) { // Reset form when dialog closes
        setEditingExpense(null);
        form.reset({
            date: new Date(),
            amount: 0,
            category: undefined,
            description: "",
        });
    } else if (editingExpense) { // Populate form when dialog opens for editing
      const expenseDate = parseISO(editingExpense.date);
      form.reset({
        id: editingExpense.id,
        date: isValid(expenseDate) ? expenseDate : new Date(),
        amount: editingExpense.amount,
        category: editingExpense.category,
        description: editingExpense.description || "",
      });
    } else { // Reset for new expense when dialog opens
         form.reset({
            date: new Date(),
            amount: 0,
            category: undefined,
            description: "",
        });
    }
  }, [editingExpense, form, isDialogOpen]);

  const onSubmit: SubmitHandler<ExpenseFormData> = async (data) => {
    setIsSubmitting(true);
    const expensePayload = {
      date: data.date.toISOString(),
      amount: data.amount,
      category: data.category,
      description: data.description || "",
    };

    try {
      if (editingExpense && editingExpense.id) {
        await updateExpense(editingExpense.id, expensePayload);
        toast({ title: "Expense Updated", description: "Your expense has been successfully updated." });
      } else {
        await addExpense(expensePayload);
        toast({ title: "Expense Added", description: "New expense has been successfully added." });
      }
      setEditingExpense(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Submission Error", description: `Could not save expense: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true); // Use same state for delete operation indication
    try {
      await deleteExpense(id);
      toast({ title: "Expense Deleted", description: "Expense has been successfully deleted.", variant: "default" }); // Changed variant
    } catch (error: any) {
      toast({ title: "Delete Error", description: `Could not delete expense: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingExpense(null);
    // Form reset is handled by useEffect on isDialogOpen
    setIsDialogOpen(true);
  };

  const isLoading = authLoading || expensesLoading || settingsLoading;

  if (isLoading && expenses.length === 0) { // Initial loading skeleton for the table
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={`skeleton-row-${i}`}>
                  {[...Array(5)].map((_, j) => <TableCell key={`skeleton-cell-${i}-${j}`}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }
  
  if (!user && !authLoading) return null; // Or a message prompting to login

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Expenses</CardTitle>
          <CardDescription>Track and categorize your spending.</CardDescription>
        </div>
        <Button onClick={openNewDialog} disabled={isLoading || isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 && !isLoading ? (
          <div className="text-center py-10">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No expenses recorded yet.</p>
            <p className="text-sm text-muted-foreground">Click "Add Expense" to get started.</p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const CategoryIcon = getCategoryIcon(expense.category);
              const expenseDate = parseISO(expense.date);
              return (
              <TableRow key={expense.id}>
                <TableCell>{isValid(expenseDate) ? format(expenseDate, "PP") : 'Invalid Date'}</TableCell>
                <TableCell className="font-medium">{expense.description || expense.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <CategoryIcon className="h-3 w-3" />
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(expense.amount, appSettings.language, appSettings.currency)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)} disabled={isSubmitting}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-destructive hover:text-destructive" disabled={isSubmitting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value && isValid(field.value) ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={isSubmitting}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.date && <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>}
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...form.register("amount")} disabled={isSubmitting} />
              {form.formState.errors.amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>
                          <div className="flex items-center">
                            <cat.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" {...form.register("description")} disabled={isSubmitting} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingExpense ? "Save Changes" : "Add Expense") }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
