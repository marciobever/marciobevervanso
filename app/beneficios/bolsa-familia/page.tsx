import BenefitPage, { BenefitContent } from "@/components/beneficios/BenefitPage"

const content: BenefitContent = {
  slug: "bolsa-familia",
  title: "Bolsa Família — Guia simples para começar",
  summary:
    "Programa de transferência de renda para famílias em situação de pobreza com prioridade para famílias com crianças, adolescentes e gestantes.",
  category: "renda",
  hero: {
    image: "/images/beneficios/bolsa-familia-hero.jpg",
    caption: "CadÚnico atualizado é condição essencial para receber o benefício.",
  },
  valueInfo:
    "O valor é composto por parcelas que consideram a composição familiar. Confirme no app oficial os componentes vigentes.",
  audience:
    "Famílias em situação de pobreza conforme critérios federais; gestantes, nutrizes, crianças e adolescentes têm prioridade em componentes.",
  eligibility: [
    "Inscrição no CadÚnico válida e atualizada.",
    "Atendimento aos critérios de renda por pessoa definidos nacionalmente.",
    "Cumprimento de condicionalidades (frequência escolar, vacinação, pré-natal, etc.).",
  ],
  steps: [
    { title: "Atualize seu CadÚnico no CRAS", detail: "Leve documentos de todos do domicílio; informe renda e escolaridade." },
    { title: "Acompanhe no app oficial", detail: "Use o app Caixa Tem / Bolsa Família para ver status e calendário." },
    { title: "Mantenha condicionalidades", detail: "Vacinação em dia, frequência escolar e acompanhamento de saúde." },
    { title: "Mantenha dados sempre atualizados", detail: "Mudanças de renda, endereço ou composição familiar devem ser informadas." },
  ],
  docs: [
    { name: "Documento com foto do responsável familiar" },
    { name: "CPF/NIS de todos os membros" },
    { name: "Comprovante de endereço", hint: "preferencial" },
    { name: "Comprovantes de renda", hint: "se houver" },
  ],
  whereToApply:
    "Inscreva-se/atualize no CRAS do seu município. A seleção é federal, automática, com base no CadÚnico.",
  importantNotes: [
    "Não há taxa para inscrição no CadÚnico.",
    "Evite fraudes: ninguém pode ‘garantir vaga’ mediante pagamento.",
    "A permanência depende da manutenção dos critérios e das condicionalidades.",
  ],
  faqs: [
    { q: "Quem prioriza a seleção?", a: "Política federal considera perfil de vulnerabilidade e composição familiar." },
    { q: "Perdi o benefício, e agora?", a: "Verifique pendências no app e regularize no CRAS. Reprograme atualizações se mudou renda/endereço." },
  ],
  sources: [
    { label: "Página oficial do Governo Federal", href: "https://www.gov.br" },
    { label: "CRAS do município (endereços e contatos)", href: "https://www.google.com/search?q=CRAS+perto+de+mim" },
  ],
  ctas: [
    { label: "Ver status no app", href: "https://www.google.com/search?q=App+Bolsa+Fam%C3%ADlia" },
    { label: "Agendar CRAS", href: "https://www.google.com/search?q=agendar+CRAS+minha+cidade" },
  ],
}

export default function Page() {
  return <BenefitPage c={content} />
}
