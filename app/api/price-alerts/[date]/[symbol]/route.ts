import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { isPriceAlertAuthorized } from '@/lib/db-mysql/authorize'
import { InvalidDateFormatError } from '@/lib/db-mysql/date'
import { deleteGroup, getGroup, replaceGroup } from '@/lib/db-mysql/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ date: string; symbol: string }>
}

const DATE_SCHEMA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.')

const SYMBOL_SCHEMA = z
  .string()
  .trim()
  .min(1, 'Symbol is required.')
  .max(100, 'Symbol must be at most 100 characters.')
  .regex(/^[A-Za-z0-9._\-/]+$/, 'Symbol may only contain letters, digits, and . _ - /')

const PUT_BODY_SCHEMA = z.object({
  date: DATE_SCHEMA.optional(),
  symbol: SYMBOL_SCHEMA,
  levels: z
    .array(
      z
        .object({
          resistance: z.number().nonnegative('Resistance must not be less than 0.').optional(),
          support: z.number().nonnegative('Support must not be less than 0.').optional(),
        })
        .refine((level) => level.resistance !== undefined || level.support !== undefined, {
          message: 'Each level must have a resistance or support value.',
        })
    )
    .min(1, 'At least one resistance/support level is required.')
    .max(50, 'At most 50 levels are allowed per group.'),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isPriceAlertAuthorized(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date: rawDate, symbol: rawSymbol } = await context.params
  const dateResult = DATE_SCHEMA.safeParse(rawDate)
  if (!dateResult.success) {
    return NextResponse.json({ error: dateResult.error.issues[0].message }, { status: 400 })
  }
  const symbolResult = SYMBOL_SCHEMA.safeParse(rawSymbol)
  if (!symbolResult.success) {
    return NextResponse.json({ error: symbolResult.error.issues[0].message }, { status: 400 })
  }
  const symbol = symbolResult.data

  try {
    const group = await getGroup(dateResult.data, symbol)
    if (!group) {
      return NextResponse.json({ error: 'Price alert group not found.' }, { status: 404 })
    }
    return NextResponse.json({ ...group, count: group.levels.length })
  } catch (error) {
    console.error('Failed to load price alert group:', error)
    return NextResponse.json({ error: 'Failed to load price alert group.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isPriceAlertAuthorized(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date: rawDate, symbol: rawSymbol } = await context.params
  const dateResult = DATE_SCHEMA.safeParse(rawDate)
  if (!dateResult.success) {
    return NextResponse.json({ error: dateResult.error.issues[0].message }, { status: 400 })
  }
  const originalDate = dateResult.data
  const originalSymbolResult = SYMBOL_SCHEMA.safeParse(rawSymbol)
  if (!originalSymbolResult.success) {
    return NextResponse.json({ error: originalSymbolResult.error.issues[0].message }, { status: 400 })
  }
  const originalSymbol = originalSymbolResult.data

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const bodyResult = PUT_BODY_SCHEMA.safeParse(rawBody)
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error.issues[0].message }, { status: 400 })
  }
  const body = bodyResult.data
  const targetDate = body.date ?? originalDate
  const targetSymbol = body.symbol

  const isRename =
    targetDate !== originalDate || targetSymbol.toLowerCase() !== originalSymbol.toLowerCase()

  try {
    const existing = await getGroup(originalDate, originalSymbol)
    const action = existing ? 'update' : 'create'

    if (isRename) {
      const targetExisting = await getGroup(targetDate, targetSymbol)
      if (targetExisting) {
        return NextResponse.json(
          { error: `A price alert group already exists for ${targetDate} / ${targetSymbol}.` },
          { status: 409 }
        )
      }
    }

    await replaceGroup({
      originalDate,
      originalSymbol,
      targetDate,
      targetSymbol,
      levels: body.levels,
    })
    const group = await getGroup(targetDate, targetSymbol)
    const count = group?.levels.length ?? 0

    console.log(
      `[price-alerts] action=${action} user=${session.user.email ?? session.user.id ?? 'unknown'} date=${targetDate} symbol=${targetSymbol} count=${count}`
    )

    return NextResponse.json({ date: targetDate, symbol: targetSymbol, levels: group?.levels ?? [], count })
  } catch (error) {
    if (error instanceof InvalidDateFormatError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to save price alert group:', error)
    return NextResponse.json({ error: 'Failed to save price alert group.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isPriceAlertAuthorized(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date: rawDate, symbol: rawSymbol } = await context.params
  const dateResult = DATE_SCHEMA.safeParse(rawDate)
  if (!dateResult.success) {
    return NextResponse.json({ error: dateResult.error.issues[0].message }, { status: 400 })
  }
  const date = dateResult.data
  const symbolResult = SYMBOL_SCHEMA.safeParse(rawSymbol)
  if (!symbolResult.success) {
    return NextResponse.json({ error: symbolResult.error.issues[0].message }, { status: 400 })
  }
  const symbol = symbolResult.data

  try {
    await deleteGroup(date, symbol)

    console.log(
      `[price-alerts] action=delete user=${session.user.email ?? session.user.id ?? 'unknown'} date=${date} symbol=${symbol} count=0`
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete price alert group:', error)
    return NextResponse.json({ error: 'Failed to delete price alert group.' }, { status: 500 })
  }
}
