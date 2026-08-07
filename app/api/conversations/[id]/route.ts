import { NextRequest, NextResponse } from 'next/server'
import { getChatRepository } from '@/lib/db/storage'
import { requireUserId } from '@/lib/db/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'A conversation id is required.' }, { status: 400 })
  }

  const url = new URL(request.url)
  const limitRaw = Number(url.searchParams.get('limit'))
  const offsetRaw = Number(url.searchParams.get('offset'))
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100
  const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0

  try {
    const repository = await getChatRepository()
    const conversation = await repository.getConversation(id, userId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    const messages = await repository.listMessages(id, userId, { limit: limit + 1, offset })
    const hasMore = messages.length > limit
    const page = hasMore ? messages.slice(0, limit) : messages
    return NextResponse.json({ conversation, messages: page, hasMore, nextOffset: offset + page.length })
  } catch (error) {
    console.error('Failed to load conversation:', error)
    return NextResponse.json({ error: 'Failed to load conversation.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'A conversation id is required.' }, { status: 400 })
  }

  let body: { title?: unknown; model?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const patch: { title?: string; model?: string } = {}
  if (typeof body.title === 'string') {
    const title = body.title.trim()
    if (title.length === 0) {
      return NextResponse.json({ error: 'Title must not be empty.' }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or fewer.' }, { status: 400 })
    }
    patch.title = title
  }
  if (typeof body.model === 'string') {
    const model = body.model.trim()
    if (model.length === 0) {
      return NextResponse.json({ error: 'Model must not be empty.' }, { status: 400 })
    }
    if (model.length > 200) {
      return NextResponse.json({ error: 'Model must be 200 characters or fewer.' }, { status: 400 })
    }
    patch.model = model
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  try {
    const conversation = await (await getChatRepository()).updateConversation(id, userId, patch)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Failed to update conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'A conversation id is required.' }, { status: 400 })
  }

  try {
    const deleted = await (await getChatRepository()).deleteConversation(id, userId)
    if (!deleted) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return NextResponse.json({ error: 'Failed to delete conversation.' }, { status: 500 })
  }
}
