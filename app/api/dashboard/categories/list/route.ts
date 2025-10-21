// app/api/dashboard/categories/list/route.ts
import { NextResponse } from 'next/server'
import { supaAdmin } from '@/lib/supa-admin'

const FIXED = [
  { name: 'Benefícios', description: 'Programas sociais e benefícios governamentais' },
  { name: 'Cartões', description: 'Cartões de crédito e débito' },
  { name: 'Empregos', description: 'Oportunidades de trabalho' },
  { name: 'Concursos', description: 'Concursos públicos e seleções' },
]

export async function GET() {
  try {
    const db = supaAdmin()

    // Garante que as fixas existam
    await db.from('categories').upsert(FIXED, { onConflict: 'name' })

    const { data, error } = await db.from('categories').select('*').order('name')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true, items: data || [] })
  } catch (err: any) {
    console.error('[categories/list] exception:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Erro inesperado' }, { status: 500 })
  }
}
