'use client'
import { useEffect, useState } from 'react'

type NavItem = { label: string; href: string }
type Settings = { title: string; nav: NavItem[]; social?: NavItem[] }

export default function Footer() {
  const [s, setS] = useState<Settings | null>(null)
  useEffect(()=>{ fetch('/api/settings').then(r=>r.json()).then(j=>setS(j?.settings||null)).catch(()=>setS(null)) },[])
  const title = s?.title || 'Mapa do Crédito'
  const nav = s?.nav?.length ? s.nav : [
    { label:'Cartões', href:'/cards' },
    { label:'Oportunidades', href:'/oportunidades' },
    { label:'Guias', href:'/guias' },
    { label:'Calculadoras', href:'/calculadoras' },
  ]
  const social = s?.social || []

  return (
    <footer className="mt-12 bg-white/70 backdrop-blur border-t">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="col-span-2">
          <a href="/" className="flex items-center gap-3 mb-3">
            <img src="/logo-mark.svg" className="w-9 h-9 rounded-xl" alt={title}/>
            <span className="font-black">{title}</span>
          </a>
          <p className="text-sm text-slate-600 max-w-md">
            Conteúdo educativo e ferramentas para decisões melhores sobre cartões, vagas e concursos.
            Alguns links podem render comissões sem custo adicional para você.
          </p>
          {!!social.length && (
            <div className="flex gap-3 mt-4">
              {social.map((s,i)=>(
                <a key={i} href={s.href} className="px-3 py-1.5 rounded-lg border bg-white text-sm hover:bg-slate-50">{s.label}</a>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="font-semibold mb-3">Navegação</div>
          <ul className="space-y-2 text-sm">
            {nav.map((n,i)=>(<li key={i}><a className="text-slate-600 hover:text-slate-900" href={n.href}>{n.label}</a></li>))}
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-3">Links úteis</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/sobre" className="text-slate-600 hover:text-slate-900">Sobre</a></li>
            <li><a href="/contato" className="text-slate-600 hover:text-slate-900">Contato</a></li>
            <li><a href="/privacidade" className="text-slate-600 hover:text-slate-900">Privacidade</a></li>
            <li><a href="/termos" className="text-slate-600 hover:text-slate-900">Termos</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-slate-400 py-4 border-t">
        © {new Date().getFullYear()} {title} — Todos os direitos reservados
      </div>
    </footer>
  )
}
