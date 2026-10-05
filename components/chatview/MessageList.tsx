'use client'

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Message } from '@/hooks/useOllamaChat';
import { MessageContent } from '@/components/chatview/MessageContent';

interface MessageListProps {
  messages: Message[];
  model: string;
  isConversationLoading: boolean;
  hasMore: boolean;
  isLoadingEarlier: boolean;
  loadEarlier: () => void;
  onGenImage: (prompt: string) => void;
  onGeminiImage: (prompt: string) => void;
  onHuggingFaceImage: (prompt: string) => void;
  onEditMessage: (message: string) => void;
}

export const MessageList = React.memo(function MessageList({
  messages,
  model,
  isConversationLoading,
  hasMore,
  isLoadingEarlier,
  loadEarlier,
  onGenImage,
  onGeminiImage,
  onHuggingFaceImage,
  onEditMessage,
}: MessageListProps) {
  if (isConversationLoading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="text-base">Loading chat history…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={loadEarlier}
            disabled={isLoadingEarlier}
            variant="outline"
            className="h-auto gap-2 px-3 py-1.5 text-zinc-500 dark:text-zinc-400"
          >
            {isLoadingEarlier && <Loader2 className="w-3 h-3 animate-spin" />}
            Load earlier messages
          </Button>
        </div>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`min-w-0 flex flex-col ${
              m.role === 'assistant' ? 'max-w-full' : 'max-w-[85%]'
            } ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <span className="text-[10px] text-zinc-500 mb-1 px-1">
              {m.role === 'user' ? 'You' : model}
            </span>
            <div
              className={`max-w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] px-4 py-2 rounded-2xl text-base leading-relaxed ${
                m.role === 'user'
                  ? 'bg-green-600 text-white rounded-tr-sm dark:bg-green-900 dark:text-green-100'
                  : 'bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-tl-sm dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
              }`}
            >
              <MessageContent
                message={m}
                onGenImage={onGenImage}
                onGeminiImage={onGeminiImage}
                onHuggingFaceImage={onHuggingFaceImage}
                onEditMessage={onEditMessage}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});


