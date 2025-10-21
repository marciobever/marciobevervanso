'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import QuizAdSlot from '@/components/ads/QuizAdSlot'
import { createClient } from '@supabase/supabase-js'

declare global {
  interface WindowEventMap {
    'open-quiz': CustomEvent<void>;
    'close-quiz': CustomEvent<void>;
  }
}

type Answer = string | number | boolean | null
type Props = { openInitially?: boolean; source?: string }

type Step = {
  key: string
  title: string
  desc?: string
  type: 'choice' | 'multi' | 'range' | 'intro' | 'result'
  options?: { value: string; label: string; hint?: string }[]
  min?: number
  max?: number
  required?: boolean
}

type Recommendation = {
  title: string
  reason: string
  url: string
  badge?: string
  highlight?: string
}

/** === GAM units do QUIZ === */
const QUIZ_MOBILE_UNIT =
  process.env.NEXT_PUBLIC_GAM_QUIZ_MOBILE
  || '/23287346478/marciobevervanso.com/marciobevervanso.com_Quiz_Mobile_320x100'

const QUIZ_DESKTOP_UNIT =
  process.env.NEXT_PUBLIC_GAM_QUIZ_DESKTOP
  || '/23287346478/marciobevervanso.com/marciobevervanso.com_Quiz_Desktop_200x300'

const STEPS: Step[] = [
  { key: 'intro', title: 'Encontre benefícios e oportunidades perfeitos para você', desc: 'Leva menos de 1 minuto.', type: 'intro' },
  {
    key: 'renda_familiar',
    title: 'Qual é a renda familiar mensal somando todos da casa?',
    type: 'choice',
    required: true,
    options: [
      { value: 'faixa_0', label: 'Sem renda' },
      { value: 'faixa_1', label: 'Até R$ 1.412 (≈1 salário mínimo)' },
      { value: 'faixa_2', label: 'R$ 1.413 a R$ 2.824' },
      { value: 'faixa_3', label: 'R$ 2.825 a R$ 4.236' },
      { value: 'faixa_4', label: 'Acima de R$ 4.236' },
    ],
  },
  {
    key: 'cadunico',
    title: 'Cadastro Único (CadÚnico)',
    type: 'choice',
    required: true,
    options: [
      { value: 'atualizado', label: 'Tenho e está atualizado (até 24 meses)' },
      { value: 'desatualizado', label: 'Tenho, mas está desatualizado' },
      { value: 'nao_tenho', label: 'Ainda não tenho' },
      { value: 'nao_sei', label: 'Não sei informar' },
    ],
  },
  { key: 'criancas_0_6', title: 'Quantas crianças de 0 a 6 anos moram com você?', type: 'range', min: 0, max: 6, required: true },
  { key: 'criancas_7_17', title: 'Quantos dependentes de 7 a 17 anos (estudando) moram com você?', type: 'range', min: 0, max: 8, required: true },
  { key: 'gestantes', title: 'Há gestantes na família?', type: 'range', min: 0, max: 4, required: true },
  { key: 'idosos', title: 'Quantas pessoas com 60 anos ou mais vivem no domicílio?', type: 'range', min: 0, max: 6, required: true },
  { key: 'pcd', title: 'Quantas pessoas com deficiência (PcD) vivem no domicílio?', type: 'range', min: 0, max: 6, required: true },
  {
    key: 'trabalho',
    title: 'Situação de trabalho da família (marque todas que se aplicam)',
    type: 'multi',
    required: true,
    options: [
      { value: 'desemprego', label: 'Desemprego' },
      { value: 'informal', label: 'Trabalho informal' },
      { value: 'mei', label: 'MEI / autônomo(a)' },
      { value: 'clt', label: 'CLT' },
      { value: 'rural', label: 'Trabalho rural' },
      { value: 'cuidador', label: 'Cuidador(a) em tempo integral' },
    ],
  },
  {
    key: 'moradia',
    title: 'Qual a sua situação de moradia?',
    type: 'choice',
    required: true,
    options: [
      { value: 'aluguel', label: 'Aluguel' },
      { value: 'propria', label: 'Própria (quitada/financiada)' },
      { value: 'cedida', label: 'Cedido por parente/amigo' },
      { value: 'rua', label: 'Situação de rua/desabrigado' },
    ],
  },
  {
    key: 'contas_basicas',
    title: 'Quais dessas despesas pesam mais no mês?',
    type: 'multi',
    required: false,
    options: [
      { value: 'energia', label: 'Energia elétrica' },
      { value: 'agua', label: 'Água/esgoto' },
      { value: 'gas', label: 'Gás de cozinha' },
      { value: 'internet', label: 'Internet/telefone' },
    ],
  },
  {
    key: 'prioridade',
    title: 'O que você quer priorizar agora?',
    type: 'multi',
    required: true,
    options: [
      { value: 'alimentacao', label: 'Alimentação e renda' },
      { value: 'contas', label: 'Desconto em contas básicas' },
      { value: 'saude', label: 'Saúde e medicamentos' },
      { value: 'educacao', label: 'Educação/crianças e adolescentes' },
      { value: 'moradia', label: 'Moradia' },
    ],
  },
  {
    key: 'disponibilidade',
    title: 'Consegue ir ao CRAS e tem conta gov.br?',
    type: 'choice',
    required: true,
    options: [
      { value: 'sim', label: 'Sim, consigo ir ao CRAS e tenho gov.br' },
      { value: 'parcial', label: 'Consigo uma das duas coisas' },
      { value: 'nao', label: 'Ainda não' },
    ],
  },
  { key: 'result', title: 'Seu resultado', type: 'result' },
]

