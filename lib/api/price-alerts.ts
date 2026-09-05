import type { PriceAlertGroup, PriceAlertPutPayload } from '@/types/price-alerts'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function listPriceAlertGroups() {
  return request<{ groups: PriceAlertGroup[] }>('/api/price-alerts')
}

export function getPriceAlertGroup(date: string, symbol: string) {
  return request<PriceAlertGroup>(`/api/price-alerts/${date}/${encodeURIComponent(symbol)}`)
}

export function savePriceAlertGroup(date: string, symbol: string, payload: PriceAlertPutPayload) {
  return request<PriceAlertGroup>(`/api/price-alerts/${date}/${encodeURIComponent(symbol)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePriceAlertGroup(date: string, symbol: string) {
  return request<{ ok: true }>(`/api/price-alerts/${date}/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  })
}

export function getPriceAlertErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
    if (error.status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลแจ้งเตือนราคา'
    if (error.status === 404) return 'ไม่พบรายการแจ้งเตือนราคานี้ อาจถูกลบไปแล้ว'
    if (error.status === 409) return 'มีรายการแจ้งเตือนราคาสำหรับวันที่และสัญลักษณ์นี้อยู่แล้ว'
    return error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}
