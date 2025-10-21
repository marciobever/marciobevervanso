import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/* ---------------- utils ---------------- */
const esc = (v: any) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

type Pos = 'top'|'center'|'bottom'
type Tone = 'dark'|'light'

const posClass = (p?: string) =>
  (p || 'bottom').toLowerCase() === 'top' ? 'pos-top'
  : (p || 'bottom').toLowerCase().match(/^(center|middle)$/) ? 'pos-center'
  : 'pos-bottom'

const toneClass = (t?: string) =>
  (t || 'dark').toLowerCase() === 'light' ? 'tone-light' : 'tone-dark'

const themeClass = (t?: string) => {
  const k = (t || 'classic').toLowerCase()
  return ['classic','glass','bold','neo','minimal'].includes(k) ? `t-${k}` : 't-classic'
}

/* CSS com diferenças BEM visíveis por tema  */
function themeCSS() {
  return `
  amp-story {
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif;
    color:#fff;
  }
  .content { padding:22px; display:grid; min-height:100%; }
  .content.pos-top    { align-content:start; }
  .content.pos-center { align-content:center; }
  .content.pos-bottom { align-content:end; }

  .content.tone-dark  .box { background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.65)); color:#fff; }
  .content.tone-light .box { background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.85)); color:#111; }
  .box { border-radius:18px; padding:16px 18px; }

  h2 { margin: 0 0 8px 0; line-height:1.1; text-wrap: balance; }
  p  { margin: 0; line-height:1.35; }
  .btn { display:inline-block; margin-top:12px; font-weight:800; font-size:14px; padding:10px 14px; border-radius:12px; text-decoration:none; }

  /* classic */
  body.t-classic h2 { font-size:28px; font-weight:900; letter-spacing:-.01em; text-shadow:0 2px 18px rgba(0,0,0,.55); }
  body.t-classic p  { font-size:15px; opacity:.95; }
  body.t-classic .btn { background:#fff; color:#111; }

  /* glass */
  body.t-glass .box { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border:1px solid rgba(255,255,255,.35); }
  body.t-glass h2   { font-size:26px; font-weight:800; }
  body.t-glass p    { font-size:14px; }
  body.t-glass .btn { background:#fff; color:#111; }

  /* bold */
  body.t-bold .box { box-shadow: 0 18px 60px rgba(0,0,0,.45); border:2px solid rgba(251,146,60,.7); }
  body.t-bold h2   { font-size:32px; font-weight:1000; letter-spacing:-.02em; text-shadow:0 3px 22px rgba(0,0,0,.6); }
  body.t-bold p    { font-size:15px; }
  body.t-bold .btn { background:#fb923c; color:#111; }

  /* neo */
  body.t-neo .box { border:1px solid rgba(56,189,248,.5); box-shadow: 0 10px 40px rgba(56,189,248,.25); }
  body.t-neo h2   { font-size:28px; font-weight:900; text-shadow: 0 0 36px rgba(56,189,248,.8); }
  body.t-neo p    { font-size:14px; }
  body.t-neo .btn { background:#38bdf8; color:#111; }

  /* minimal */
  body.t-minimal .box { background: none !important; padding: 0; }
  body.t-minimal h2   { font-size:22px; font-weight:800; text-shadow:none; }
  body.t-minimal p    { font-size:13px; opacity:.95; }
  body.t-minimal .btn { background:#fff; color:#111; border-radius:10px; }
  `
}

/* ---------------- handler ---------------- */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  if (!url || !key) {
    return new NextResponse('Supabase não configurado', { status: 500 })
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('webstories')
    .select('slug,title,publisher,publisher_logo,poster_portrait,pages,canonical_url,template')
    .eq('slug', params.slug)
    .maybeSingle()

  if (error || !data) return new NextResponse('Not found', { status: 404 })

  const pages = Array.isArray(data.pages) ? data.pages : []
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const canonical = data.canonical_url || `${siteURL}/webstories/${params.slug}`
  const tplClass = themeClass((data as any).template)

  // 👉 GAM para AMP Story (DoubleClick)
  // Ex.: NEXT_PUBLIC_GAM_STORY_ADUNIT=/23287346478/marciobevervanso.com/amp_story_auto
  const gamStoryAdUnit = process.env.NEXT_PUBLIC_GAM_STORY_ADUNIT || ''

  const storyPages = pages.map((pg: any) => {
    const bg = pg?.bg || pg?.image?.url || ''
    const heading = esc(pg?.heading || '')
    const sub = esc(pg?.sub || '')
    const pos = posClass(pg?.overlay?.pos as Pos)
    const tone = toneClass(pg?.overlay?.tone as Tone)
    const cta =
      pg?.cta_url && pg?.cta_label
        ? `<a class="btn" href="${esc(pg.cta_url)}" target="_blank" rel="nofollow noopener">${esc(pg.cta_label)}</a>`
        : ''
    return `
  <amp-story-page id="${esc(pg.id)}">
    <amp-story-grid-layer template="fill">
      <amp-img src="${esc(bg)}" width="720" height="1280" layout="responsive"></amp-img>
    </amp-story-grid-layer>
    <amp-story-grid-layer template="vertical" class="content ${pos} ${tone}">
      <div class="box">
        <h2>${heading}</h2>
        ${sub ? `<p>${sub}</p>` : ''}
        ${cta}
      </div>
    </amp-story-grid-layer>
  </amp-story-page>`
  }).join('\n')

  // ✅ Usa GAM se configurado; caso contrário, não injeta anúncios.
  const autoAds = gamStoryAdUnit
    ? `
  <amp-story-auto-ads>
    <script type="application/json">
      {
        "ad-attributes": {
          "type": "doubleclick",
          "data-slot": "${esc(gamStoryAdUnit)}"
        }
      }
    </script>
  </amp-story-auto-ads>`
    : ''

  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? `
  <amp-analytics type="gtag" data-credentials="include">
    <script type="application/json">
      {
        "vars": {
          "gtag_id": "${esc(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)}",
          "config": { "${esc(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)}": { "groups": "default" } }
        }
      }
    </script>
  </amp-analytics>` : ''

  const html = `<!doctype html>
<html amp lang="pt-br">
<head>
  <meta charset="utf-8">
  <title>${esc(data.title)}</title>
  <link rel="canonical" href="${esc(canonical)}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
  <script async custom-element="amp-story-auto-ads" src="https://cdn.ampproject.org/v0/amp-story-auto-ads-0.1.js"></script>
  <style amp-boilerplate>
    body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
      -moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
      -ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
      animation:-amp-start 8s steps(1,end) 0s 1 normal both}
    @-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
  </style>
  <noscript><style amp-boilerplate>
    body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}
  </style></noscript>
  <style amp-custom>
    ${themeCSS()}
  </style>
</head>
<body class="${tplClass}">
  <amp-story
    standalone
    title="${esc(data.title)}"
    publisher="${esc(data.publisher || 'Receita Popular')}"
    publisher-logo-src="${esc(data.publisher_logo || '')}"
    poster-portrait-src="${esc(data.poster_portrait || '')}">
    ${autoAds}
    ${storyPages}
  </amp-story>
  ${ga}
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
