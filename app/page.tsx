'use client'
import React, { useState } from 'react';
import ModelListView from '@/components/ModelListView';
import ChatView from '@/components/ChatView';

export default function Page() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  if (selectedModel) {
    return <ChatView model={selectedModel} onBack={() => setSelectedModel(null)} />;
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0f]">
      <ModelListView onSelectModel={setSelectedModel} />
    </div>
  );
}
