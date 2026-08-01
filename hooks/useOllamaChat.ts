'use client'
import { useState, useCallback, useRef } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
  imageName?: string
  documentText?: string
}

export interface ChatAttachment {
  image?: string
  name: string
  documentText?: string
}

export function useOllamaChat(model: string) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: `Chatting with **${model}**. Say anything!` },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>(messages)
  messagesRef.current = messages

  const sendMessage = useCallback(async (text: string, attachment?: ChatAttachment) => {
    if ((!text.trim() && !attachment) || isLoading) return

    const messageContent = text.trim() || (attachment?.documentText ? 'Summarize this document.' : 'Describe this image.')
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      image: attachment?.image,
      imageName: attachment?.name,
      documentText: attachment?.documentText,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const history = messagesRef.current.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.image && !m.documentText ? { images: [getBase64Image(m.image)] } : {}),
      ...(m.documentText ? { content: `${m.content}\n\nAttached document:\n${m.documentText}` } : {}),
    }))

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            ...history,
            {
              role: 'user',
              content: messageContent,
              ...(attachment?.image && !attachment.documentText
                ? { images: [getBase64Image(attachment.image)] }
                : {}),
              ...(attachment?.documentText
                ? { content: `${messageContent}\n\nAttached document:\n${attachment.documentText}` }
                : {}),
            },
          ],
          stream: true,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${errText ? ': ' + errText : ''}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullReply = ''

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          const finalChunks = splitJsonObjects(buffer)
          finalChunks.objects.forEach(processChunk)
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const chunks = splitJsonObjects(buffer)
        buffer = chunks.remainder
        chunks.objects.forEach(processChunk)
      }

      function processChunk(line: string) {
        if (!line.trim()) return
        try {
          const chunk = JSON.parse(line)
          if (chunk.done) return
          if (chunk.message?.content) {
            fullReply += chunk.message.content
            setMessages((prev) => {
              const updated = [...prev]
              const idx = updated.findIndex((m) => m.id === assistantId)
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], content: fullReply }
              }
              return updated
            })
          }
        } catch {
          // Ignore malformed lines so one bad chunk does not end the chat.
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${errorMsg}` },
      ])
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [model, isLoading])

  const append = useCallback((msg: Omit<Message, 'id'>) => {
    const id = crypto.randomUUID()
    setMessages((prev) => [...prev, { id, ...msg }])
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([
      { id: 'welcome', role: 'assistant', content: `Chatting with **${model}**. Say anything!` },
    ])
    setInput('')
    setIsLoading(false)
  }, [model])

  return { messages, input, setInput, sendMessage, append, isLoading, stop, reset }
}

function splitJsonObjects(input: string): { objects: string[]; remainder: string } {
  const objects: string[] = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }

    if (character === '"') {
      inString = true
      continue
    }

    if (character === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (character === '}' && depth > 0) {
      depth -= 1
      if (depth === 0 && start !== -1) {
        objects.push(input.slice(start, index + 1))
        start = -1
      }
    }
  }

  return {
    objects,
    remainder: start === -1 ? '' : input.slice(start),
  }
}

function getBase64Image(dataUrl: string): string {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
}
