// app/calculadoras/13-salario/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'

/* =========================
   Helpers locais (sem deps externas)
========================= */
function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}`
  }
}
function parseBR(input: string) {
  // aceita "1.234,56", "1234,56" ou "1234.56"
  const s = String(input || '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

export default function DecimoTerceiroPage() {
  /* ========= State ========= */
  const [salario, setSalario] = useState('2.500,00')        // salário base mensal
  const [meses, setMeses] = useState('12')                  // meses trabalhados no ano (1..12)
  const [mediaAdic, setMediaAdic] = useState('0,00')        // média de adicionais/variáveis (opcional)
  const [aliqINSS, setAliqINSS] = useState('8')             // % estimada para INSS (ajustável)

  /* ========= Cálculo (didático) ========= */
  const out = useMemo(() => {
    const s = parseBR(salario)
    const m = Math.min(12, Math.max(1, Math.floor(parseBR(meses))))
    const varMed = Math.max(0, parseBR(mediaAdic))
    const inssPct = Math.max(0, parseBR(aliqINSS)) / 100

    const base13 = s + varMed
    const bruto = base13 * (m / 12)

    const inss = bruto * inssPct            // estimativa didática (ajuste a alíquota conforme a tabela vigente)
    const liquido = Math.max(0, bruto - inss)

    const fgts13 = bruto * 0.08             // informativo: depósito de FGTS sobre o 13º (pago pelo empregador)

    return { base13, bruto, inss, liquido, fgts13, m }
  }, [salario, meses, mediaAdic, aliqINSS])

  /* ========= UI ========= */
  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header dentro do bloco */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              13º Salário (proporcional)
            </h1>
            <p className="text-slate-600 md:text-base">
              Simule o <strong>13º salário</strong> proporcional com base no salário mensal, meses
              trabalhados no ano e média de adicionais/variáveis. Modelo <em>didático</em> — ajuste a
              alíquota do INSS conforme a tabela vigente para aproximar do seu caso.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Salário base mensal (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 2.500,00"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Salário de referência (ex.: salário de dezembro).
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Meses trabalhados no ano</label>
              <input
                inputMode="numeric"
                placeholder="ex.: 12"
                value={meses}
                onChange={(e) => setMeses(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Use 1 a 12 (proporcional ao período trabalhado).
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Média de adicionais (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 300,00"
                value={mediaAdic}
                onChange={(e) => setMediaAdic(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Ex.: média de horas extras, comissões, adicional noturno etc. (opcional).
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">INSS (estimativa %) </label>
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  placeholder="ex.: 8"
                  value={aliqINSS}
                  onChange={(e) => setAliqINSS(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
                <span className="mt-2 text-slate-600 text-sm">%</span>
              </div>
              <p className="mt-1 text-[12px] text-slate-500">
                Ajuste conforme a faixa/tabela atual (modelo ilustrativo).
              </p>
            </div>
          </form>

          {/* Resultados — tudo dentro do mesmo bloco */}
          <section className="space-y-8">
            {/* Destaques */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Base do 13º
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.base13)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  Considera salário + média de adicionais.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  13º bruto (proporcional)
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.bruto)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  Proporção de {out.m} / 12 avos.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  INSS (estimado)
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  − {formatBRL(out.inss)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  Alíquota configurável pelo usuário.
                </p>
              </div>
            </div>

            {/* Líquido + FGTS */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  13º líquido (estimado)
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900" aria-live="polite">
                  {formatBRL(out.liquido)}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  FGTS sobre 13º (informativo)
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {formatBRL(out.fgts13)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  Depósito do empregador (8%); não é desconto do empregado.
                </p>
              </div>
            </div>

            {/* Observações compactas */}
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-700">
                <strong>Observações:</strong> cálculo ilustrativo. Em cenários reais, o 13º pode
                considerar médias de variáveis, descontos previdenciários e, quando aplicável,
                IRRF conforme a base de cálculo. Verifique sempre com o RH/contabilidade e normas
                vigentes.
              </p>
            </div>
          </section>

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