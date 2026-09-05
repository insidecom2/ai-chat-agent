import type { RowDataPacket } from 'mysql2'
import { getMysqlPool } from './client'
import { dateStringToDbDate, dbDateToDateString } from './date'

export interface PriceAlertLevel {
  resistance: number | null
  support: number | null
}

export interface PriceAlertGroup {
  date: string
  symbol: string
  levels: PriceAlertLevel[]
}

export interface PriceAlertLevelInput {
  resistance?: number
  support?: number
}

export interface ReplaceGroupParams {
  originalDate: string
  originalSymbol: string
  targetDate: string
  targetSymbol: string
  levels: PriceAlertLevelInput[]
}

interface PriceAlertRow extends RowDataPacket {
  date: Date
  symbol: string
  resistance: string | null
  support: string | null
}

function toLevel(row: PriceAlertRow): PriceAlertLevel {
  return {
    resistance: row.resistance === null ? null : Number(row.resistance),
    support: row.support === null ? null : Number(row.support),
  }
}

function groupRows(rows: PriceAlertRow[]): PriceAlertGroup[] {
  const groups: PriceAlertGroup[] = []
  const indexByKey = new Map<string, number>()

  for (const row of rows) {
    const date = dbDateToDateString(row.date)
    const key = `${date}|${row.symbol}`
    const existingIndex = indexByKey.get(key)
    if (existingIndex === undefined) {
      indexByKey.set(key, groups.length)
      groups.push({ date, symbol: row.symbol, levels: [toLevel(row)] })
    } else {
      groups[existingIndex].levels.push(toLevel(row))
    }
  }

  return groups
}

export async function listGroups(): Promise<PriceAlertGroup[]> {
  const pool = getMysqlPool()
  const [rows] = await pool.query<PriceAlertRow[]>(
    'SELECT date, symbol, resistance, support FROM price_alert ORDER BY date DESC, symbol ASC'
  )
  return groupRows(rows)
}

export async function getGroup(date: string, symbol: string): Promise<PriceAlertGroup | null> {
  const pool = getMysqlPool()
  const dateUtc = dateStringToDbDate(date)
  const [rows] = await pool.query<PriceAlertRow[]>(
    'SELECT date, symbol, resistance, support FROM price_alert WHERE date = ? AND symbol = ?',
    [dateUtc, symbol]
  )
  if (rows.length === 0) {
    return null
  }
  return groupRows(rows)[0]
}

export async function replaceGroup(params: ReplaceGroupParams): Promise<number> {
  const pool = getMysqlPool()
  const originalDateUtc = dateStringToDbDate(params.originalDate)
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    await connection.execute(
      'DELETE FROM price_alert WHERE date = ? AND symbol = ?',
      [originalDateUtc, params.originalSymbol]
    )

    if (params.levels.length > 0) {
      const targetDateUtc = dateStringToDbDate(params.targetDate)
      const values = params.levels.map((level) => [
        targetDateUtc,
        params.targetSymbol,
        level.resistance ?? null,
        level.support ?? null,
      ])
      await connection.query(
        'INSERT INTO price_alert (date, symbol, resistance, support) VALUES ?',
        [values]
      )
    }

    await connection.commit()
    return params.levels.length
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteGroup(date: string, symbol: string): Promise<number> {
  return replaceGroup({
    originalDate: date,
    originalSymbol: symbol,
    targetDate: date,
    targetSymbol: symbol,
    levels: [],
  })
}
