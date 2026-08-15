'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import type { CelestialUserInfo } from '@/lib/celestial-user-info'

interface CelestialInfoModalProps {
  open: boolean
  initialInfo?: CelestialUserInfo | null
  onSave: (info: { fullName: string; birthDate: string }) => void
  onDismiss: () => void
}

export default function CelestialInfoModal({ open, initialInfo, onSave, onDismiss }: CelestialInfoModalProps) {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFullName(initialInfo?.fullName ?? '')
      setBirthDate(initialInfo?.birthDate ?? '')
      setError(null)
    }
  }, [open, initialInfo])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = fullName.trim()
    const date = birthDate.trim()
    if (!name || !date) {
      setError('กรุณากรอกชื่อ-นามสกุล และวันเดือนปีเกิดให้ครบถ้วน')
      return
    }
    setError(null)
    onSave({ fullName: name, birthDate: date })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celestial-info-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#0d0d15] dark:border dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="celestial-info-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            ข้อมูลสำหรับการดูดวง
          </h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="ปิด"
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          โมเดลนี้ใช้ข้อมูลของคุณในการให้คำตอบ กรุณากรอกข้อมูลด้านล่าง
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="celestial-full-name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ชื่อ-นามสกุล
            </label>
            <Input
              id="celestial-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ระบุชื่อ-นามสกุล"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="celestial-birth-date"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              วันเดือนปีเกิด
            </label>
            <Input
              id="celestial-birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDismiss}>
              ปิด
            </Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </div>
    </div>
  )
}