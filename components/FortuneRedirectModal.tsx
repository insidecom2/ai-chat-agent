'use client'

import { Button } from '@/components/ui/button'

const JANTRA_ASTRO_URL = 'https://www.jantraastro.com/'

export default function FortuneRedirectModal() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fortune-redirect-title"
      aria-describedby="fortune-redirect-description"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl dark:border dark:border-zinc-800 dark:bg-[#0d0d15]">
        <h2 id="fortune-redirect-title" className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          เว็บไซต์ดูดวงปรับโฉมใหม่
        </h2>
        <p id="fortune-redirect-description" className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          สามารถเข้าใช้งานได้ที่ jantraastro.com หรือคลิกปุ่มด้านล่างนี้
        </p>
        <Button asChild className="mt-6 h-12 w-full text-base">
          <a href={JANTRA_ASTRO_URL}>ไปที่เว็บไซต์ใหม่</a>
        </Button>
      </div>
    </div>
  )
}
