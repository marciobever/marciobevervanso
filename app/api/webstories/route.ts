// app/api/webstories/route.ts
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Page = {
  id: string;
  bg: string;
  heading: string;
  sub?: string | null;
  cta_url?: string | null;
  cta_label?: string | null;
};

type Payload = {
  slug: string;
  lang?: string;
  title: string;
  publisher: string;
  publisher_logo: string;
  poster_portrait: string;
  canonical_url?: string | null;
  published?: boolean;
  pages: Page[];
};

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
const bad = (s: number, m: string) => json(s, { error: m });
const ok  = (d: any) => json(200, d);

function validate(p: Payload): string | null {
  if (!p.slug) return 'slug é obrigatório';
  if (!p.title) return 'title é obrigatório';
  if (!p.publisher) return 'publisher é obrigatório';
  if (!p.publisher_logo) return 'publisher_logo é obrigatório';
  if (!p.poster_portrait) return 'poster_portrait é obrigatório';
  if (!Array.isArray(p.pages) || p.pages.length === 0) return 'pages precisa ter ao menos 1 item';
  for (const pg of p.pages) {
    if (!pg.id || !pg.bg || !pg.heading) return 'cada página precisa de id/bg/heading';
  }
  return null;
}

/* =======================
   GET  /api/webstories
   Lista webstories (tolerante a colunas ausentes)
   ======================= */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return bad(500, 'Supabase não configurado');

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Busca tudo e filtramos/ordenamos em memória para evitar depender de colunas específicas
  const { data, error } = await supabase.from('webstories').select('*');
  if (error) return bad(500, error.message);

  const list = (Array.isArray(data) ? data : []).map((row: any) => {
    // Fallbacks de campos comuns
    const title = row.title ?? row.name ?? '(sem título)';
    const slug = String(row.slug ?? row.id ?? '').toLowerCase();
    const published = Boolean(row.published ?? row.is_published ?? false);
    const poster_portrait =
      row.poster_portrait ?? row.poster ?? row.cover ?? row.cover_url ?? null;

    // Escolhe um campo de data disponível
    const updated_at =
      row.updated_at ??
      row.published_at ??
      row.created_at ??
      row.updatedAt ??
      row.createdAt ??
      null;

    return {
      slug,
      title,
      published,
      poster_portrait,
      updated_at,
    };
  });

  // Ordena por data (desc), quando houver; sem data, mantém estável no fim
  const dateVal = (v: any) => {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d.getTime() : 0;
    // 0 = sem data -> vai para o fim
  };
  list.sort((a, b) => dateVal(b.updated_at) - dateVal(a.updated_at));

  return ok(list);
}

/* =======================
   POST /api/webstories
   Upsert via webhook (mesmo que você já tinha)
   ======================= */
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key') || '';
  if (!key || key !== process.env.WEBSTORIES_API_KEY) {
    return bad(401, 'unauthorized');
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return bad(400, 'JSON inválido');
  }

  const err = validate(body);
  if (err) return bad(422, err);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey =
    process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !supaKey) return bad(500, 'Supabase não configurado');

  const supabase = createClient(url, supaKey, { auth: { persistSession: false } });

  const payload = {
    slug: body.slug.toLowerCase(),
    lang: body.lang || 'pt-br',
    title: body.title,
    publisher: body.publisher,
    publisher_logo: body.publisher_logo,
    poster_portrait: body.poster_portrait,
    canonical_url: body.canonical_url ?? null,
    published: body.published ?? false,
    pages: body.pages,
  };

  const { data, error } = await supabase
    .from('webstories')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .single();

  if (error) return bad(500, error.message);

  return ok({ ok: true, slug: data.slug, published: data.published });
}