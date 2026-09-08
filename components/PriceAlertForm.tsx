'use client'
import React, { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'
import type { PriceAlertLevel, PriceAlertPutPayload } from '@/types/price-alerts'

interface LevelRow {
  id: string
  resistance: string
  support: string
}

export interface PriceAlertFormValues {
  date: string
  symbol: string
  levels: PriceAlertLevel[]
}

interface PriceAlertFormProps {
  initialValues: PriceAlertFormValues
  isSubmitting: boolean
  submitError: string | null
  onSubmit: (payload: PriceAlertPutPayload) => void
}

export default function PriceAlertForm({ initialValues, isSubmitting, submitError, onSubmit }: PriceAlertFormProps) {
  const idPrefix = useId()

  const [date, setDate] = useState(initialValues.date)
  const [symbol, setSymbol] = useState(initialValues.symbol)
  const [rows, setRows] = useState<LevelRow[]>(() => {
    let counter = 0
    const makeId = () => {
      counter += 1
      return `${idPrefix}-row-${counter}`
    }
    if (initialValues.levels.length === 0) {
      return [{ id: makeId(), resistance: '', support: '' }]
    }
    return initialValues.levels.map((level) => ({
      id: makeId(),
      resistance: level.resistance === null ? '' : String(level.resistance),
      support: level.support === null ? '' : String(level.support),
    }))
  })
  const [error, setError] = useState<string | null>(null)
  const rowIdCounterRef = useRef(Math.max(1, initialValues.levels.length))
  const nextRowId = () => {
    rowIdCounterRef.current += 1
    return `${idPrefix}-row-${rowIdCounterRef.current}`
  }

  const updateRow = (id: string, field: 'resistance' | 'support', value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const addRow = () => {
    setRows((prev) => [...prev, { id: nextRowId(), resistance: '', support: '' }])
  }

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedDate = date.trim()
    const trimmedSymbol = symbol.trim()

    if (!trimmedDate) {
      setError('กรุณาเลือกวันที่')
      return
    }
    if (!trimmedSymbol) {
      setError('กรุณาระบุสัญลักษณ์')
      return
    }
    if (trimmedSymbol.toLowerCase() === '__new__') {
      setError('ไม่สามารถใช้สัญลักษณ์นี้ได้ กรุณาระบุสัญลักษณ์อื่น')
      return
    }

    const levels = rows
      .map((row) => ({
        resistance: row.resistance.trim() === '' ? undefined : Number(row.resistance),
        support: row.support.trim() === '' ? undefined : Number(row.support),
      }))
      .filter((level) => level.resistance !== undefined || level.support !== undefined)

    if (levels.length === 0) {
      setError('กรุณากรอกค่า resistance หรือ support อย่างน้อยหนึ่งแถว')
      return
    }
    const hasNegative = levels.some(
      (level) => (level.resistance !== undefined && level.resistance < 0) || (level.support !== undefined && level.support < 0)
    )
    if (hasNegative) {
      setError('ค่า resistance และ support ต้องไม่น้อยกว่า 0')
      return
    }

    setError(null)
    onSubmit({
      date: trimmedDate,
      symbol: trimmedSymbol,
      levels,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="price-alert-date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          วันที่
        </label>
        <Input
          id="price-alert-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="price-alert-symbol" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          สัญลักษณ์
        </label>
        <Input
          id="price-alert-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="เช่น XAUUSD"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ระดับ Resistance / Support
        </legend>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex items-end gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="flex-1 space-y-1.5">
              <label htmlFor={`resistance-${row.id}`} className="block text-xs text-zinc-500 dark:text-zinc-400">
                Resistance {index + 1}
              </label>
              <Input
                id={`resistance-${row.id}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={row.resistance}
                onChange={(e) => updateRow(row.id, 'resistance', e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label htmlFor={`support-${row.id}`} className="block text-xs text-zinc-500 dark:text-zinc-400">
                Support {index + 1}
              </label>
              <Input
                id={`support-${row.id}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={row.support}
                onChange={(e) => updateRow(row.id, 'support', e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              aria-label="ลบแถวนี้"
              variant="ghost"
              size="icon"
              className="mb-0.5 shrink-0 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={addRow}
          variant="outline"
          className="min-h-11 gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          เพิ่มระดับ
        </Button>
      </fieldset>

      {(error || submitError) && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error || submitError}
        </p>
      )}

      <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
      </Button>
    </form>
  )
}
