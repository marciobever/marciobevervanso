import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const missing = [
        !SUPABASE_URL && 'SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)',
        !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
      ].filter(Boolean).join(', ')
      return NextResponse.json({ ok: false, message: `Config ausente: ${missing}.` }, { status: 500 })
    }

    const { email, name, source = 'home', tags = [], meta = {} } = await req.json()
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, message: 'E-mail inválido.' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      // sem schema custom — estamos em public
    })

    const payload = {
      email: String(email).trim(),
      name: name ? String(name).slice(0, 120) : null,
      source: String(source).slice(0, 40),
      tags: Array.isArray(tags) ? tags.slice(0, 12) : [],
      meta: { ...meta, ua: req.headers.get('user-agent')?.slice(0, 200) ?? null },
    }

    const { error } = await supabase.from('subscribers').insert([payload])

    if (error && (error as any).code === '23505') {
      return NextResponse.json({ ok: true, message: 'E-mail já inscrito.' })
    }
    if (error) {
      return NextResponse.json({ ok: false, message: `Erro ao inscrever: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Inscrição realizada com sucesso!' }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? 'Erro inesperado.' }, { status: 500 })
  }
}
