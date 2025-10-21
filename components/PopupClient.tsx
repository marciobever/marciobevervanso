'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PopupClient() {
  const [popup, setPopup] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    const route = pathname === '/' ? 'home' : pathname.startsWith('/posts') ? 'posts' : 'all'
    fetch(`/api/popups/for-route?route=${encodeURIComponent(route)}`)
      .then(r => r.json()).then(j => setPopup(j?.popup || null))
  }, [pathname])

  if (!popup) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-4 max-w-md w-full shadow-xl">
        {popup.image_url && <img src={popup.image_url} className="w-full h-40 object-cover rounded-lg mb-3" />}
        <h3 className="font-bold text-lg mb-1">{popup.title}</h3>
        <p className="text-sm text-slate-600 mb-3">{popup.body}</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setPopup(null)} className="px-3 py-1.5 rounded bg-slate-100">Fechar</button>
          {popup.cta_url &&
            <a href={popup.cta_url} className="px-3 py-1.5 rounded bg-sky-600 text-white">{popup.cta_label || 'Saiba mais'}</a>}
        </div>
      </div>
    </div>
  )
}
