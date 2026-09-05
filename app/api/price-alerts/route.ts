import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isPriceAlertAuthorized } from '@/lib/db-mysql/authorize'
import { listGroups } from '@/lib/db-mysql/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isPriceAlertAuthorized(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const groups = await listGroups()
    return NextResponse.json({
      groups: groups.map((group) => ({ ...group, count: group.levels.length })),
    })
  } catch (error) {
    console.error('Failed to list price alerts:', error)
    return NextResponse.json({ error: 'Failed to list price alerts.' }, { status: 500 })
  }
}
