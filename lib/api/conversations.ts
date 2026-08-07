import type { Conversation, ConversationPatch, Message } from '@/lib/db/types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface ConversationMessageInput {
  role: 'user' | 'assistant'
  content: string
  image?: string | null
  imageName?: string | null
  documentText?: string | null
}

export function listConversations() {
  return request<{ conversations: Conversation[] }>('/api/conversations')
}

export function createConversation(model: string) {
  return request<{ conversation: Conversation }>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ model }),
  })
}

export function getConversation(id: string, options?: { limit?: number; offset?: number }) {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.offset) params.set('offset', String(options.offset))
  const qs = params.toString()
  return request<{
    conversation: Conversation
    messages: Message[]
    hasMore: boolean
    nextOffset: number
  }>(`/api/conversations/${id}${qs ? `?${qs}` : ''}`)
}

export function updateConversation(id: string, patch: ConversationPatch) {
  return request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteConversation(id: string) {
  return request<{ ok: true }>(`/api/conversations/${id}`, {
    method: 'DELETE',
  })
}

export function addMessage(conversationId: string, message: ConversationMessageInput) {
  return request<{ message: Message }>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(message),
    }
  )
}
