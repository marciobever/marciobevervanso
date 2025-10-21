'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText, Image as ImageIcon, BriefcaseBusiness, Trophy, CreditCard,
  BookOpen, Megaphone, HelpCircle, BellRing, Bot, Settings, Plug2
} from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Início', icon: Bot },
  { href: '/dashboard/posts', label: 'Posts', icon: FileText },
  { href: '/dashboard/images', label: 'Imagens', icon: ImageIcon },
  { href: '/dashboard/jobs', label: 'Empregos', icon: BriefcaseBusiness },
  { href: '/dashboard/contests', label: 'Concursos', icon: Trophy },
  { href: '/dashboard/cards', label: 'Cartões', icon: CreditCard },
  { href: '/dashboard/guides', label: 'Guias', icon: BookOpen },
  { href: '/dashboard/ads', label: 'Anúncios', icon: Megaphone },
  { href: '/dashboard/quizzes', label: 'Quizzes', icon: HelpCircle },
  { href: '/dashboard/popups', label: 'Popups', icon: BellRing },

  // 👇 Novo item
  { href: '/dashboard/n8n', label: 'n8n', icon: Plug2 },

  { href: '/dashboard/automations', label: 'Automations', icon: Bot },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="p-3">
      {/* logo compacta */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/50 bg-white/70">
        <div className="size-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600" />
        <div>
          <div className="text-sm font-extrabold leading-none">Mapa do Crédito</div>
          <div className="text-[11px] text-slate-500">Dashboard</div>
        </div>
      </div>

      <nav className="mt-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition
                ${active
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : 'bg-white/70 border-white/60 hover:bg-white'}
              `}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
