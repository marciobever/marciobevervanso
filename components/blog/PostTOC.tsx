'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type TOCItem = {
  id: string
  text: string
  level: 2 | 3
}

function slugify(raw: string) {
  return raw
    .toLowerCase()
    .normalize('NFD')              // remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function PostTOC() {
  const [items, setItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // coleta headings do artigo
  useEffect(() => {
    const article = document.querySelector('article')
    if (!article) return

    const headings = Array.from(
      article.querySelectorAll<HTMLHeadingElement>('h2, h3')
    )

    // garante id único e estável
    const seen = new Map<string, number>()
    const mapped: TOCItem[] = headings.map((h) => {
      const text = h.textContent?.trim() || ''
      let id = h.id || slugify(text) || 'sec'
      const count = (seen.get(id) ?? 0) + 1
      seen.set(id, count)
      if (count > 1) id = `${id}-${count}` // desambiguar duplicados
      h.id = id
      const level = (h.tagName === 'H3' ? 3 : 2) as 2 | 3
      return { id, text: text || (level === 2 ? 'Seção' : 'Subseção'), level }
    })

    setItems(mapped)
  }, [])

  // observa a seção ativa ao rolar
  useEffect(() => {
    if (!items.length) return
    const options: IntersectionObserverInit = {
      // quando o topo do heading passa da área visível
      rootMargin: '0px 0px -70% 0px',
      threshold: [0, 1.0],
    }

    const handler: IntersectionObserverCallback = (entries) => {
      // pega o primeiro heading visível mais alto
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop)
      if (visible[0]) {
        const id = (visible[0].target as HTMLElement).id
        if (id) setActiveId(id)
      } else {
        // fallback: o último que passou do topo
        const topMost = entries
          .slice()
          .sort((a, b) => (b.target as HTMLElement).getBoundingClientRect().top - (a.target as HTMLElement).getBoundingClientRect().top)[0]
        const id = (topMost?.target as HTMLElement)?.id
        if (id) setActiveId(id)
      }
    }

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(handler, options)

    items.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current!.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [items])

  const grouped = useMemo(() => {
    // estrutura hierárquica simples: h2 com filhos h3
    const out: (TOCItem & { children: TOCItem[] })[] = []
    let currentH2: (TOCItem & { children: TOCItem[] }) | null = null
    for (const it of items) {
      if (it.level === 2) {
        currentH2 = { ...it, children: [] }
        out.push(currentH2)
      } else if (it.level === 3) {
        if (!currentH2) {
          currentH2 = { ...it, level: 2, children: [] }
          out.push(currentH2)
        } else {
          currentH2.children.push(it)
        }
      }
    }
    return out
  }, [items])

  if (!items.length) return null

  const onClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    // scroll suave
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // atualiza hash sem reload
    history.pushState(null, '', `#${id}`)
    setActiveId(id)
  }

  return (
    <nav
      aria-label="Sumário do artigo"
      className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 sticky top-20"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
        <span>📑</span> <span>Sumário</span>
      </div>

      <ul className="mt-3 space-y-2 text-sm">
        {grouped.map((h2) => (
          <li key={h2.id}>
            <a
              href={`#${h2.id}`}
              onClick={onClick(h2.id)}
              className={`block leading-snug hover:underline ${
                activeId === h2.id ? 'text-sky-700 font-semibold' : 'text-slate-700'
              }`}
            >
              {h2.text}
            </a>

            {h2.children.length > 0 && (
              <ul className="mt-1 ml-3 border-l pl-3 space-y-1">
                {h2.children.map((h3) => (
                  <li key={h3.id}>
                    <a
                      href={`#${h3.id}`}
                      onClick={onClick(h3.id)}
                      className={`block text-[13px] leading-snug hover:underline ${
                        activeId === h3.id ? 'text-sky-700 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {h3.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
