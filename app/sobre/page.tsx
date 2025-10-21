import PageHeader from '@/components/PageHeader'
import Glass from '@/components/ui/Glass'

export const metadata = {
  title: 'Sobre • Mapa do Crédito',
  description: 'Nossa missão, princípios e como financiamos o projeto.',
}

const valores = [
  { title: 'Clareza radical', desc: 'Dados explicados em linguagem simples, sem jargões desnecessários.' },
  { title: 'Independência editorial', desc: 'Conteúdo e recomendações não são vendidos. Parcerias são sempre sinalizadas.' },
  { title: 'Útil desde o 1º minuto', desc: 'Calculadoras, comparadores e guias orientados à ação.' },
]

const marcos = [
  { ano: '2024', titulo: 'Ideia & protótipo', desc: 'Primeiras calculadoras e comparadores; conceito de “rabit hole de engajamento”.' },
  { ano: '2025', titulo: 'Stack moderna', desc: 'Next.js, Supabase, integrações com IA e buscadores; dashboard de conteúdo.' },
  { ano: 'Hoje', titulo: 'Expansão', desc: 'Mais calculadoras, quizzes, personalização por perfil e automações de publicação.' },
]

export default function Page() {
  return (
    <main className="relative">
      {/* fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_20%_-10%,#e0f2fe_0%,transparent_45%),radial-gradient(50%_120%_at_120%_0%,#e0e7ff_0%,transparent_40%),#f8fafc]" />
      
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <PageHeader title="Sobre" desc="Quem somos, como trabalhamos e para onde vamos." backHref="/" />

        <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] items-start">
          {/* esquerda */}
          <div className="space-y-6">
            <Glass className="p-6">
              <h2 className="text-xl font-bold mb-2">Nossa missão</h2>
              <p className="text-slate-700">
                O <strong>Mapa do Crédito</strong> nasceu para traduzir finanças do dia a dia e organizar decisões:
                qual cartão usar, onde guardar a reserva, se vale um empréstimo agora, como comparar benefícios e
                oportunidades — tudo com ferramentas simples e diretas.
              </p>
              <p className="text-slate-700 mt-3">
                Acreditamos que um bom produto começa eliminando atritos: <em>simular rápido, entender o resultado e agir</em>.
                Por isso, nossas páginas priorizam clareza, interatividade e transparência.
              </p>
            </Glass>

            <Glass className="p-6">
              <h2 className="text-xl font-bold mb-3">Valores</h2>
              <ul className="grid gap-3 md:grid-cols-3">
                {valores.map((v) => (
                  <li key={v.title} className="rounded-xl border border-white/40 bg-white/60 backdrop-blur p-4 hover:shadow transition">
                    <div className="font-semibold">{v.title}</div>
                    <p className="text-sm text-slate-600 mt-1">{v.desc}</p>
                  </li>
                ))}
              </ul>
            </Glass>

            <Glass className="p-6">
              <h2 className="text-xl font-bold mb-2">Como financiamos</h2>
              <p className="text-slate-700">
                Mantemos <strong>independência editorial</strong>. Alguns links podem render comissões de parceiros — sempre
                sinalizados. Isso nos ajuda a manter e evoluir as ferramentas sem cobrar por acesso.
              </p>
            </Glass>
          </div>

          {/* direita: timeline + CTA */}
          <div className="space-y-6 md:sticky md:top-20">
            <Glass className="p-6">
              <h2 className="text-xl font-bold mb-3">Nosso caminho</h2>
              <ol className="relative ml-2 border-l border-slate-200">
                {marcos.map((m, i) => (
                  <li key={i} className="ml-4 pb-4 last:pb-0">
                    <div className="absolute -left-2 mt-1 h-3 w-3 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600" />
                    <div className="text-xs text-slate-500">{m.ano}</div>
                    <div className="font-semibold">{m.titulo}</div>
                    <div className="text-sm text-slate-600">{m.desc}</div>
                  </li>
                ))}
              </ol>
            </Glass>

            <Glass className="p-6">
              <h2 className="text-xl font-bold mb-2">Fale com a gente</h2>
              <p className="text-sm text-slate-600">
                Ideias, parcerias, correções? Adoramos feedbacks.
              </p>
              <a href="/contato" className="mt-3 inline-flex w-full justify-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 transition">
                Ir para contato
              </a>
            </Glass>
          </div>
        </div>
      </div>
    </main>
  )
}
