export const COMMANDS = [
  {
    key: '/gen-image',
    desc: 'Generate image from last Ollama response',
  },
  {
    key: '/gemini-image',
    desc: 'Generate image with Gemini',
  },
  {
    key: '/hugging-face',
    desc: 'Generate image with Hugging Face',
  },
] as const

export type Command = (typeof COMMANDS)[number]
