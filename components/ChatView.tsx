'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatAttachment, Message, useOllamaChat } from '@/hooks/useOllamaChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, ArrowRight, Loader2, Check, Copy, Paperclip, X, Image as ImageIcon, Sparkles, Bot, Menu, Pencil } from 'lucide-react';
import { COMMANDS, Command } from '@/lib/commands';
import { formatImagePrompt, getLatestImagePrompt, getPollinationsUrl, extractImagePrompt, limitImagePrompt } from '@/lib/image-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/components/ui/toast';
import { useCopyHistory } from '@/store/copyHistory';
import { extractImageText, extractPdfText } from '@/lib/document-utils';
import ThemeToggle from '@/components/ThemeToggle';
import CodeBlock from '@/components/CodeBlock';
import { replaceLatexSymbols } from '@/lib/latex-symbols';
import { safeUrl } from '@/lib/utils';
import { useModels } from '@/hooks/useModels';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import UserMenu from '@/components/UserMenu';
import CelestialInfoModal from '@/components/CelestialInfoModal';
import {
  isCelestialModel,
  readCelestialUserInfo,
  saveCelestialUserInfo,
  hasDismissedCelestialPrompt,
  dismissCelestialPrompt,
} from '@/lib/celestial-user-info';
import type { Conversation } from '@/lib/db/types';

type SelectedAttachment = ChatAttachment & { dataUrl?: string };

interface ChatViewProps {
  model: string;
  conversationId?: string | null;
  onConversationChange: (id: string | null) => void;
  onBack: () => void;
  onModelChange: (model: string) => void;
  onNewChat: () => void;
  onOpenConversation: (conversation: Conversation) => void;
  onConversationDeleted?: (id: string) => void;
}

