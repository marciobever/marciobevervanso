// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const LEGACY_TYPE_MAP: Record<string, string> = {
  beneficios: 'beneficios',
  'benefícios': 'beneficios',
  cartoes: 'cartoes',
  'cartões': 'cartoes',
  concursos: 'concursos',
  empregos: 'empregos',
}

function isDevEnv(req: NextRequest) {
  const { hostname } = req.nextUrl
  return (
    (process.env.NODE_ENV || '').toLowerCase() === 'development' ||
    String(hostname).includes('localhost') ||
    String(hostname).includes('127.0.0.1')
  )
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // 0) ignora raiz e caminhos já canônicos
  if (pathname === '/' || pathname.startsWith('/posts/')) {
    return NextResponse.next()
  }

  // 1) redirect canônico APENAS para rotas legadas 2-segmentos "/tipo/slug"
  //    Ex.: /beneficios/abc → /posts/beneficios/abc
  if (!pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/assets')) {
    const m = pathname.match(/^\/([^/]+)\/([^/]+)\/?$/)
    if (m) {
      const seg1 = decodeURIComponent(m[1].toLowerCase())
      const seg2 = decodeURIComponent(m[2])
      const mapped = LEGACY_TYPE_MAP[seg1]
      if (mapped) {
        const url = req.nextUrl.clone()
        url.pathname = `/posts/${mapped}/${seg2}`
        url.search = search
        return NextResponse.redirect(url, 308)
      }
    }
  }

  // 2) proteção do dashboard (produção apenas)
  const isDev = isDevEnv(req)
  if (isDev) return NextResponse.next()

  if (pathname === '/dashboard/login') {
    return NextResponse.next()
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const token = req.cookies.get('sb_access_token')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Aplica no site inteiro exceto estes prefixos/arquivos
    '/:path((?!_next|api|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json).*)',
  ],
}