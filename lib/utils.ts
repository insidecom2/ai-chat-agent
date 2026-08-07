export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

export function formatDate(ts?: string): string {
  return ts ? new Date(ts).toLocaleString() : '—'
}

const ALLOWED_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', '#', '/', 'data:image/'] as const

export function safeUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  for (const protocol of ALLOWED_URL_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) return trimmed
  }
  return undefined
}
