export interface TarotReadingSection {
  cardName: string
  explanation: string
}

export interface ParsedTarotReading {
  cardReadings: TarotReadingSection[]
  remainingText: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseTarotReading(text: string, tarotCards: readonly string[]): ParsedTarotReading {
  const sections: Array<{ start: number; end: number; reading: TarotReadingSection }> = []

  tarotCards.forEach((cardName, index) => {
    const heading = new RegExp(
      `^##\\s*ไพ่ที่\\s*${index + 1}\\s*:\\s*${escapeRegExp(cardName)}\\s*$`,
      'm'
    )
    const match = heading.exec(text)
    if (!match || match.index === undefined) return

    const contentStart = match.index + match[0].length
    const nextHeading = /^##\s+/m
    nextHeading.lastIndex = contentStart
    const remainder = text.slice(contentStart)
    const nextMatch = nextHeading.exec(remainder)
    const end = nextMatch ? contentStart + nextMatch.index : text.length
    const explanation = text.slice(contentStart, end).trim()

    if (explanation) {
      sections.push({ start: match.index, end, reading: { cardName, explanation } })
    }
  })

  const remainingText = [...sections]
    .sort((left, right) => right.start - left.start)
    .reduce((result, section) => `${result.slice(0, section.start)}${result.slice(section.end)}`, text)
    .trim()

  return {
    cardReadings: tarotCards
      .map((cardName) => sections.find((section) => section.reading.cardName === cardName)?.reading)
      .filter((reading): reading is TarotReadingSection => reading !== undefined),
    remainingText,
  }
}
