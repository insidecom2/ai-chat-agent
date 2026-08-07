CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  model      TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT 'New chat',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  image           TEXT,
  image_name      TEXT,
  document_text   TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_updated
  ON conversations (updated_at DESC);
