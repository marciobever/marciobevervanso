// app/calculadoras/fgts-rescisao/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'

type TipoRescisao = 'sem-justa-causa' | 'pedido' | 'acordo' | 'justa-causa'

/* ========= Helpers locais ========= */
function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}`
  }
}
function parseBR(input: string) {
  // aceita "2.500,00", "2500,00" ou "2500.00"
  const s = String(input || '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

export default function FGTSRescisaoPage() {
  /* ========= Estado ========= */
  const [salario, setSalario] = useState('2.500,00')
  const [meses, setMeses] = useState('12')
  const [tipo, setTipo] = useState<TipoRescisao>('sem-justa-causa')

  /* ========= Cálculo (didático) ========= */
  const out = useMemo(() => {
    const s = parseBR(salario)
    const m = Math.max(0, Math.floor(parseBR(meses)))

    const fgtsMensal = s * 0.08
    const depositos = fgtsMensal * m

    // Multa: 40% (sem justa causa) • 20% (acordo) • 0% (pedido/justa causa)
    const multaPerc =
      tipo === 'sem-justa-causa' ? 0.4 :
      tipo === 'acordo' ? 0.2 : 0

    const multa = depositos * multaPerc
    const total = depositos + multa

    return { fgtsMensal, depositos, multa, total }
  }, [salario, meses, tipo])

  /* ========= UI ========= */
  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header dentro do bloco */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              FGTS na Rescisão
            </h1>
            <p className="text-slate-600 md:text-base">
              Estime os <strong>depósitos de FGTS</strong> acumulados e a{' '}
              <strong>multa rescisória</strong> conforme o tipo de desligamento.
              Modelo <em>didático</em> — não substitui cálculos oficiais do empregador/contabilidade.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Salário bruto (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 2.500,00"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Considera 8% do salário como depósito mensal de FGTS.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Meses trabalhados</label>
              <input
                inputMode="numeric"
                placeholder="ex.: 12"
                value={meses}
                onChange={(e) => setMeses(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Tipo de rescisão</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoRescisao)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="sem-justa-causa">Sem justa causa (empregador)</option>
                <option value="acordo">Acordo entre as partes (art. 484-A)</option>
                <option value="pedido">Pedido de demissão (empregado)</option>
                <option value="justa-causa">Justa causa</option>
              </select>
            </div>
          </form>

          {/* Resultados — tudo dentro do mesmo bloco */}
          <section className="space-y-8">
            {/* Destaques */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  FGTS mensal (8%)
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.fgtsMensal)}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Depósitos acumulados
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.depositos)}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Multa rescisória
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.multa)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  {tipo === 'sem-justa-causa' && '40% sobre os depósitos'}
                  {tipo === 'acordo' && '20% sobre os depósitos'}
                  {(tipo === 'pedido' || tipo === 'justa-causa') && 'Sem multa'}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="rounded-2xl border bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Total (depósitos + multa)
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900" aria-live="polite">
                {formatBRL(out.total)}
              </div>
            </div>

            {/* Observações compactas */}
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-700">
                <strong>Observações:</strong> este simulador não considera juros/correções do FGTS,
                nem verbas como aviso prévio, férias/13º proporcionais ou descontos legais.
                A multa aplica-se sobre os <em>depósitos de FGTS</em> (não sobre salário).
                Consulte seu RH/contabilidade para o cálculo oficial.
              </p>
            </div>
          </section>

          {/* Compartilhar */}
          <SocialShare
            title="FGTS na Rescisão • Mapa do Crédito"
            summary="Simule os depósitos acumulados de FGTS e a multa rescisória conforme o tipo de desligamento."
            tags={['MapaDoCredito','FGTS','Rescisao']}
            variant="brand"
            size="md"
            compactOnMobile
          />

          {/* Ad discreto no rodapé do bloco */}
          <div className="pt-2">
            <div className="mx-auto max-w-sm">
              <AdSlot slot="4252785059" />
            </div>
          </div>
        </Glass>
      </div>
    </Container>
  )
}