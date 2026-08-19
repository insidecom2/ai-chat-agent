import tarotDeck from '@/lib/tarot-deck.json'

export const TAROT_DECK = tarotDeck
export const TAROT_CARDS = TAROT_DECK.cards.map((card) => card.name_th)

export type TarotCard = (typeof TAROT_DECK.cards)[number]

export function shuffleTarotCards(
  cards: readonly TarotCard[] = TAROT_DECK.cards,
  random: () => number = Math.random
): TarotCard[] {
  const shuffled = [...cards]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]]
  }
  return shuffled
}
