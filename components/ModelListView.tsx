'use client'
import React from 'react';
import { useModels } from '@/hooks/useModels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';

interface ModelListViewProps {
  onSelectModel: (model: string) => void;
}

export default function ModelListView({ onSelectModel }: ModelListViewProps) {
  const { data: models, isLoading, isError, error, refetch } = useModels();

  return (
    <div className="flex flex-col h-screen w-full max-w-2xl mx-auto p-4 gap-6">
      <header className="space-y-1 pt-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900 flex items-center gap-2 tracking-tight dark:text-zinc-100">
            <span className="text-green-500">⧩</span> Ollama Chat
          </h1>
          <p className="text-xs text-zinc-500">Select a model to start chatting</p>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="text-sm font-medium">Fetching models...</p>
          </div>
        )}

        {!isLoading && isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-1">Connection failed</p>
              <p className="text-red-600/70 dark:text-red-400/70">
                {error?.message || 'Make sure Ollama is running and the host URL is correct.'}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && models?.length === 0 && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-600 text-sm">
            No models found. Pull one with{' '}
            <code className="bg-zinc-200 px-1 rounded text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">ollama pull &lt;name&gt;</code>
          </div>
        )}

        {!isLoading &&
          models?.map((model: any) => (
            <Card
              key={model.name}
              className="hover:border-green-500/40 transition-all duration-200 cursor-pointer group active:scale-[0.98]"
              onClick={() => onSelectModel(model.name)}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-800 group-hover:text-green-600 transition-colors dark:text-zinc-200 dark:group-hover:text-green-400">
                      {model.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-zinc-50 text-zinc-500 border-zinc-300 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-700"
                    >
                      {model.details?.parameter_size || '—'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500">Modified: {formatDate(model.modified_at)}</p>
                </div>
                <span className="text-xs text-zinc-600 font-mono bg-zinc-100 px-2 py-1 rounded dark:text-zinc-500 dark:bg-zinc-800/50">
                  {formatBytes(model.size)}
                </span>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
