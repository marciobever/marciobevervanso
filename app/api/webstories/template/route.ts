// app/api/webstories/template/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type TemplateKey = 'classic' | 'bold' | 'glass' | 'minimal'

function normalizeTemplate(v: any): TemplateKey {
  const k = String(v ?? '').trim().toLowerCase()
  if (['classic','bold','glass','minimal'].includes(k)) return k as TemplateKey
  if (['glassmorphism','glassmorph','frosted','blur','frost'].includes(k)) return 'glass'
  if (['strong','impact','heavy','big'].includes(k)) return 'bold'
  if (['clean','simple','minimalist'].includes(k)) return 'minimal'
  return 'classic'
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  const slug = String(body.slug || '').trim()
  const template = normalizeTemplate(body.template)

  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug obrigatório' }, { status: 422 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Supabase não configurado' }, { status: 500 })
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data, error } = await supabase
    .from('webstories')
    .update({ template })
    .eq('slug', slug)
    .select('slug, template')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, slug, template: data?.template })
}