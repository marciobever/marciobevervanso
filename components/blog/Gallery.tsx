export default function Gallery({ items }: { items: { src: string; caption?: string }[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((g, i) => (
        <figure key={i} className="rounded-xl overflow-hidden border bg-white">
          <img src={g.src} alt={g.caption || ''} className="w-full h-56 object-cover" />
          {g.caption && <figcaption className="text-xs text-slate-500 px-3 py-2">{g.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}
