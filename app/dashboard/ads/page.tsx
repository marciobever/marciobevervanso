'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AdsConfig } from '@/lib/ads-config'

type SlotKey =
  | 'content_top'
  | 'content_middle'
  | 'content_bottom'
  | 'sidebar'
  | 'floating_left'
  | 'floating_right'
  | 'modal'
  | 'inarticle'
  | 'infeed'
  | 'modal_quiz_mobile'   // novo
  | 'modal_quiz_desktop'  // novo

export default function AdsDashboardPage() {
  const [cfg, setCfg] = useState<AdsConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // carregar config
  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/ads/config', { cache: 'no-store' })
      const j = await r.json()
      setCfg(j.data as AdsConfig)
    } catch (e) {
      console.error(e)
      alert('Erro ao carregar configuração de anúncios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave() {
    if (!cfg) return
    setSaving(true)
    try {
      const res = await fetch('/api/ads/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Erro ao salvar')
      setCfg(j.data as AdsConfig)
      alert('Configuração salva!')
    } catch (e) {
      console.error(e)
      alert('Falha ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  const slotsList = useMemo<{ key: SlotKey; label: string }[]>(
    () => [
      { key: 'content_top',    label: 'Topo do conteúdo (responsivo)' },
      { key: 'content_middle', label: 'Meio do conteúdo (responsivo)' },
      { key: 'content_bottom', label: 'Final do conteúdo (responsivo)' },
      { key: 'sidebar',        label: 'Sidebar' },
      { key: 'inarticle',      label: 'In-article' },
      { key: 'infeed',         label: 'In-feed' },
      { key: 'modal',          label: 'Modal (300x250)' },
      { key: 'floating_left',  label: 'Floating left' },
      { key: 'floating_right', label: 'Floating right' },

      // novos
      { key: 'modal_quiz_mobile',  label: 'Quiz — Mobile (exclusivo)' },
      { key: 'modal_quiz_desktop', label: 'Quiz — Desktop (exclusivo)' },
    ],
    []
  )

  if (loading || !cfg) {
    return <div className="p-6">Carregando…</div>
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Anúncios — On/Off</h1>

      {/* Máximo por página */}
      <div className="space-y-2">
        <label className="block font-semibold">Máx. anúncios por página</label>
        <input
          type="number"
          min={0}
          className="w-32 border rounded p-2"
          value={cfg.max_ads_per_page}
          onChange={(e) =>
            setCfg({ ...cfg, max_ads_per_page: Number(e.target.value) })
          }
        />
        <p className="text-xs text-gray-500">
          Limita a quantidade total de slots fixos renderizados por página.
        </p>
      </div>

      {/* On/Off */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Slots</h2>
        <div className="space-y-2">
          {slotsList.map(({ key, label }) => {
            const val = cfg.adsense.slots[key]
            return (
              <div key={key} className="flex items-center justify-between border rounded p-2">
                <div className="flex flex-col">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-gray-500">
                    chave: <code>{key}</code>
                  </span>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!val?.enabled}
                    onChange={(e) =>
                      setCfg({
                        ...cfg,
                        adsense: {
                          ...cfg.adsense,
                          slots: {
                            ...cfg.adsense.slots,
                            [key]: { ...(val || { enabled: false, block: 'content_responsive' }), enabled: e.target.checked },
                          },
                        },
                      })
                    }
                  />
                  <span>{val?.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          onClick={load}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Recarregar
        </button>
      </div>

      <div className="text-xs text-gray-500 pt-4">
        Os IDs dos blocos e o client do AdSense ficam fixos no backend. Aqui você só liga/desliga os pontos onde quer exibir.
      </div>
    </div>
  )
}