function cls(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ')
}
const STORAGE_KEY = 'quiz_beneficios_seen_v3'

// Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

// ---- Range Quick Pick (0,1,2,3,4+) ----
function RangeQuickPick({
  min = 0,
  max = 6,
  value,
  onChange,
}: { min?: number; max?: number; value?: number; onChange: (v: number) => void }) {
  const picks = [0, 1, 2, 3, Math.max(4, Math.min(9, max))]
  return (
    <div className="grid grid-cols-5 gap-2">
      {picks.map((n, idx) => {
        const isPlus = idx === picks.length - 1 && n >= 4
        const selected = value === n || (isPlus && typeof value === 'number' && value >= n)
        return (
          <button
            key={idx}
            onClick={() => onChange(n)}
            className={cls(
              'rounded-2xl px-3 py-2 text-sm transition',
              selected ? 'bg-sky-50 ring-2 ring-sky-300' : 'bg-slate-100 hover:bg-slate-200/70'
            )}
          >
            {isPlus ? `${n}+` : `${n}`}
          </button>
        )
      })}
    </div>
  )
}

function buildNeeded(answers: Record<string, any>) {
  const renda = answers['renda_familiar'] as string | undefined
  const c06 = (answers['criancas_0_6'] as number | undefined) ?? 0
  const c717 = (answers['criancas_7_17'] as number | undefined) ?? 0
  const gest = (answers['gestantes'] as number | undefined) ?? 0
  const idosos = (answers['idosos'] as number | undefined) ?? 0
  const pcd = (answers['pcd'] as number | undefined) ?? 0
  const contas = (answers['contas_basicas'] as string[] | undefined) || []
  const moradia = answers['moradia'] as string | undefined

  const baixaRenda = ['faixa_0','faixa_1','faixa_2'].includes(String(renda))
  const wanted: Array<{ slug: string; reason: string }> = []

  if (baixaRenda && (c06 > 0 || c717 > 0 || gest > 0))
    wanted.push({ slug: 'bolsa-familia-2025-guia-completo-beneficio-como-receber', reason: 'família com crianças/adolescentes/gestantes e renda compatível' })

  if (baixaRenda && contas.includes('gas'))
    wanted.push({ slug: 'auxilio-gas-guia-completo-direito-como-receber', reason: 'impacto do gás no orçamento' })

  if (baixaRenda && (contas.includes('energia') || pcd > 0 || idosos > 0))
    wanted.push({ slug: 'tarifa-social-energia-eletrica-guia-desconto-conta-luz', reason: 'direito a desconto na conta de luz' })

  if (baixaRenda && (pcd > 0 || idosos > 0))
    wanted.push({ slug: 'bpc-loas-2025-guia-completo-beneficio-prestacao-continuada', reason: 'renda per capita baixa (idosos 65+ ou PcD)' })

  if (baixaRenda && moradia === 'aluguel')
    wanted.push({ slug: 'minha-casa-minha-vida-como-funciona-regras-rendas', reason: 'baixa renda pagando aluguel' })

  return wanted.slice(0, 5)
}

