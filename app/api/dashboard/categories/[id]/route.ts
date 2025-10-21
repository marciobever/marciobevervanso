import { NextRequest, NextResponse } from 'next/server'
import { supaAdmin } from '@/lib/supa-admin'

// GET: buscar categoria única
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = supaAdmin()
    const { data, error } = await db.from('categories').select('*').eq('id', params.id).single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 })
    return NextResponse.json({ ok: true, category: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Erro inesperado' }, { status: 500 })
  }
}

// PATCH: atualizar categoria
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const db = supaAdmin()

    const { data, error } = await db
      .from('categories')
      .update({
        name: body.name?.trim(),
        description: body.description?.trim() || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, category: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Erro inesperado' }, { status: 500 })
  }
}

// DELETE: apagar categoria
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = supaAdmin()
    const { error } = await db.from('categories').delete().eq('id', params.id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Erro inesperado' }, { status: 500 })
  }
}
