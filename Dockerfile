# syntax=docker/dockerfile:1.7-labs

########### Build-time defaults (placeholders) ###########
ARG NEXT_PUBLIC_SUPABASE_URL=http://build-placeholder
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=build-placeholder
ARG SUPABASE_URL=http://build-placeholder
ARG SUPABASE_SERVICE_ROLE_KEY=build-placeholder
ARG NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-placeholder

######################## Base ########################
FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

######################## Deps ########################
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

######################## Build ########################
FROM base AS builder
# injeta placeholders só no build (evita falhas por env ausentes)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_ADSENSE_CLIENT

ENV NODE_ENV=production \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    SUPABASE_URL=${SUPABASE_URL} \
    SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY} \
    NEXT_PUBLIC_ADSENSE_CLIENT=${NEXT_PUBLIC_ADSENSE_CLIENT}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

####################### Runtime #######################
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# curl para healthcheck do Coolify
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# usuário não-root
RUN useradd -m -u 1001 nextjs

# 👉 Copia o que o next start precisa (sempre)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Healthcheck (troque para "/" se preferir)
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

USER nextjs

# Sobe com next start sempre (sem standalone)
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
