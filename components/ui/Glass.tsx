import clsx from 'clsx'

export default function Glass({
  className,
  children,
}: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/30 bg-white/60',
        'backdrop-blur-md shadow-[0_10px_30px_-15px_rgba(2,6,23,0.2)]',
        'transition hover:shadow-[0_20px_50px_-20px_rgba(2,6,23,0.35)]',
        className
      )}
    >
      {children}
    </div>
  )
}
