import Link from 'next/link'

export default function CTARow() {
  const base =
    'flex items-center justify-center rounded-2xl border bg-white px-4 py-4 font-semibold hover:shadow-sm transition';
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Link href="/calculadoras" className={base}>🧮 Abrir calculadoras</Link>
      <Link href="/comparar-cartoes" className={base}>💳 Comparar cartões</Link>
      <Link href="/newsletter" className={base}>✉️ Assinar newsletter</Link>
    </div>
  )
}
