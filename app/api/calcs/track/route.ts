import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request){
  const body = await req.json().catch(()=>null)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await sb.from('calc_events').insert(body)
  if (error) return NextResponse.json({ok:false,error:error.message},{status:500})
  return NextResponse.json({ok:true})
}
