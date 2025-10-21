'use client'
import { ReactNode } from 'react'

export const Container = ({ children }: { children: ReactNode }) => (
  <div className="max-w-6xl mx-auto px-4 md:px-6">{children}</div>
)

export const Pill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
    {children}
  </span>
)

export const Glass = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`backdrop-blur bg-white/70 border border-slate-200 shadow-[0_10px_40px_rgba(2,6,23,.06)] rounded-2xl ${className}`}>
    {children}
  </div>
)

/** Placeholder visual de anúncio (APENAS visual). */
export const AdPlaceholder = ({ label }: { label: string }) => (
  <div className="w-full min-h-[90px] rounded-2xl border border-dashed border-slate-300 grid place-items-center text-slate-500 bg-gradient-to-br from-slate-50 to-white">
    {label}
  </div>
)
