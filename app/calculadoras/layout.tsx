// app/calculadoras/layout.tsx
import type { ReactNode } from 'react'
import CalculadorasFrame from '@/components/calculadoras/CalculadorasFrame'

export default function CalculadorasLayout({ children }: { children: ReactNode }) {
  // OBS: Não renderize títulos/descrições aqui.
  // O wrapper injeta o ad mobile após o primeiro <h1> encontrado no conteúdo.
  return <CalculadorasFrame>{children}</CalculadorasFrame>
}
