// app/oportunidades/page.tsx
import dynamic from 'next/dynamic'
import { Container } from '@/components/ui'
import Opportunities from '@/components/home/Opportunities'

// importa o componente cliente sem SSR (evita o erro "IntrinsicAttributes")
const AdSlot = dynamic(() => import('@/components/ads/AdSlot'), { ssr: false })

export const metadata = {
  title: 'Oportunidades • Mapa do Crédito',
  description: 'Empregos, Concursos e Benefícios atualizados.',
}

export default function OportunidadesPage() {
  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl md:text-4xl font-black">Oportunidades</h1>
        <p className="text-slate-600 mt-2">Empregos, concursos e benefícios em um só lugar.</p>

        <Opportunities />

        <div className="mt-8">
          {/* Rótulo opcional (apenas visual) */}
          <div className="text-xs text-slate-500 mb-1">Ad – 728x90 / 970x90</div>
          <AdSlot slot="oportunidades_bottom" />
        </div>
      </div>
    </Container>
  )
}
