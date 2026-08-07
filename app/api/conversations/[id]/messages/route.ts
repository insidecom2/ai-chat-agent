import { NextRequest, NextResponse } from 'next/server'
import { getChatRepository } from '@/lib/db/storage'
import { requireUserId } from '@/lib/db/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

const ROLE_VALUES = ['user', 'assistant'] as const
const MAX_CONTENT_LENGTH = 200_000

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'A conversation id is required.' }, { status: 400 })
  }

  let body: {
    role?: unknown
    content?: unknown
    image?: unknown
    imageName?: unknown
    documentText?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!ROLE_VALUES.includes(body.role as (typeof ROLE_VALUES)[number])) {
    return NextResponse.json({ error: 'A valid message role is required.' }, { status: 400 })
  }
  if (typeof body.content !== 'string' || body.content.trim() === '') {
    return NextResponse.json({ error: 'Message content is required.' }, { status: 400 })
  }
  if (body.content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Message content must be ${MAX_CONTENT_LENGTH} characters or fewer.` },
      { status: 400 }
    )
  }
  if (typeof body.documentText === 'string' && body.documentText.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Document text must be ${MAX_CONTENT_LENGTH} characters or fewer.` },
      { status: 400 }
    )
  }
  if (typeof body.image === 'string' && body.image.length > 30_000_000) {
    return NextResponse.json(
      { error: 'Image data must be 30 MB or fewer.' },
      { status: 400 }
    )
  }

  try {
    const repository = await getChatRepository()
    const existing = await repository.getConversation(id, userId)
    if (!existing) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const message = await repository.createMessage({
      id: crypto.randomUUID(),
      conversationId: id,
      role: body.role as 'user' | 'assistant',
      content: body.content,
      image: typeof body.image === 'string' ? body.image : null,
      imageName: typeof body.imageName === 'string' ? body.imageName : null,
      documentText: typeof body.documentText === 'string' ? body.documentText : null,
    })
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Failed to save message:', error)
    return NextResponse.json({ error: 'Failed to save message.' }, { status: 500 })
  }
}
