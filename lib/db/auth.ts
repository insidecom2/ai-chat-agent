import { auth } from '@/lib/auth'

export async function requireUserId(): Promise<string | null> {
  const session = await auth()
  const userId = session?.user?.id
  return userId || null
}
