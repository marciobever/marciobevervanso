import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, service, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  try {
    const { id, action } = (await req.json()) as { id: string; action: 'publish' | 'draft' }
    if (!id || !action) throw new Error('id/action faltando')

    const { error } = await db()
      .from('posts')
      .update({ status: action === 'publish' ? 'published' : 'draft' })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'fail' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = (await req.json()) as { id: string }
    if (!id) throw new Error('id faltando')

    const { error } = await db().from('posts').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'fail' }, { status: 500 })
  }
}
