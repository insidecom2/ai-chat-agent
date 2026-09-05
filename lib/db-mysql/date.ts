export class InvalidDateFormatError extends Error {
  constructor(value: string) {
    super(`Invalid date format: "${value}". Expected YYYY-MM-DD.`)
    this.name = 'InvalidDateFormatError'
  }
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

export function dateStringToDbDate(dateStr: string): Date {
  const match = DATE_PATTERN.exec(dateStr)
  if (!match) {
    throw new InvalidDateFormatError(dateStr)
  }
  const [, yearStr, monthStr, dayStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!isValidCalendarDate(year, month, day)) {
    throw new InvalidDateFormatError(dateStr)
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
}

export function dbDateToDateString(d: Date): string {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
