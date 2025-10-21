// app/calculadoras/poupanca-casa/page.tsx
import { Container, Glass, Pill } from '@/components/ui'
import { Home } from 'lucide-react'
import HouseSavingsClient from './HouseSavingsClient'

export const metadata = {
  title: 'Poupança para Casa Própria • Calculadora',
  description: 'Veja em quanto tempo chega à meta — e quanto acumula em um prazo fixo.',
}

export default function PoupancaCasaPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
      <Container>
        <div className="mb-3 flex items-center gap-2">
          <Pill><Home className="h-3.5 w-3.5" /> Poupança para Casa Própria</Pill>
          <span className="text-slate-500 text-sm">
            Veja em quanto tempo chega à meta — e quanto acumula em um prazo fixo.
          </span>
        </div>

        <Glass className="p-4 md:p-6">
          <HouseSavingsClient />
        </Glass>
      </Container>
    </main>
  )
}
