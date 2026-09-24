'use client'

import React, { useRef, useState } from 'react';
import { ArrowRight, Loader2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { COMMANDS, type Command } from '@/lib/commands';
import type { ChatAttachment } from '@/hooks/useOllamaChat';

type SelectedAttachment = ChatAttachment & { dataUrl?: string };

interface ChatComposerProps {
  attachedImage: SelectedAttachment | null;
  isLoading: boolean;
  isConversationLoading: boolean;
  isReadingFile: boolean;
  geminiLoading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  onSubmit: (text: string) => boolean | void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  resizeTextarea: (textarea: HTMLTextAreaElement) => void;
}

export function ChatComposer({
  attachedImage,
  isLoading,
  isConversationLoading,
  isReadingFile,
  geminiLoading,
  onFileSelect,
  onRemoveAttachment,
  onSubmit,
  input,
  setInput,
  textareaRef,
  resizeTextarea,
}: ChatComposerProps) {
  const [cmdIdx, setCmdIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clearInput = () => {
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const focusTextarea = () => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const selectCommand = (cmd: Command) => {
    setInput(`${cmd.key} `);
    setCmdIdx(0);
    focusTextarea();
  };

  const submit = () => {
    if (!input.trim() && !attachedImage) return;
    if (onSubmit(input) === false) return;
    clearInput();
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const commandName = input.trim().split(/\s+/)[0];
    const showCommands = input.startsWith('/') &&
      !/\s/.test(input) &&
      COMMANDS.some((cmd) => cmd.key.startsWith(commandName));

    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCmdIdx((prev) => (prev + 1) % COMMANDS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCmdIdx((prev) => (prev - 1 + COMMANDS.length) % COMMANDS.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectCommand(COMMANDS[cmdIdx]);
        return;
      }
      if (e.key === 'Escape') {
        clearInput();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-[#0d0d15] md:static md:pb-4">
      <div className="max-w-5xl mx-auto relative">
        {input.startsWith('/') &&
          !/\s/.test(input) &&
          COMMANDS.some((cmd) => cmd.key.startsWith(input.trim())) && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xl z-50 dark:bg-zinc-900 dark:border-zinc-800">
            {COMMANDS.map((cmd, idx) => (
              <div
                key={cmd.key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCommand(cmd);
                }}
                className={`p-3 text-base cursor-pointer flex justify-between items-center transition-colors ${
                  idx === cmdIdx
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="font-mono font-medium">{cmd.key}</span>
                <span className="text-sm opacity-70">{cmd.desc}</span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="flex gap-2 items-start">
          <div className="flex-1 relative">
            {attachedImage && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-2 dark:border-zinc-800 dark:bg-zinc-900">
                <Paperclip className="h-4 w-4 text-green-500" />
                <span className="flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {isReadingFile ? 'Reading file…' : attachedImage.name}
                </span>
                <Button
                  type="button"
                  onClick={onRemoveAttachment}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Remove attached image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                resizeTextarea(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="min-h-[44px] max-h-32 resize-none rounded-xl border-zinc-200 p-3 text-base focus-visible:ring-green-500/30 dark:border-zinc-800"
            />
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={onFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isConversationLoading || isReadingFile}
            aria-label="Attach image or PDF"
            className="min-h-[44px] text-zinc-500 hover:text-green-500"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isConversationLoading || isReadingFile || geminiLoading || (!input.trim() && !attachedImage)}
            className="min-h-[44px]"
          >
            {isLoading || geminiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </footer>
  );
}
