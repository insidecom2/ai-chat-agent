import { describe, it, expect } from 'vitest'
import { splitJsonObjects } from '@/lib/stream-utils'

describe('splitJsonObjects', () => {
  it('splits concatenated JSON objects', () => {
    const input = '{"a":1}{"b":2}'
    expect(splitJsonObjects(input).objects).toEqual(['{"a":1}', '{"b":2}'])
  })

  it('keeps an incomplete tail in the remainder', () => {
    const result = splitJsonObjects('{"a":1}{"b"')
    expect(result.objects).toEqual(['{"a":1}'])
    expect(result.remainder).toBe('{"b"')
  })

  it('handles braces and escaped quotes inside strings', () => {
    const input = '{"message":{"content":"a}b \\" { c"}}'
    expect(splitJsonObjects(input).objects).toEqual(['{"message":{"content":"a}b \\" { c"}}'])
  })

  it('returns empty objects and empty remainder for empty input', () => {
    expect(splitJsonObjects('')).toEqual({ objects: [], remainder: '' })
  })
})