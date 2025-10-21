import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { name, email, answers, source } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // server only
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.from('quiz_leads').insert({
      name,
      email,
      answers,
      source
    })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[api/quiz/lead]', err?.message || err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
