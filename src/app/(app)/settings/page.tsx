"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Save, Trash2 } from "lucide-react";
import useLocalStorage from "@/hooks/use-local-storage";
import type { MonthlyIncome } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [monthlyIncome, setMonthlyIncome] = useLocalStorage<MonthlyIncome>('monthlyIncome', { amount: 0 });
  const [tempIncome, setTempIncome] = React.useState<string>(monthlyIncome.amount.toString());
  const { toast } = useToast();

  React.useEffect(() => {
    setTempIncome(monthlyIncome.amount.toString());
  }, [monthlyIncome]);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempIncome(e.target.value);
  };

  const handleSaveIncome = () => {
    const newAmount = parseFloat(tempIncome);
    if (isNaN(newAmount) || newAmount < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number for income.", variant: "destructive" });
      return;
    }
    setMonthlyIncome({ amount: newAmount });
    toast({ title: "Income Updated", description: `Monthly income set to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newAmount)}.` });
  };
  
  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL SpendWise data? This action cannot be undone.")) {
      localStorage.removeItem('expenses');
      localStorage.removeItem('budgets');
      localStorage.removeItem('monthlyIncome');
      // Optionally, reload or redirect to re-initialize states
      window.location.reload(); 
      toast({ title: "Data Cleared", description: "All application data has been removed.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Manage your SpendWise preferences and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="monthlyIncome" className="text-base font-medium flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Default Monthly Income
            </Label>
            <p className="text-sm text-muted-foreground">
              Set your primary monthly income. This is used for calculations and AI suggestions.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="monthlyIncome"
                type="number"
                step="100"
                placeholder="e.g., 3000"
                value={tempIncome}
                onChange={handleIncomeChange}
                className="max-w-xs"
              />
              <Button onClick={handleSaveIncome}>
                <Save className="mr-2 h-4 w-4" /> Save Income
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Be careful with actions in this section.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2 p-4 border border-destructive rounded-lg">
            <Label className="text-base font-medium flex items-center text-destructive">
              <Trash2 className="mr-2 h-5 w-5" />
              Clear All Application Data
            </Label>
            <p className="text-sm text-muted-foreground">
              This will permanently delete all your expenses, budgets, and income settings stored in this browser. This action cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleClearAllData}>
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
