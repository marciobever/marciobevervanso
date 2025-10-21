// components/dashboard/N8NApproveImages.tsx
'use client'

import React, { useMemo, useState } from 'react'

type ApprovePayload = {
  approval_id: string
  urls: string[]
}

type SubmitBody = {
  approval_id: string
  urls: string[]
}

export default function N8NApproveImages() {
  const [raw, setRaw] = useState<string>('')              // entrada JSON
  const [approvalId, setApprovalId] = useState<string>('') // manual
  const [urlsText, setUrlsText] = useState<string>('')

  const [maxSelect, setMaxSelect] = useState<number>(1)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 🔄 transforma entrada em payload
  const payload: ApprovePayload | null = useMemo(() => {
    if (raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.approval_id && Array.isArray(parsed?.urls)) {
          return { approval_id: String(parsed.approval_id), urls: parsed.urls.map(String) }
        }
        if (parsed?.approval?.payload?.approval_id) {
          const p = parsed.approval.payload
          return { approval_id: String(p.approval_id), urls: (p.urls || []).map(String) }
        }
        if (Array.isArray(parsed) && parsed[0]?.approval?.payload?.approval_id) {
          const p = parsed[0].approval.payload
          return { approval_id: String(p.approval_id), urls: (p.urls || []).map(String) }
        }
      } catch {
        /* erro tratado visualmente */
      }
    }
    const list = urlsText.split('\n').map(l => l.trim()).filter(Boolean)
    if (approvalId && list.length) return { approval_id: approvalId, urls: list }
    return null
  }, [raw, approvalId, urlsText])

  const urls = payload?.urls ?? []
  const countSelected = Object.values(selected).filter(Boolean).length

  function toggle(url: string) {
    setSelected(prev => {
      const next = { ...prev }
      const willSelect = !next[url]
      if (willSelect) {
        const current = Object.values(next).filter(Boolean).length
        if (current >= maxSelect) return prev
      }
      next[url] = willSelect
      return next
    })
  }

  function selectAll() {
    const next: Record<string, boolean> = {}
    for (let i = 0; i < Math.min(maxSelect, urls.length); i++) next[urls[i]] = true
    setSelected(next)
  }

  function clearAll() {
    setSelected({})
  }

  async function submitSelection() {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      if (!payload?.approval_id) throw new Error('Sem approval_id')
      const chosen = urls.filter(u => selected[u])
      if (!chosen.length) throw new Error('Selecione ao menos 1 imagem')

      const body: SubmitBody = { approval_id: payload.approval_id, urls: chosen }
      const res = await fetch('/api/n8n/approval/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Falha (${res.status})`)
      setMessage('✅ Aprovação enviada com sucesso')
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar aprovação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-xl font-bold text-slate-800">🖼️ Aprovação de imagens</h2>
      <p className="mb-6 text-sm text-slate-600">
        Cole o payload <code>approval.payload</code> do n8n <b>ou</b> preencha manualmente
        o <code>approval_id</code> e as URLs.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* JSON */}
        <label className="block text-sm font-medium text-slate-700">
          Payload JSON
          <textarea
            className="mt-1 min-h-[160px] w-full rounded-xl border px-3 py-2 text-sm"
            placeholder={`{\n  "approval_id": "12345",\n  "urls": ["https://..."]\n}`}
            value={raw}
            onChange={e => setRaw(e.target.value)}
          />
        </label>

        {/* Manual */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            approval_id
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="ex.: 1758397566015_s6f48x"
              value={approvalId}
              onChange={e => setApprovalId(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            URLs (uma por linha)
            <textarea
              className="mt-1 min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="https://site/imagem1.jpg"
              value={urlsText}
              onChange={e => setUrlsText(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Seleção */}
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Máximo selecionáveis
          <input
            type="number"
            min={1}
            className="mt-1 w-28 rounded-xl border px-3 py-2"
            value={maxSelect}
            onChange={e => setMaxSelect(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={!urls.length}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Selecionar limite
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={!urls.length}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6">
        <div className="mb-3 text-sm text-slate-600">
          {payload?.approval_id && <><b>ID:</b> <code>{payload.approval_id}</code> • </>}
          <b>imagens:</b> {urls.length} • <b>selecionadas:</b> {countSelected}/{maxSelect}
        </div>

        {urls.length === 0 ? (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-yellow-700">
            Nenhuma URL carregada
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {urls.map((u, i) => {
              const isChecked = !!selected[u]
              return (
                <li key={u} className="group relative overflow-hidden rounded-xl border">
                  <button
                    type="button"
                    onClick={() => toggle(u)}
                    className="block w-full"
                    title={u}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u}
                      alt={`img-${i + 1}`}
                      className={`h-40 w-full object-cover transition ${isChecked ? 'ring-4 ring-sky-500' : ''}`}
                    />
                    <div className="flex items-center justify-between gap-2 p-2 text-xs">
                      <span className="truncate">#{i + 1}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          isChecked ? 'bg-sky-500/20 text-sky-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isChecked ? 'Selecionada' : 'Disponível'}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Botões */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={submitSelection}
          disabled={loading || !payload?.approval_id || !countSelected}
          className="rounded-xl bg-sky-600 px-5 py-2 font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar aprovação'}
        </button>
        <button
          type="button"
          onClick={() => { setRaw(''); setApprovalId(''); setUrlsText(''); setSelected({}); setMessage(null); setError(null) }}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          Limpar
        </button>
      </div>

      {(error || message) && (
        <div className="mt-4">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-700">
              {message}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
