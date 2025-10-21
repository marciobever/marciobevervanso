// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },

  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",

      // ===== SCRIPTS =====
      // GPT/GAM + CMP + GTM/GA + AMP + Videoo + Google
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
        "https://securepubads.g.doubleclick.net " +
        "https://googleads.g.doubleclick.net " +
        "https://pagead2.googlesyndication.com " +
        "https://tpc.googlesyndication.com " +
        "https://fundingchoicesmessages.google.com " +
        "https://www.googletagmanager.com " +
        "https://www.google-analytics.com " +
        "https://region1.google-analytics.com " +
        "https://www.gstatic.com " +
        "https://www.google.com " +
        "https://cdn.ampproject.org " +
        "https://static.videoo.tv",

      // ===== IFRAMES =====
      // Safeframe + CMP + GTM preview + Google
      "frame-src 'self' " +
        "https://fundingchoicesmessages.google.com " +
        "https://googleads.g.doubleclick.net " +
        "https://securepubads.g.doubleclick.net " +
        "https://pagead2.googlesyndication.com " +
        "https://tpc.googlesyndication.com " +
        "https://*.googlesyndication.com " +
        "https://www.googletagmanager.com " +
        "https://www.google.com",

      // ===== CONNECT (XHR/fetch/beacon) =====
      // ATQ (ep1/epl), CSI, GA/Region1, GPT, FundingChoices, Videoo, Supabase
      "connect-src 'self' " +
        "https://securepubads.g.doubleclick.net " +
        "https://googleads.g.doubleclick.net " +
        "https://pagead2.googlesyndication.com " +
        "https://fundingchoicesmessages.google.com " +
        "https://epl.adtrafficquality.google.com " +
        "https://ep1.adtrafficquality.google.com " +
        "https://csi.gstatic.com " +
        "https://www.google-analytics.com " +
        "https://region1.google-analytics.com " +
        "https://www.googletagmanager.com " +
        "https://t.videoo.tv " +
        "https://static.videoo.tv " +
        "https://*.supabase.co",

      // ===== MÍDIA/IMAGENS/ESTILO/FONTES/WORKERS =====
      "img-src 'self' data: blob: https:",
      "media-src 'self' https: data: blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' https: data:",
      "worker-src 'self' blob:",
      // evita clickjacking de terceiros
      "frame-ancestors 'self'"
    ].join('; ')

    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    }]
  },
}

export default nextConfig
