import Link from 'next/link'

type Chip = { label: string; href: string }

export default function TopicChips({ items }: { items: Chip[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className="rounded-full border px-3 py-1 text-sm bg-white hover:bg-slate-50"
        >
          {i.label}
        </Link>
      ))}
    </div>
  )
}
