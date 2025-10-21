// app/dashboard/webstories/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Image as ImageIcon, ChevronRight, ChevronLeft, Check } from 'lucide-react';

type Img = {
  id: string;
  provider?: string;
  full: string;
  thumb?: string;
  w?: number;
  h?: number;
  alt?: string;
  page?: string;
  host?: string;
  score?: number;
};

type MetaSlides = {
  id: string;
  type?: 'cover' | 'content' | 'cta';
  heading: string;
  sub?: string | null;
  cta_url?: string | null;
  cta_label?: string | null;
  overlay?: { pos?: 'top' | 'bottom' | 'center'; tone?: 'dark' | 'light' };
};

function slugify(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function NewWebstoryPage() {
  // ===== UI / state =====
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [data, setData] = useState<{
    constraints: { min: number; max: number };
    images: Img[];
    meta?: {
      title?: string;
      summary?: string;
      tags?: string[];
      slug?: string;
      published?: boolean;
      slides?: MetaSlides[];
      ai_prompts?: { cover_prompt?: string; fallback_prompts?: string[] };
    };
  } | null>(null);

  // fluxo em 2 passos
  const [step, setStep] = useState<'select' | 'captions'>('select');

  // seleção: capa travada + slides ordenados
  const [coverId, setCoverId] = useState<string | null>(null);
  const [slideIds, setSlideIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const minTotal = data?.constraints?.min ?? 8;
  const maxTotal = data?.constraints?.max ?? 12;
  const minSlides = Math.max(1, minTotal - 1);
  const maxSlides = Math.max(1, maxTotal - 1);

  // mapeamento de providers pra badge/anel
  const badgeClasses: Record<string, string> = {
    pexels: 'bg-emerald-600',
    pixabay: 'bg-sky-600',
    searchapi: 'bg-purple-600',
    ai: 'bg-pink-600',
    other: 'bg-slate-700',
  };
  const ringClasses: Record<string, string> = {
    pexels: 'ring-emerald-500',
    pixabay: 'ring-sky-500',
    searchapi: 'ring-purple-500',
    ai: 'ring-pink-500',
    other: 'ring-slate-500',
  };

  // === Geração (n8n) ===
  async function generate() {
    setErr(null);
    setData(null);
    setCoverId(null);
    setSlideIds([]);
    setStep('select');

    if (!term.trim()) {
      setErr('Informe um tema');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/webstories/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, slides_min: 8, slides_max: 12 }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Falha ao gerar');
      setData({
        constraints: json.constraints,
        images: Array.isArray(json.images) ? json.images : [],
        meta: json.meta || {},
      });
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // === Seleção ===
  function setCover(id: string) {
    setCoverId(id);
  }
  function toggleSlide(id: string) {
    setSlideIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (coverId === id) return prev; // capa não entra
      if (prev.length >= maxSlides) return prev; // trava no máximo
      return [...prev, id];
    });
  }

  const canGoNext = !!coverId && slideIds.length >= minSlides && slideIds.length <= maxSlides;

  // ====== Etapa 2: Legendas por imagem ======
  const [slidesText, setSlidesText] = useState<MetaSlides[]>([]);
  const [rewritingIdx, setRewritingIdx] = useState<number | null>(null);

  const selectedImages: Img[] = useMemo(() => {
    if (!data) return [];
    const byId = new Map(data.images.map((i) => [i.id, i]));
    const cover = coverId ? byId.get(coverId) : null;
    const slides = slideIds.map((id) => byId.get(id)).filter(Boolean) as Img[];
    return cover ? [cover, ...slides] : slides;
  }, [data, coverId, slideIds]);

  function buildPlaceholders(total: number, title: string): MetaSlides[] {
    const arr: MetaSlides[] = [];
    for (let i = 0; i < total; i++) {
      if (i === 0) {
        arr.push({ id: 'capa', type: 'cover', heading: title, sub: null });
      } else if (i === total - 1) {
        arr.push({
          id: 'final',
          type: 'cta',
          heading: 'Quer saber mais?',
          sub: 'Acesse nosso portal para detalhes e atualizações.',
          cta_label: 'Ver detalhes',
          cta_url: '/posts/beneficios',
        });
      } else {
        arr.push({ id: `s${i}`, type: 'content', heading: `Slide ${i}`, sub: null });
      }
    }
    return arr;
  }

  function ensureSlidesForSelection(): MetaSlides[] {
    const baseTitle = (data?.meta?.title?.trim() || term || 'Webstory').slice(0, 80);
    const incoming = Array.isArray(data?.meta?.slides) ? (data!.meta!.slides as MetaSlides[]) : [];
    const need = selectedImages.length || 0;
    if (incoming.length >= need) return incoming.slice(0, need);
    const extra = buildPlaceholders(need, baseTitle);
    // mescla o que tiver de incoming nos primeiros itens
    for (let i = 0; i < incoming.length && i < extra.length; i++) {
      extra[i] = { ...extra[i], ...incoming[i] };
    }
    return extra;
  }

  function goToCaptions() {
    // inicializa textos alinhados à seleção
    setSlidesText(ensureSlidesForSelection());
    setStep('captions');
  }

  function onEditSlide(idx: number, field: 'heading' | 'sub', value: string) {
    setSlidesText((prev) => {
      const copy = [...prev];
      const s = { ...(copy[idx] || { id: `s${idx}`, type: 'content', heading: '' }) };
      (s as any)[field] = value;
      copy[idx] = s;
      return copy;
    });
  }

  async function rewriteOne(idx: number) {
    if (!slidesText[idx]) return;
    setErr(null);
    setRewritingIdx(idx);
    try {
      const res = await fetch('/api/webstories/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: (data?.meta?.title?.trim() || term || 'Webstory').slice(0, 80),
          tone: 'direto',
          objective: 'informar',
          slides: [slidesText[idx]], // usa a própria legenda como base
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok || !Array.isArray(json.slides) || !json.slides[0]) {
        throw new Error(json?.error || 'Falha ao reescrever legenda');
      }
      const updated = json.slides[0] as MetaSlides;
      setSlidesText((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      });
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setRewritingIdx(null);
    }
  }

  // === Publicar ===
  async function publish() {
    if (!data) return;
    if (!coverId) {
      setErr('Escolha uma capa');
      return;
    }
    if (slideIds.length < minSlides) {
      setErr(`Selecione pelo menos ${minSlides} imagens para os slides`);
      return;
    }

    // payload final
    const title = (data.meta?.title?.trim() || term || 'Webstory').slice(0, 80);
    const slidesFinal =
      slidesText.length === selectedImages.length
        ? slidesText
        : ensureSlidesForSelection();

    const payload = {
      selected: selectedImages,
      coverId,
      meta: {
        title,
        slug: data.meta?.slug || slugify(title),
        published: data.meta?.published ?? false,
        slides: slidesFinal,
        ai_prompts: data.meta?.ai_prompts || {},
      },
    };

    setPublishing(true);
    setErr(null);
    try {
      const res = await fetch('/api/webstories/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Falha ao salvar');
      window.location.href = `/dashboard/webstories/${json.slug}`;
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setPublishing(false);
    }
  }

  // ===== Render =====
  const slidesInfo = `${slideIds.length}/${minSlides}–${maxSlides}`;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">Nova Webstory</h1>

        {/* Busca inicial */}
        {!data && (
          <div className="flex gap-2 w-full md:w=[560px]">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
              placeholder="Tema (ex: Bolsa Família: como verificar, manter e aumentar o benefício)"
            />
            <Button onClick={generate} disabled={loading || !term.trim()}>
              {loading ? 'Gerando…' : 'Gerar'}
            </Button>
          </div>
        )}
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* Passos */}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <div className={`px-2 py-1 rounded ${step === 'select' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
              1. Seleção
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <div className={`px-2 py-1 rounded ${step === 'captions' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
              2. Legendas
            </div>
          </div>

          {step === 'select' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>
                    Escolha <b>1 capa</b> e {minSlides}–{maxSlides} <b>slides</b> ({slidesInfo})
                  </span>
                </div>
                <div>
                  Título sugerido: <b>{data.meta?.title || term || '-'}</b>
                </div>
              </div>

              {/* GRID de imagens */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {data.images.map((im) => {
                  const provider = (im.provider || 'other').toLowerCase();
                  const badge = badgeClasses[provider] ?? badgeClasses.other;
                  const ring = ringClasses[provider] ?? ringClasses.other;

                  const isCover = coverId === im.id;
                  const slidePos = slideIds.indexOf(im.id);
                  const showRing = isCover || slidePos >= 0;
                  const ringColor = isCover ? 'ring-amber-500' : ring;

                  return (
                    <div key={im.id} className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge} text-white capitalize`}>
                          {provider}
                        </span>
                        {isCover && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-medium">
                            capa
                          </span>
                        )}
                        {slidePos >= 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                            s{slidePos + 1}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => (isCover ? setCoverId(null) : setCoverId(im.id))}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleSlide(im.id);
                        }}
                        title="Clique para definir capa • Botão direito para alternar como slide"
                        className={`relative aspect-[9/16] w-full overflow-hidden rounded border bg-white transition
                          ${showRing ? `ring-2 ${ringColor}` : 'border-gray-200'}
                          hover:shadow-sm`}
                      >
                        <img
                          src={im.thumb || im.full}
                          alt={im.alt || im.provider || 'image'}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </button>

                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant={isCover ? 'default' : 'outline'}
                          className={isCover ? 'bg-amber-500 text-black hover:bg-amber-600 border-amber-500' : undefined}
                          onClick={() => setCoverId(im.id)}
                        >
                          {isCover ? <><Check className="h-3 w-3 mr-1" /> Capa</> : 'Capa'}
                        </Button>
                        <Button
                          size="sm"
                          variant={slidePos >= 0 ? 'default' : 'outline'}
                          className={slidePos >= 0 ? 'bg-red-600 text-white hover:bg-red-700' : undefined}
                          onClick={() => toggleSlide(im.id)}
                          disabled={coverId === im.id}
                          title={coverId === im.id ? 'A capa não entra como slide' : 'Marcar como slide'}
                        >
                          {slidePos >= 0 ? 'Remover' : 'Slide'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Dica: clique para definir capa, <b>botão direito</b> no card alterna como slide.
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setData(null); setCoverId(null); setSlideIds([]); }}>
                    Refazer
                  </Button>
                  <Button onClick={goToCaptions} disabled={!canGoNext}>
                    Avançar para legendas
                  </Button>
                </div>
              </div>
            </section>
          )}

          {step === 'captions' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Revise as legendas por imagem. Você pode <b>gerar nova legenda</b> em cada uma.
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('select')}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                  <Button onClick={publish} disabled={publishing || selectedImages.length === 0}>
                    {publishing ? 'Publicando…' : 'Publicar'}
                  </Button>
                </div>
              </div>

              {/* Lista de selecionadas com editor de legenda */}
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedImages.map((im, idx) => {
                  const s = slidesText[idx] || { id: `s${idx}`, type: idx === 0 ? 'cover' : 'content', heading: '' };
                  const label =
                    idx === 0 ? 'capa' : idx === selectedImages.length - 1 ? 'final' : `s${idx}`;

                  return (
                    <li key={im.id} className="rounded-xl border bg-white overflow-hidden shadow-sm">
                      <div className="aspect-[9/16] relative">
                        <img src={im.thumb || im.full} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute left-2 top-2 text-[11px] px-2 py-0.5 rounded bg-black/70 text-white">
                          {label}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <input
                          className="w-full border rounded px-3 py-2 text-sm"
                          value={s.heading || ''}
                          onChange={(e) => onEditSlide(idx, 'heading', e.target.value)}
                          placeholder="Título curto (48–60c)"
                        />
                        <textarea
                          className="w-full border rounded px-3 py-2 text-sm"
                          value={s.sub || ''}
                          onChange={(e) => onEditSlide(idx, 'sub', e.target.value)}
                          placeholder="Linha de apoio (opcional, até 90c)"
                          rows={2}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => rewriteOne(idx)} disabled={rewritingIdx === idx}>
                            <Wand2 className="h-4 w-4 mr-2" />
                            {rewritingIdx === idx ? 'Gerando…' : 'Gerar nova legenda'}
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('select')}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button onClick={publish} disabled={publishing || selectedImages.length === 0}>
                  {publishing ? 'Publicando…' : 'Publicar'}
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}