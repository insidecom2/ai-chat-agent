import type {
  Conversation,
  ConversationPatch,
  Message,
  NewConversation,
  NewMessage,
} from './types'

export interface ChatRepository {
  listConversations(userId: string): Promise<Conversation[]>
  getConversation(id: string, userId: string): Promise<Conversation | null>
  createConversation(userId: string, data: NewConversation): Promise<Conversation>
  updateConversation(id: string, userId: string, patch: ConversationPatch): Promise<Conversation | null>
  deleteConversation(id: string, userId: string): Promise<boolean>

  listMessages(
    conversationId: string,
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Message[]>
  createMessage(data: NewMessage): Promise<Message>
}
