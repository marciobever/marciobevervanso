// app/api/dashboard/categories/save/route.ts
import { NextResponse } from 'next/server'
import { supaAdmin } from '@/lib/supa-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const db = supaAdmin()

    // payload básico
    const payload = {
      name: body.name?.trim(),
      description: body.description?.trim() || null,
    }

    if (!payload.name) {
      return NextResponse.json({ ok: false, error: 'Nome da categoria é obrigatório' }, { status: 400 })
    }

    const { data, error } = await db
      .from('categories')
      .upsert(payload, { onConflict: 'name' })
      .select()
      .single()

    if (error) {
      console.error('[categories/save] erro:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, category: data })
  } catch (err: any) {
    console.error('[categories/save] exception:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Erro inesperado' }, { status: 500 })
  }
}
