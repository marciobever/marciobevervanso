import BenefitPage, { BenefitContent } from "@/components/beneficios/BenefitPage"

const content: BenefitContent = {
  slug: "auxilio-gas",
  title: "Auxílio Gás — como receber",
  summary:
    "Ajuda periódica para famílias de baixa renda amenizarem o custo do gás de cozinha (GLP).",
  category: "contas",
  hero: {
    image: "/images/beneficios/auxilio-gas-hero.jpg",
    caption: "Pago de forma periódica, com base em critérios do CadÚnico.",
  },
  valueInfo:
    "O pagamento é periódico e definido nacionalmente. Confirme o próximo calendário no app oficial do Governo Federal.",
  audience:
    "Famílias de baixa renda com CadÚnico, priorizando aquelas em maior vulnerabilidade, conforme regras federais.",
  eligibility: [
    "Inscrição no CadÚnico atualizada.",
    "Atendimento aos critérios de renda vigentes.",
    "Respeito ao calendário de pagamentos por NIS.",
  ],
  steps: [
    { title: "Regularize seu CadÚnico", detail: "CRAS do seu município; dados completos e atualizados." },
    { title: "Acompanhe o calendário", detail: "Consulte por NIS nos canais oficiais." },
    { title: "Receba conforme instruções locais", detail: "Geralmente via conta social/app oficial." },
  ],
  docs: [
    { name: "Documento com foto do responsável" },
    { name: "CPF/NIS dos membros" },
    { name: "Comprovante de endereço", hint: "quando solicitado" },
  ],
  whereToApply:
    "Inscrição/atualização no CadÚnico (CRAS). Seleção e pagamento são executados em nível federal.",
  importantNotes: [
    "Confira valores e periodicidade nos canais oficiais.",
    "Evite golpes: benefícios não exigem pagamento para liberação.",
  ],
  faqs: [
    { q: "Posso acumular com outros benefícios?", a: "Regra geral permite acumular com programas de transferência de renda; confirme pendências no app." },
    { q: "Perdi um pagamento?", a: "Verifique o calendário e as regras de reemissão/retirada; procure o CRAS se necessário." },
  ],
  sources: [
    { label: "Portal oficial do Governo Federal", href: "https://www.gov.br" },
    { label: "CRAS — endereço/agenda local", href: "https://www.google.com/search?q=CRAS+perto+de+mim" },
  ],
  ctas: [
    { label: "Conferir calendário", href: "https://www.google.com/search?q=calend%C3%A1rio+aux%C3%ADlio+g%C3%A1s" },
    { label: "Atualizar CadÚnico", href: "https://www.google.com/search?q=agendar+CRAS+minha+cidade" },
  ],
}

export default function Page() {
  return <BenefitPage c={content} />
}
