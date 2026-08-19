'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import FortuneForm, { type FortuneFormValues } from '@/components/FortuneForm'
import FortuneResult from '@/components/FortuneResult'
import { readCelestialUserInfo } from '@/lib/celestial-user-info'
import { splitJsonObjects } from '@/lib/stream-utils'

type Phase = 'form' | 'streaming' | 'done' | 'error'

const EMPTY_VALUES: FortuneFormValues = { fullName: '', birthDate: '', topics: [], extraText: '' }

export default function FortunePage() {
  const existing = readCelestialUserInfo()
  const [values, setValues] = useState<FortuneFormValues>({
    fullName: existing?.fullName ?? '',
    birthDate: existing?.birthDate ?? '',
    topics: [],
    extraText: '',
  })
  const [phase, setPhase] = useState<Phase>('form')
  const [streamText, setStreamText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const handleSubmit = useCallback(async (submitted: FortuneFormValues) => {
    setValues(submitted)
    setStreamText('')
    setErrorMessage(null)
    setPhase('streaming')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: submitted.fullName,
          birthDate: submitted.birthDate,
          topics: submitted.topics,
          extraText: submitted.extraText,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${errText ? `: ${errText}` : ''}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullReply = ''

      const processChunk = (line: string) => {
        if (!line.trim()) return
        try {
          const chunk = JSON.parse(line)
          if (chunk.done) return
          if (chunk.message?.content) {
            fullReply += chunk.message.content
            setStreamText(fullReply)
          }
        } catch {
          // Ignore malformed lines so one bad chunk does not end the reading.
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          splitJsonObjects(buffer).objects.forEach(processChunk)
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const chunks = splitJsonObjects(buffer)
        buffer = chunks.remainder
        chunks.objects.forEach(processChunk)
      }

      if (fullReply) {
        setPhase('done')
      } else {
        setErrorMessage('โมเดลไม่ส่งคำตอบกลับมา')
        setPhase('error')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
      setPhase('error')
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [])

  const handleEdit = () => setPhase('form')
  const handleNew = () => {
    setValues({ ...EMPTY_VALUES })
    setFormKey((key) => key + 1)
    setPhase('form')
  }

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-50 dark:bg-[#0a0a0f]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-[#0d0d15]">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 transition-colors hover:text-green-500" aria-label="กลับไปหน้าแชท">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Sparkles className="h-4 w-4 text-green-500" />
            ดูดวง
          </h1>
        </div>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        {phase === 'form' ? (
          <FortuneForm key={formKey} initialValues={values} onSubmit={handleSubmit} />
        ) : (
          <FortuneResult
            values={values}
            streamText={streamText}
            isLoading={phase === 'streaming'}
            errorMessage={errorMessage}
            onEdit={handleEdit}
            onNew={handleNew}
          />
        )}
      </main>
    </div>
  )
}