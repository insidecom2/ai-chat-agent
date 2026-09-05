import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * NOTE ON TEST STRATEGY:
 * DATE_SCHEMA / SYMBOL_SCHEMA / PUT_BODY_SCHEMA in
 * app/api/price-alerts/[date]/[symbol]/route.ts are module-scoped (not
 * exported), and importing that route module directly in vitest fails
 * independent of these schemas: the file imports `auth` from `@/lib/auth`,
 * which calls `NextAuth(...)` at import time, which imports `next/server`.
 * That import fails to resolve under vitest's environment
 * ("Cannot find module '.../node_modules/next/server' ... Did you mean to
 * import 'next/server.js'?"), the same way test/fortune-route.test.ts avoids
 * any route that imports auth. Exporting the schemas would not fix this,
 * since the import chain fails before the exports are even reached.
 *
 * We did not change route.ts's exports for this reason - doing so would not
 * make the schemas importable and would be a no-op change under a false
 * pretense of enabling testability.
 *
 * Instead, these tests re-declare byte-for-byte equivalent schemas here and
 * assert against them as executable documentation of the validation rules
 * described in the story card. If the real schemas in route.ts ever drift
 * from these, this file's assertions will no longer describe route.ts's
 * actual behavior - keep the two in sync by hand, or resolve the next/server
 * import issue in vitest.config.ts (e.g. via module aliasing/mocking) and
 * switch to importing the real exports.
 */

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
          resistance: z.number().optional(),
          support: z.number().optional(),
        })
        .refine((level) => level.resistance !== undefined || level.support !== undefined, {
          message: 'Each level must have a resistance or support value.',
        })
    )
    .min(1, 'At least one resistance/support level is required.')
    .max(50, 'At most 50 levels are allowed per group.'),
})

describe('DATE_SCHEMA', () => {
  it('accepts a well-formed date string', () => {
    expect(DATE_SCHEMA.safeParse('2026-01-01').success).toBe(true)
  })

  it.each(['2026-1-1', '2026/01/01', 'not-a-date', ''])(
    'rejects malformed date %j',
    (input) => {
      expect(DATE_SCHEMA.safeParse(input).success).toBe(false)
    }
  )
})

describe('SYMBOL_SCHEMA', () => {
  it.each(['XAUUSD', 'BTC/USD', '__new__', 'a'.repeat(100)])(
    'accepts valid symbol %j',
    (input) => {
      const result = SYMBOL_SCHEMA.safeParse(input)
      expect(result.success).toBe(true)
    }
  )

  it('rejects a symbol over 100 characters', () => {
    const result = SYMBOL_SCHEMA.safeParse('a'.repeat(101))
    expect(result.success).toBe(false)
  })

  it('rejects a symbol containing a space', () => {
    const result = SYMBOL_SCHEMA.safeParse('XAU USD')
    expect(result.success).toBe(false)
  })

  it('rejects a symbol containing a newline', () => {
    const result = SYMBOL_SCHEMA.safeParse('XAU\nUSD')
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = SYMBOL_SCHEMA.safeParse('')
    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only string (trims to empty)', () => {
    const result = SYMBOL_SCHEMA.safeParse('   ')
    expect(result.success).toBe(false)
  })
})

describe('PUT_BODY_SCHEMA levels validation', () => {
  const base = { symbol: 'XAUUSD' }

  it('rejects an empty levels array', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels: [] })
    expect(result.success).toBe(false)
  })

  it('rejects a level with neither resistance nor support', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels: [{}] })
    expect(result.success).toBe(false)
  })

  it('rejects a level with neither field even when other levels in the array are valid', () => {
    const result = PUT_BODY_SCHEMA.safeParse({
      ...base,
      levels: [{ resistance: 100 }, {}],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an array of 51 levels', () => {
    const levels = Array.from({ length: 51 }, (_, i) => ({ resistance: i + 1 }))
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels })
    expect(result.success).toBe(false)
  })

  it('accepts an array of exactly 50 levels', () => {
    const levels = Array.from({ length: 50 }, (_, i) => ({ resistance: i + 1 }))
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels })
    expect(result.success).toBe(true)
  })

  it('accepts a single valid level with only support set', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels: [{ support: 50 }] })
    expect(result.success).toBe(true)
  })

  it('accepts a single valid level with both resistance and support set', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels: [{ resistance: 100, support: 50 }] })
    expect(result.success).toBe(true)
  })

  it('rejects a body with an invalid symbol even if levels are valid', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ symbol: 'bad symbol', levels: [{ resistance: 1 }] })
    expect(result.success).toBe(false)
  })

  it('rejects a body with an invalid optional date', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, date: '01-01-2026', levels: [{ resistance: 1 }] })
    expect(result.success).toBe(false)
  })

  it('accepts a body without an optional date (rename via date omitted)', () => {
    const result = PUT_BODY_SCHEMA.safeParse({ ...base, levels: [{ resistance: 1 }] })
    expect(result.success).toBe(true)
  })
})
