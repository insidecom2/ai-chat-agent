import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HostState {
  host: string;
  apiKey: string;
  setHost: (host: string) => void;
  setApiKey: (key: string) => void;
}

export const useHostStore = create<HostState>()(
  persist(
    (set) => ({
      host: process.env.NEXT_PUBLIC_OLLAMA_HOST || 'http://localhost:11434',
      apiKey: process.env.NEXT_PUBLIC_OLLAMA_API_KEY || '',
      setHost: (host) => set({ host }),
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'ollama-host-storage',
    }
  )
);
