'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ label = 'Voltar', href }: { label?: string; href?: string }) {
  const router = useRouter()

  function handle() {
    if (href) router.push(href)
    else router.back()
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/70 px-3 py-1.5 text-sm
                 shadow-sm hover:bg-white transition"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  )
}
