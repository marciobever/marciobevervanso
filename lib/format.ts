// lib/format.ts
export const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtPct = (n: number, digits = 2) =>
  `${(n * 100).toFixed(digits)}%`

export const parseNumber = (s: string) =>
  Number(String(s).replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.')) || 0