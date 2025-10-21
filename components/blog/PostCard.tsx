import Link from 'next/link'

type CardProps = {
  href: string
  title: string
  category?: string
  minutes?: number
  img?: string
  badge?: string
}

export default function PostCard({ href, title, category, minutes, img, badge }: CardProps) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img || 'https://picsum.photos/seed/card/1200/675'}
          alt=""
          className="h-full w-full object-cover group-hover:scale-[1.02] transition"
        />
      </div>
      <div className="p-4">
        {category && (
          <span className="inline-block text-[11px] rounded-full border px-2 py-0.5 text-slate-600">
            {category}
          </span>
        )}
        {badge && (
          <span className="inline-block text-[11px] rounded-full bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 ml-2">
            {badge}
          </span>
        )}
        <h3 className="mt-2 font-bold leading-snug">{title}</h3>
        {minutes ? (
          <div className="text-xs text-slate-500 mt-1">Leitura de {minutes} min</div>
        ) : null}
      </div>
    </Link>
  )
}
