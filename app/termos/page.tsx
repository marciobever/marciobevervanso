import PageHeader from '@/components/PageHeader'
import Glass from '@/components/ui/Glass'

export const metadata = {
  title: 'Termos de Uso • Mapa do Crédito',
  description: 'Condições para utilizar o site e as ferramentas.',
}

const toc = [
  { id: 'aceitacao', label: 'Aceitação dos termos' },
  { id: 'conteudo', label: 'Conteúdo e isenção' },
  { id: 'ferramentas', label: 'Uso das ferramentas' },
  { id: 'propriedade', label: 'Propriedade intelectual' },
  { id: 'responsabilidade', label: 'Limitação de responsabilidade' },
  { id: 'mudancas', label: 'Mudanças nestes termos' },
  { id: 'contato', label: 'Contato' },
]

export default function Page() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_20%_-10%,#e0f2fe_0%,transparent_45%),radial-gradient(50%_120%_at_120%_0%,#e0e7ff_0%,transparent_40%),#f8fafc]" />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <PageHeader title="Termos de Uso" desc="Condições e responsabilidades ao usar este site." backHref="/" />

        <div className="grid gap-6 md:grid-cols-[1fr_.35fr]">
          <Glass className="p-6">
            <section id="aceitacao" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-2">Aceitação dos termos</h2>
              <p className="text-slate-700">
                Ao acessar o Mapa do Crédito, você concorda com estes termos. Caso não concorde, recomendamos não utilizar o site.
              </p>
            </section>

            <section id="conteudo" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Conteúdo e isenção</h2>
              <p className="text-slate-700">
                O conteúdo é fornecido “como está”, sem garantias explícitas ou implícitas de exatidão, adequação ou atualização constante.
                Verifique sempre condições e regulamentações nos sites oficiais das instituições.
              </p>
            </section>

            <section id="ferramentas" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Uso das ferramentas</h2>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                <li>As calculadoras e comparadores são auxiliares e não constituem aconselhamento financeiro.</li>
                <li>É vedado o uso comercial sem autorização prévia.</li>
                <li>Podemos alterar ou descontinuar ferramentas a qualquer tempo.</li>
              </ul>
            </section>

            <section id="propriedade" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Propriedade intelectual</h2>
              <p className="text-slate-700">
                Marcas, logos, layout, design e código são protegidos por direitos autorais. É proibida a reprodução total ou parcial sem autorização.
              </p>
            </section>

            <section id="responsabilidade" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Limitação de responsabilidade</h2>
              <p className="text-slate-700">
                Não nos responsabilizamos por perdas decorrentes de decisões tomadas com base nas informações do site.
              </p>
            </section>

            <section id="mudancas" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Mudanças nestes termos</h2>
              <p className="text-slate-700">
                Podemos atualizar estes termos a qualquer momento. Publicaremos a nova versão nesta página.
              </p>
            </section>

            <section id="contato" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Contato</h2>
              <p className="text-slate-700">
                Dúvidas sobre os termos? Escreva para <strong>legal@mapadocredito.com.br</strong>.
              </p>
            </section>
          </Glass>

          {/* Sumário lateral */}
          <div className="md:sticky md:top-24 space-y-3">
            <Glass className="p-4">
              <div className="text-sm font-semibold mb-2">Sumário</div>
              <ul className="space-y-1 text-sm">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-slate-700 hover:text-sky-700 transition">{t.label}</a>
                  </li>
                ))}
              </ul>
            </Glass>
            <Glass className="p-4">
              <div className="text-xs text-slate-500">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </Glass>
          </div>
        </div>
      </div>
    </main>
  )
}
