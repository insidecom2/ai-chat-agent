import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CopyEntry {
  content: string;
  timestamp: number;
}

interface CopyHistoryState {
  entries: CopyEntry[];
  add: (content: string) => void;
}

export const useCopyHistory = create<CopyHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (content) =>
        set((state) => ({
          entries: [{ content, timestamp: Date.now() }, ...state.entries].slice(0, 50),
        })),
    }),
    { name: 'copy-history' }
  )
);
