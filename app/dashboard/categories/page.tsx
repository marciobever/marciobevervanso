// app/dashboard/categories/page.tsx
'use client'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function CategoriesPage() {
  const { data, mutate } = useSWR('/api/dashboard/categories/list', fetcher)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const cats = data?.items || []

  async function add() {
    if (!name.trim()) return
    await fetch('/api/dashboard/categories/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description: desc }),
    })
    setName('')
    setDesc('')
    mutate()
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black">Categorias</h1>

      {/* Criar nova categoria */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-semibold mb-2">Nova categoria</div>
        <div className="grid md:grid-cols-[1fr_2fr_auto] gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome"
            className="border rounded-xl px-3 py-2"
          />
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="border rounded-xl px-3 py-2"
          />
          <button
            onClick={add}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Listagem */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-3">Nome</th>
              <th className="p-3">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c: any) => (
              <tr key={c.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{c.name}</td>
                <td className="p-3 text-slate-600">{c.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Dica */}
      <p className="mt-4 text-xs text-slate-500">
        📌 Sugestão: mantenha apenas as categorias principais — <b>Benefícios</b>,{' '}
        <b>Cartões</b>, <b>Empregos</b> e <b>Concursos</b>.
      </p>
    </main>
  )
}
