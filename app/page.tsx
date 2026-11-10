"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ModelListView from "@/components/ModelListView";
import ChatView from "@/components/ChatView";
import LoginView from "@/components/LoginView";
import {
  useModelStore,
  getStoredModel,
  getDefaultModel,
  GEMINI_CHAT_MODEL,
} from "@/store/modelStore";
import { updateConversation } from "@/lib/api/conversations";
import type { Conversation } from "@/lib/db/types";
import { useModels } from "@/hooks/useModels";

export default function Page() {
  const { data: session, status } = useSession();
  const setLastModel = useModelStore((s) => s.setLastModel);
  const { data: models = [], isLoading: isModelsLoading } = useModels();
  const [model, setModel] = useState<string | null>(() => getStoredModel());
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (model || isModelsLoading || models.length === 0) return;

    const nextModel = getDefaultModel([
      ...models,
      { name: GEMINI_CHAT_MODEL },
    ]);
    if (!nextModel) return;

    setModel(nextModel);
    setLastModel(nextModel);
  }, [isModelsLoading, model, models, setLastModel]);

  if (status === "loading") {
    return (
      <div className="h-screen w-full bg-zinc-50 dark:bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return <LoginView />;
  }

  if (!model) {
    return (
      <div className="h-screen w-full bg-zinc-50 dark:bg-[#0a0a0f]">
        <ModelListView
          onSelectModel={(selected) => {
            setModel(selected);
            setLastModel(selected);
          }}
        />
      </div>
    );
  }

  return (
    <ChatView
      model={model}
      conversationId={conversationId}
      onConversationChange={setConversationId}
      onBack={() => {
        setConversationId(null);
        setModel(null);
      }}
      onModelChange={(next) => {
        if (conversationId) {
          updateConversation(conversationId, { model: next }).catch(() => {});
        }
        setModel(next);
        setLastModel(next);
      }}
      onNewChat={() => setConversationId(null)}
      onOpenConversation={(conversation: Conversation) => {
        setModel(conversation.model);
        setLastModel(conversation.model);
        setConversationId(conversation.id);
      }}
      onConversationDeleted={(id: string) => {
        setConversationId((current) => (current === id ? null : current));
      }}
    />
  );
}
