import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // delete exige service role
)

export async function POST(req: Request) {
  try {
    const { id } = await req.json() as { id?: string }
    if (!id) return NextResponse.json({ ok: false, error: 'id ausente' }, { status: 400 })

    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'erro' }, { status: 500 })
  }
}
