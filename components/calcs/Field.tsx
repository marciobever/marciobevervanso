// components/calcs/Field.tsx
'use client'

type FieldProps = {
  label: string
  children: React.ReactNode
  hint?: string
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-slate-500">{hint}</div>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'h-10 w-full rounded-lg border border-slate-300 px-3 text-sm',
        'focus:outline-none focus:ring-4 focus:ring-sky-100',
        props.className || '',
      ].join(' ')}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'h-10 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white',
        'focus:outline-none focus:ring-4 focus:ring-sky-100',
        props.className || '',
      ].join(' ')}
    />
  )
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        'h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white',
        'hover:bg-slate-800 disabled:opacity-60',
        props.className || '',
      ].join(' ')}
    />
  )
}