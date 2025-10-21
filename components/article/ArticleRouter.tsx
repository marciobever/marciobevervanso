'use client'

import ArticleCartoes from './ArticleCartoes'
import ArticleBeneficios from './ArticleBeneficios'
import ArticleEmpregosLista from './ArticleEmpregosLista'
import ArticleEmpregosGuia from './ArticleEmpregosGuia'

export type Json = Record<string, any> | null

export type PostRow = {
  id: string
  title: string
  slug: string
  type: string | null
  category: string | null
  image_url: string | null
  content_html: string | null
  minutes: number | null
  reading_time?: number | null
  created_at: string | null
  published_at?: string | null
  status: 'draft' | 'published'
  extras: Json
  flags: Json
  summary?: string | null
  excerpt?: string | null
  groups?: any[] | null
  list?: any[] | null
}

export type Related = Pick<
  PostRow,
  'id' | 'title' | 'slug' | 'type' | 'category' | 'image_url' | 'created_at'
>

function norm(s?: string | null) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // sem flag 'u' para compilar no Netlify
    .trim()
}

const PRIMARY = ['beneficios', 'cartoes', 'empregos', 'concursos'] as const
type Kind = (typeof PRIMARY)[number]

/** Decide o "kind" principal do template. guia/lista contam como subtipo; para eles usamos kindHint da URL. */
function resolveKind(post: any, kindHint?: string): Kind | 'posts' {
  const cat = norm(post?.category)
  const typ = norm(post?.type)
  const sub = norm(post?.extras?.subtype) || norm(post?.flags?.subtype)
  if (PRIMARY.includes(cat as Kind)) return cat as Kind
  if (PRIMARY.includes(typ as Kind)) return typ as Kind
  const hint = norm(kindHint)
  if ((typ === 'guia' || typ === 'lista' || sub === 'guia' || sub === 'lista') && PRIMARY.includes(hint as Kind)) {
    return hint as Kind
  }
  const k1 = norm(post?.extras?.kind)
  const k2 = norm(post?.flags?.kind)
  if (PRIMARY.includes(k1 as Kind)) return k1 as Kind
  if (PRIMARY.includes(k2 as Kind)) return k2 as Kind
  return (cat || typ || hint || 'posts') as Kind | 'posts'
}

/* ===== Normalização de grupos para Empregos–Lista ===== */

type FlatItem = {
  title?: string
  link?: string
  pubDate?: string | null
  summary?: string | null
  salary?: string | null
  salary_amount?: number | null
  modality?: string | null
  contract?: string | null
  area?: string | null
  source?: string | null
  domain?: string | null
  uf?: string | null
  city?: string | null
}
type NormalizedGroup = { uf: string | null; city: string | null; items: FlatItem[] }

const asArr = (v: any) => (Array.isArray(v) ? v : v ? [v] : [])

function parseLabel(label?: string | null) {
  if (!label) return { uf: null as string | null, city: null as string | null }
  const parts = String(label)
    .split(/[\u2022•\-\|,;>]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
  let uf: string | null = null
  let city: string | null = null
  if (parts.length >= 2) {
    const [p1, p2] = parts
    if (/^[A-Za-z]{2}$/.test(p1)) {
      uf = p1.toUpperCase()
      city = p2
    } else if (/^[A-Za-z]{2}$/.test(p2)) {
      uf = p2.toUpperCase()
      city = p1
    } else {
      city = p1
    }
  } else if (parts.length === 1) {
    const p = parts[0]
    if (/^[A-Za-z]{2}$/.test(p)) uf = p.toUpperCase()
    else city = p
  }
  return { uf, city }
}

function normItem(it: any): FlatItem {
  const uf = it?.uf || it?.UF || it?.estado || it?.state || null
  const city = it?.city || it?.cidade || it?.municipio || it?.mun || null
  return {
    title: it?.title ?? it?.cargo ?? it?.nome ?? it?.name ?? '',
    link: it?.link ?? it?.url ?? it?.href ?? '',
    pubDate: it?.pubDate ?? it?.data ?? it?.published_at ?? null,
    summary: it?.summary ?? it?.desc ?? it?.descricao ?? null,
    salary: it?.salary ?? it?.salario ?? null,
    salary_amount: it?.salary_amount ?? it?.salario_valor ?? null,
    modality: it?.modality ?? it?.modalidade ?? null,
    contract: it?.contract ?? it?.contrato ?? null,
    area: it?.area ?? null,
    source: it?.source ?? it?.fonte ?? null,
    domain: it?.domain ?? null,
    uf: uf ? String(uf).toUpperCase() : null,
    city: city ? String(city).trim() : null,
  }
}

function groupFromFlat(flat: any[]): NormalizedGroup[] {
  const byKey: Record<string, NormalizedGroup> = {}
  for (const raw of flat) {
    const it = normItem(raw)
    if (!it.title || !it.link) continue
    const k = `${it.uf || '??'}|${it.city || '??'}`
    if (!byKey[k]) byKey[k] = { uf: it.uf ?? null, city: it.city ?? null, items: [] }
    byKey[k].items.push(it)
  }
  return Object.values(byKey)
}

function normalizeEmpregoGroups(post: PostRow): NormalizedGroup[] {
  const ex = (post.extras as any) || {}
  const fl = (post.flags as any) || {}

  const groupsRaw = [...asArr((post as any).groups), ...asArr(ex.groups), ...asArr(fl.groups)]
  const flatRaw = [
    ...asArr(post.list),
    ...asArr(ex.list),
    ...asArr(fl.list),
    ...asArr(ex.vagas),
    ...asArr(ex.items),
  ]

  const out: NormalizedGroup[] = []

  for (const g of groupsRaw) {
    const byLab = parseLabel(g?.label)
    const uf = (g?.uf || byLab.uf) ? String(g?.uf || byLab.uf).toUpperCase() : null
    const city = (g?.city || byLab.city) ? String(g?.city || byLab.city).trim() : null
    const items = (Array.isArray(g?.items) ? g.items : [])
      .map(normItem)
      .filter((x: FlatItem) => !!x.title && !!x.link)
    if (items.length > 0 || uf || city) {
      out.push({ uf, city, items })
    }
  }

  if (out.length === 0 && flatRaw.length > 0) {
    return groupFromFlat(flatRaw)
  }

  return out.filter((g) => g.items && g.items.length > 0)
}

/* ===== Roteador ===== */
export default function ArticleRouter({
  post,
  related = [],
  kindHint,
}: {
  post: PostRow
  related?: Related[]
  kindHint?: string
}) {
  const kind = resolveKind(post, kindHint)
  const type =
    norm(post?.type) ||
    norm((post.extras as any)?.subtype) ||
    norm((post.flags as any)?.subtype)

  switch (kind) {
    case 'beneficios':
      return <ArticleBeneficios post={post} related={related} />

    case 'cartoes':
      return <ArticleCartoes post={post} related={related} />

    case 'empregos': {
      const groups = normalizeEmpregoGroups(post)
      if (groups.length > 0 || type === 'lista') {
        const adapted = { ...post, groups } as any
        return <ArticleEmpregosLista post={adapted} related={related} />
      }
      if (type === 'guia') {
        return <ArticleEmpregosGuia post={post as any} related={related} />
      }
      // fallback rico
      return <ArticleCartoes post={post} related={related} />
    }

    // Quando os templates de concursos estiverem prontos, replique a lógica acima com um normalizador similar.
    // case 'concursos': ...

    default:
      return <ArticleCartoes post={post} related={related} />
  }
}
