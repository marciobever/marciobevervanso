// components/calcs/ResultCard.tsx
'use client'

export function ResultCard({
  title,
  value,
  note,
}: {
  title: string
  value: string
  note?: string
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      {note && <div className="mt-1 text-[11px] text-slate-500">{note}</div>}
    </div>
  )
}