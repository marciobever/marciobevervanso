// components/Brand.tsx
'use client'
import useSWR from 'swr'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function Brand() {
  const { data } = useSWR('/api/settings', fetcher)
  const s = data?.settings
  if (!s) return <span className="font-black">Site</span>
  return (
    <a href="/" className="flex items-center gap-2">
      {s.logo_url ? <img src={s.logo_url} className="h-7" alt={s.title} /> : (
        <svg width="28" height="28" viewBox="0 0 24 24" className="rounded-lg" style={{ fill: s.primary_color || '#0ea5e9' }}>
          <rect width="24" height="24" rx="6" />
        </svg>
      )}
      <span className="font-black">{s.title}</span>
    </a>
  )
}
