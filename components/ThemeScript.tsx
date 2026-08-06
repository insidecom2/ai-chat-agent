'use client'
import { useServerInsertedHTML } from 'next/navigation'

const THEME_INIT = `(function(){try{var s=localStorage.getItem('chat-agent-theme');var t=s==='light'?'light':(s==='dark'?'dark':(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t}catch(e){}})();`

export default function ThemeScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
  ))
  return null
}
