// lib/templates.ts
export type TemplateKey = 'classic' | 'bold' | 'glass' | 'minimal'

export const TEMPLATES: Record<TemplateKey, true> = {
  classic: true,
  bold: true,
  glass: true,
  minimal: true,
}

export function normalizeTemplate(v?: string | null): TemplateKey {
  const k = String(v || '').toLowerCase() as TemplateKey
  return (k in TEMPLATES ? k : 'classic')
}

export function pickTemplate(opts: {
  slug: string
  tags?: string[]
  explicit?: string | null
}): TemplateKey {
  if (opts.explicit) return normalizeTemplate(opts.explicit)
  // heurística simples por enquanto
  const s = opts.slug || ''
  if (/cartoes?|credito/.test(s)) return 'glass'
  if (/beneficios?|guias?/.test(s)) return 'classic'
  return 'bold'
}