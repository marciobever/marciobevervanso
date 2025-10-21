export default function Sources({ sources }: { sources: { title?: string; url: string }[] }) {
  if (!sources?.length) return null
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">Fontes & referências</div>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
        {sources.map((s, i) => (
          <li key={i}>
            <a href={s.url} target="_blank" className="text-sky-700 hover:underline">
              {s.title || s.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
