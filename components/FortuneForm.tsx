'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FORTUNE_TOPICS } from '@/lib/fortune'
import { shuffleTarotCards, TAROT_DECK, type TarotCard } from '@/lib/tarot'
import TarotCardBack from '@/components/TarotCardBack'
import { RefreshCw } from 'lucide-react'

export interface FortuneFormValues {
  fullName: string
  birthDate: string
  topics: string[]
  extraText: string
  tarotCards: string[]
}

interface FortuneFormProps {
  initialValues: FortuneFormValues
  tarotDeck: readonly TarotCard[]
  onSubmit: (values: FortuneFormValues) => void
}

export default function FortuneForm({ initialValues, tarotDeck, onSubmit }: FortuneFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName)
  const [birthDate, setBirthDate] = useState(initialValues.birthDate)
  const [topics, setTopics] = useState<string[]>(initialValues.topics)
  const [extraText, setExtraText] = useState(initialValues.extraText)
  const [tarotCards, setTarotCards] = useState<string[]>(initialValues.tarotCards)
  const [tarotEnabled, setTarotEnabled] = useState(initialValues.tarotCards.length > 0)
  const [currentTarotDeck, setCurrentTarotDeck] = useState<readonly TarotCard[]>(tarotDeck)
  const [error, setError] = useState<string | null>(null)

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]))
  }

  const toggleTarotCard = (cardName: string) => {
    setTarotCards((prev) => {
      if (prev.includes(cardName)) return prev.filter((selected) => selected !== cardName)
      if (prev.length >= 10) return prev
      return [...prev, cardName]
    })
  }

  const handleTarotToggle = (enabled: boolean) => {
    setTarotEnabled(enabled)
    setTarotCards([])
    if (enabled) setCurrentTarotDeck(shuffleTarotCards(TAROT_DECK.cards))
  }

  const resetTarotCards = () => {
    setCurrentTarotDeck(shuffleTarotCards(TAROT_DECK.cards))
    setTarotCards([])
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = fullName.trim()
    const date = birthDate.trim()
    if (!name || !date) {
      setError('กรุณากรอกชื่อ-นามสกุล และวันเดือนปีเกิดให้ครบถ้วน')
      return
    }
    if (tarotEnabled && tarotCards.length !== 10) {
      setError('กรุณาเลือกไพ่ทาโรต์ให้ครบ 10 ใบ')
      return
    }
    setError(null)
    onSubmit({
      fullName: name,
      birthDate: date,
      topics: [...topics],
      extraText,
      tarotCards: tarotEnabled ? [...tarotCards] : [],
    })
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

      <div className="rounded-xl border border-zinc-200 bg-white/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <label htmlFor="fortune-tarot-enabled" className="flex cursor-pointer items-center gap-3">
          <input
            id="fortune-tarot-enabled"
            type="checkbox"
            checked={tarotEnabled}
            onChange={(event) => handleTarotToggle(event.target.checked)}
            className="h-5 w-5 accent-green-600"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">ดูไพ่ทาโรต์</span>
        </label>
        <p className="mt-2 pl-8 text-xs text-zinc-500 dark:text-zinc-400">
          เปิดใช้งานเพื่อเลือกไพ่ 10 ใบให้ AI วิเคราะห์เพิ่มเติม
        </p>
      </div>

      {tarotEnabled && (
        <fieldset>
          <div className="mb-2 flex items-center justify-between gap-3">
            <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เลือกไพ่ทาโรต์ ({tarotCards.length}/10)
            </legend>
            <button
              type="button"
              onClick={resetTarotCards}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-600 transition-colors hover:border-green-500 hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-green-500 dark:hover:text-green-400"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              สุ่มไพ่ใหม่
            </button>
          </div>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            เลือกไพ่ให้ครบ 10 ใบ ไพ่จะถูกสับใหม่ทุกครั้งที่เริ่มเปิดการดูไพ่
          </p>
          <div
            className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100/70 px-2 dark:border-zinc-800 dark:bg-zinc-950/40"
            role="group"
            aria-label="สำรับไพ่ทาโรต์"
          >
            <div className="flex flex-wrap items-end px-2 py-8 pr-[72px]">
              {currentTarotDeck.map((card, index) => {
              const selected = tarotCards.includes(card.name_th)
              const unavailable = tarotCards.length >= 10 && !selected
              return (
                <button
                  key={card.name}
                  type="button"
                  aria-label={`ไพ่ใบที่ ${index + 1}${selected ? ' เลือกแล้ว' : ''}`}
                  aria-pressed={selected}
                  disabled={unavailable}
                  onClick={() => toggleTarotCard(card.name_th)}
                  style={{
                    transform: selected ? 'translateY(-20%)' : 'translateY(0)',
                  }}
                  className={`relative mb-6 h-40 w-24 shrink-0 rounded-xl mr-[-72px] transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 ${
                    selected ? 'drop-shadow-[0_8px_8px_rgba(22,101,52,0.35)]' : 'hover:-translate-y-1'
                  } ${unavailable ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
                >
                  <TarotCardBack selected={selected} cardId={`tarot-card-${index}`} />
                </button>
              )
              })}
            </div>
          </div>
        </fieldset>
      )}

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
