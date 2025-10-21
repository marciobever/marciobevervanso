import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** Schema esperado (mínimo) */
type Story = {
  slug: string
  lang: string
  title: string
  publisher: string
  publisher_logo: string
  poster_portrait: string
  canonical_url?: string | null
  published: boolean
  // páginas simples; expanda conforme seu fluxo
  pages: Array<{
    id: string
    bg: string
    heading: string
    sub?: string | null
    cta_url?: string | null
    cta_label?: string | null
  }>
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { slug: string } }
) {
  const slug = sanitizeSlug(ctx.params?.slug || '')

  // --- Supabase client (server) ---
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Use a que preferir: ANON (somente dados públicos) OU SERVICE_ROLE (server-only, acesso amplo)
  const key =
    process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return plainText(500, 'Supabase URL/KEY não configurados.')
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // --- Busca a story por slug ---
  const { data, error } = await supabase
    .from('webstories')
    .select('*')
    .eq('slug', slug)
    .eq('published', true) // remova este filtro se quiser servir rascunhos
    .limit(1)
    .maybeSingle<Story>()

  if (error) {
    return plainText(500, `Erro ao buscar story: ${error.message}`)
  }
  if (!data) {
    return plainText(404, 'Web Story não encontrada')
  }

  // --- Validação mínima ---
  const err = validateStory(data)
  if (err) return plainText(422, `Story inválida: ${err}`)

  // --- Render AMP ---
  const html = renderAmp(data)

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Cache control — ajuste a gosto
      'Cache-Control': 'public, max-age=300, s-maxage=1200, stale-while-revalidate=600',
    },
  })
}

/* ---------------- helpers ---------------- */

function sanitizeSlug(s: string) {
  return String(s).replace(/[^a-z0-9\-_/]/gi, '').toLowerCase()
}

function plainText(status: number, msg: string) {
  return new Response(msg, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function validateStory(s: Story): string | null {
  if (!s.title || !s.publisher || !s.publisher_logo || !s.poster_portrait) {
    return 'campos obrigatórios ausentes (title/publisher/publisher_logo/poster_portrait)'
  }
  if (!Array.isArray(s.pages) || s.pages.length === 0) {
    return 'precisa ter ao menos 1 página'
  }
  for (const p of s.pages) {
    if (!p.id || !p.bg || !p.heading) return 'cada página precisa de id/bg/heading'
  }
  return null
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as const)[c]!
  )
}

function renderAmp(s: Story) {
  const lang = s.lang || 'pt-br'
  const title = esc(s.title)
  const publisher = esc(s.publisher)
  const publisherLogo = s.publisher_logo
  const posterPortrait = s.poster_portrait
  const canonical = s.canonical_url || `https://mapadocredito.com.br/webstories/${esc(s.slug)}`

  return `<!doctype html>
<html amp lang="${lang}">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="canonical" href="${canonical}">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">

    <!-- AMP runtime + components -->
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
    <script async custom-element="amp-img"   src="https://cdn.ampproject.org/v0/amp-img-0.1.js"></script>
    <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>

    <!-- AMP boilerplate -->
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
    <noscript>
      <style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style>
    </noscript>

    <!-- SEO -->
    <meta name="description" content="${title}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:image" content="${posterPortrait}">
    <meta name="twitter:card" content="summary_large_image">

    <!-- Estilos mínimos -->
    <style amp-custom>
      .cover-gradient{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.55) 70%)}
      .stack{display:flex;flex-direction:column;gap:.5rem;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.35);padding:24px}
      .bottom{justify-content:flex-end}
      h1{font-size:32px;line-height:1.05;margin:0;font-weight:800}
      p{font-size:16px;line-height:1.35;margin:0;opacity:.95}
      .chip{display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.15);backdrop-filter:blur(4px);font-size:12px;font-weight:700;letter-spacing:.02em}
      .cta{display:inline-block;padding:12px 16px;border-radius:12px;background:#0ea5e9;color:#fff;font-weight:800;text-decoration:none}
    </style>
  </head>
  <body>
    <amp-story
      standalone
      title="${title}"
      publisher="${publisher}"
      publisher-logo-src="${publisherLogo}"
      poster-portrait-src="${posterPortrait}"
    >
      ${s.pages.map(pageAmp).join('\n')}
    </amp-story>
  </body>
</html>`
}

function pageAmp(p: Story['pages'][number]) {
  const heading = esc(p.heading)
  const sub = p.sub ? `<p>${esc(p.sub)}</p>` : ''
  const cta = p.cta_url
    ? `<a class="cta" href="${p.cta_url}" target="_top">${esc(p.cta_label || 'Saiba mais')}</a>`
    : ''
  return `
  <amp-story-page id="${esc(p.id)}">
    <amp-story-grid-layer template="fill">
      <amp-img src="${p.bg}" width="720" height="1280" layout="responsive"></amp-img>
    </amp-story-grid-layer>
    <amp-story-grid-layer template="fill">
      <div class="cover-gradient"></div>
    </amp-story-grid-layer>
    <amp-story-grid-layer template="vertical">
      <div class="stack bottom">
        <span class="chip">Mapa do Crédito</span>
        <h1>${heading}</h1>
        ${sub}
        ${cta}
      </div>
    </amp-story-grid-layer>
  </amp-story-page>`
}