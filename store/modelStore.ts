import { create } from 'zustand'

const STORAGE_KEY = 'last-model'

function readStoredModel(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
}

interface ModelStore {
  lastModel: string | null
  setLastModel: (model: string | null) => void
}

export const useModelStore = create<ModelStore>((set) => ({
  lastModel: null,
  setLastModel: (model) => {
    if (typeof window !== 'undefined') {
      if (model) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    set({ lastModel: model })
  },
}))

export function getStoredModel(): string | null {
  return readStoredModel()
}
