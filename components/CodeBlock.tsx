'use client'
import type { ReactNode } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import dracula from 'react-syntax-highlighter/dist/esm/styles/prism/dracula'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp'
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff'
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import json5 from 'react-syntax-highlighter/dist/esm/languages/prism/json5'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('csharp', csharp)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('diff', diff)
SyntaxHighlighter.registerLanguage('docker', docker)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('graphql', graphql)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('json5', json5)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('kotlin', kotlin)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('markup', markup)
SyntaxHighlighter.registerLanguage('php', php)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('ruby', ruby)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('swift', swift)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('yaml', yaml)

const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  json5: 'json5',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
}

const REGISTERED = new Set([
  'bash', 'cpp', 'csharp', 'css', 'diff', 'docker', 'go', 'graphql', 'markup',
  'java', 'javascript', 'json', 'json5', 'jsx', 'kotlin', 'markdown', 'php',
  'python', 'ruby', 'rust', 'sql', 'swift', 'tsx', 'typescript', 'yaml',
])

export function getCodeLanguage(className?: string): string | undefined {
  const match = /language-(\w+)/.exec(className || '')
  if (!match) return undefined
  const raw = match[1].toLowerCase()
  const language = ALIASES[raw] ?? raw
  return REGISTERED.has(language) ? language : undefined
}

export default function CodeBlock({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const language = getCodeLanguage(className)
  const code = String(children).replace(/\n$/, '')

  if (!language) {
    return (
      <pre className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 my-2 overflow-x-auto">
        <code className="text-zinc-100">{code}</code>
      </pre>
    )
  }

  return (
    <SyntaxHighlighter
      language={language}
      style={dracula}
      customStyle={{
        margin: '0.5rem 0',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        lineHeight: '1.5',
      }}
    >
      {code}
    </SyntaxHighlighter>
  )
}
