import { describe, it, expect } from 'vitest'
import { FORTUNE_TOPICS, buildFortuneUserMessage } from '@/lib/fortune'

describe('buildFortuneUserMessage', () => {
  it('joins selected topics into one line', () => {
    expect(buildFortuneUserMessage(['งาน', 'เงิน'], '')).toBe('ดูดวงให้ฉันในเรื่อง: งาน, เงิน')
  })

  it('appends extra text when provided', () => {
    expect(buildFortuneUserMessage(['งาน'], 'เจออุปสรรค')).toBe(
      'ดูดวงให้ฉันในเรื่อง: งาน\nข้อความเพิ่มเติม: เจออุปสรรค'
    )
  })

  it('uses only extra text when no topic is selected', () => {
    expect(buildFortuneUserMessage([], '  อยากรู้เรื่องสุขภาพ  ')).toBe(
      'ข้อความเพิ่มเติม: อยากรู้เรื่องสุขภาพ'
    )
  })

  it('falls back to a general reading when topics and text are empty', () => {
    expect(buildFortuneUserMessage([], '')).toBe('ดูดวงทั่วไปให้ฉัน')
  })

  it('asks the model to analyze selected Thai tarot card names', () => {
    expect(buildFortuneUserMessage([], '', ['ไพ่คนโง่', 'นักมายากล'])).toBe(
      'โปรดวิเคราะห์ไพ่ทาโรต์จากไพ่ที่เลือก โดยอธิบายความหมายของไพ่แต่ละใบและภาพรวมให้ฉัน:\n1. ไพ่คนโง่\n2. นักมายากล'
    )
  })

  it('exposes the six configured topics', () => {
    expect(FORTUNE_TOPICS).toEqual(['งาน', 'เงิน', 'บริวาร', 'ความรัก', 'สุขภาพ', 'โชคลาภ'])
  })
})
