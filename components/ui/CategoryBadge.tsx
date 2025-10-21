// components/ui/CategoryBadge.tsx
type Props = {
  value?: string | null
  className?: string
  /** "solid" para fundo claro (default) | "glass" para usar sobre imagem */
  tone?: 'solid' | 'glass'
}

function formatLabel(s: string) {
  if (!s) return ''
  const pretty = s.replace(/[-_]+/g, ' ').toLowerCase()
  return pretty.replace(/\b\w/g, c => c.toUpperCase())
}

const PALETTE: Record<string, { solid: string; glass: string }> = {
  concursos: {
    solid: 'border-sky-200 bg-sky-50 text-sky-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  empregos: {
    solid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  cartoes: {
    solid: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  beneficios: {
    solid: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  planejamento: {
    solid: 'border-blue-200 bg-blue-50 text-blue-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  milhas: {
    solid: 'border-violet-200 bg-violet-50 text-violet-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  cashback: {
    solid: 'border-amber-200 bg-amber-50 text-amber-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  estudante: {
    solid: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
  default: {
    solid: 'border-slate-200 bg-slate-50 text-slate-700',
    glass: 'border-white/40 bg-white/12 text-white backdrop-blur-sm',
  },
}

export default function CategoryBadge({ value, className = '', tone = 'solid' }: Props) {
  const raw = (value || '').trim()
  if (!raw) return null
  const key = raw.toLowerCase()
  const colors = (PALETTE[key] || PALETTE.default)[tone]

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-[3px] text-xs font-medium',
        colors,
        className,
      ].join(' ')}
    >
      {formatLabel(raw)}
    </span>
  )
}
