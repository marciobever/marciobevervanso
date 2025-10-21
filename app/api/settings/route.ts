import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Leitura pública
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON)
// Escrita/admin (só no server)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE)

type NavItem = { label: string; href: string }
type SettingsRow = {
  id: 'site'
  title: string
  tagline?: string | null
  logo_url?: string | null
  favicon_url?: string | null
  primary_color?: string | null
  nav?: NavItem[] | null
  social?: NavItem[] | null
}

function strOrNull(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  return s.slice(0, max)
}

function asNavList(v: unknown): NavItem[] | null {
  if (!Array.isArray(v)) return null
  const cleaned: NavItem[] = v
    .map((x) => {
      const label = strOrNull((x && (x as any).label) ?? '')
      const href = strOrNull((x && (x as any).href) ?? '', 1000)
      if (!label || !href) return null
      return { label, href }
    })
    .filter(Boolean) as NavItem[]
  return cleaned.length ? cleaned : null
}

export async function GET() {
  const { data, error } = await supabaseAnon
    .from('settings')
    .select('*')
    .eq('id', 'site')
    .maybeSingle<SettingsRow>()

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    { ok: true, settings: data || { id: 'site', title: '' } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const payload: SettingsRow = {
      id: 'site',
      title: strOrNull(body.title, 200) || '',
      tagline: strOrNull(body.tagline, 500),
      logo_url: strOrNull(body.logo_url, 1000),
      favicon_url: strOrNull(body.favicon_url, 1000),
      primary_color: strOrNull(body.primary_color, 20),
      nav: asNavList(body.nav),
      social: asNavList(body.social),
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single<SettingsRow>()

    if (error) throw error

    return NextResponse.json(
      { ok: true, settings: data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Erro inesperado' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
