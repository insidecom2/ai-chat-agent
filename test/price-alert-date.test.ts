import { describe, it, expect } from 'vitest'
import { dateStringToDbDate, dbDateToDateString, InvalidDateFormatError } from '@/lib/db-mysql/date'

describe('dateStringToDbDate', () => {
  it('stores a calendar date as its literal midnight instant, with no timezone shift', () => {
    const result = dateStringToDbDate('2026-01-01')
    expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('converts a mid-year date correctly', () => {
    const result = dateStringToDbDate('2026-06-15')
    expect(result.toISOString()).toBe('2026-06-15T00:00:00.000Z')
  })

  it.each(['2026-13-40', 'not-a-date', ''])(
    'throws InvalidDateFormatError for %j',
    (input) => {
      expect(() => dateStringToDbDate(input)).toThrow(InvalidDateFormatError)
    }
  )
})

describe('dateStringToDbDate / dbDateToDateString round trip', () => {
  it.each([
    '2026-01-01',
    '2025-12-31',
    '2024-02-29',
    '2026-06-15',
    '2026-12-31',
  ])('round-trips %s with no shift', (dateStr) => {
    const dbDate = dateStringToDbDate(dateStr)
    expect(dbDateToDateString(dbDate)).toBe(dateStr)
  })

  it('round-trips across the year boundary in both directions', () => {
    const newYearsEve = dateStringToDbDate('2025-12-31')
    const newYearsDay = dateStringToDbDate('2026-01-01')
    expect(dbDateToDateString(newYearsEve)).toBe('2025-12-31')
    expect(dbDateToDateString(newYearsDay)).toBe('2026-01-01')
    expect(newYearsDay.getTime() - newYearsEve.getTime()).toBe(24 * 60 * 60 * 1000)
  })

  it('round-trips a leap day', () => {
    const dbDate = dateStringToDbDate('2024-02-29')
    expect(dbDate.toISOString()).toBe('2024-02-29T00:00:00.000Z')
    expect(dbDateToDateString(dbDate)).toBe('2024-02-29')
  })
})

describe('InvalidDateFormatError', () => {
  it('carries the offending value in its message', () => {
    try {
      dateStringToDbDate('nope')
      throw new Error('expected dateStringToDbDate to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDateFormatError)
      expect((error as Error).message).toContain('nope')
      expect((error as Error).name).toBe('InvalidDateFormatError')
    }
  })
})
