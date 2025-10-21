'use client'
import { Facebook, Twitter, Link as LinkIcon, Linkedin } from 'lucide-react'
import { useState } from 'react'
export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1200)
    })
  }
  const Btn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    <button {...props} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm hover:bg-slate-50" />
  return (
    <div className="flex flex-wrap gap-2">
      <a className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm hover:bg-slate-50"
         href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener">
        <Facebook size={16}/> Facebook
      </a>
      <a className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm hover:bg-slate-50"
         href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener">
        <Twitter size={16}/> X/Twitter
      </a>
      <a className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm hover:bg-slate-50"
         href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener">
        <Linkedin size={16}/> LinkedIn
      </a>
      <Btn onClick={copy}><LinkIcon size={16}/>{copied ? 'Copiado!' : 'Copiar link'}</Btn>
    </div>
  )
}
