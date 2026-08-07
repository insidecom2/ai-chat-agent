import { NextRequest, NextResponse } from 'next/server'
import { getChatRepository } from '@/lib/db/storage'
import { requireUserId } from '@/lib/db/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversations = await (await getChatRepository()).listConversations(userId)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Failed to list conversations:', error)
    return NextResponse.json({ error: 'Failed to list conversations.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { model?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const model = typeof body.model === 'string' ? body.model.trim() : ''
  if (!model) {
    return NextResponse.json({ error: 'A model is required.' }, { status: 400 })
  }

  try {
    const conversation = await (await getChatRepository()).createConversation(userId, {
      id: crypto.randomUUID(),
      model,
    })
    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation.' }, { status: 500 })
  }
}
