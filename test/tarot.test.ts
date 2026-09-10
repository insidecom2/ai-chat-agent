import { describe, expect, it } from 'vitest'
import { getTarotCardImagePath, shuffleTarotCards, TAROT_CARDS, TAROT_DECK } from '@/lib/tarot'

describe('tarot deck', () => {
  it('contains exactly 78 unique Thai card names', () => {
    expect(TAROT_DECK.deck_name).toBe('Tarot Deck (Rider-Waite)')
    expect(TAROT_DECK.total_cards).toBe(78)
    expect(TAROT_DECK.cards).toHaveLength(78)
    expect(TAROT_CARDS).toHaveLength(78)
    expect(new Set(TAROT_CARDS).size).toBe(78)
    expect(TAROT_CARDS.every((card) => /[ก-๙]/.test(card))).toBe(true)
    expect(TAROT_DECK.cards.every((card) => card.name && card.name_th && card.description)).toBe(true)
  })

  it('shuffles without adding or removing cards', () => {
    const shuffled = shuffleTarotCards(TAROT_DECK.cards, () => 0.5)
    expect(shuffled).toHaveLength(78)
    expect(new Set(shuffled.map((card) => card.name_th))).toEqual(new Set(TAROT_CARDS))
  })

  it('maps every card to its Rider-Waite image in the public deck', () => {
    const paths = TAROT_DECK.cards.map(getTarotCardImagePath)

    expect(paths).toHaveLength(78)
    expect(paths).not.toContain('')
    expect(new Set(paths)).toHaveLength(78)
    expect(getTarotCardImagePath(TAROT_DECK.cards[0])).toBe('/tarot/00_Fool.jpg')
    expect(getTarotCardImagePath(TAROT_DECK.cards[22])).toBe('/tarot/Wands01.jpg')
    expect(getTarotCardImagePath(TAROT_DECK.cards[77])).toBe('/tarot/Pents14.jpg')
  })
})
