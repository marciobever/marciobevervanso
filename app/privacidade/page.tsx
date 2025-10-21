import PageHeader from '@/components/PageHeader'
import Glass from '@/components/ui/Glass'

export const metadata = {
  title: 'Política de Privacidade • Mapa do Crédito',
  description: 'Como coletamos, usamos e protegemos seus dados.',
}

const toc = [
  { id: 'coleta', label: 'Coleta de dados' },
  { id: 'uso', label: 'Como usamos' },
  { id: 'compartilhamento', label: 'Compartilhamento' },
  { id: 'cookies', label: 'Cookies & analytics' },
  { id: 'direitos', label: 'Seus direitos' },
  { id: 'seguranca', label: 'Segurança & retenção' },
  { id: 'contato', label: 'Contato sobre privacidade' },
]

export default function Page() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_20%_-10%,#e0f2fe_0%,transparent_45%),radial-gradient(50%_120%_at_120%_0%,#e0e7ff_0%,transparent_40%),#f8fafc]" />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <PageHeader title="Política de Privacidade" desc="Transparência sobre dados, cookies e suas escolhas." backHref="/" />

        <div className="grid gap-6 md:grid-cols-[1fr_.35fr]">
          <Glass className="p-6">
            <section id="coleta" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-2">Coleta de dados</h2>
              <p className="text-slate-700">
                Coletamos dados fornecidos por você (ex.: formulários) e dados técnicos de navegação
                (ex.: páginas acessadas, dispositivo, navegador), geralmente de forma agregada e anônima.
              </p>
            </section>

            <section id="uso" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Como usamos</h2>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                <li>Operar e melhorar o site e as ferramentas (calculadoras, comparadores, quizzes).</li>
                <li>Entender desempenho de páginas e conteúdo.</li>
                <li>Responder contatos e solicitações.</li>
                <li>Quando você opta, enviar newsletters ou notificações.</li>
              </ul>
            </section>

            <section id="compartilhamento" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Compartilhamento</h2>
              <p className="text-slate-700">
                Não vendemos dados pessoais. Podemos compartilhar informações com provedores de infraestrutura,
                analytics, e parceiros de monetização — sempre sob acordo de confidencialidade.
              </p>
            </section>

            <section id="cookies" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Cookies & analytics</h2>
              <p className="text-slate-700">
                Usamos cookies para lembrar preferências e entender métricas de uso. Você pode bloquear cookies
                no navegador; algumas funções podem ser afetadas. Ferramentas de analytics podem anonimizar IPs
                e realizar amostragem para proteger a privacidade.
              </p>
            </section>

            <section id="direitos" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Seus direitos</h2>
              <p className="text-slate-700">
                Você pode solicitar acesso, correção ou exclusão de dados pessoais. Para exercer seus direitos,
                entre em contato no e-mail indicado abaixo.
              </p>
            </section>

            <section id="seguranca" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Segurança & retenção</h2>
              <p className="text-slate-700">
                Adotamos medidas técnicas e organizacionais para proteger dados. Mantemos informações pelo tempo
                necessário para cumprir as finalidades descritas ou obrigações legais.
              </p>
            </section>

            <section id="contato" className="scroll-mt-20 mt-6">
              <h2 className="text-xl font-bold mb-2">Contato sobre privacidade</h2>
              <p className="text-slate-700">
                Para dúvidas ou solicitações, escreva para <strong>privacidade@mapadocredito.com.br</strong>.
              </p>
            </section>
          </Glass>

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
