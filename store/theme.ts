'use client'
import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  initTheme: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'chat-agent-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  initTheme: () => {
    const theme = getInitialTheme()
    set({ theme })
    applyTheme(theme)
  },
  setTheme: (theme) => {
    set({ theme })
    window.localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },
}))
