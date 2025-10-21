import { NextResponse } from 'next/server'
import { saveAdsConfig } from '@/lib/ads-config'
import type { AdsConfig } from '@/lib/ads-config'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    // aceitar parcial; o helper faz o merge + saneamento
    const incoming = (body?.data || body) as Partial<AdsConfig>

    // ⚠️ Sem delete: o helper já ignora strings vazias e aplica defaults
    const saved = await saveAdsConfig(incoming as AdsConfig)

    return NextResponse.json({ ok: true, data: saved })
  } catch (e) {
    console.error('[api][ads][save-config][POST] error', e)
    return NextResponse.json(
      { error: 'failed_to_save_ads_config' },
      { status: 500 }
    )
  }
}