export default function BenefitQuizModal({ openInitially = false }: Props) {
  const [open, setOpen] = useState(openInitially)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer | Answer[]>>({})
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onOpen = () => { setOpen(true); setStepIndex(0); setAnswers({}) }
    const onClose = () => setOpen(false)
    window.addEventListener('open-quiz', onOpen)
    window.addEventListener('close-quiz', onClose)
    return () => {
      window.removeEventListener('open-quiz', onOpen)
      window.removeEventListener('close-quiz', onClose)
    }
  }, [])

  useEffect(() => {
    if (openInitially) return
    const seen = typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      const t = setTimeout(() => {
        setOpen(true)
        window.localStorage.setItem(STORAGE_KEY, '1')
      }, 800)
      return () => clearTimeout(t)
    }
  }, [openInitially])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const current = STEPS[stepIndex]
  // << fix do build: cálculo correto
  const progress = Math.round(((stepIndex + 1) / (STEPS.length || 1)) * 100)

  function next() { if (!validate(current)) return; setStepIndex(i => Math.min(i + 1, STEPS.length - 1)) }
  function prev() { setStepIndex(i => Math.max(i - 1, 0)) }
  function toggleMulti(key: string, v: string) {
    const list = (answers[key] as string[] | undefined) || []
    const updated = list.includes(v) ? list.filter(x => x !== v) : [...list, v]
    setAnswers({ ...answers, [key]: updated })
  }
  function setSingle(key: string, v: string) { setAnswers({ ...answers, [key]: v }) }
  function setRange(key: string, v: number) { setAnswers({ ...answers, [key]: v }) }
  function validate(step: Step) {
    if (!step.required) return true
    const val = answers[step.key]
    if (step.type === 'multi') return Array.isArray(val) && val.length > 0
    if (step.type === 'choice') return typeof val === 'string' && val.length > 0
    if (step.type === 'range') return val === 0 || typeof val === 'number'
    return true
  }

  const needed = useMemo(() => buildNeeded(answers), [answers])

  useEffect(() => {
    async function run() {
      if (!open) return
      if (current.type !== 'result') return
      if (!needed.length) { setRecommendations([]); return }
      if (!supabase) { setRecommendations([]); return }

      const { data, error } = await supabase
        .from('posts')
        .select('slug,title,summary,category,url_path,status')
        .in('slug', needed.map(n => n.slug))
        .eq('status', 'published')

      if (error) { setRecommendations([]); return }

      const bySlug = new Map((data || []).map(p => [p.slug, p]))
      const list: Recommendation[] = needed
        .map(n => {
          const p = bySlug.get(n.slug)
          if (!p) return null
          const url = (p.url_path && typeof p.url_path === 'string')
            ? p.url_path
            : `/posts/${p.category}/${p.slug}`
          return {
            title: p.title || 'Recomendação',
            reason: n.reason,
            url,
            badge: p.category === 'beneficios' ? 'BENEFÍCIOS' : undefined,
            highlight: p.summary || undefined,
          } as Recommendation
        })
        .filter(Boolean) as Recommendation[]

      setRecommendations(list)
    }
    run()
  }, [current.type, needed, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

      <div
        ref={modalRef}
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        style={{ width: 'clamp(360px, 64vw, 680px)', height: 'clamp(420px, 68vh, 600px)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            <strong className="text-sm text-slate-900">Assistente de Benefícios</strong>
          </div>
          <button aria-label="Fechar" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        {/* Progresso */}
        <div className="shrink-0 px-4 pt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 text-right text-[11px] text-slate-500">{progress}%</div>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid max-w-full gap-4 px-4 py-4 md:grid-cols-[1fr_1px_200px]">
            {/* LEFT */}
            <div>
              {/* Ad MOBILE (fixo 320×100) */}
              <div className="mb-2 md:hidden">
                <QuizAdSlot slot={QUIZ_MOBILE_UNIT} variant="mobile" showLabel />
              </div>

              {/* Título/desc */}
              <div className="mb-2 text-center md:text-left">
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">{current.title}</h3>
                {current.desc && <p className="mt-1 text-[13px] leading-relaxed text-slate-600 md:text-[14px]">{current.desc}</p>}
              </div>

              {/* ETAPAS */}
              <div className="min-h-[160px]">
                {current.type === 'intro' && (
                  <div className="space-y-3 text-[14px] leading-relaxed text-slate-700">
                    <p className="text-sm text-center md:text-left">
                      Vamos combinar os melhores <strong>benefícios sociais</strong> com o seu momento de vida.
                    </p>
                    <ul className="grid gap-2 grid-cols-1 sm:grid-cols-3 text-[12px]">
                      <li className="rounded-xl bg-slate-100 px-3 py-2 text-center">Filtramos o que vale a pena</li>
                      <li className="rounded-xl bg-slate-100 px-3 py-2 text-center">Recomendações acionáveis</li>
                      <li className="rounded-xl bg-slate-100 px-3 py-2 text-center">Você escolhe como seguir</li>
                    </ul>
                  </div>
                )}

                {current.type === 'choice' && (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {current.options!.map((opt) => {
                      const selected = answers[current.key] === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSingle(current.key, opt.value)}
                          className={cls(
                            'flex min-h[72px] flex-col items-center justify-center rounded-2xl px-3 py-2.5 text-center transition',
                            selected ? 'bg-sky-50 ring-2 ring-sky-300' : 'bg-slate-100 hover:bg-slate-200/70'
                          )}
                        >
                          <strong className="text-[13px] text-slate-900">{opt.label}</strong>
                          {opt.hint && <span className="mt-0.5 text-[11px] text-slate-500">{opt.hint}</span>}
                          {selected && <CheckCircle2 className="mt-1 h-4 w-4 text-sky-600" />}
                        </button>
                      )
                    })}
                  </div>
                )}

                {current.type === 'multi' && (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {current.options!.map((opt) => {
                      const list = (answers[current.key] as string[] | undefined) || []
                      const selected = list.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleMulti(current.key, opt.value)}
                          className={cls(
                            'flex min-h[72px] flex-col items-center justify-center rounded-2xl px-3 py-2.5 text-center transition',
                            selected ? 'bg-sky-50 ring-2 ring-sky-300' : 'bg-slate-100 hover:bg-slate-200/70'
                          )}
                        >
                          <strong className="text-[13px] text-slate-900">{opt.label}</strong>
                          {opt.hint && <span className="mt-0.5 text-[11px] text-slate-500">{opt.hint}</span>}
                          {selected && <CheckCircle2 className="mt-1 h-4 w-4 text-sky-600" />}
                        </button>
                      )
                    })}
                  </div>
                )}

                {current.type === 'range' && (
                  <div className="space-y-2">
                    <RangeQuickPick
                      min={current.min}
                      max={current.max}
                      value={(answers[current.key] as number | undefined) ?? 0}
                      onChange={(v) => setRange(current.key, v)}
                    />
                    <div className="text-center text-sm text-slate-700">
                      Selecionado: <strong>{(answers[current.key] as number | undefined) ?? 0}{((answers[current.key] as number | undefined) ?? 0) >= Math.max(4, current.max ?? 4) ? '+' : ''}</strong> pessoa(s)
                    </div>
                  </div>
                )}

                {current.type === 'result' && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-100 p-3 text-[13px] leading-relaxed text-slate-700">
                      <strong>Pronto!</strong> Veja abaixo as melhores próximas ações com base nas suas respostas.
                    </div>
                    <div className="grid gap-2.5">
                      {recommendations.map((r, i) => (
                        <a key={i} href={r.url} className="group rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                          {r.badge && <div className="text-[10px] uppercase tracking-wide text-slate-500">{r.badge}</div>}
                          <div className="font-semibold text-slate-900 group-hover:underline">{r.title}</div>
                          <div className="text-[12px] text-slate-500">Motivo: {r.reason}</div>
                          {r.highlight && <div className="mt-1 text-[12px] text-emerald-700">{r.highlight}</div>}
                        </a>
                      ))}
                      {recommendations.length === 0 && (
                        <div className="rounded-xl bg-slate-100 p-3 text-[13px] text-slate-600">
                          Complete as respostas para gerar recomendações.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DIVISÓRIA */}
            <div className="hidden md:block w-px bg-slate-200" />

            {/* RIGHT — Ad DESKTOP 200×300 */}
            <aside className="hidden md:block md:pl-3">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">Patrocinado</div>
              <QuizAdSlot slot={QUIZ_DESKTOP_UNIT} variant="desktop" />
            </aside>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-auto shrink-0 bg-white px-4 py-2.5 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={stepIndex === 0}
              className={cls(
                'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs md:text-sm',
                stepIndex === 0 ? 'pointer-events-none opacity-40' : 'bg-slate-100 hover:bg-slate-200'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>

            {current.type !== 'result' ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-slate-800"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <a
                href={recommendations[0]?.url || '/posts/beneficios'}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Abrir recomendações
                <ChevronRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
