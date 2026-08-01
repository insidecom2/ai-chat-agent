import React from 'react';
import './globals.css';
import Providers from './providers';
import { ToastProvider } from '@/components/ui/toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-zinc-300 bg-[#0a0a0f]">
        <ToastProvider>
          <Providers>
            {children}
          </Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
