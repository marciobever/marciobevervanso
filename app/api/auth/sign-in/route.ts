// app/api/auth/sign-in/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false }
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 401 })
  }

  const token = data.session?.access_token ?? ''
  const isProd = process.env.NODE_ENV === 'production'

  const res = NextResponse.json({ ok: true })

  // ⚠️ Em dev (http://localhost), NÃO pode secure:true
  res.cookies.set('sb_access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,     // true só em produção (https)
    path: '/',
    maxAge: 60 * 60     // 1h
  })

  return res
}