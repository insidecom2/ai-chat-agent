import React from 'react'
import { Check } from 'lucide-react'

interface TarotCardBackProps {
  selected: boolean
  cardId: string
}

export default function TarotCardBack({ selected, cardId }: TarotCardBackProps) {
  const gradientId = `${cardId}-gradient`
  const patternId = `${cardId}-pattern`

  return (
    <span className="relative block h-full w-full" aria-hidden="true">
      <svg
        viewBox="0 0 120 180"
        className="h-full w-full rounded-xl"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="55%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M6 1 11 6 6 11 1 6Z" fill="none" stroke="#bbf7d0" strokeOpacity="0.3" />
            <circle cx="6" cy="6" r="1.2" fill="#dcfce7" fillOpacity="0.45" />
          </pattern>
        </defs>
        <rect x="1.5" y="1.5" width="117" height="177" rx="12" fill={`url(#${gradientId})`} />
        <rect x="7" y="7" width="106" height="166" rx="8" fill={`url(#${patternId})`} stroke="#dcfce7" strokeOpacity="0.8" strokeWidth="1.5" />
        <rect x="15" y="15" width="90" height="150" rx="5" fill="none" stroke="#dcfce7" strokeOpacity="0.7" strokeWidth="1.5" />
        <path d="m60 38 18 22-18 22-18-22 18-22Z" fill="none" stroke="#f0fdf4" strokeOpacity="0.9" strokeWidth="2" />
        <circle cx="60" cy="60" r="7" fill="none" stroke="#f0fdf4" strokeOpacity="0.85" strokeWidth="1.5" />
        <path d="m60 82 18 22-18 22-18-22 18-22Z" fill="none" stroke="#f0fdf4" strokeOpacity="0.75" strokeWidth="2" />
        <circle cx="60" cy="104" r="7" fill="none" stroke="#f0fdf4" strokeOpacity="0.8" strokeWidth="1.5" />
      </svg>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
    </span>
  )
}
