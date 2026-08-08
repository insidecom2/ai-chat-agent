export function shouldIncludeImageInHistory(message: {
  role: string
  image?: string
  documentText?: string
}, allowImages = false): boolean {
  return allowImages && message.role === 'user' && Boolean(message.image) && !message.documentText
}
