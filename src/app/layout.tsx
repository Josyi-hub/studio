
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a clean, legible UI
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/providers'; // Genkit provider
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Changed from geist to inter for better legibility with numbers often found in budget apps
});

export const metadata: Metadata = {
  title: 'SpendWise - Smart Budgeting',
  description: 'Track expenses, set budgets, and gain financial insights with SpendWise.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
