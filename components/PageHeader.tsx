import BackButton from '@/components/BackButton'

export default function PageHeader({
  title,
  desc,
  backHref,
}: {
  title: string
  desc?: string
  backHref?: string
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl md:text-4xl font-black leading-tight">{title}</h1>
        {desc && <p className="text-slate-600 mt-1">{desc}</p>}
      </div>
      <BackButton href={backHref} />
    </header>
  )
}
