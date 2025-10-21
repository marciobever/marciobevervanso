export function Stat({
  label,
  value,
  accent = 'text-slate-900',
}: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/50 backdrop-blur p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-extrabold ${accent}`}>{value}</div>
    </div>
  )
}
