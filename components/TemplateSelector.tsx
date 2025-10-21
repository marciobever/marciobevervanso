'use client';

import * as React from 'react';
import { TEMPLATES, normalizeTemplate, TemplateKey } from '@/lib/templates';

export default function TemplateSelector({
  slug,
  value,
  onChanged,
}: { slug: string; value?: string | null; onChanged?: (v: TemplateKey) => void }) {
  const [sel, setSel] = React.useState<TemplateKey>(normalizeTemplate(value));
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function save(v: TemplateKey) {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/webstories/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, template: v }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || 'Falha ao salvar');
      setSel(v);
      onChanged?.(v);
      setMsg('Template salvo!');
    } catch (e:any) {
      setMsg(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  const opts = Object.keys(TEMPLATES) as TemplateKey[];

  return (
    <div className="rounded-xl border border-neutral-200 p-3 md:p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Template do Webstory</h3>
          <p className="text-xs text-neutral-500">Escolha um estilo visual para os slides</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sel}
            onChange={(e) => save(e.target.value as TemplateKey)}
            className="rounded-md border px-2 py-1 text-sm"
            disabled={saving}
          >
            {opts.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {saving && <span className="text-xs text-neutral-500">salvando…</span>}
          {msg && <span className="text-xs">{msg}</span>}
        </div>
      </div>
    </div>
  );
}