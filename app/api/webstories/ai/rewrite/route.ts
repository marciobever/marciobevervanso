// app/api/webstory/ai/rewrite/route.ts
import { NextRequest } from 'next/server';

type SlideIn = {
  id: string;
  type?: 'cover' | 'content' | 'cta';
  heading: string;
  sub?: string | null;
  cta_url?: string | null;
  cta_label?: string | null;
};
type BodyIn = {
  term?: string;
  title?: string;
  tone?: 'objetivo' | 'didático' | 'convincente' | 'neutro' | string;
  slides: SlideIn[];
};

const MODEL = 'gemini-1.5-flash';
const API = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

function bad(status: number, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function ok(data: any) {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
function stripFence(s: string) {
  return s.replace(/^\s*```[a-zA-Z0-9-]*\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
function safeParseJSON(text: string): any | null {
  try { return JSON.parse(text); } catch {
    const start = text.indexOf('{'); const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}
function clampLine(s: string, max: number) {
  const one = (s || '').replace(/\s+/g, ' ').trim();
  return one.length <= max ? one : one.slice(0, max);
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) return bad(500, 'GEMINI_API_KEY ausente');

  let body: BodyIn;
  try { body = await req.json(); } catch { return bad(400, 'JSON inválido'); }
  if (!body || !Array.isArray(body.slides) || body.slides.length === 0) {
    return bad(422, 'Envie { slides: [{ id, heading, sub? }] }');
  }

  const slides = body.slides
    .map((s) => ({
      id: String(s.id || '').trim(),
      type: s.type || 'content',
      heading: String(s.heading || '').trim(),
      sub: (s.sub ?? '') ? String(s.sub).trim() : '',
      cta_url: s.cta_url ?? null,
      cta_label: s.cta_label ?? null,
    }))
    .filter((s) => s.id && s.heading);

  if (!slides.length) return bad(422, 'Nenhum slide válido (id/heading obrigatórios)');

  const sys = [
    'Você é um copywriter de Web Stories (PT-BR).',
    'Reescreva **heading** (máx 60 caracteres, 1–2 linhas com \\n opcional) e **sub** (máx 90 caracteres, até 2 linhas).',
    'Estilo claro, direto; 1 ideia por slide; evitar hashtags/emojis/valores enganosos.',
    'Se "type=cover", foque promessa/benefício; se "cta", foque chamada para ação.',
    `TOM: ${body.tone || 'objetivo'}.`,
    'Responda SOMENTE em JSON válido: {"slides":[{ "id":"...", "heading":"...", "sub":"" }]}',
  ].join('\n');

  const userPayload = {
    context: { term: body.term || '', title: body.title || '' },
    slides: slides.map((s) => ({ id: s.id, type: s.type, heading: s.heading, sub: s.sub || '' })),
    constraints: { headingMax: 60, subMax: 90, language: 'pt-BR' },
  };

  const reqBody = {
    contents: [{ parts: [{ text: `${sys}\n\nINPUT:\n${JSON.stringify(userPayload, null, 2)}` }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  };

  try {
    const r = await fetch(API(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });
    const j = await r.json();
    if (!r.ok) return ok({ ok: false, error: 'gemini_error', status: r.status, detail: j });

    const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('\n') || '';
    const cleaned = stripFence(String(text || ''));
    const parsed = safeParseJSON(cleaned);
    if (!parsed || !Array.isArray(parsed.slides)) return ok({ ok: false, error: 'parse_fail', raw: cleaned.slice(0, 500) });

    const byId: Record<string, { heading: string; sub?: string }> = {};
    for (const s of parsed.slides) {
      if (!s || !s.id) continue;
      byId[String(s.id)] = {
        heading: clampLine(String(s.heading || ''), 60),
        sub: clampLine(String(s.sub || ''), 90),
      };
    }

    const out = slides.map((s) => {
      const upd = byId[s.id];
      return {
        ...s,
        heading: upd?.heading || s.heading,
        sub: typeof upd?.sub === 'string' ? upd.sub : s.sub || '',
      };
    });

    return ok({ ok: true, slides: out });
  } catch (e: any) {
    return ok({ ok: false, error: 'rewrite_exception', detail: String(e?.message || e) });
  }
}