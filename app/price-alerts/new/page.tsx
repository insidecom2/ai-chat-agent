'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import PriceAlertHeader from '@/components/PriceAlertHeader'
import PriceAlertForm from '@/components/PriceAlertForm'
import { useSavePriceAlertGroup } from '@/hooks/usePriceAlerts'
import { getPriceAlertErrorMessage } from '@/lib/api/price-alerts'
import type { PriceAlertPutPayload } from '@/types/price-alerts'

const NEW_ENTRY_PLACEHOLDER_DATE = '1970-01-01'
const NEW_ENTRY_PLACEHOLDER_SYMBOL = '__new__'

export default function NewPriceAlertPage() {
  const router = useRouter()
  const saveMutation = useSavePriceAlertGroup(NEW_ENTRY_PLACEHOLDER_DATE, NEW_ENTRY_PLACEHOLDER_SYMBOL)

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
      <PriceAlertHeader title="เพิ่มรายการแจ้งเตือนราคา" />

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <PriceAlertForm
          initialValues={{ date: '', symbol: 'XAUUSD', levels: [] }}
          isSubmitting={saveMutation.isPending}
          submitError={submitError}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  )
}
