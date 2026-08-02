export interface GeminiImage {
  mimeType: string
  data: string
}

export function extractGeminiImage(payload: unknown): GeminiImage | null {
  const candidates = (payload as { candidates?: { content?: { parts?: unknown[] } }[] })?.candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return null

  const parts = candidates[0]?.content?.parts
  if (!Array.isArray(parts)) return null

  for (const part of parts) {
    const inline = (part as { inlineData?: { mimeType?: string; data?: string } })?.inlineData
    if (inline?.mimeType && inline?.data) {
      return { mimeType: inline.mimeType, data: inline.data }
    }
  }
  return null
}

export function parseGeminiError(text: string, status: number): string {
  if (status === 403) {
    return 'Invalid Gemini API key or insufficient permissions.'
  }
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } }
    if (parsed.error?.message) {
      return parsed.error.message
    }
  } catch {
    // Ignore malformed error bodies and fall back to the status message.
  }
  return `Gemini API returned HTTP ${status}.`
}
