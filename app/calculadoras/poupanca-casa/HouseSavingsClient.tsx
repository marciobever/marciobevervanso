'use client'

import { useMemo, useState } from 'react'

// helpers
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function monthsToGoal(goal: number, monthly: number, rateMonthly: number) {
  // Depósitos no fim do mês: FV = P * [((1+i)^n - 1)/i]
  if (goal <= 0) return 0
  if (monthly <= 0) return NaN
  if (rateMonthly <= 0) return Math.ceil(goal / monthly)
  const i = rateMonthly
  const n = Math.log((goal * i) / monthly + 1) / Math.log(1 + i)
  if (!Number.isFinite(n) || n < 0) return NaN
  return Math.ceil(n)
}

function futureValue(monthly: number, months: number, rateMonthly: number) {
  if (months <= 0 || monthly <= 0) return 0
  const i = rateMonthly
  if (i <= 0) return monthly * months
  return monthly * ((Math.pow(1 + i, months) - 1) / i)
}

export default function HouseSavingsClient() {
  // estados (com defaults do seu exemplo)
  const [goal, setGoal] = useState<number>(120_000)   // meta R$
  const [monthly, setMonthly] = useState<number>(800) // aporte mensal R$
  const [annualRate, setAnnualRate] = useState<number>(6) // % a.a.
  const [months, setMonths] = useState<number>(60)        // horizonte p/ projeção

  // taxa efetiva mensal aproximada
  const i = useMemo(() => (annualRate / 100) / 12, [annualRate])

  const timeToGoal = useMemo(
    () => monthsToGoal(goal, monthly, i),
    [goal, monthly, i]
  )

  const fvHorizon = useMemo(
    () => futureValue(monthly, months, i),
    [monthly, months, i]
  )

  // UI
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* FORM */}
      <div className="grid gap-3">
        <label className="text-sm">
          Meta (R$)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={goal}
            min={0}
            onChange={(e) => setGoal(clamp(Number(e.target.value || 0), 0, 10_000_000_000))}
          />
        </label>

        <label className="text-sm">
          Aporte mensal (R$)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={monthly}
            min={0}
            onChange={(e) => setMonthly(clamp(Number(e.target.value || 0), 0, 10_000_000))}
          />
        </label>

        <label className="text-sm">
          % a.a. (bruto)
          <input
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={annualRate}
            onChange={(e) => setAnnualRate(clamp(Number(e.target.value || 0), 0, 100))}
          />
        </label>

        <label className="text-sm">
          Horizonte p/ projeção (meses)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={months}
            min={1}
            onChange={(e) => setMonths(clamp(Number(e.target.value || 1), 1, 3600))}
          />
        </label>
      </div>

      {/* RESULTADOS */}
      <div>
        <h3 className="font-bold">Resultado</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3 bg-white">
            <div className="text-slate-500">Tempo até a meta</div>
            <div className="text-xl font-extrabold">
              {Number.isFinite(timeToGoal) ? `${timeToGoal} meses` : '—'}
            </div>
          </div>
          <div className="rounded-lg border p-3 bg-white">
            <div className="text-slate-500">Acúmulo no horizonte</div>
            <div className="text-xl font-extrabold">
              {BRL.format(fvHorizon || 0)}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          * Taxas são estimativas. Considere impostos e custos de produtos financeiros.
        </p>
      </div>
    </div>
  )
}
