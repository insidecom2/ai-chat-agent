'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatAttachment, useOllamaChat } from '@/hooks/useOllamaChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Send, Loader2, Check, Paperclip, X } from 'lucide-react';
import { COMMANDS, Command } from '@/lib/commands';
import { formatImagePrompt, getPollinationsUrl } from '@/lib/image-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/components/ui/toast';
import { useCopyHistory } from '@/store/copyHistory';
import { extractImageText, extractPdfText } from '@/lib/document-utils';

interface ChatViewProps {
  model: string;
  onBack: () => void;
}

export default function ChatView({ model, onBack }: ChatViewProps) {
  const { messages, input, setInput, sendMessage, append, isLoading, reset } = useOllamaChat(model);
  const { toast } = useToast();
  const [cmdIdx, setCmdIdx] = useState(0);
  const [attachedImage, setAttachedImage] = useState<ChatAttachment & { dataUrl?: string } | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
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
    setInput('');

      if (cmd.key === '/gen-image') {
      const prompt = text.slice(cmd.key.length).trim();
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const contextPrompt = prompt || lastUserMsg?.content || '';
      const finalPrompt = formatImagePrompt(contextPrompt, messages);
      append({ role: 'user', content: text });
      append({ role: 'assistant', content: finalPrompt });
      const imgUrl = getPollinationsUrl(finalPrompt);
      setTimeout(() => {
        append({ role: 'assistant', content: `![Image](${imgUrl})` });
      }, 500);
    }
  };

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
    <div className="flex flex-col h-screen w-full max-w-3xl mx-auto bg-[#0d0d15]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0d0d15]">
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
            <span className="text-sm font-medium text-zinc-200">{model}</span>
            <span className="text-[10px] text-zinc-500">Ollama Model</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          className="text-xs text-zinc-400 border-zinc-800 hover:text-green-500 hover:border-green-500"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Chat
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-[10px] text-zinc-500 mb-1 px-1">
                  {m.role === 'user' ? 'You' : model}
                </span>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-green-900 text-green-100 rounded-tr-sm'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-tl-sm'
                  }`}
                >
                  <MessageContent message={m} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-zinc-800 bg-[#0d0d15] relative">
        <div className="max-w-3xl mx-auto relative">
          {input.startsWith('/') &&
            !/\s/.test(input) &&
            COMMANDS.some((cmd) => cmd.key.startsWith(input.trim())) && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50">
              {COMMANDS.map((cmd, idx) => (
                <div
                  key={cmd.key}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCommand(cmd);
                  }}
                  className={`p-3 text-sm cursor-pointer flex justify-between items-center transition-colors ${
                    idx === cmdIdx
                      ? 'bg-green-900/30 text-green-400'
                      : 'text-zinc-400 hover:bg-zinc-800'
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
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                  <Paperclip className="h-4 w-4 text-green-500" />
                  <span className="flex-1 truncate text-xs text-zinc-400">
                    {isReadingFile ? 'Reading file…' : attachedImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
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
                className="w-full resize-none p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-green-500 transition-colors min-h-[44px] max-h-32"
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
                disabled={isLoading || isReadingFile || (!input.trim() && !attachedImage)}
              className="bg-green-900 text-green-400 hover:bg-green-800 min-h-[44px]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}

function MessageContent({ message }: { message: { id: string; role: string; content: string; image?: string; imageName?: string } }) {
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

  if (message.role === 'assistant' && !message.content) {
    return (
      <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" />
    );
  }

  return (
    <>
      {message.imageName && (
        <div className="mb-2 flex items-center gap-2 text-xs text-green-400">
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
            <code className="bg-zinc-700/50 px-1.5 py-0.5 rounded text-sm text-zinc-200" {...props}>
              {children}
            </code>
          ) : (
            <div className="relative group">
              <pre className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 my-2 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
              <button
                onClick={() => handleCopy(String(children), String(message.id))}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1"
              >
                {copiedId === String(message.id) ? <Check className="w-3 h-3" /> : 'Copy'}
              </button>
            </div>
          );
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300">
              {children}
            </a>
          );
        },
        ul({ children }) {
          return <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside space-y-1 my-1">{children}</ol>;
        },
        p({ children }) {
          return <p className="my-1 leading-relaxed">{children}</p>;
        },
        strong({ children }) {
          return <strong className="font-semibold text-zinc-100">{children}</strong>;
        },
      }}
      >
        {message.content}
      </ReactMarkdown>
    </>
  );
}
