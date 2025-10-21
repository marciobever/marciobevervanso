'use client'
import { useEffect, useState } from 'react'
export default function ReadingBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    function onScroll() {
      const el = document.querySelector('main') as HTMLElement | null
      if (!el) return
      const total = el.scrollHeight - window.innerHeight
      const y = Math.max(0, Math.min(total, window.scrollY))
      setPct(total > 0 ? (y / total) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return (
    <div className="sticky top-0 z-20 h-[3px] w-full bg-transparent">
      <div className="h-[3px] bg-sky-600" style={{ width: `${pct}%`, transition: 'width .15s linear' }} />
    </div>
  )
}
