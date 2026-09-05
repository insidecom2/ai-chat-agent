'use client'
import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PriceAlertHeader from '@/components/PriceAlertHeader'
import PriceAlertGroupCard from '@/components/PriceAlertGroupCard'
import { useDeletePriceAlertGroup, usePriceAlertGroups } from '@/hooks/usePriceAlerts'
import { getPriceAlertErrorMessage } from '@/lib/api/price-alerts'
import type { PriceAlertGroup } from '@/types/price-alerts'

export default function PriceAlertsPage() {
  const { data: groups, isLoading, isError, error } = usePriceAlertGroups()
  const deleteMutation = useDeletePriceAlertGroup()

  const handleDelete = (group: PriceAlertGroup) => {
    const confirmed = window.confirm(`ลบข้อมูลแจ้งเตือนราคา ${group.symbol} วันที่ ${group.date} ใช่หรือไม่?`)
    if (!confirmed) return
    deleteMutation.mutate({ date: group.date, symbol: group.symbol })
  }

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-50 dark:bg-[#0a0a0f]">
      <PriceAlertHeader title="แจ้งเตือนราคา" />

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="mb-4 flex justify-end">
          <Button asChild size="sm">
            <Link href="/price-alerts/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มรายการใหม่
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {getPriceAlertErrorMessage(error, 'เกิดข้อผิดพลาดในการโหลดข้อมูล')}
          </p>
        )}

        {!isLoading && !isError && groups && groups.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">ยังไม่มีข้อมูลแจ้งเตือนราคา</p>
        )}

        {!isLoading && !isError && groups && groups.length > 0 && (
          <div className="space-y-3">
            {groups.map((group) => (
              <PriceAlertGroupCard
                key={`${group.date}|${group.symbol}`}
                group={group}
                onDelete={handleDelete}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables?.date === group.date &&
                  deleteMutation.variables?.symbol === group.symbol
                }
              />
            ))}
          </div>
        )}

        {deleteMutation.isError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {getPriceAlertErrorMessage(deleteMutation.error, 'ลบข้อมูลไม่สำเร็จ')}
          </p>
        )}
      </main>
    </div>
  )
}
