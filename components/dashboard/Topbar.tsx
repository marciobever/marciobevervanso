'use client'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard': 'Início',
  '/dashboard/posts': 'Posts',
  '/dashboard/images': 'Imagens',
  '/dashboard/jobs': 'Empregos',
  '/dashboard/contests': 'Concursos',
  '/dashboard/cards': 'Cartões',
  '/dashboard/guides': 'Guias',
  '/dashboard/ads': 'Anúncios',
  '/dashboard/quizzes': 'Quizzes',
  '/dashboard/popups': 'Popups',
  '/dashboard/automations': 'Automations',
  '/dashboard/settings': 'Configurações',
}

export default function Topbar() {
  const pathname = usePathname()
  const base = Object.keys(titles).find((k) => pathname === k || pathname.startsWith(k))
  const title = base ? titles[base] : 'Dashboard'

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold">{title}</h1>
        <p className="text-xs text-slate-500">Gerencie conteúdo, mídia e automações.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5">
          <Search size={16} className="text-slate-500" />
          <input
            placeholder="Buscar no dashboard…"
            className="bg-transparent outline-none text-sm w-56"
            onKeyDown={(e) => {
              if (e.key === 'Enter') alert('Busca global entra na próxima etapa 😉')
            }}
          />
        </div>
        {/* espaço para ações rápidas por página (opcional) */}
      </div>
    </div>
  )
}
