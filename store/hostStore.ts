import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HostState {
  host: string;
  setHost: (host: string) => void;
}

export const useHostStore = create<HostState>()(
  persist(
    (set) => ({
      host: process.env.NEXT_PUBLIC_OLLAMA_HOST || 'http://localhost:11434',
      setHost: (host) => set({ host }),
    }),
    {
      name: 'ollama-host-storage',
    }
  )
);
