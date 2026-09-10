import tarotDeck from '@/lib/tarot-deck.json'

export const TAROT_DECK = tarotDeck
export const TAROT_CARDS = TAROT_DECK.cards.map((card) => card.name_th)

export type TarotCard = (typeof TAROT_DECK.cards)[number]

const MINOR_CARD_FILE_NUMBERS: Record<string, number> = {
  Ace: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  Page: 11,
  Knight: 12,
  Queen: 13,
  King: 14,
}

const SUIT_FILE_PREFIXES: Record<NonNullable<TarotCard['suit']>, string> = {
  Wands: 'Wands',
  Cups: 'Cups',
  Swords: 'Swords',
  Pentacles: 'Pents',
}

export function getTarotCardImagePath(card: TarotCard): string {
  if (card.arcana === 'Major') {
    const number = String(Number(card.number)).padStart(2, '0')
    const name = card.name.replace(/^The /, '').replaceAll(' ', '_')
    return `/tarot/${number}_${name}.jpg`
  }

  const fileNumber = MINOR_CARD_FILE_NUMBERS[card.number]
  const suitPrefix = card.suit ? SUIT_FILE_PREFIXES[card.suit] : undefined
  if (!fileNumber || !suitPrefix) return ''

  return `/tarot/${suitPrefix}${String(fileNumber).padStart(2, '0')}.jpg`
}

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
