'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatAttachment, useOllamaChat } from '@/hooks/useOllamaChat';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, Menu, Pencil, Bell } from 'lucide-react';
import { COMMANDS, Command } from '@/lib/commands';
import { formatImagePrompt, getLatestImagePrompt, getPollinationsUrl, limitImagePrompt } from '@/lib/image-utils';
import { useToast } from '@/components/ui/toast';
import { extractImageText, extractPdfText } from '@/lib/document-utils';
import ThemeToggle from '@/components/ThemeToggle';
import { useModels } from '@/hooks/useModels';
import { ChatComposer } from '@/components/chatview/ChatComposer';
import { MessageList } from '@/components/chatview/MessageList';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';
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
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const resizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  const handleEditMessage = useCallback((message: string) => {
    setInput(message);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      resizeTextarea(textarea);
    });
  }, [resizeTextarea]);

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
              <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger
                className="cursor-pointer"
                aria-label="Select model"
              >
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {models?.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
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
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-zinc-500 hover:text-green-500"
          >
            <Link href="/price-alerts" aria-label="แจ้งเตือนราคา" title="แจ้งเตือนราคา">
              <Bell className="w-5 h-5" />
            </Link>
          </Button>
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
          onEditMessage={handleEditMessage}
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
        input={input}
        setInput={setInput}
        textareaRef={textareaRef}
        resizeTextarea={resizeTextarea}
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
