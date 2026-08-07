export type MessageRole = 'user' | 'assistant'

export interface Conversation {
  id: string
  model: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  image: string | null
  imageName: string | null
  documentText: string | null
  createdAt: string
}

export interface NewConversation {
  id: string
  model: string
}

export interface NewMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  image?: string | null
  imageName?: string | null
  documentText?: string | null
}

export type ConversationPatch = Partial<Pick<Conversation, 'title' | 'model'>>
