"use client"

import Image from 'next/image'
import React, { useState } from 'react'
import { getTarotCardImagePath, type TarotCard } from '@/lib/tarot'

interface TarotCardFaceProps {
  card: TarotCard
  position: number
}

const SUIT_SYMBOLS: Record<string, string> = {
  Wands: '♣',
  Cups: '♥',
  Swords: '♠',
  Pentacles: '♦',
}

export default function TarotCardFace({ card, position }: TarotCardFaceProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const symbol = card.suit ? SUIT_SYMBOLS[card.suit] : '✦'
  const imagePath = getTarotCardImagePath(card)

  if (!imageFailed && imagePath) {
    return (
      <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg border-2 border-amber-700 bg-amber-50 shadow-sm sm:w-52 dark:border-amber-500 dark:bg-zinc-900">
        <Image
          src={imagePath}
          alt={`ไพ่ใบที่ ${position}: ${card.name_th}`}
          fill
          sizes="(max-width: 640px) 160px, 208px"
          className="object-contain"
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      aria-label={`รูปไพ่ใบที่ ${position}: ${card.name_th}`}
      className="flex aspect-[2/3] w-40 shrink-0 flex-col items-center justify-between rounded-lg border-2 border-amber-700 bg-gradient-to-b from-amber-50 via-orange-100 to-amber-200 p-2 text-center text-amber-950 shadow-sm sm:w-52 dark:border-amber-500 dark:from-amber-100 dark:via-orange-200 dark:to-amber-300"
      role="img"
    >
      <span className="text-[10px] font-semibold tracking-wide">{card.number}</span>
      <span className="text-4xl leading-none" aria-hidden="true">{symbol}</span>
      <span className="text-[10px] font-bold leading-tight">{card.name_th}</span>
    </div>
  )
}
