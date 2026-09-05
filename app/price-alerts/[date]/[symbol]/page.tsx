'use client'
import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import PriceAlertHeader from '@/components/PriceAlertHeader'
import PriceAlertForm from '@/components/PriceAlertForm'
import { usePriceAlertGroup, useSavePriceAlertGroup } from '@/hooks/usePriceAlerts'
import { getPriceAlertErrorMessage } from '@/lib/api/price-alerts'
import type { PriceAlertPutPayload } from '@/types/price-alerts'

export default function EditPriceAlertPage() {
  const params = useParams<{ date: string; symbol: string }>()
  const router = useRouter()
  const date = params.date
  const symbol = decodeURIComponent(params.symbol)

  const groupQuery = usePriceAlertGroup(date, symbol, Boolean(date && symbol))
  const saveMutation = useSavePriceAlertGroup(date, symbol)

  const handleSubmit = (payload: PriceAlertPutPayload) => {
    saveMutation.mutate(payload, {
      onSuccess: () => router.push('/price-alerts'),
    })
  }

  const submitError = saveMutation.isError
    ? getPriceAlertErrorMessage(saveMutation.error, 'บันทึกข้อมูลไม่สำเร็จ')
    : null

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-50 dark:bg-[#0a0a0f]">
      <PriceAlertHeader title="แก้ไขรายการแจ้งเตือนราคา" />

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        {groupQuery.isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        )}

        {groupQuery.isError && !groupQuery.data && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {getPriceAlertErrorMessage(groupQuery.error, 'เกิดข้อผิดพลาดในการโหลดข้อมูล')}
            </p>
            <Link href="/price-alerts" className="text-sm font-medium text-green-600 hover:underline dark:text-green-400">
              กลับไปหน้ารายการ
            </Link>
          </div>
        )}

        {groupQuery.data && (
          <PriceAlertForm
            key={`${groupQuery.data.date}|${groupQuery.data.symbol}`}
            initialValues={{
              date: groupQuery.data.date,
              symbol: groupQuery.data.symbol,
              levels: groupQuery.data.levels,
            }}
            isSubmitting={saveMutation.isPending}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  )
}
