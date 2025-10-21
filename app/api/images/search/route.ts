// app/api/images/search/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function mapResults(items: any[], source: 'pexels' | 'pixabay') {
  if (source === 'pexels') {
    return (items || []).map((p: any) => ({
      url: p?.src?.large2x || p?.src?.large || p?.src?.original || p?.url,
      thumb: p?.src?.medium || p?.src?.small,
      photographer: p?.photographer,
      source: 'pexels' as const,
    }))
  }
  // pixabay
  return (items || []).map((h: any) => ({
    url: h?.largeImageURL || h?.webformatURL || h?.previewURL,
    thumb: h?.previewURL,
    photographer: h?.user,
    source: 'pixabay' as const,
  }))
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const provider = (searchParams.get('provider') || 'pexels').toLowerCase()

    if (!q) return NextResponse.json({ results: [] })

    if (provider === 'pexels') {
      const key = process.env.PEXELS_API_KEY
      if (!key) return NextResponse.json({ results: [] }, { status: 200 })
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=8`,
        { headers: { Authorization: key }, cache: 'no-store' }
      )
      if (!res.ok) return NextResponse.json({ results: [] }, { status: 200 })
      const data = await res.json()
      return NextResponse.json({ results: mapResults(data?.photos, 'pexels') })
    }

    // pixabay
    const key = process.env.PIXABAY_API_KEY
    if (!key) return NextResponse.json({ results: [] }, { status: 200 })
    const res = await fetch(
      `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&per_page=8&safesearch=true`,
      { cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ results: [] }, { status: 200 })
    const data = await res.json()
    return NextResponse.json({ results: mapResults(data?.hits, 'pixabay') })
  } catch (e: any) {
    console.error(e)
    // nunca 405/500 pro UI — devolve vazio pra seguir com fallback
    return NextResponse.json({ results: [], error: e?.message }, { status: 200 })
  }
}
