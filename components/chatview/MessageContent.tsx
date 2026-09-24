'use client'

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { Bot, Check, Copy, Edit, Image as ImageIcon, Loader2, Paperclip, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import CodeBlock from '@/components/CodeBlock';
import { extractImagePrompt } from '@/lib/image-utils';
import { replaceLatexSymbols } from '@/lib/latex-symbols';
import { safeUrl } from '@/lib/utils';
import { useCopyHistory } from '@/store/copyHistory';

export function MessageContent({ message, onGenImage, onGeminiImage, onHuggingFaceImage, onEditMessage }: {
  message: { id: string; role: string; content: string; image?: string; imageName?: string; loadingText?: string }
  onGenImage?: (prompt: string) => void
  onGeminiImage?: (prompt: string) => void
  onHuggingFaceImage?: (prompt: string) => void,
  onEditMessage: (message: string) => void;
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
      <Image src={src} alt="Generated" width={1024} height={1024} unoptimized className="rounded-lg mb-2 max-w-full h-auto" />
    ) : null;
  }

  if (message.role === 'assistant' && message.content.startsWith('![Image]')) {
    const match = message.content.match(/\(([^)]+)\)/);
    const src = safeUrl(match?.[1]);
    return src ? (
      <Image src={src} alt="Generated" width={1024} height={1024} unoptimized className="rounded-lg mb-2 max-w-full h-auto" />
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
      <div className="mt-1 flex justify-end">
        {message.role === 'user' && <div>
          <Button
            type="button"
            onClick={() => onEditMessage(message.content)}
            title="Edit message"
            aria-label="Edit message"
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-transparent p-1 text-white/70"
          >
            {copiedId === String(message.id) ? <Check className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
          </Button>
        </div>
        }
        <Button
          type="button"
          onClick={() => handleCopy(message.content, String(message.id))}
          title="Copy message"
          aria-label="Copy message"
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-transparent p-1 text-white/70"
        >
          {copiedId === String(message.id) ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
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
              <CodeBlock className={className}>{children}</CodeBlock>
              <Button
                onClick={() => handleCopy(String(children), String(message.id))}
                variant="outline"
                className="absolute right-2 top-2 h-auto gap-1 rounded-md border-zinc-300 bg-zinc-200 p-1.5 text-xs text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-300 hover:text-zinc-700 group-hover:opacity-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                {copiedId === String(message.id) ? <Check className="w-3 h-3" /> : 'Copy'}
              </Button>
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
            <Image src={safeSrc} alt={alt || ''} width={1024} height={1024} unoptimized className="rounded-lg my-2 max-w-full h-auto" />
          ) : null;
        },
      }}
      >
        {replaceLatexSymbols(message.content)}
      </ReactMarkdown>

      {imagePrompt && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => onGenImage?.(imagePrompt)}
            variant="outline"
            className="h-auto gap-1 px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400"
          >
            <ImageIcon className="w-3 h-3" />
            Gen Image
          </Button>
          <Button
            type="button"
            onClick={() => onGeminiImage?.(imagePrompt)}
            variant="outline"
            className="h-auto gap-1 px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400"
          >
            <Sparkles className="w-3 h-3" />
            Gemini Image
          </Button>
          <Button
            type="button"
            onClick={() => onHuggingFaceImage?.(imagePrompt)}
            variant="outline"
            className="h-auto gap-1 px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400"
          >
            <Bot className="w-3 h-3" />
            Hugging Face
          </Button>
        </div>
      )}
    </>
  );
}
