import { describe, expect, it } from 'vitest'
import { parseTarotReading } from '@/lib/tarot-reading'

describe('parseTarotReading', () => {
  it('separates each card explanation from the overall reading', () => {
    const result = parseTarotReading(
      '## ไพ่ที่ 1: ไพ่คนโง่\nเริ่มต้นสิ่งใหม่อย่างเปิดใจ\n\n## ไพ่ที่ 2: นักมายากล\nใช้ความสามารถที่มีให้เต็มที่\n\n## ภาพรวม\nเป็นช่วงเวลาที่เหมาะกับการลงมือทำ',
      ['ไพ่คนโง่', 'นักมายากล']
    )

    expect(result.cardReadings).toEqual([
      { cardName: 'ไพ่คนโง่', explanation: 'เริ่มต้นสิ่งใหม่อย่างเปิดใจ' },
      { cardName: 'นักมายากล', explanation: 'ใช้ความสามารถที่มีให้เต็มที่' },
    ])
    expect(result.remainingText).toBe('## ภาพรวม\nเป็นช่วงเวลาที่เหมาะกับการลงมือทำ')
  })

  it('keeps the original response when no card headings are present', () => {
    const result = parseTarotReading('คำทำนายแบบไม่มีหัวข้อ', ['ไพ่คนโง่'])

    expect(result.cardReadings).toEqual([])
    expect(result.remainingText).toBe('คำทำนายแบบไม่มีหัวข้อ')
  })
})
