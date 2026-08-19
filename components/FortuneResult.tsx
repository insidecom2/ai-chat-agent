'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { replaceLatexSymbols } from '@/lib/latex-symbols'
import { safeUrl } from '@/lib/utils'
import type { FortuneFormValues } from '@/components/FortuneForm'

interface FortuneResultProps {
  values: FortuneFormValues
  streamText: string
  isLoading: boolean
  errorMessage: string | null
  onEdit: () => void
  onNew: () => void
}

export default function FortuneResult({
  values,
  streamText,
  isLoading,
  errorMessage,
  onEdit,
  onNew,
}: FortuneResultProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ข้อมูลที่ใช้ดูดวง</h2>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">ชื่อ-นามสกุล</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">{values.fullName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">วันเดือนปีเกิด</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">{values.birthDate}</dd>
            </div>
            {values.topics.length > 0 && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">ดูดวงเรื่อง</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{values.topics.join(', ')}</dd>
              </div>
            )}
            {values.extraText.trim() !== '' && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">ข้อความเพิ่มเติม</dt>
                <dd className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{values.extraText}</dd>
              </div>
            )}
            {values.tarotCards.length > 0 && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">ไพ่ทาโรต์</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{values.tarotCards.join(', ')}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          {isLoading && (
            <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
              กำลังดูดวง…
            </div>
          )}
          {errorMessage && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
              เกิดข้อผิดพลาด: {errorMessage}
            </p>
          )}
          <div className="min-h-[120px] text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
            {streamText ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a({ href, children }) {
                      const safeHref = safeUrl(href)
                      if (!safeHref) {
                        return <span className="text-zinc-500 dark:text-zinc-500">{children}</span>
                      }
                      return (
                        <a
                          href={safeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-words underline hover:text-green-600 dark:hover:text-green-400"
                        >
                          {children}
                        </a>
                      )
                    },
                  }}
                >
                  {replaceLatexSymbols(streamText)}
                </ReactMarkdown>
                {isLoading && (
                  <span
                    className="ml-1 inline-block h-4 w-2 animate-pulse bg-green-500"
                    aria-hidden="true"
                  />
                )}
              </>
            ) : isLoading ? (
              <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                กำลังรอคำตอบ…
              </span>
            ) : !errorMessage ? (
              <p className="text-zinc-500 dark:text-zinc-400">ไม่ได้รับคำตอบ กรุณาลองใหม่อีกครั้ง</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!isLoading && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onEdit}>
            แก้ไขข้อมูล
          </Button>
          <Button type="button" variant="ghost" onClick={onNew}>
            ใหม่
          </Button>
        </div>
      )}
    </div>
  )
}
