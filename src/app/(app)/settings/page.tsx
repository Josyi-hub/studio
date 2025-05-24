
"use client";

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Save, Trash2, Globe, Banknote as CurrencyIcon } from "lucide-react";
import useLocalStorage from "@/hooks/use-local-storage";
import type { AppSettings } from "@/lib/types";
import { DEFAULT_APP_SETTINGS, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function SettingsPage() {
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [isClient, setIsClient] = useState(false);
  
  // Temporary states for form inputs, initialized once isClient is true
  const [tempIncome, setTempIncome] = React.useState<string>('');
  const [tempCurrency, setTempCurrency] = React.useState<string>('');
  const [tempLanguage, setTempLanguage] = React.useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setTempIncome(appSettings.monthlyIncome.toString());
      setTempCurrency(appSettings.currency);
      setTempLanguage(appSettings.language);
    }
  }, [appSettings, isClient]);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempIncome(e.target.value);
  };

  const handleSaveSettings = () => {
    const newIncomeAmount = parseFloat(tempIncome);
    if (isNaN(newIncomeAmount) || newIncomeAmount < 0) {
      toast({ title: "Invalid Income Amount", description: "Please enter a valid positive number for income.", variant: "destructive" });
      return;
    }
    const newSettings: AppSettings = {
      monthlyIncome: newIncomeAmount,
      currency: tempCurrency,
      language: tempLanguage,
    };
    setAppSettings(newSettings);
    toast({ title: "Settings Updated", description: `Settings saved. Income: ${formatCurrency(newIncomeAmount, newSettings.language, newSettings.currency)}` });
  };
  
  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL SpendWise data? This action cannot be undone.")) {
      localStorage.removeItem('expenses');
      localStorage.removeItem('budgets');
      localStorage.removeItem('appSettings');
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
        <CardContent className="space-y-6">
          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="monthlyIncome" className="text-base font-medium flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Monthly Income
            </Label>
            <p className="text-sm text-muted-foreground">
              Set your primary monthly income. This is used for calculations and AI suggestions.
            </p>
            {!isClient ? (
              <Skeleton className="h-10 w-full max-w-xs" />
            ) : (
              <Input
                id="monthlyIncome"
                type="number"
                step="100"
                placeholder="e.g., 3000"
                value={tempIncome}
                onChange={handleIncomeChange}
                className="max-w-xs"
                disabled={!isClient}
              />
            )}
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="currency" className="text-base font-medium flex items-center">
              <CurrencyIcon className="mr-2 h-5 w-5 text-primary" />
              Currency
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred currency for displaying amounts.
            </p>
            {!isClient ? (
              <Skeleton className="h-10 w-full max-w-xs" />
            ) : (
              <Select value={tempCurrency} onValueChange={setTempCurrency} disabled={!isClient}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <div className="flex items-center gap-2">
                        {curr.icon && <curr.icon className="h-4 w-4 text-muted-foreground" />}
                        <span>{curr.name} ({curr.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="language" className="text-base font-medium flex items-center">
              <Globe className="mr-2 h-5 w-5 text-primary" />
              Language
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose your display language (affects number/currency formatting). Full UI translation is progressive.
            </p>
            {!isClient ? (
              <Skeleton className="h-10 w-full max-w-xs" />
            ) : (
              <Select value={tempLanguage} onValueChange={setTempLanguage} disabled={!isClient}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                       <div className="flex items-center gap-2">
                        {lang.icon && <lang.icon className="h-4 w-4 text-muted-foreground" />}
                        <span>{lang.name}</span>
                       </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <Button onClick={handleSaveSettings} className="w-full md:w-auto" disabled={!isClient}>
            <Save className="mr-2 h-4 w-4" /> Save All Settings
          </Button>
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
              This will permanently delete all your expenses, budgets, and application settings stored in this browser. This action cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleClearAllData} disabled={!isClient}>
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    