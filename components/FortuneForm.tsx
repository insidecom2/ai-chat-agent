'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FORTUNE_TOPICS } from '@/lib/fortune'

export interface FortuneFormValues {
  fullName: string
  birthDate: string
  topics: string[]
  extraText: string
}

interface FortuneFormProps {
  initialValues: FortuneFormValues
  onSubmit: (values: FortuneFormValues) => void
}

export default function FortuneForm({ initialValues, onSubmit }: FortuneFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName)
  const [birthDate, setBirthDate] = useState(initialValues.birthDate)
  const [topics, setTopics] = useState<string[]>(initialValues.topics)
  const [extraText, setExtraText] = useState(initialValues.extraText)
  const [error, setError] = useState<string | null>(null)

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = fullName.trim()
    const date = birthDate.trim()
    if (!name || !date) {
      setError('กรุณากรอกชื่อ-นามสกุล และวันเดือนปีเกิดให้ครบถ้วน')
      return
    }
    setError(null)
    onSubmit({ fullName: name, birthDate: date, topics: [...topics], extraText })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="fortune-full-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ชื่อ-นามสกุล
        </label>
        <Input
          id="fortune-full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="ระบุชื่อ-นามสกุล"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fortune-birth-date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          วันเดือนปีเกิด
        </label>
        <Input
          id="fortune-birth-date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ดูดวงเรื่องใดบ้าง
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FORTUNE_TOPICS.map((topic) => (
            <label
              key={topic}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                topics.includes(topic)
                  ? 'border-green-500 bg-green-50 dark:border-green-800 dark:bg-green-900/30'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
              }`}
            >
              <input
                type="checkbox"
                checked={topics.includes(topic)}
                onChange={() => toggleTopic(topic)}
                className="h-4 w-4 accent-green-600"
              />
              <span className="text-zinc-700 dark:text-zinc-300">{topic}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="fortune-extra-text" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ข้อความเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          id="fortune-extra-text"
          value={extraText}
          onChange={(e) => setExtraText(e.target.value)}
          placeholder="ระบุคำถามหรือข้อความเพิ่มเติม…"
          rows={3}
          className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="h-12 w-full text-base">
        ดูดวง
      </Button>
    </form>
  )
}