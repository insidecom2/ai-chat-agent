'use client'
import React, { useState } from 'react';
import { useConversations, useDeleteConversation } from '@/hooks/useConversations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Plus, Trash2, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Conversation } from '@/lib/db/types';

interface ChatHistorySidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  onDeleted?: (id: string) => void;
}

export default function ChatHistorySidebar({
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleted,
}: ChatHistorySidebarProps) {
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (conversation: Conversation) => {
    if (confirmId !== conversation.id) {
      setConfirmId(conversation.id);
      setTimeout(() => setConfirmId((current) => (current === conversation.id ? null : current)), 3000);
      return;
    }
    deleteMutation.mutate(conversation.id, {
      onSuccess: () => onDeleted?.(conversation.id),
    });
    setConfirmId(null);
  };

  return (
    <aside className="w-64 h-screen shrink-0 flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#0d0d15]">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center text-sm"
          onClick={onNewChat}
        >
          <Plus className="w-3 h-3 mr-1" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-green-500" />
            </div>
          )}

          {!isLoading && (!conversations || conversations.length === 0) && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-8">
              No conversations yet
            </p>
          )}

          {conversations?.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const isConfirming = confirmId === conversation.id;
            return (
              <div
                key={conversation.id}
                className={`group relative rounded-lg border-b border-zinc-200/70 last:border-b-0 dark:border-zinc-800/70 text-base transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white dark:bg-green-900 dark:text-green-100'
                    : 'text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 pr-12 text-left"
                >
                  <span className="w-full truncate">
                    {conversation.title || 'Untitled'}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {conversation.model} · {formatDate(conversation.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={isConfirming ? `Confirm delete ${conversation.title || 'conversation'}` : `Delete ${conversation.title || 'conversation'}`}
                  disabled={deleteMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conversation);
                    }}
                    className={`absolute right-2 top-2 flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 ${
                      isConfirming
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                        : isActive
                          ? 'text-white/70 hover:bg-white/20'
                          : 'text-zinc-400 hover:bg-zinc-200 dark:text-zinc-500 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isConfirming ? (
                      <>
                        <Check className="w-3 h-3" />
                        Delete?
                      </>
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {confirmId && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Delete conversation?
          </span>
          <button
            type="button"
            onClick={() => setConfirmId(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Cancel delete"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
}
