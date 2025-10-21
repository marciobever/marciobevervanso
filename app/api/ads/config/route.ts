import { NextResponse } from 'next/server'
import { getAdsConfig } from '@/lib/ads-config'

export async function GET() {
  try {
    const data = await getAdsConfig()
    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e) {
    console.error('[api][ads][config][GET] error', e)
    return NextResponse.json(
      { error: 'failed_to_load_ads_config' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
