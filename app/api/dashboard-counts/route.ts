import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const TABLES = ['posts','categories','webstories'] as const

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const db = createClient(url, service, { auth: { persistSession: false } })

    const only = new URL(req.url).searchParams.get('only')?.split(',').filter(Boolean)
    const list = (only && only.length) ? only : TABLES

    const counts: Record<string, number> = {}
    await Promise.all(
      list.map(async (table) => {
        const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
        counts[table] = !error && typeof count === 'number' ? count : 0
      })
    )
    // n8n é "virtual"
    if (!only || only.includes('n8n')) counts['n8n'] = 1

    return NextResponse.json({ ok: true, counts })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'fail' }, { status: 500 })
  }
}