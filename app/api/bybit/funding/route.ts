import { NextResponse } from "next/server"

const BYBIT_API_HOSTS = ["https://api.bybit.com", "https://api.bytick.com"]
const REQUEST_TIMEOUT_MS = 8_000

export const maxDuration = 20
export const runtime = "edge"
export const preferredRegion = "sin1"

type BybitPayload = {
  retCode?: number
  retMsg?: string
  [key: string]: unknown
}

function isBybitPayload(value: unknown): value is BybitPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function GET() {
  const failures: string[] = []

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
      failures.push(`${new URL(host).hostname}:${getFailureCode(error)}`)
    }
  }

  return NextResponse.json(
    { error: "Bybit market data is temporarily unavailable.", attempts: failures },
    { status: 502 },
  )
}

function getFailureCode(error: unknown): string {
  if (error instanceof SyntaxError) return "invalid_json"
  if (!(error instanceof Error)) return "unknown_error"

  const httpStatus = error.message.match(/Bybit returned HTTP (\d+)/)?.[1]
  if (httpStatus) return `http_${httpStatus}`

  const apiCode = error.message.match(/retCode=([^ :]+)/)?.[1]
  if (apiCode && apiCode !== "undefined") return `retcode_${apiCode}`

  const cause = error.cause
  if (cause instanceof Error && "code" in cause && typeof cause.code === "string") {
    return `network_${cause.code.toLowerCase()}`
  }

  if (error.name === "TimeoutError" || error.name === "AbortError") return "timeout"
  return error.name.toLowerCase()
}
