'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/store/theme'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggleTheme)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="text-zinc-500 hover:text-green-500"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  )
}
