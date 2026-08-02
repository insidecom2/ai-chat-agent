export const LATEX_SYMBOLS: Record<string, string> = {
  uparrow: '↑',
  Uparrow: '⇑',
  downarrow: '↓',
  Downarrow: '⇓',
  leftarrow: '←',
  rightarrow: '→',
  Leftarrow: '⇐',
  Rightarrow: '⇒',
  leftrightarrow: '↔',
  Leftrightarrow: '⇔',
  to: '→',
  gets: '←',
  leq: '≤',
  geq: '≥',
  neq: '≠',
  approx: '≈',
  equiv: '≡',
  pm: '±',
  times: '×',
  cdot: '·',
  div: '÷',
  infty: '∞',
  sum: '∑',
  prod: '∏',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  phi: 'φ',
  omega: 'ω',
  Delta: 'Δ',
  Gamma: 'Γ',
  Lambda: 'Λ',
  Omega: 'Ω',
  Phi: 'Φ',
  Sigma: 'Σ',
  Theta: 'Θ',
  in: '∈',
  notin: '∉',
  cup: '∪',
  cap: '∩',
  subset: '⊂',
  supset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  emptyset: '∅',
  neg: '¬',
  land: '∧',
  lor: '∨',
  forall: '∀',
  exists: '∃',
  nabla: '∇',
  partial: '∂',
  int: '∫',
  star: '∗',
  otimes: '⊗',
  oplus: '⊕',
  propto: '∝',
}

const COMMAND_RE = /(?<!\\)\\([a-zA-Z]+)\b/g
const MATH_GROUP_RE = /\$\s*((?:\\[a-zA-Z]+|[^$\\]|\\.)+?)\s*\$/g

export function replaceLatexSymbols(content: string): string {
  const withGroups = content.replace(MATH_GROUP_RE, (whole, inner: string) => {
    let convertedAny = false
    const converted = inner.replace(COMMAND_RE, (match, name: string) => {
      const symbol = LATEX_SYMBOLS[name]
      if (symbol) {
        convertedAny = true
        return symbol
      }
      return match
    })
    return convertedAny ? converted : whole
  })

  return withGroups.replace(COMMAND_RE, (match, name: string) => LATEX_SYMBOLS[name] ?? match)
}
