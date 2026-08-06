export interface HuggingFaceImage {
  mimeType: string
  data: string
}

export function mimeTypeFromBase64(data: string): string {
  const head = data.slice(0, 8)
  if (head.startsWith('/9j/')) return 'image/jpeg'
  if (head.startsWith('iVBOR')) return 'image/png'
  if (head.startsWith('R0lGOD')) return 'image/gif'
  if (head.startsWith('UklGR')) return 'image/webp'
  return 'image/jpeg'
}

export function parseHFError(text: string, status: number): string {
  try {
    const parsed = JSON.parse(text) as { error?: string }
    if (parsed.error) {
      return parsed.error
    }
  } catch {
    // Ignore malformed error bodies and fall back to the status message.
  }
  if (status === 401) {
    return 'Invalid Hugging Face token (HF_TOKEN).'
  }
  if (status === 403) {
    return 'This Hugging Face model requires access your token does not have.'
  }
  if (status === 404) {
    return 'Hugging Face model not found. Check HF_MODEL.'
  }
  return `Hugging Face API returned HTTP ${status}.`
}
