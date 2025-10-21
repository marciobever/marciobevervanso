'use client'

import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function CategoriesManagePage() {
  const { data, mutate } = useSWR('/api/dashboard/categories/list', fetcher)
  const cats = data?.items || []

  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  async function startEdit(c: any) {
    setEditing(c.id)
    setName(c.name)
    setDesc(c.description || '')
  }

  async function saveEdit() {
    if (!editing) return
    await fetch(`/api/dashboard/categories/${editing}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc }),
    })
    setEditing(null)
    setName('')
    setDesc('')
    mutate()
  }

  async function remove(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    await fetch(`/api/dashboard/categories/${id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black">Gerenciar Categorias</h1>

      <section className="mt-6 rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-3">Nome</th>
              <th className="p-3">Descrição</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">
                  {editing === c.id ? (
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="p-3 text-slate-600">
                  {editing === c.id ? (
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                    />
                  ) : (
                    c.description
                  )}
                </td>
                <td className="p-3 text-right space-x-2">
                  {editing === c.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1 rounded-lg bg-slate-200 text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(c)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
