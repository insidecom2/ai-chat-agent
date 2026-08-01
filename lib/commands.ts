export const COMMANDS = [
  {
    key: '/gen-image',
    desc: 'Generate image from last Ollama response',
  },
] as const

export type Command = (typeof COMMANDS)[number]
