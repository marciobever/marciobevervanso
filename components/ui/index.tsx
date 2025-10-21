// components/ui/index.tsx
'use client'

import * as React from 'react'

// util pra juntar classes
function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

// Agora aceita todos atributos de <div> (inclui className)
export function Container({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cx('mx-auto max-w-6xl px-4 md:px-6', className)}>
      {children}
    </div>
  )
}

// Também tipa corretamente o Pill
export function Pill({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...rest}
      className={cx(
        'inline-flex items-center gap-2 rounded-full border border-slate-200',
        'bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700',
        className
      )}
    >
      {children}
    </span>
  )
}

export { default as Glass } from './Glass'
export { Stat } from './Stat'