// NÃO usar "use client" aqui — este módulo é importado por Server Components.
import React from "react";
import clsx from "clsx";

/** Dados de cada página vindos do banco */
export type Pg = {
  id: string;
  bg?: string; // URL da imagem de fundo (legacy)
  heading: string;
  sub?: string | null;
  cta_url?: string | null;
  cta_label?: string | null;
  overlay?: { pos?: "top" | "middle" | "bottom" | "center"; tone?: "light" | "dark" };
  /** opcional: payload completo salvo no API /images (tem .image.url) */
  image?: {
    id?: string;
    url?: string;
    alt?: string;
    provider?: string;
    w?: number | null;
    h?: number | null;
  };
};

type PageProps = { pg: Pg };

/** Util: pega a melhor URL de imagem salva */
function pageImg(pg: Pg): string {
  return (
    (pg.image && pg.image.url) ||
    pg.bg ||
    "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop"
  );
}

/** Botão CTA (se existir) */
function CtaButton({ url, label }: { url?: string | null; label?: string | null }) {
  if (!url || !label) return null;
  return (
    <a
      href={url}
      className="inline-block mt-3 rounded-full bg-white/95 text-black text-sm font-semibold px-4 py-2 shadow hover:bg-white"
    >
      {label}
    </a>
  );
}

/* =======================
   Template 1 — CardGlass
   ======================= */
function CardGlass({ pg }: PageProps) {
  const toneDark = (pg.overlay?.tone || "dark") === "dark";
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-2xl shadow-lg">
      <img src={pageImg(pg)} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover" />
      <div
        className={clsx(
          "absolute inset-x-0 p-5",
          pg.overlay?.pos === "top" ? "top-0" : pg.overlay?.pos === "middle" || pg.overlay?.pos === "center" ? "top-1/2 -translate-y-1/2" : "bottom-0",
          "bg-gradient-to-t from-black/70 via-black/10 to-transparent",
        )}
      >
        <div className="backdrop-blur-md bg-black/35 rounded-2xl p-4 border border-white/10">
          <h2 className={clsx("font-semibold leading-tight tracking-tight",
            toneDark ? "text-white" : "text-black",
            "text-[22px] sm:text-2xl"
          )}>
            {pg.heading}
          </h2>
          {pg.sub ? (
            <p className={clsx("mt-2 text-sm", toneDark ? "text-white/85" : "text-black/80")}>{pg.sub}</p>
          ) : null}
          <CtaButton url={pg.cta_url} label={pg.cta_label} />
        </div>
      </div>
    </article>
  );
}

/* =======================
   Template 2 — CenterHero
   ======================= */
function CenterHero({ pg }: PageProps) {
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-2xl shadow-lg">
      <img src={pageImg(pg)} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover scale-[1.02]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      <div className="absolute inset-0 grid place-items-center p-5">
        <div className="text-center max-w-[85%] mx-auto">
          <h2 className="text-white drop-shadow-xl font-bold leading-tight text-3xl">
            {pg.heading}
          </h2>
          {pg.sub ? <p className="text-white/85 text-sm mt-2">{pg.sub}</p> : null}
          <CtaButton url={pg.cta_url} label={pg.cta_label} />
        </div>
      </div>
    </article>
  );
}

/* =======================
   Template 3 — Magazine
   ======================= */
function Magazine({ pg }: PageProps) {
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-2xl shadow-lg">
      <img src={pageImg(pg)} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
      <div className="absolute left-0 top-0 bottom-0 w-[70%] p-5 flex flex-col justify-end">
        <div className="border-l-4 border-white/90 pl-3">
          <h2 className="text-white font-extrabold leading-tight text-2xl">{pg.heading}</h2>
          {pg.sub ? <p className="text-white/85 text-sm mt-2">{pg.sub}</p> : null}
          <CtaButton url={pg.cta_url} label={pg.cta_label} />
        </div>
      </div>
    </article>
  );
}

/** Registro dos templates exportados */
export const TEMPLATES = {
  glass: CardGlass,
  center: CenterHero,
  magazine: Magazine,
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

/** Escolhe template: explícito > por tag > determinístico pelo slug */
export function pickTemplate(opts: {
  slug?: string | null;
  tags?: string[];
  explicit?: TemplateKey | null;
}): TemplateKey {
  if (opts.explicit && TEMPLATES[opts.explicit]) return opts.explicit;

  const tags = (opts.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => /cart[aã]o|cr[eé]dito|finan|banco/.test(t))) return "magazine";
  if (tags.some((t) => /viagem|benef[ií]cio|dica|guia/.test(t))) return "glass";

  const slug = (opts.slug || "story").toLowerCase();
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const keys = Object.keys(TEMPLATES) as TemplateKey[];
  return keys[h % keys.length];
}