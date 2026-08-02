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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('chat-agent-theme');var t=s==='light'?'light':(s==='dark'?'dark':(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t}catch(e){}})();`,
          }}
        />
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
