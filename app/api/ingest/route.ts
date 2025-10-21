import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest){
  const body = await req.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { table, rows } = body as { table: string, rows: any[] }
  const whitelist = ['posts','cards','jobs','contests','guides']
  if(!table || !Array.isArray(rows) || !whitelist.includes(table)) return NextResponse.json({ ok:false, error:'bad request' },{ status:400 })
  const { error } = await supabase.from(table).upsert(rows)
  if(error) return NextResponse.json({ ok:false, error: error.message },{ status:500 })
  return NextResponse.json({ ok:true })
}
