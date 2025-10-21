import PageHeader from '@/components/PageHeader'
import Glass from '@/components/ui/Glass'
import ContactForm from '@/components/forms/ContactForm'

export const metadata = {
  title: 'Contato • Mapa do Crédito',
  description: 'Fale com a nossa equipe.',
}

export default function Page() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_20%_-10%,#e0f2fe_0%,transparent_45%),radial-gradient(50%_120%_at_120%_0%,#e0e7ff_0%,transparent_40%),#f8fafc]" />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <PageHeader title="Contato" desc="Feedbacks, ideias, parcerias ou imprensa — estamos por aqui." backHref="/" />
        <div className="grid gap-6 md:grid-cols-2">
          <Glass className="p-6">
            <h2 className="text-lg font-bold mb-2">Envie uma mensagem</h2>
            <ContactForm />
          </Glass>

          <div className="space-y-6">
            <Glass className="p-6">
              <h2 className="text-lg font-bold mb-2">Canais</h2>
              <ul className="space-y-2 text-sm">
                <li><strong>E-mail:</strong> contato@mapadocredito.com.br</li>
                <li><strong>Parcerias:</strong> parceiros@mapadocredito.com.br</li>
                <li><strong>Imprensa:</strong> press@mapadocredito.com.br</li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                * Endereços ilustrativos — ajuste para os seus reais.
              </p>
            </Glass>
            <Glass className="p-6">
              <h2 className="text-lg font-bold mb-2">Tempo de resposta</h2>
              <p className="text-sm text-slate-600">
                Respondemos em até 2 dias úteis. Se for urgente, indique no assunto.
              </p>
            </Glass>
          </div>
        </div>
      </div>
    </main>
  )
}
