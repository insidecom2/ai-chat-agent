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

export function getPollinationsUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
}
