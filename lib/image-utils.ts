export function formatImagePrompt(
  prompt: string,
  _history: { role: string; content: string }[]
): string {
  let cleaned = prompt

  const imagineIdx = prompt.indexOf('/imagine')
  if (imagineIdx !== -1) {
    cleaned = prompt.slice(imagineIdx + '/imagine'.length).trim()
  } else {
    const q1 = prompt.indexOf('"')
    if (q1 !== -1) {
      const q2 = prompt.indexOf('"', q1 + 1)
      if (q2 !== -1) cleaned = prompt.slice(q1 + 1, q2)
    }
  }

  return cleaned || 'A beautiful landscape'
}

export interface PollinationsOptions {
  model?: string
  enhance?: boolean
  negativePrompt?: string
  width?: number
  height?: number
}

export function getPollinationsUrl(prompt: string, options?: PollinationsOptions): string {
  const params = new URLSearchParams()
  params.set('model', options?.model ?? 'flux')
  if (options?.enhance !== false) params.set('enhance', 'true')
  if (options?.negativePrompt) params.set('negative_prompt', options.negativePrompt)
  params.set('width', String(options?.width ?? 512))
  params.set('height', String(options?.height ?? 512))
  const query = params.toString()
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}${query ? `?${query}` : ''}`
}

export function extractImagePrompt(content: string): string | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const direct = findImagePrompt(tryParseJson(trimmed))
  if (direct) return direct

  const block = extractJsonBlock(trimmed)
  if (block) {
    const fromBlock = findImagePrompt(tryParseJson(block))
    if (fromBlock) return fromBlock
  }

  return null
}

function tryParseJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function findImagePrompt(value: unknown): string | null {
  if (typeof value === 'string') {
    const parsed = tryParseJson(value)
    if (parsed !== undefined) return findImagePrompt(parsed)
    return value.trim() || null
  }
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  for (const key of ['action_input', 'actionInput', 'input', 'prompt', 'prompt_text']) {
    const field = record[key]
    if (field === undefined) continue
    const nested = findImagePrompt(field)
    if (nested) return nested
  }
  return null
}

function extractJsonBlock(text: string): string | undefined {
  const start = text.indexOf('{')
  if (start === -1) return undefined

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const character = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }
    if (character === '"') {
      inString = true
    } else if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return undefined
}
