
"use client";

import React, { useMemo, useState, useEffect } from 'react'; // Added useState, useEffect
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import useLocalStorage from "@/hooks/use-local-storage";
import type { Expense, Budget, CategoryName, ChartDataPoint, AppSettings } from "@/lib/types";
import { EXPENSE_CATEGORIES, CATEGORIES_CONFIG, DEFAULT_APP_SETTINGS } from "@/lib/constants";
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

const RenderActiveShape = (props: any) => { 
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, language, currency } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${formatCurrency(value, language, currency)}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export default function ReportsPage() {
  const [expenses] = useLocalStorage<Expense[]>('expenses', []);
  const [budgets] = useLocalStorage<Budget[]>('budgets', EXPENSE_CATEGORIES.map(c => ({ id: c.name, category: c.name, amount: 0 })));
  const [appSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const spendingByCategory: ChartDataPoint[] = useMemo(() => {
    if (!isClient) return []; 

    const categoryTotals: Record<CategoryName, number> = {} as Record<CategoryName, number>;
    EXPENSE_CATEGORIES.forEach(cat => categoryTotals[cat.name] = 0);

    expenses.forEach(expense => {
      if (categoryTotals[expense.category] !== undefined) {
        categoryTotals[expense.category] += expense.amount;
      }
    });
    
    return EXPENSE_CATEGORIES.map(cat => {
      const colorConfig = CATEGORIES_CONFIG[cat.name];
      let fillColor = colorConfig?.color;
      if (colorConfig?.color && colorConfig.color.startsWith('var(') && typeof window !== 'undefined') {
         try {
            fillColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue(colorConfig.color.slice(4, -1)).trim()})`;
         } catch (e) {
            console.warn("Could not compute style for chart color", e);
            // Use default color if var cannot be resolved
         }
      }
      return {
        name: cat.name,
        value: categoryTotals[cat.name] || 0,
        fill: fillColor || '#8884d8', // Fallback fill color
      };
    }).filter(item => item.value > 0);
  }, [expenses, isClient]);

  const budgetVsActualData = useMemo(() => {
    if (!isClient) return [];
    return budgets.filter(b => b.amount > 0).map(budget => {
      const actualSpending = expenses
        .filter(exp => exp.category === budget.category)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return {
        name: budget.category,
        budget: budget.amount,
        actual: actualSpending,
        // Recharts might not directly support CSS variables in `fill`.
        // If these are var(--some-css-var), they might need to be resolved to HSL/HEX in JS like spendingByCategory.
        // For now, assuming these theme variables are directly usable or simple colors.
        fillBudget: 'hsl(var(--primary) / 0.6)',
        fillActual: 'hsl(var(--accent))',
      };
    });
  }, [budgets, expenses, isClient]);


  if (!isClient && (expenses.length === 0 && budgets.filter(b => b.amount > 0).length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <TrendingUp className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }
  
  if (isClient && expenses.length === 0 && budgets.filter(b => b.amount > 0).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <TrendingUp className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold mb-2">No Data for Reports</h2>
        <p className="text-muted-foreground">
          Start by adding some <Link href="/expenses" className="text-primary hover:underline">expenses</Link> or setting up <Link href="/budgets" className="text-primary hover:underline">budgets</Link>.
        </p>
      </div>
    );
  }

  const pieChartActiveShape = (props: any) => (
    <RenderActiveShape {...props} language={appSettings.language} currency={appSettings.currency} />
  );

  const renderChartSkeletons = () => (
     <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[350px]">
            <Skeleton className="h-56 w-56 rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-end">
            <div className="flex items-end h-full gap-4 px-4">
                <Skeleton className="h-[60%] w-10" />
                <Skeleton className="h-[80%] w-10" />
                <Skeleton className="h-[40%] w-10" />
                <Skeleton className="h-[70%] w-10" />
            </div>
             <Skeleton className="h-2 w-full mt-2" /> {/* X-axis line */}
          </CardContent>
        </Card>
    </div>
  );

  if (!isClient) {
    return renderChartSkeletons();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Visual breakdown of your expenses across different categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={pieChartActiveShape}
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, appSettings.language, appSettings.currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-center">
              <PieChartIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No spending data to display for this chart.</p>
              <p className="text-sm text-muted-foreground">Add some expenses to see your spending breakdown.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs. Actual Spending</CardTitle>
          <CardDescription>Compare your budgeted amounts with actual spending for each category.</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetVsActualData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={budgetVsActualData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
              <YAxis 
                stroke="hsl(var(--foreground))" 
                tickFormatter={(value) => formatCurrency(value, appSettings.language, appSettings.currency).replace(/\.00$/, '')} 
                tick={{ fontSize: 12 }} 
                width={80} 
              />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value, appSettings.language, appSettings.currency), name === 'budget' ? 'Budgeted' : 'Actual Spending']}
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="budget" name="Budgeted" fill="var(--primary-foreground)" barSize={20} radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual Spending" fill="var(--accent)" barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No budget data to display comparison.</p>
              <p className="text-sm text-muted-foreground">Set some budgets to compare with your spending.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    