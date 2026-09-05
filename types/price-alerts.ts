export interface PriceAlertLevel {
  resistance: number | null
  support: number | null
}

export interface PriceAlertGroup {
  date: string
  symbol: string
  levels: PriceAlertLevel[]
  count: number
}

export interface PriceAlertLevelInput {
  resistance?: number
  support?: number
}

export interface PriceAlertPutPayload {
  date?: string
  symbol: string
  levels: PriceAlertLevelInput[]
}
