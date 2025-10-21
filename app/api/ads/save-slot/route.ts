import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const s = await req.json()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{ persistSession:false, autoRefreshToken:false }})

  const { data: row } = await sb.from('ads_slots').select('id').eq('key', s.key).maybeSingle()
  if (!row) {
    const { error } = await sb.from('ads_slots').insert(s)
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  } else {
    const { error } = await sb.from('ads_slots').update(s).eq('id', row.id)
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  }
  return NextResponse.json({ ok:true })
}
