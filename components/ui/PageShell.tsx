// components/ui/PageShell.tsx
import { ReactNode } from 'react'
import { Container } from '@/components/ui'

export default function PageShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* header da página */}
      <div className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Container>
          <div className="py-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{title}</h1>
                {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
              </div>
              {right}
            </div>
          </div>
        </Container>
      </div>

      {/* conteúdo */}
      <Container>
        <div className="flex-1 py-6">
          {children}
        </div>
      </Container>
    </div>
  )
}
