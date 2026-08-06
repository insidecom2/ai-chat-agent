'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatAttachment, useOllamaChat } from '@/hooks/useOllamaChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, ArrowRight, Loader2, Check, Paperclip, X, Image as ImageIcon, Sparkles, Bot } from 'lucide-react';
import { COMMANDS, Command } from '@/lib/commands';
import { formatImagePrompt, getPollinationsUrl, extractImagePrompt } from '@/lib/image-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/components/ui/toast';
import { useCopyHistory } from '@/store/copyHistory';
import { extractImageText, extractPdfText } from '@/lib/document-utils';
import ThemeToggle from '@/components/ThemeToggle';
import CodeBlock from '@/components/CodeBlock';
import { replaceLatexSymbols } from '@/lib/latex-symbols';

interface ChatViewProps {
  model: string;
  onBack: () => void;
}

export default function ChatView({ model, onBack }: ChatViewProps) {
  const { messages, input, setInput, sendMessage, append, updateMessage, isLoading, reset } = useOllamaChat(model);
  const { toast } = useToast();
  const [cmdIdx, setCmdIdx] = useState(0);
  const [attachedImage, setAttachedImage] = useState<ChatAttachment & { dataUrl?: string } | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBack = () => {
    reset();
    onBack();
  };

  const handleNewChat = () => {
    reset();
    setAttachedImage(null);
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

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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
        setInput('');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const command = COMMANDS.find((cmd) => cmd.key === commandName);
      if (command) {
        executeCommand(input, command);
      } else {
        sendMessage(input, getAttachment());
        setAttachedImage(null);
      }
    }
  };

  const selectCommand = (cmd: Command) => {
    setInput(`${cmd.key} `);
    setCmdIdx(0);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const executeCommand = (text: string, cmd: Command) => {
    if (geminiLoading) return;
    setInput('');

    if (cmd.key === '/gen-image') {
      const prompt = text.slice(cmd.key.length).trim();
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const contextPrompt = prompt || lastUserMsg?.content || '';
      const finalPrompt = formatImagePrompt(contextPrompt, messages);
      append({ role: 'user', content: text });
      append({ role: 'assistant', content: finalPrompt });
      const imgUrl = getPollinationsUrl(finalPrompt);
      const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
      setTimeout(() => {
        updateMessage(imgId, { content: `![Image](${imgUrl})`, loadingText: undefined });
      }, 500);
    } else if (cmd.key === '/gemini-image') {
      const prompt = text.slice(cmd.key.length).trim();
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const contextPrompt = prompt || lastUserMsg?.content || '';
      const finalPrompt = formatImagePrompt(contextPrompt, messages);
      append({ role: 'user', content: text });
      const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
      generateImage('/api/gemini', finalPrompt, imgId);
    } else if (cmd.key === '/hugging-face') {
      const prompt = text.slice(cmd.key.length).trim();
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const contextPrompt = prompt || lastUserMsg?.content || '';
      const finalPrompt = formatImagePrompt(contextPrompt, messages);
      append({ role: 'user', content: text });
      const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
      generateImage('/api/huggingface', finalPrompt, imgId);
    }
  };

  const handleGenImage = (prompt: string) => {
    if (!prompt.trim()) {
      toast('No image prompt found in this response.');
      return;
    }
    const imgUrl = getPollinationsUrl(prompt);
    const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
    setTimeout(() => {
      updateMessage(imgId, { content: `![Image](${imgUrl})`, loadingText: undefined });
    }, 500);
  };

  const handleGeminiImage = (prompt: string) => {
    if (geminiLoading) return;
    if (!prompt.trim()) {
      toast('No image prompt found in this response.');
      return;
    }
    const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
    generateImage('/api/gemini', prompt, imgId);
  };

  const handleHuggingFaceImage = (prompt: string) => {
    if (geminiLoading) return;
    if (!prompt.trim()) {
      toast('No image prompt found in this response.');
      return;
    }
    const imgId = append({ role: 'assistant', content: '', loadingText: 'กำลังสร้างรูปภาพ…' });
    generateImage('/api/huggingface', prompt, imgId);
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
      updateMessage(messageId, { content: `![Image](data:${mimeType};base64,${imageData})`, loadingText: undefined });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      updateMessage(messageId, { content: `Error: ${reason}`, loadingText: undefined });
    } finally {
      setGeminiLoading(false);
    }
  }, [updateMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize(e.target);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commandName = input.trim().split(/\s+/)[0];
    const command = COMMANDS.find((cmd) => cmd.key === commandName);
    if (command) {
      executeCommand(input, command);
    } else {
      sendMessage(input, getAttachment());
      setAttachedImage(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-5xl mx-auto bg-white dark:bg-[#0d0d15]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d0d15]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-zinc-500 hover:text-green-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{model}</span>
            <span className="text-[10px] text-zinc-500">Ollama Model</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Chat
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] min-w-0 flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-[10px] text-zinc-500 mb-1 px-1">
                  {m.role === 'user' ? 'You' : model}
                </span>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-green-600 text-white rounded-tr-sm dark:bg-green-900 dark:text-green-100'
                      : 'bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-tl-sm dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <MessageContent message={m} onGenImage={handleGenImage} onGeminiImage={handleGeminiImage} onHuggingFaceImage={handleHuggingFaceImage} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d0d15] relative">
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
                  className={`p-3 text-sm cursor-pointer flex justify-between items-center transition-colors ${
                    idx === cmdIdx
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="font-mono font-medium">{cmd.key}</span>
                  <span className="text-xs opacity-70">{cmd.desc}</span>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="flex gap-2 items-start">
            <div className="flex-1 relative">
              {attachedImage && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <Paperclip className="h-4 w-4 text-green-500" />
                  <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {isReadingFile ? 'Reading file…' : attachedImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
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
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="w-full resize-none p-3 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-sm focus:outline-none focus:border-green-500 transition-colors min-h-[44px] max-h-32 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isReadingFile}
                aria-label="Attach image or PDF"
                className="min-h-[44px] text-zinc-500 hover:text-green-500"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isReadingFile || geminiLoading || (!input.trim() && !attachedImage)}
              className="min-h-[44px]"
            >
              {isLoading || geminiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}

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
  if (message.role === 'assistant' && message.content.startsWith('![Image]')) {
    const match = message.content.match(/\(([^)]+)\)/);
    const src = match?.[1] || '';
    return src ? (
      <img src={src} alt="Generated" className="rounded-lg mb-2 max-w-full h-auto" />
    ) : (
      <>{message.content}</>
    );
  }

  if (message.role === 'assistant' && message.loadingText) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
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
        <div className="mb-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
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
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-600 underline hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
              {children}
            </a>
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
      }}
      >
        {replaceLatexSymbols(message.content)}
      </ReactMarkdown>
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
