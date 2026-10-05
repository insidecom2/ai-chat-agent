import { NextResponse } from "next/server"

export async function GET() {
  try {
    const url = 'https://api.bybit.com/v5/market/tickers?category=linear'
    const response = await fetch(`${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const payload = await response.json();
     return NextResponse.json(payload)
  } catch (error) {
    console.error('Failed to get bybit:', error)
    return NextResponse.json({ error: 'Failed to get bybit.' }, { status: 500 })
  }
}
