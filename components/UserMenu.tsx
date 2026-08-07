'use client'
import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';

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
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="rounded-md p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
