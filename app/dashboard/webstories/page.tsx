'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json && (json.error || json.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
};

export default function WebstoriesPage() {
  const { data, error, isLoading } = useSWR('/api/webstories', fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Carregando…</div>;
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-red-600">
        Erro ao carregar webstories: {String(error.message || error)}
      </div>
    );
  }

  const list: Array<{
    id?: string;
    slug: string;
    title: string;
    published?: boolean;
    poster_portrait?: string;
    updated_at?: string;
    created_at?: string;
  }> = Array.isArray(data) ? data : [];

  if (!list.length) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Webstories</h1>
        <p className="text-sm text-gray-500">Nenhum item encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Webstories</h1>
        <Link href="/dashboard/webstories/new">
          <Button>Criar Webstory</Button>
        </Link>
      </div>

      <ul className="grid gap-3">
        {list.map((ws) => (
          <li
            key={ws.slug || ws.id}
            className="p-4 border rounded-md shadow-sm flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{ws.title}</h2>
              <p className="text-sm text-gray-500">{ws.slug}</p>
              {ws.published ? (
                <span className="text-xs text-green-600">Publicado</span>
              ) : (
                <span className="text-xs text-amber-600">Rascunho</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/webstories/${ws.slug}`} target="_blank">
                <Button size="sm">Abrir</Button>
              </Link>
              <Link href={`/dashboard/webstories/${ws.slug}`}>
                <Button variant="outline" size="sm">Editar</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}