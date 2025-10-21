type Props = {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export default function SectionHeader({ title, subtitle, action, className = '' }: Props) {
  return (
    <div className={['mb-4 flex items-end justify-between', className].join(' ')}>
      <div>
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