export default function ChatView({ model, conversationId, onConversationChange, onBack, onModelChange, onNewChat, onOpenConversation, onConversationDeleted }: ChatViewProps) {
  const { data: models, isLoading: isModelsLoading } = useModels();
  const {
    messages,
    sendMessage,
    append,
    updateMessage,
    persistMessage,
    isLoading,
    isConversationLoading,
    hasMore,
    isLoadingEarlier,
    loadEarlier,
    reset,
  } = useOllamaChat(model, conversationId, onConversationChange);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [attachedImage, setAttachedImage] = useState<SelectedAttachment | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [showCelestialModal, setShowCelestialModal] = useState(false);
  const [editCelestialModal, setEditCelestialModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    if (!isModelsLoading && !isConversationLoading) {
      setShowInitialLoading(false);
    }
  }, [isConversationLoading, isModelsLoading]);

  useEffect(() => {
    const shouldAsk = isCelestialModel(model) && !readCelestialUserInfo() && !hasDismissedCelestialPrompt();
    setShowCelestialModal(shouldAsk);
  }, [model]);

  useEffect(() => {
    if (!scrollRef.current || !shouldStickToBottomRef.current) return;

    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      scrollFrameRef.current = null;
    });

    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [messages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const viewport = e.currentTarget;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const shouldStick = distanceFromBottom < 96;
    shouldStickToBottomRef.current = shouldStick;

    if (!shouldStick && scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const handleBack = () => {
    onBack();
  };

  const handleNewChat = () => {
    reset();
    setAttachedImage(null);
    onNewChat();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      toast('Please select an image or PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast('Image must be smaller than 10 MB.');
      return;
    }

    setIsReadingFile(true);
    try {
      if (isPdf) {
        const documentText = await extractPdfText(file);
        if (!documentText) {
          toast('Could not extract text from this PDF.');
          return;
        }
        setAttachedImage({ name: file.name, documentText });
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Could not read image'));
          reader.onerror = () => reject(reader.error || new Error('Could not read image'));
          reader.readAsDataURL(file);
        });
        setAttachedImage({ dataUrl, name: file.name });
        let documentText = '';
        try {
          documentText = await extractImageText(file);
        } catch (error) {
          console.error('OCR failed:', error);
          toast('OCR unavailable, but the image was attached.');
        }
        setAttachedImage({ dataUrl, name: file.name, documentText });
      }
    } catch (error) {
      console.error('File reading failed:', error);
      const reason = error instanceof Error ? ` ${error.message}` : '';
      toast(`Could not read this file.${reason}`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const getAttachment = () => attachedImage ? {
    image: attachedImage.dataUrl,
    name: attachedImage.name,
    documentText: attachedImage.documentText,
  } : undefined;

  const executeCommand = (text: string, cmd: Command) => {
    if (geminiLoading || isLoading || isConversationLoading) return;

    const explicitPrompt = text.slice(cmd.key.length).trim();
    const sourcePrompt = explicitPrompt || getLatestImagePrompt(messages);
    append({ role: 'user', content: text });
    void persistMessage({ role: 'user', content: text }).catch((error) => console.error('Failed to save command:', error));

    if (!sourcePrompt) {
      const noPromptMessage = 'ไม่พบ prompt';
      append({ role: 'assistant', content: noPromptMessage });
      void persistMessage({ role: 'assistant', content: noPromptMessage }).catch((error) => console.error('Failed to save command response:', error));
      return;
    }

    const finalPrompt = formatImagePrompt(sourcePrompt, []);

    if (cmd.key === '/gen-image') {
      append({ role: 'assistant', content: finalPrompt });
      void persistMessage({ role: 'assistant', content: finalPrompt }).catch((error) => console.error('Failed to save command:', error));
      const imgUrl = getPollinationsUrl(finalPrompt);
      const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
      setTimeout(() => {
        const content = `![Image](${imgUrl})`;
        updateMessage(imgId, { content, loadingText: undefined });
        void persistMessage({ role: 'assistant', content }).catch((error) => console.error('Failed to save generated image:', error));
      }, 500);
    } else if (cmd.key === '/gemini-image') {
      const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
      generateImage('/api/gemini', finalPrompt, imgId);
    } else if (cmd.key === '/hugging-face') {
      const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
      generateImage('/api/huggingface', finalPrompt, imgId);
    }
  };

  const handleComposerSubmit = (text: string) => {
    const commandName = text.trim().split(/\s+/)[0];
    const command = COMMANDS.find((cmd) => cmd.key === commandName);
    if (command) {
      if (geminiLoading || isLoading || isConversationLoading) return false;
      executeCommand(text, command);
      return true;
    }

    sendMessage(text, getAttachment());
    setAttachedImage(null);
    return true;
  };

  const generateImage = useCallback(async (apiPath: string, prompt: string, messageId: string) => {
    setGeminiLoading(true);
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const { mimeType, data: imageData } = data as { mimeType: string; data: string };
      const image = `data:${mimeType};base64,${imageData}`;
      updateMessage(messageId, { content: 'Generated image', image, loadingText: undefined });
      await persistMessage({ role: 'assistant', content: 'Generated image', image });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      updateMessage(messageId, { content: `Error: ${reason}`, loadingText: undefined });
    } finally {
      setGeminiLoading(false);
    }
  }, [persistMessage, updateMessage]);

  const handleGenImage = useCallback((prompt: string) => {
    if (!prompt.trim()) {
      toast('No image prompt found in this response.');
      return;
    }
    const imgUrl = getPollinationsUrl(limitImagePrompt(prompt));
    const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
    setTimeout(() => {
      const content = `![Image](${imgUrl})`;
      updateMessage(imgId, { content, loadingText: undefined });
      void persistMessage({ role: 'assistant', content }).catch((error) => console.error('Failed to save generated image:', error));
    }, 500);
  }, [append, persistMessage, toast, updateMessage]);

  const handleGeminiImage = useCallback((prompt: string) => {
    if (geminiLoading) return;
    if (!prompt.trim()) {
      toast('No image prompt found in this response.');
      return;
    }
    const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
    generateImage('/api/gemini', limitImagePrompt(prompt), imgId);
  }, [append, generateImage, geminiLoading, toast]);

  const handleHuggingFaceImage = useCallback((prompt: string) => {
    if (geminiLoading) return;
    if (!prompt.trim()) {
      toast('No image prompt found in this response.');
      return;
    }
    const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
    generateImage('/api/huggingface', limitImagePrompt(prompt), imgId);
  }, [append, generateImage, geminiLoading, toast]);

  if (showInitialLoading) {
    return (
      <div className="flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center bg-white dark:bg-[#0d0d15] md:h-screen md:min-h-0">
        <div className="flex flex-col items-center gap-3 text-zinc-500 dark:text-zinc-400" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <span className="text-base">Loading chat…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full max-w-6xl mx-auto overflow-hidden bg-white dark:bg-[#0d0d15] md:h-screen md:min-h-0">
      {/* Desktop sidebar: always visible */}
      <div className="hidden md:flex">
        <ChatHistorySidebar
          activeConversationId={conversationId || null}
          onSelectConversation={onOpenConversation}
          onNewChat={handleNewChat}
          onDeleted={onConversationDeleted}
        />
      </div>

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ChatHistorySidebar
          activeConversationId={conversationId || null}
          onSelectConversation={(conv) => {
            setSidebarOpen(false);
            onOpenConversation(conv);
          }}
          onNewChat={() => {
            setSidebarOpen(false);
            handleNewChat();
          }}
          onDeleted={onConversationDeleted}
        />
      </div>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-0 flex-1 min-w-0 flex-col">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-[#0d0d15] md:static">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((open) => !open)}
            className="text-zinc-500 hover:text-green-500 shrink-0 md:hidden"
            aria-label="Toggle conversation list"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-zinc-500 hover:text-green-500 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-transparent text-base font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-green-500 border border-transparent rounded px-1 py-0.5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700"
                aria-label="Select model"
              >
                {models?.map((m: any) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-zinc-500">Ollama Model</span>
          </div>
          {isCelestialModel(model) && readCelestialUserInfo() && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditCelestialModal(true)}
              className="text-zinc-500 hover:text-green-500 shrink-0"
              aria-label="แก้ไขข้อมูลดูดวง"
              title="แก้ไขข้อมูลดูดวง"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>

      <ScrollArea
        className="min-h-0 flex-1 p-4 pt-[76px] pb-[116px] md:p-4"
        viewportRef={scrollRef}
        onScroll={handleScroll}
      >
        <MessageList
          messages={messages}
          model={model}
          isConversationLoading={isConversationLoading}
          hasMore={hasMore}
          isLoadingEarlier={isLoadingEarlier}
          loadEarlier={loadEarlier}
          onGenImage={handleGenImage}
          onGeminiImage={handleGeminiImage}
          onHuggingFaceImage={handleHuggingFaceImage}
        />
      </ScrollArea>

      <ChatComposer
        key={`${model}:${conversationId || 'new'}`}
        attachedImage={attachedImage}
        isLoading={isLoading}
        isConversationLoading={isConversationLoading}
        isReadingFile={isReadingFile}
        geminiLoading={geminiLoading}
        onFileSelect={handleImageSelect}
        onRemoveAttachment={() => setAttachedImage(null)}
        onSubmit={handleComposerSubmit}
      />
      <CelestialInfoModal
        open={showCelestialModal || editCelestialModal}
        initialInfo={readCelestialUserInfo()}
        onSave={({ fullName, birthDate }) => {
          saveCelestialUserInfo(fullName, birthDate);
          setShowCelestialModal(false);
          setEditCelestialModal(false);
        }}
        onDismiss={() => {
          dismissCelestialPrompt();
          setShowCelestialModal(false);
          setEditCelestialModal(false);
        }}
      />
      </div>
    </div>
  );
}

interface ChatComposerProps {
  attachedImage: SelectedAttachment | null;
  isLoading: boolean;
  isConversationLoading: boolean;
  isReadingFile: boolean;
  geminiLoading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  onSubmit: (text: string) => boolean | void;
}

function ChatComposer({
  attachedImage,
  isLoading,
  isConversationLoading,
  isReadingFile,
  geminiLoading,
  onFileSelect,
  onRemoveAttachment,
  onSubmit,
}: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [cmdIdx, setCmdIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const clearInput = () => {
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const selectCommand = (cmd: Command) => {
    setInput(`${cmd.key} `);
    setCmdIdx(0);
    requestAnimationFrame(() => textareaRef.current?.focus());
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
                <button
                  type="button"
                  onClick={onRemoveAttachment}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Remove attached image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="w-full resize-none p-3 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-base focus:outline-none focus:border-green-500 transition-colors min-h-[44px] max-h-32 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            />
          </div>
          <input
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
}

const MessageList = React.memo(function MessageList({
  messages,
  model,
  isConversationLoading,
  hasMore,
  isLoadingEarlier,
  loadEarlier,
  onGenImage,
  onGeminiImage,
  onHuggingFaceImage,
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
          <button
            type="button"
            onClick={loadEarlier}
            disabled={isLoadingEarlier}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 border border-zinc-200 hover:text-green-600 hover:border-green-500 transition-colors disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-green-400"
          >
            {isLoadingEarlier && <Loader2 className="w-3 h-3 animate-spin" />}
            Load earlier messages
          </button>
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
              <MemoizedMessageContent
                message={m}
                onGenImage={onGenImage}
                onGeminiImage={onGeminiImage}
                onHuggingFaceImage={onHuggingFaceImage}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

function MessageContent({ message, onGenImage, onGeminiImage, onHuggingFaceImage }: {
  message: { id: string; role: string; content: string; image?: string; imageName?: string; loadingText?: string }
  onGenImage?: (prompt: string) => void
  onGeminiImage?: (prompt: string) => void
  onHuggingFaceImage?: (prompt: string) => void
}) {
  const { toast } = useToast()
  const addToHistory = useCopyHistory((s) => s.add)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = useCallback(async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    addToHistory(content)
    setCopiedId(id)
    toast('Copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }, [addToHistory, toast])
  if (message.role === 'assistant' && message.image) {
    const src = safeUrl(message.image);
    return src ? (
      <img src={src} alt="Generated" className="rounded-lg mb-2 max-w-full h-auto" />
    ) : null;
  }

  if (message.role === 'assistant' && message.content.startsWith('![Image]')) {
    const match = message.content.match(/\(([^)]+)\)/);
    const src = safeUrl(match?.[1]);
    return src ? (
      <img src={src} alt="Generated" className="rounded-lg mb-2 max-w-full h-auto" />
    ) : (
      <>{message.content}</>
    );
  }

  if (message.role === 'assistant' && message.loadingText) {
    return (
      <span className="inline-flex items-center gap-2 text-base text-zinc-500 dark:text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin text-green-500" />
        {message.loadingText}
      </span>
    );
  }

  if (message.role === 'assistant' && !message.content) {
    return (
      <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" />
    );
  }

  const imagePrompt = message.role === 'assistant' ? extractImagePrompt(message.content) : null

  return (
    <>
      {message.imageName && (
        <div className="mb-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Paperclip className="h-3 w-3" />
          <span>{message.imageName || 'Attached image'}</span>
        </div>
      )}
      <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className;
          return isInline ? (
            <code className="bg-zinc-200 px-1.5 py-0.5 rounded text-sm text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-200" {...props}>
              {children}
            </code>
          ) : (
            <div className="relative group">
              <CodeBlock className={className} children={children} />
              <button
                onClick={() => handleCopy(String(children), String(message.id))}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-200 border border-zinc-300 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1"
              >
                {copiedId === String(message.id) ? <Check className="w-3 h-3" /> : 'Copy'}
              </button>
            </div>
          );
        },
        a({ href, children }) {
          const safeHref = safeUrl(href);
          if (!safeHref) {
            return <span className="text-zinc-500 dark:text-zinc-500">{children}</span>;
          }
          return (
            <a href={safeHref} target="_blank" rel="noopener noreferrer" className="break-words [overflow-wrap:anywhere] text-[#FFF] underline hover:text-zinc-100 dark:text-[#FFF] dark:hover:text-zinc-200">
              {children}
            </a>
          );
        },
        table({ children }) {
          return (
            <div className="my-2 max-w-full overflow-x-auto">
              <table className="min-w-max">{children}</table>
            </div>
          );
        },
        ul({ children }) {
          return <ul className="list-disc list-inside space-y-1.5 my-2">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside space-y-1.5 my-2">{children}</ol>;
        },
        p({ children }) {
          return <p className="my-2 leading-relaxed">{children}</p>;
        },
        strong({ children }) {
          return <strong className="font-semibold text-zinc-800 dark:text-zinc-100">{children}</strong>;
        },
        img({ src, alt }) {
          const safeSrc = typeof src === 'string' ? safeUrl(src) : undefined;
          return safeSrc ? (
            <img src={safeSrc} alt={alt || ''} className="rounded-lg my-2 max-w-full h-auto" />
          ) : null;
        },
      }}
      >
        {replaceLatexSymbols(message.content)}
      </ReactMarkdown>
      {message.role === 'user' && (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => handleCopy(message.content, String(message.id))}
            title="Copy message"
            aria-label="Copy message"
            className="rounded p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            {copiedId === String(message.id) ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      {imagePrompt && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onGenImage?.(imagePrompt)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 border border-zinc-200 hover:text-green-600 hover:border-green-500 transition-colors dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-green-400"
          >
            <ImageIcon className="w-3 h-3" />
            Gen Image
          </button>
          <button
            type="button"
            onClick={() => onGeminiImage?.(imagePrompt)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 border border-zinc-200 hover:text-green-600 hover:border-green-500 transition-colors dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-green-400"
          >
            <Sparkles className="w-3 h-3" />
            Gemini Image
          </button>
          <button
            type="button"
            onClick={() => onHuggingFaceImage?.(imagePrompt)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 border border-zinc-200 hover:text-green-600 hover:border-green-500 transition-colors dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-green-400"
          >
            <Bot className="w-3 h-3" />
            Hugging Face
          </button>
        </div>
      )}
    </>
  );
}

const MemoizedMessageContent = React.memo(MessageContent);
