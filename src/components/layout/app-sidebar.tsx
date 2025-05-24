// @ts-nocheck
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_NAME } from '@/lib/constants';
import { Home, LogOut, Settings, BarChart3, Sparkles, ShoppingBag, PiggyBank } from 'lucide-react'; // Updated icons
import { Separator } from '../ui/separator';

// Update NAV_LINKS icons to actual Lucide components
const NAVIGATION_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: ShoppingBag },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/ai-budget-tool', label: 'AI Budget Tool', icon: Sparkles },
];


export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex items-center justify-between">
         <Link href="/dashboard" className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              {APP_NAME}
            </h1>
          </Link>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          <SidebarMenu>
            {NAVIGATION_ITEMS.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    className="w-full justify-start"
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </ScrollArea>
      <Separator />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <Link href="/settings" legacyBehavior passHref>
                <SidebarMenuButton className="w-full justify-start" tooltip="Settings">
                  <Settings className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-start" variant="destructive" tooltip="Logout">
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
