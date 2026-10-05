import { NextResponse } from "next/server"

const BYBIT_API_HOSTS = ["https://api.bybit.com", "https://api.bytick.com"]
const REQUEST_TIMEOUT_MS = 8_000

export const preferredRegion = "sin1"
export const maxDuration = 20

type BybitPayload = {
  retCode?: number
  retMsg?: string
  [key: string]: unknown
}

function isBybitPayload(value: unknown): value is BybitPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function GET() {
  for (const host of BYBIT_API_HOSTS) {
    try {
      const response = await fetch(
        `${host}/v5/market/tickers?category=linear`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      )

      if (!response.ok) {
        throw new Error(`Bybit returned HTTP ${response.status}`)
      }

      const payload: unknown = await response.json()
      if (!isBybitPayload(payload) || payload.retCode !== 0) {
        const retCode = isBybitPayload(payload) ? payload.retCode : undefined
        const retMsg = isBybitPayload(payload) ? payload.retMsg : undefined
        throw new Error(
          `Bybit returned retCode=${String(retCode)}${typeof retMsg === "string" ? `: ${retMsg}` : ""}`,
        )
      }

      return NextResponse.json(payload)
    } catch (error) {
      console.error(`Bybit funding request failed via ${host}`, error)
    }
  }

  return NextResponse.json(
    { error: "Bybit market data is temporarily unavailable." },
    { status: 502 },
  )
}
