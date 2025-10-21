# marciobevervanso.com.br

Site em **Next.js 14 (App Router)** com **TypeScript** e **Tailwind CSS**, preparado para **Dashboard** e integrações (Supabase, anúncios, analytics).
Este repositório contém o código-fonte do site **marciobevervanso.com.br**.

> **Status de anúncios**: o projeto está configurado para AdSense e em migração para **Google Ad Manager (GAM)**.

---

## Sumário
- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Dashboard](#dashboard)
- [Endpoints de API](#endpoints-de-api)
- [Publicidade (GAM)](#publicidade-gam)
- [Analytics](#analytics)
- [Estrutura das pastas](#estrutura-das-pastas)
- [Build e Deploy](#build-e-deploy)
- [Comandos úteis](#comandos-úteis)
- [Licença](#licença)

---

## Visão geral
- **Next.js 14 (App Router)** para páginas públicas e área logada.
- **Dashboard** acessível em `/dashboard` para gestão/integrações (modo demonstração quando variáveis não estão configuradas).
- **API interna** para ingestão e revalidação de conteúdo estático (Incremental Static Regeneration).
- **Anúncios**: hoje com AdSense; **migração planejada para Google Ad Manager** (doubleclick / GPT).
- **Pronto para Supabase** (banco, autenticação e storage – opcional).

## Stack
- **Framework**: Next.js 14 (React 18, App Router)
- **Linguagem**: TypeScript
- **UI**: Tailwind CSS (+ utilitários/ícones como `lucide-react`)
- **Dados**: Supabase (opcional)
- **Ads**: AdSense → em migração para **Google Ad Manager (GAM)**
- **Analytics**: GA4 (opcional)

## Requisitos
- **Node.js 18+** (recomendado 18.20+)
- **npm** ou **pnpm**/**yarn** (use um gerenciador, o projeto assume `npm` nos exemplos)
- (Opcional) Conta **Supabase** e **Google** (Ad Manager / Analytics)

## Como rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000

> Em desenvolvimento, se `.env.local` estiver ausente, partes do dashboard rodam em **modo demonstração** (sem persistência).

## Variáveis de ambiente
Crie um arquivo **`.env.local`** na raiz. Variáveis comuns (ligue só o que for usar):

```env
# URL pública do site (sem barra no final)
NEXT_PUBLIC_SITE_URL=https://marciobevervanso.com.br

# --- Supabase (opcional) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Revalidate (ISR) ---
REVALIDATE_SECRET=troque-por-um-segredo-forte

# --- ADS (estado atual: AdSense; destino: GAM) ---
# AdSense — legado (em processo de remoção)
NEXT_PUBLIC_ADSENSE_CLIENT=

# Google Ad Manager (GAM) — migração recomendada
NEXT_PUBLIC_GAM_NETWORK_CODE=
NEXT_PUBLIC_GAM_ADUNIT_CONTENT_TOP=
NEXT_PUBLIC_GAM_ADUNIT_CONTENT_MID=
NEXT_PUBLIC_GAM_ADUNIT_SIDEBAR=
# adicione outros ad units conforme o layout
```

> **Importante**: Nunca commitar chaves/tokens sensíveis. Use variáveis de ambiente no provedor de deploy.

## Dashboard
- Rota: **`/dashboard`**
- Sem `.env.local`, abre em **modo demonstração** (não grava).
- Com Supabase configurado, o dashboard persiste dados e pode acionar integrações.

## Endpoints de API
- `POST /api/ingest`  
  Corpo: `{ table: 'jobs' | 'cards' | 'posts' | 'contests' | 'guides', rows: [...] }`  
  Usa validações leves e insere/atualiza de acordo com a tabela.
- `POST /api/revalidate?secret=REVALIDATE_SECRET`  
  Invalida páginas estáticas alvo (ISR) após mudanças de conteúdo.

> Endpoints adicionais podem existir conforme o ambiente (ex.: busca interna); ver código em `app/api/*`.

## Publicidade (GAM)
O projeto está saindo de AdSense e migrando para **Google Ad Manager**.

**Como habilitar GAM:**
1. Configure as variáveis `NEXT_PUBLIC_GAM_*` no `.env.local`/provedor.
2. Garanta o carregamento de `https://securepubads.g.doubleclick.net/tag/js/gpt.js` (Script único no `layout`).
3. Use componentes de slot GPT (ex.: `GAMSlot`) mapeando cada posição a um `ad unit` (ex.: `/12345678/site/content_top`).  
   - Tamanhos responsivos podem ser fixos por breakpoints ou `fluid`, conforme sua estratégia de inventário.
4. Remova gradualmente o legado de AdSense (`AdSenseScript`, `<ins class="adsbygoogle">`, etc.).

> **Funding Choices (CMP)** pode continuar ativo; não depende de AdSense.

## Analytics
- Recomenda-se **GA4** via tag `gtag.js` ou Google Tag Manager.
- A configuração fica em componente/`layout` de aplicação e lê IDs do `.env.local`.
- Evite inserir o ID diretamente no código; prefira `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

## Estrutura das pastas
Estrutura típica (pode variar conforme evolução do código):
```
app/
  (páginas públicas e rotas /api via App Router)
  dashboard/
  api/
components/
  ads/
  ui.tsx
lib/
  (helpers, clients, configs)
public/
  (imagens estáticas, ícones)
```

## Build e Deploy
- **Vercel** (recomendado): conecte o repositório e configure as variáveis em **Settings → Environment Variables**.
- **Build**: `npm run build`
- **Start** (produção): `npm run start`
- Configure domínios (primário e alternativos) na plataforma de hospedagem.

## Comandos úteis
```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # inicia a build
npm run lint       # lint opcional
```

## Licença
© 2025 Marcio Bevervanso. Todos os direitos reservados.
