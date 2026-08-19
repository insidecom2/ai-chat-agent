import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/fortune/route'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/fortune', () => {
  it('requests enough output tokens for a complete fortune reading', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"done":true}\n', {
        headers: { 'content-type': 'application/x-ndjson' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const request = new Request('http://localhost/api/fortune', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'สมชาย ใจดี',
        birthDate: '1990-01-01',
        topics: ['งาน'],
        extraText: '',
      }),
    })

    const response = await POST(request as never)
    const [, init] = fetchMock.mock.calls[0]
    const payload = JSON.parse(init.body)

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      model: 'gemma-celestial:latest',
      stream: true,
      options: { num_predict: 4096 },
    })
  })
})
