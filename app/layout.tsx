import React from 'react';
import './globals.css';
import Providers from './providers';
import ThemeScript from '@/components/ThemeScript';
import { ToastProvider } from '@/components/ui/toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="text-zinc-700 bg-zinc-50 dark:text-zinc-300 dark:bg-[#0a0a0f]">
        <ToastProvider>
          <Providers>
            {children}
          </Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
