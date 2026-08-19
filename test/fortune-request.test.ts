import { describe, it, expect } from 'vitest'
import { normalizeFortuneRequest } from '@/lib/fortune'
import { TAROT_CARDS } from '@/lib/tarot'

describe('normalizeFortuneRequest', () => {
  it('accepts a valid request and trims values', () => {
    const result = normalizeFortuneRequest({
      fullName: '  สมชาย ใจดี ',
      birthDate: '1990-01-01',
      topics: ['งาน', 'เงิน'],
      extraText: '  เจออุปสรรค ',
    })
    expect(result).toEqual({
      ok: true,
      value: {
        fullName: 'สมชาย ใจดี',
        birthDate: '1990-01-01',
        topics: ['งาน', 'เงิน'],
        extraText: 'เจออุปสรรค',
        tarotCards: [],
      },
    })
  })

  it('rejects a non-object body', () => {
    expect(normalizeFortuneRequest(null).ok).toBe(false)
    expect(normalizeFortuneRequest('x').ok).toBe(false)
  })

  it('rejects a missing or empty fullName', () => {
    expect(normalizeFortuneRequest({ fullName: '', birthDate: '1990-01-01' }).ok).toBe(false)
    expect(normalizeFortuneRequest({ birthDate: '1990-01-01' }).ok).toBe(false)
  })

  it('rejects an invalid birthDate format', () => {
    const base = { fullName: 'สมชาย ใจดี' }
    expect(normalizeFortuneRequest({ ...base, birthDate: '01/01/1990' }).ok).toBe(false)
    expect(normalizeFortuneRequest({ ...base, birthDate: '' }).ok).toBe(false)
  })

  it('rejects topics that are not an array or exceed the limit', () => {
    const base = { fullName: 'สมชาย ใจดี', birthDate: '1990-01-01' }
    expect(normalizeFortuneRequest({ ...base, topics: 'งาน' }).ok).toBe(false)
    const many = Array.from({ length: 11 }, (_, i) => `หัวข้อ${i}`)
    expect(normalizeFortuneRequest({ ...base, topics: many }).ok).toBe(false)
  })

  it('treats missing topics and extraText as empty', () => {
    const result = normalizeFortuneRequest({ fullName: 'สมชาย ใจดี', birthDate: '1990-01-01' })
    expect(result).toEqual({
      ok: true,
      value: { fullName: 'สมชาย ใจดี', birthDate: '1990-01-01', topics: [], extraText: '', tarotCards: [] },
    })
  })

  it('accepts exactly ten unique Thai tarot card names', () => {
    const result = normalizeFortuneRequest({
      fullName: 'สมชาย ใจดี',
      birthDate: '1990-01-01',
      tarotCards: TAROT_CARDS.slice(0, 10),
    })
    expect(result).toEqual({
      ok: true,
      value: {
        fullName: 'สมชาย ใจดี',
        birthDate: '1990-01-01',
        topics: [],
        extraText: '',
        tarotCards: [...TAROT_CARDS.slice(0, 10)],
      },
    })
  })

  it('rejects tarot cards when the count, uniqueness, or names are invalid', () => {
    const base = { fullName: 'สมชาย ใจดี', birthDate: '1990-01-01' }
    expect(normalizeFortuneRequest({ ...base, tarotCards: TAROT_CARDS.slice(0, 9) }).ok).toBe(false)
    expect(normalizeFortuneRequest({ ...base, tarotCards: [...TAROT_CARDS.slice(0, 9), TAROT_CARDS[0]] }).ok).toBe(false)
    expect(normalizeFortuneRequest({ ...base, tarotCards: [...TAROT_CARDS.slice(0, 9), 'ไพ่ปลอม'] }).ok).toBe(false)
  })
})
