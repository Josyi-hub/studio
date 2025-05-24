"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Expense, CategoryName } from "@/lib/types";
import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/lib/constants";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const expenseSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "Date is required." }),
  amount: z.coerce.number().min(0.01, "Amount must be positive."),
  category: z.enum(EXPENSE_CATEGORIES.map(c => c.name) as [CategoryName, ...CategoryName[]], { required_error: "Category is required." }),
  description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      description: "",
    },
  });

  React.useEffect(() => {
    if (editingExpense) {
      form.reset({
        id: editingExpense.id,
        date: parseISO(editingExpense.date),
        amount: editingExpense.amount,
        category: editingExpense.category,
        description: editingExpense.description || "",
      });
    } else {
      form.reset({
        date: new Date(),
        amount: 0,
        category: undefined,
        description: "",
      });
    }
  }, [editingExpense, form, isDialogOpen]);

  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? { ...data, id: editingExpense.id, date: data.date.toISOString() } : exp));
      toast({ title: "Expense Updated", description: "Your expense has been successfully updated." });
    } else {
      setExpenses(prev => [...prev, { ...data, id: crypto.randomUUID(), date: data.date.toISOString() }]);
      toast({ title: "Expense Added", description: "New expense has been successfully added." });
    }
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    toast({ title: "Expense Deleted", description: "Expense has been successfully deleted.", variant: "destructive" });
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingExpense(null);
    form.reset({ date: new Date(), amount: 0, category: undefined, description: "" });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Expenses</CardTitle>
          <CardDescription>Track and categorize your spending.</CardDescription>
        </div>
        <Button onClick={openNewDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
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
            {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() ).map((expense) => {
              const CategoryIcon = getCategoryIcon(expense.category);
              return (
              <TableRow key={expense.id}>
                <TableCell>{format(parseISO(expense.date), "PP")}</TableCell>
                <TableCell className="font-medium">{expense.description || expense.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <CategoryIcon className="h-3 w-3" />
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-destructive hover:text-destructive">
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
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.date && <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>}
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
              {form.formState.errors.amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Textarea id="description" {...form.register("description")} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{editingExpense ? "Save Changes" : "Add Expense"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
