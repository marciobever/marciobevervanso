// app/layout.tsx
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import FundingChoicesScript from '@/components/FundingChoicesScript'
import Analytics from '@/components/Analytics'
import GAMBootstrap from '@/components/ads/GAMBootstrap'
import type { Metadata } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://marciobevervanso.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Mapa do Crédito', template: '%s — Mapa do Crédito' },
  description: 'Cartões, Empregos, Concursos e Guias — em um só lugar.',
  alternates: { canonical: SITE },
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'Mapa do Crédito',
    url: SITE,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Mapa do Crédito' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og-default.jpg'] },
}

// ⚠️ Funding Choices usa o **publisher ID** (AdX/AdSense), não o network code
const FC_PUB = (process.env.NEXT_PUBLIC_FC_PUB || 'pub-1610389804575958').trim()

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        {/* Videoo.tv – precisa estar no HEAD (snippet oficial) */}
        <script
          defer
          id="videoowall"
          data-id="a4ee5d6b80c91488ada774c8d658cf4e74f25043d10e44697965e620f24742ba"
          data-cfasync="false"
          src="https://static.videoo.tv/a4ee5d6b80c91488ada774c8d658cf4e74f25043d10e44697965e620f24742ba.js"
        ></script>

        {/* Preconnects úteis */}
        <link rel="preconnect" href="https://securepubads.g.doubleclick.net" crossOrigin="" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />

        {/* ✅ CMP deve carregar o quanto antes (expõe __tcfapi) */}
        <FundingChoicesScript client={FC_PUB} />
      </head>

      <body className={`${plusJakarta.variable} font-sans antialiased text-slate-900 min-h-screen flex flex-col`}>
        {/* ✅ GPT só depois do CMP (evita “IAB TCF signal not received”) */}
        <GAMBootstrap />

        {/* Analytics (respeita consent) */}
        <Analytics />

        <Header />
        <main id="content" className="flex-1">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
        <Footer />
      </body>
    </html>
  )
}
