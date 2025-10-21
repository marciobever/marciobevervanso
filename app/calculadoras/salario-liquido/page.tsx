// app/calculadoras/salario-liquido/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'

/* =========================================================
   Helpers locais (sem dependências externas)
   ========================================================= */
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
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/* =========================================================
   Tipos e cálculo progressivo
   ========================================================= */
type Bracket = { upTo: number | null; rate: number; ded?: number } // ded: parcela a deduzir (IRRF)

function calcProgressive(base: number, table: Bracket[]) {
  // Soma progressiva (para INSS)
  let remaining = Math.max(0, base)
  let from = 0
  let total = 0

  for (const b of table) {
    const limit = b.upTo ?? Infinity
    if (remaining <= 0) break
    const slice = Math.max(0, Math.min(remaining, limit - from))
    total += slice * b.rate
    remaining -= slice
    from = limit
  }
  return total
}

function calcIRRF(base: number, table: Bracket[]) {
  // Cálculo por faixa com “parcela a deduzir”
  if (base <= 0) return 0
  for (const b of table) {
    const limit = b.upTo ?? Infinity
    if (base <= limit) {
      const imposto = base * b.rate - (b.ded ?? 0)
      return Math.max(0, imposto)
    }
  }
  return 0
}

/* =========================================================
   Página
   ========================================================= */
