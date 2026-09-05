'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'
import type { PriceAlertGroup } from '@/types/price-alerts'

function formatDateLabel(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return dateStr
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

interface PriceAlertGroupCardProps {
  group: PriceAlertGroup
  onDelete: (group: PriceAlertGroup) => void
  isDeleting: boolean
}

export default function PriceAlertGroupCard({ group, onDelete, isDeleting }: PriceAlertGroupCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <Link
          href={`/price-alerts/${group.date}/${encodeURIComponent(group.symbol)}`}
          className="flex flex-1 flex-col gap-0.5"
        >
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {group.symbol} · {formatDateLabel(group.date)}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{group.count} ระดับ</span>
        </Link>
        <button
          type="button"
          onClick={() => onDelete(group)}
          disabled={isDeleting}
          aria-label={`ลบ ${group.symbol} วันที่ ${group.date}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  )
}
