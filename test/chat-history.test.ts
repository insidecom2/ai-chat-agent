import { describe, expect, it } from 'vitest'
import { shouldIncludeImageInHistory } from '@/lib/chat-history'

describe('shouldIncludeImageInHistory', () => {
  it('omits generated assistant images from the next request', () => {
    expect(shouldIncludeImageInHistory({
      role: 'assistant',
      image: 'data:image/png;base64,large-image',
    })).toBe(false)
  })

  it('does not replay user image attachments by default', () => {
    expect(shouldIncludeImageInHistory({
      role: 'user',
      image: 'data:image/png;base64,image',
    })).toBe(false)
  })

  it('can explicitly allow a user image when a flow needs it', () => {
    expect(shouldIncludeImageInHistory({
      role: 'user',
      image: 'data:image/png;base64,image',
    }, true)).toBe(true)
  })

  it('omits document attachments because their text is already in history', () => {
    expect(shouldIncludeImageInHistory({
      role: 'user',
      image: 'data:image/png;base64,image',
      documentText: 'extracted text',
    }, true)).toBe(false)
  })
})
