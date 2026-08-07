import { createClient, type Client } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ChatRepository } from './repository'
import type {
  Conversation,
  ConversationPatch,
  Message,
  NewConversation,
  NewMessage,
} from './types'

interface ConversationRow {
  id: string
  user_id: string
  model: string
  title: string
  created_at: string
  updated_at: string
}

interface MessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  image: string | null
  image_name: string | null
  document_text: string | null
  created_at: string
}

class TursoRepository implements ChatRepository {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  private mapConversation(row: ConversationRow): Conversation {
    return {
      id: row.id,
      model: row.model,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapMessage(row: MessageRow): Message {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      image: row.image,
      imageName: row.image_name,
      documentText: row.document_text,
      createdAt: row.created_at,
    }
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const result = await this.client.execute({
      sql: 'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      args: [userId],
    })
    return (result.rows as unknown as ConversationRow[]).map((row) => this.mapConversation(row))
  }

  async getConversation(id: string, userId: string): Promise<Conversation | null> {
    const result = await this.client.execute({
      sql: 'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      args: [id, userId],
    })
    const row = result.rows[0] as unknown as ConversationRow | undefined
    return row ? this.mapConversation(row) : null
  }

  async createConversation(userId: string, data: NewConversation): Promise<Conversation> {
    const now = new Date().toISOString()
    await this.client.execute({
      sql: 'INSERT INTO conversations (id, user_id, model, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [data.id, userId, data.model, 'New chat', now, now],
    })
    return {
      id: data.id,
      model: data.model,
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
    }
  }

  async updateConversation(id: string, userId: string, patch: ConversationPatch): Promise<Conversation | null> {
    const sets: string[] = ['updated_at = ?']
    const args: Array<string> = [new Date().toISOString()]
    if (patch.title !== undefined) {
      sets.push('title = ?')
      args.push(patch.title)
    }
    if (patch.model !== undefined) {
      sets.push('model = ?')
      args.push(patch.model)
    }
    args.push(id, userId)

    const result = await this.client.execute({
      sql: `UPDATE conversations SET ${sets.join(', ')} WHERE id = ? AND user_id = ? RETURNING *`,
      args,
    })
    const row = result.rows[0] as unknown as ConversationRow | undefined
    return row ? this.mapConversation(row) : null
  }

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    const result = await this.client.execute({
      sql: 'DELETE FROM conversations WHERE id = ? AND user_id = ?',
      args: [id, userId],
    })
    return Number(result.rowsAffected) > 0
  }

  async listMessages(
    conversationId: string,
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Message[]> {
    const limit = options?.limit ?? 100
    const offset = options?.offset ?? 0
    const result = await this.client.execute({
      sql: `SELECT m.* FROM messages m
        INNER JOIN conversations c ON c.id = m.conversation_id
        WHERE m.conversation_id = ? AND c.user_id = ?
        ORDER BY m.created_at ASC, m.rowid ASC
        LIMIT ? OFFSET ?`,
      args: [conversationId, userId, limit, offset],
    })
    return (result.rows as unknown as MessageRow[]).map((row) => this.mapMessage(row))
  }

  async createMessage(data: NewMessage): Promise<Message> {
    const now = new Date().toISOString()
    await this.client.batch([
      {
        sql: 'INSERT INTO messages (id, conversation_id, role, content, image, image_name, document_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          data.id,
          data.conversationId,
          data.role,
          data.content,
          data.image ?? null,
          data.imageName ?? null,
          data.documentText ?? null,
          now,
        ],
      },
      {
        sql: 'UPDATE conversations SET updated_at = ? WHERE id = ?',
        args: [now, data.conversationId],
      },
    ])
    return {
      id: data.id,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      image: data.image ?? null,
      imageName: data.imageName ?? null,
      documentText: data.documentText ?? null,
      createdAt: now,
    }
  }
}

let repository: Promise<ChatRepository> | null = null

export function getChatRepository(): Promise<ChatRepository> {
  if (!repository) {
    repository = createRepository()
  }
  return repository
}

async function createRepository(): Promise<ChatRepository> {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN || ''
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not configured. Create a Turso database and add it to .env.local.'
    )
  }
  const client = createClient({ url, authToken })
  await runMigrations(client)
  return new TursoRepository(client)
}

async function runMigrations(client: Client): Promise<void> {
  const schema = readFileSync(join(process.cwd(), 'lib/db/schema.sql'), 'utf-8')
  const statements = schema
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
  for (const statement of statements) {
    await client.execute(statement)
  }
  await addUserIdColumn(client)
}

async function addUserIdColumn(client: Client): Promise<void> {
  const result = await client.execute('PRAGMA table_info(conversations)')
  const columns = result.rows.map((row: unknown) => (row as { name: string }).name)
  if (!columns.includes('user_id')) {
    await client.execute(
      "ALTER TABLE conversations ADD COLUMN user_id TEXT NOT NULL DEFAULT ''"
    )
  }
  await client.execute('CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations (user_id, updated_at DESC)')
}
