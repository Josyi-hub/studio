
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Save, Trash2, Globe, Banknote as CurrencyIcon, Loader2 } from "lucide-react";
import { useUserAppSettings } from "@/hooks/use-user-app-settings";
import type { AppSettings } from "@/lib/types";
import { DEFAULT_APP_SETTINGS, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';


export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { appSettings: currentSettings, setAppSettings: saveAppSettings, loading: settingsLoading, error: settingsError } = useUserAppSettings();
  
  const [tempIncome, setTempIncome] = React.useState<string>('');
  const [tempCurrency, setTempCurrency] = React.useState<string>('');
  const [tempLanguage, setTempLanguage] = React.useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login'); // Redirect if not authenticated
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (currentSettings) {
      setTempIncome(currentSettings.monthlyIncome.toString());
      setTempCurrency(currentSettings.currency);
      setTempLanguage(currentSettings.language);
    }
  }, [currentSettings]);

  useEffect(() => {
    if (settingsError) {
      toast({ title: "Settings Error", description: `Could not load settings: ${settingsError.message}`, variant: "destructive" });
    }
  }, [settingsError, toast]);


  const handleSaveSettings = async () => {
    setIsSaving(true);
    const newIncomeAmount = parseFloat(tempIncome);
    if (isNaN(newIncomeAmount) || newIncomeAmount < 0) {
      toast({ title: "Invalid Income Amount", description: "Please enter a valid positive number for income.", variant: "destructive" });
      setIsSaving(false);
      return;
    }
    const newSettings: AppSettings = {
      monthlyIncome: newIncomeAmount,
      currency: tempCurrency,
      language: tempLanguage,
    };
    try {
      await saveAppSettings(newSettings);
      toast({ title: "Settings Updated", description: `Settings saved. Income: ${formatCurrency(newIncomeAmount, newSettings.language, newSettings.currency)}` });
    } catch (error: any) {
       toast({ title: "Save Error", description: `Could not save settings: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClearAllData = () => {
    // This needs to be re-thought with Firestore. 
    // For now, it's a placeholder or would require more complex Firebase functions to clear user data.
    // For simplicity, I will comment this out, as clearing specific user data in Firestore from client is not straightforward and risky.
    toast({ title: "Action Not Implemented", description: "Clearing all data from Firestore is a sensitive operation and not implemented in this version.", variant: "default" });
    // if (window.confirm("Are you sure you want to clear ALL SpendWise data for your account? This action cannot be undone.")) {
    //   // Firestore data clearing logic would go here (potentially a Firebase Function call)
    //   toast({ title: "Data Cleared", description: "All application data for your account has been removed.", variant: "destructive" });
    // }
  };
  
  const isLoading = authLoading || settingsLoading;

  if (isLoading && !currentSettings) { // Show full page skeleton if initial load and no data yet
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <Skeleton className="h-6 w-1/3 mb-1" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
         <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3 text-destructive" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
             <div className="space-y-3 p-4 border border-destructive rounded-lg">
              <Skeleton className="h-6 w-1/2 mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user && !authLoading) return null; // Or a message prompting to login

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
            {isLoading ? (
              <Skeleton className="h-10 w-full max-w-xs" />
            ) : (
              <Input
                id="monthlyIncome"
                type="number"
                step="100"
                placeholder="e.g., 3000"
                value={tempIncome}
                onChange={(e) => setTempIncome(e.target.value)}
                className="max-w-xs"
                disabled={isLoading || isSaving}
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
            {isLoading ? (
              <Skeleton className="h-10 w-full max-w-xs" />
            ) : (
              <Select value={tempCurrency} onValueChange={setTempCurrency} disabled={isLoading || isSaving}>
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
              Choose your display language (affects number/currency formatting and AI responses).
            </p>
            {isLoading ? (
              <Skeleton className="h-10 w-full max-w-xs" />
            ) : (
              <Select value={tempLanguage} onValueChange={setTempLanguage} disabled={isLoading || isSaving}>
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
          
          <Button onClick={handleSaveSettings} className="w-full md:w-auto" disabled={isLoading || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             {isSaving ? "Saving..." : "Save All Settings"}
          </Button>
        </CardContent>
      </Card>
      {/* <Card>
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
            <Button variant="destructive" onClick={handleClearAllData} disabled={isLoading || isSaving}>
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
