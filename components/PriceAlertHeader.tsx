import React from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface PriceAlertHeaderProps {
  title: string
}

export default function PriceAlertHeader({ title }: PriceAlertHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-[#0d0d15]">
      <h1 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        <Bell className="h-4 w-4 text-green-500" />
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-green-500">
          กลับไปหน้าแชท
        </Link>
      </div>
    </header>
  )
}
