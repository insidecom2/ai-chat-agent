import { TAROT_CARDS } from '@/lib/tarot'

export const FORTUNE_TOPICS = ['งาน', 'เงิน', 'บริวาร', 'ความรัก', 'สุขภาพ', 'โชคลาภ'] as const

export type FortuneTopic = (typeof FORTUNE_TOPICS)[number]

export function buildFortuneUserMessage(
  topics: readonly string[],
  extraText: string,
  tarotCards: readonly string[] = []
): string {
  const parts: string[] = []
  if (tarotCards.length > 0) {
    parts.push(
      `โปรดวิเคราะห์ไพ่ทาโรต์จากไพ่ที่เลือก โดยอธิบายความหมายของไพ่แต่ละใบและภาพรวมให้ฉัน:\n${tarotCards
        .map((card, index) => `${index + 1}. ${card}`)
        .join('\n')}`
    )
  }
  if (topics.length > 0) {
    parts.push(`ดูดวงให้ฉันในเรื่อง: ${topics.join(', ')}`)
  }
  const trimmed = extraText.trim()
  if (trimmed) {
    parts.push(`ข้อความเพิ่มเติม: ${trimmed}`)
  }
  if (parts.length === 0) {
    parts.push('ดูดวงทั่วไปให้ฉัน')
  }
  return parts.join('\n')
}

export interface FortuneRequest {
  fullName: string
  birthDate: string
  topics: string[]
  extraText: string
  tarotCards: string[]
}

export type FortuneRequestResult = { ok: true; value: FortuneRequest } | { ok: false; error: string }

const MAX_TOPICS = 10
const MAX_TOPIC_LENGTH = 50
const MAX_NAME_LENGTH = 200
const MAX_EXTRA_TEXT_LENGTH = 2000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TAROT_CARD_COUNT = 10

export function normalizeFortuneRequest(raw: unknown): FortuneRequestResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Invalid request body.' }
  }
  const body = raw as Record<string, unknown>

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  if (!fullName) {
    return { ok: false, error: 'fullName is required.' }
  }
  if (fullName.length > MAX_NAME_LENGTH) {
    return { ok: false, error: 'fullName is too long.' }
  }

  const birthDate = typeof body.birthDate === 'string' ? body.birthDate.trim() : ''
  if (!DATE_PATTERN.test(birthDate)) {
    return { ok: false, error: 'birthDate must be in YYYY-MM-DD format.' }
  }

  let topics: string[] = []
  if (body.topics !== undefined) {
    if (!Array.isArray(body.topics)) {
      return { ok: false, error: 'topics must be an array.' }
    }
    topics = body.topics
      .filter((topic): topic is string => typeof topic === 'string')
      .map((topic) => topic.trim())
      .filter((topic) => topic !== '')
    if (topics.length > MAX_TOPICS) {
      return { ok: false, error: 'Too many topics.' }
    }
    if (topics.some((topic) => topic.length > MAX_TOPIC_LENGTH)) {
      return { ok: false, error: 'A topic is too long.' }
    }
  }

  const extraText = typeof body.extraText === 'string' ? body.extraText.trim() : ''
  if (extraText.length > MAX_EXTRA_TEXT_LENGTH) {
    return { ok: false, error: 'extraText is too long.' }
  }

  let tarotCards: string[] = []
  if (body.tarotCards !== undefined) {
    if (!Array.isArray(body.tarotCards) || body.tarotCards.some((card) => typeof card !== 'string')) {
      return { ok: false, error: 'tarotCards must be an array of card names.' }
    }
    tarotCards = body.tarotCards.map((card) => card.trim())
    if (tarotCards.length !== TAROT_CARD_COUNT) {
      return { ok: false, error: 'Exactly 10 tarot cards are required.' }
    }
    if (new Set(tarotCards).size !== tarotCards.length) {
      return { ok: false, error: 'Tarot cards must not contain duplicates.' }
    }
    if (tarotCards.some((card) => !TAROT_CARDS.includes(card as (typeof TAROT_CARDS)[number]))) {
      return { ok: false, error: 'One or more tarot cards are invalid.' }
    }
  }

  return { ok: true, value: { fullName, birthDate, topics, extraText, tarotCards } }
}
