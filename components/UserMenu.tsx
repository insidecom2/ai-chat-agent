'use client'
import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex items-center gap-2">
      {user?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name || 'User'}
          className="w-7 h-7 rounded-full"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="hidden md:flex flex-col leading-tight">
        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
          {user?.name || 'User'}
        </span>
        {user?.email && (
          <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">
            {user.email}
          </span>
        )}
      </div>
      <Button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        variant="ghost"
        size="icon"
        className="h-7 w-7 p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
