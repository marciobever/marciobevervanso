'use client'

import { useEffect, useState } from 'react'

type NavItem = { label: string; href: string }
type Settings = {
  title: string
  tagline?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  nav: NavItem[]
  social: NavItem[]
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings>({
    title: '',
    tagline: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#0ea5e9',
    nav: [],
    social: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return
        const d = j?.settings
        if (d) {
          setS({
            title: d.title || '',
            tagline: d.tagline || '',
            logo_url: d.logo_url || '',
            favicon_url: d.favicon_url || '',
            primary_color: d.primary_color || '#0ea5e9',
            nav: Array.isArray(d.nav) ? d.nav : [],
            social: Array.isArray(d.social) ? d.social : [],
          })
        }
      })
      .catch(() => {
        alert('Erro ao carregar configurações.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      const j = await r.json()
      if (!j.ok) throw new Error(j.error || 'Falha ao salvar')
      alert('Configurações salvas!')
    } catch (e: any) {
      alert(e?.message || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4">Carregando…</div>

  return (
    <div className="p-4 space-y-5 max-w-4xl">
      <h1 className="text-xl font-bold">Configurações do site</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Coluna 1 */}
        <div className="space-y-3">
          <label className="block text-sm">Título</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={s.title}
            onChange={(e) => setS({ ...s, title: e.target.value })}
          />

          <label className="block text-sm">Tagline</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={s.tagline}
            onChange={(e) => setS({ ...s, tagline: e.target.value })}
          />

          <label className="block text-sm">Logo URL (ex: /logo.svg)</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={s.logo_url || ''}
            onChange={(e) => setS({ ...s, logo_url: e.target.value })}
          />
          {s.logo_url ? (
            <div className="mt-1 text-xs text-slate-500">
              Preview:
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logo_url} alt="logo" className="mt-1 h-10 object-contain" />
            </div>
          ) : null}

          <label className="block text-sm">Favicon URL (ex: /favicon.svg)</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={s.favicon_url || ''}
            onChange={(e) => setS({ ...s, favicon_url: e.target.value })}
          />
          {s.favicon_url ? (
            <div className="mt-1 text-xs text-slate-500">
              Preview:
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.favicon_url} alt="favicon" className="mt-1 h-6 w-6" />
            </div>
          ) : null}

          <label className="block text-sm">Cor primária</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer"
              value={s.primary_color || '#0ea5e9'}
              onChange={(e) => setS({ ...s, primary_color: e.target.value })}
            />
            <input
              className="border rounded px-2 py-1 w-full"
              value={s.primary_color || '#0ea5e9'}
              onChange={(e) => setS({ ...s, primary_color: e.target.value })}
            />
          </div>
        </div>

        {/* Coluna 2 */}
        <div className="space-y-6">
          {/* Menu */}
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm">Menu</label>
              <button
                onClick={() => setS((v) => ({ ...v, nav: [...v.nav, { label: 'Novo', href: '/' }] }))}
                className="px-2 py-1 text-sm rounded bg-slate-100"
              >
                + Adicionar
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {s.nav.map((n, i) => (
                <div key={`${n.label}-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Label"
                    value={n.label}
                    onChange={(e) => {
                      const nav = [...s.nav]
                      nav[i] = { ...nav[i], label: e.target.value }
                      setS({ ...s, nav })
                    }}
                  />
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="/rota ou https://"
                    value={n.href}
                    onChange={(e) => {
                      const nav = [...s.nav]
                      nav[i] = { ...nav[i], href: e.target.value }
                      setS({ ...s, nav })
                    }}
                  />
                  <button
                    onClick={() => {
                      const nav = s.nav.filter((_, idx) => idx !== i)
                      setS({ ...s, nav })
                    }}
                    className="text-xs px-2 py-1 rounded bg-rose-100 hover:bg-rose-200"
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Redes */}
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm">Redes</label>
              <button
                onClick={() => setS((v) => ({ ...v, social: [...v.social, { label: 'Link', href: '#' }] }))}
                className="px-2 py-1 text-sm rounded bg-slate-100"
              >
                + Adicionar
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {s.social.map((n, i) => (
                <div key={`${n.label}-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Label"
                    value={n.label}
                    onChange={(e) => {
                      const social = [...s.social]
                      social[i] = { ...social[i], label: e.target.value }
                      setS({ ...s, social })
                    }}
                  />
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="https://"
                    value={n.href}
                    onChange={(e) => {
                      const social = [...s.social]
                      social[i] = { ...social[i], href: e.target.value }
                      setS({ ...s, social })
                    }}
                  />
                  <button
                    onClick={() => {
                      const social = s.social.filter((_, idx) => idx !== i)
                      setS({ ...s, social })
                    }}
                    className="text-xs px-2 py-1 rounded bg-rose-100 hover:bg-rose-200"
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-60"
      >
        {saving ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}