export default function SalarioLiquidoPage() {
  /* -------- Entradas básicas -------- */
  const [salario, setSalario] = useState('2.750,00')
  const [dependentes, setDependentes] = useState('0')
  const [outrosDesc, setOutrosDesc] = useState('0,00') // pensão, vale, sindicato etc. (opcional)

  // Modo de dedução do IRRF: simplificado ou por dependente
  const [modoIR, setModoIR] = useState<'simplificado' | 'dependentes'>('simplificado')
  const [deducaoSimplificada, setDeducaoSimplificada] = useState('528,00') // valor fixo (ajustável)
  const [deducaoPorDependente, setDeducaoPorDependente] = useState('189,59') // por dependente (ajustável)

  /* -------- Tabelas (editáveis em "Avançado") --------
     Os valores abaixo são ilustrativos/didáticos. Ajuste conforme sua referência.
  */
  const [inssBrackets, setInssBrackets] = useState<Bracket[]>([
    { upTo: 1412.00, rate: 0.075 }, // 7,5%
    { upTo: 2666.68, rate: 0.09  }, // 9%
    { upTo: 4000.03, rate: 0.12  }, // 12%
    { upTo: 7786.02, rate: 0.14  }, // 14% (teto)
  ])

  const [irrfBrackets, setIrrfBrackets] = useState<Bracket[]>([
    { upTo: 2259.20, rate: 0.00,  ded: 0.00  }, // isento
    { upTo: 2826.65, rate: 0.075, ded: 169.44 },
    { upTo: 3751.05, rate: 0.15,  ded: 381.44 },
    { upTo: 4664.68, rate: 0.225, ded: 662.77 },
    { upTo: null,    rate: 0.275, ded: 896.00 },
  ])

  /* -------- Saída -------- */
  const out = useMemo(() => {
    const sBruto = parseBR(salario)
    const deps = Math.max(0, Math.floor(parseBR(dependentes)))
    const outros = Math.max(0, parseBR(outrosDesc))

    // INSS progressivo sobre o salário bruto (limitado ao teto da tabela)
    const baseInss = sBruto
    const inss = calcProgressive(baseInss, inssBrackets)

    // Deduções IRRF
    const dedSimples = modoIR === 'simplificado' ? parseBR(deducaoSimplificada) : 0
    const dedDeps = modoIR === 'dependentes' ? deps * parseBR(deducaoPorDependente) : 0

    // Base IRRF
    const baseIrrf = Math.max(0, sBruto - inss - dedSimples - dedDeps - outros)

    // IRRF por faixas (parcela a deduzir)
    const irrf = calcIRRF(baseIrrf, irrfBrackets)

    // Líquido
    const liquido = Math.max(0, sBruto - inss - irrf - outros)

    return {
      sBruto,
      baseInss,
      inss,
      baseIrrf,
      irrf,
      liquido,
      deps,
      dedSimples,
      dedDeps,
      outros,
    }
  }, [
    salario,
    dependentes,
    outrosDesc,
    modoIR,
    deducaoSimplificada,
    deducaoPorDependente,
    inssBrackets,
    irrfBrackets,
  ])

  /* -------- UI -------- */
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header dentro do bloco */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              Salário Líquido (didático)
            </h1>
            <p className="text-slate-600 md:text-base">
              Estime o valor <strong>líquido</strong> a partir do salário bruto, com INSS progressivo e IRRF
              (modo <em>simplificado</em> ou por <em>dependentes</em>). Tabelas <em>ajustáveis</em> em “Avançado”.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Salário bruto (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 2.750,00"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Outros descontos (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 250,00"
                value={outrosDesc}
                onChange={(e) => setOutrosDesc(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Ex.: pensão, vale-transporte, sindicato… (opcional)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Modo de IRRF</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-3">
                  <input
                    type="radio"
                    name="mIR"
                    value="simplificado"
                    checked={modoIR === 'simplificado'}
                    onChange={() => setModoIR('simplificado')}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Simplificado</div>
                    <div className="text-xs text-slate-500">
                      Desconto fixo configurável (ex.: R$ 528,00/mês).
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-3">
                  <input
                    type="radio"
                    name="mIR"
                    value="dependentes"
                    checked={modoIR === 'dependentes'}
                    onChange={() => setModoIR('dependentes')}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Por dependentes</div>
                    <div className="text-xs text-slate-500">
                      Dedução por dependente configurável (ex.: R$ 189,59).
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {modoIR === 'simplificado' ? (
              <div>
                <label className="text-sm font-medium text-slate-700">Dedução simplificada (R$)</label>
                <input
                  inputMode="decimal"
                  placeholder="ex.: 528,00"
                  value={deducaoSimplificada}
                  onChange={(e) => setDeducaoSimplificada(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Dependentes</label>
                  <input
                    inputMode="numeric"
                    placeholder="ex.: 1"
                    value={dependentes}
                    onChange={(e) => setDependentes(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Dedução por dependente (R$)</label>
                  <input
                    inputMode="decimal"
                    placeholder="ex.: 189,59"
                    value={deducaoPorDependente}
                    onChange={(e) => setDeducaoPorDependente(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </>
            )}
          </form>

          {/* Avançado: editar tabelas */}
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="text-sm font-semibold text-sky-700 underline"
            >
              {showAdvanced ? 'Ocultar avançado' : 'Mostrar avançado (tabelas INSS/IRRF)'}
            </button>

            {showAdvanced && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Tabela INSS */}
                <div className="rounded-2xl border bg-white p-5">
                  <div className="text-sm font-semibold text-slate-800">INSS (progressivo)</div>
                  <p className="mt-1 text-xs text-slate-500">
                    Edite faixas e alíquotas (upTo = limite superior da faixa; null = teto).
                  </p>
                  <TableEditor
                    rows={inssBrackets}
                    onChange={setInssBrackets}
                    kind="inss"
                  />
                </div>

                {/* Tabela IRRF */}
                <div className="rounded-2xl border bg-white p-5">
                  <div className="text-sm font-semibold text-slate-800">IRRF (por faixa)</div>
                  <p className="mt-1 text-xs text-slate-500">
                    Alíquota e parcela a deduzir por faixa (upTo = limite; null = acima).
                  </p>
                  <TableEditor
                    rows={irrfBrackets}
                    onChange={setIrrfBrackets}
                    kind="irrf"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Resultados — tudo dentro do mesmo bloco */}
          <section className="space-y-8">
            {/* Destaques */}
            <div className="grid gap-6 md:grid-cols-3">
              <CardStat label="INSS (estimado)" value={`− ${formatBRL(out.inss)}`} />
              <CardStat label="IRRF (estimado)" value={`− ${formatBRL(out.irrf)}`} />
              <CardStat label="Salário líquido" value={formatBRL(out.liquido)} strong />
            </div>

            {/* Bases e deduções */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Base de INSS
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">{formatBRL(out.baseInss)}</div>
                <div className="mt-3 text-[12px] text-slate-500">
                  Salário bruto: <strong>{formatBRL(out.sBruto)}</strong>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Base de IRRF
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">{formatBRL(out.baseIrrf)}</div>
                <ul className="mt-3 space-y-1 text-[12px] text-slate-600">
                  <li>− INSS: <strong>{formatBRL(out.inss)}</strong></li>
                  {modoIR === 'simplificado' && (
                    <li>− Ded. simplificada: <strong>{formatBRL(out.dedSimples)}</strong></li>
                  )}
                  {modoIR === 'dependentes' && (
                    <li>− Ded. dependentes: <strong>{formatBRL(out.dedDeps)}</strong> ({out.deps} dep.)</li>
                  )}
                  {out.outros > 0 && (
                    <li>− Outros descontos: <strong>{formatBRL(out.outros)}</strong></li>
                  )}
                </ul>
              </div>
            </div>

            {/* Observações compactas */}
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-700">
                <strong>Observações:</strong> simulador <em>didático</em>. As tabelas/valores podem mudar com o tempo.
                Ajuste nos campos de “Avançado” para refletir sua referência atual. A incidência efetiva
                de IRRF/INSS pode variar por regime e rubricas da sua folha.
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

/* =========================================================
   Subcomponentes locais (cards e editor simples de tabelas)
   ========================================================= */
function CardStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 ${strong ? 'text-2xl' : 'text-xl'} font-bold text-slate-900`} aria-live="polite">
        {value}
      </div>
    </div>
  )
}

function TableEditor({
  rows,
  onChange,
  kind,
}: {
  rows: Bracket[]
  onChange: (v: Bracket[]) => void
  kind: 'inss' | 'irrf'
}) {
  const [local, setLocal] = useState(() => rows.map(cloneB))
  function cloneB(b: Bracket): Bracket {
    return { upTo: b.upTo === null ? null : Number(b.upTo), rate: Number(b.rate), ded: b.ded != null ? Number(b.ded) : undefined }
  }
  function handleChange(i: number, field: keyof Bracket, value: string) {
    setLocal((prev) => {
      const next = prev.map(cloneB)
      if (field === 'upTo') {
        next[i].upTo = value.trim() === '' ? null : Number(value)
      } else if (field === 'rate') {
        next[i].rate = clamp(Number(value), 0, 1)
      } else if (field === 'ded') {
        next[i].ded = value.trim() === '' ? undefined : Number(value)
      }
      return next
    })
  }
  function apply() {
    onChange(local.map(cloneB))
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 text-[12px] font-semibold text-slate-600">
        <div>Até (R$) *</div>
        <div>Alíquota</div>
        <div>{kind === 'irrf' ? 'Deduzir' : '—'}</div>
      </div>

      {local.map((b, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2">
          <input
            placeholder={b.upTo === null ? 'teto' : 'ex.: 4664.68'}
            defaultValue={b.upTo === null ? '' : String(b.upTo)}
            onChange={(e) => handleChange(i, 'upTo', e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              placeholder="0.14"
              defaultValue={String(b.rate)}
              onChange={(e) => handleChange(i, 'rate', e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
            />
            <span className="text-xs text-slate-500">×</span>
          </div>
          {kind === 'irrf' ? (
            <input
              placeholder="ex.: 896.00"
              defaultValue={b.ded != null ? String(b.ded) : ''}
              onChange={(e) => handleChange(i, 'ded', e.target.value)}
              className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
            />
          ) : (
            <div className="text-center text-xs text-slate-400">—</div>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Aplicar alterações
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        * Deixe vazio para indicar “acima do teto” (última faixa).
      </p>
    </div>
  )
}