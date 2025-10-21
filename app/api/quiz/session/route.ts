import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { quiz_id, answers, score, email, result_key } = body
    const { error } = await supabase.from('quiz_sessions').insert({
      quiz_id, answers, score, email: email || null, result_key: result_key || null
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 500 })
  }
}
