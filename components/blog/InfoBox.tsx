'use client'
export default function InfoBox({
  type, extras,
}: { type: 'concursos' | 'cartoes' | 'empregos' | 'guias' | 'outros'; extras: any }) {
  if (!extras || Object.keys(extras).length === 0) return null
  if (type === 'concursos') {
    const { orgao, vagas, salario, inscricoes, taxa, provas, edital } = extras
    return (
      <div className="rounded-2xl border bg-white p-4 sticky top-56">
        <div className="font-semibold mb-2">Resumo do concurso</div>
        <dl className="text-sm space-y-1 text-slate-700">
          {orgao && <div><dt className="text-slate-500">Órgão</dt><dd>{orgao}</dd></div>}
          {vagas && <div><dt className="text-sale-500">Vagas</dt><dd>{vagas}</dd></div>}
          {salario && <div><dt className="text-slate-500">Salário</dt><dd>{salario}</dd></div>}
          {inscricoes && <div><dt className="text-slate-500">Inscrições</dt><dd>{inscricoes}</dd></div>}
          {taxa && <div><dt className="text-slate-500">Taxa</dt><dd>{taxa}</dd></div>}
          {provas && <div><dt className="text-slate-500">Provas</dt><dd>{provas}</dd></div>}
          {edital && <div><dt className="text-slate-500">Edital</dt><dd><a className="text-sky-700 hover:underline" href={edital} target="_blank">Ver edital</a></dd></div>}
        </dl>
      </div>
    )
  }
  if (type === 'empregos') {
    const { vaga, empresa, local, tipo, remoto, salario, requisitos, candidatura } = extras
    return (
      <div className="rounded-2xl border bg-white p-4 sticky top-56">
        <div className="font-semibold mb-2">Vaga em destaque</div>
        <dl className="text-sm space-y-1 text-slate-700">
          {vaga && <div><dt className="text-slate-500">Cargo</dt><dd>{vaga}</dd></div>}
          {empresa && <div><dt className="text-slate-500">Empresa</dt><dd>{empresa}</dd></div>}
          {(local || remoto) && <div><dt className="text-slate-500">Local</dt><dd>{remoto ? 'Remoto' : local}</dd></div>}
          {(tipo || salario) && <div><dt className="text-slate-500">Regime</dt><dd>{[tipo, salario].filter(Boolean).join(' • ')}</dd></div>}
          {requisitos && <div><dt className="text-slate-500">Requisitos</dt><dd>{requisitos}</dd></div>}
          {candidatura && <a className="inline-block mt-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm" href={candidatura} target="_blank">Candidatar-se</a>}
        </dl>
      </div>
    )
  }
  if (type === 'cartoes') {
    const { banco, anuidade, renda, beneficios, programa, link } = extras
    return (
      <div className="rounded-2xl border bg-white p-4 sticky top-56">
        <div className="font-semibold mb-2">Resumo do cartão</div>
        <dl className="text-sm space-y-1 text-slate-700">
          {banco && <div><dt className="text-slate-500">Banco</dt><dd>{banco}</dd></div>}
          {anuidade && <div><dt className="text-slate-500">Anuidade</dt><dd>{anuidade}</dd></div>}
          {renda && <div><dt className="text-slate-500">Renda mínima</dt><dd>{renda}</dd></div>}
          {programa && <div><dt className="text-slate-500">Programa</dt><dd>{programa}</dd></div>}
          {beneficios && <div><dt className="text-slate-500">Benefícios</dt><dd>{beneficios}</dd></div>}
          {link && <a className="inline-block mt-2 px-3 py-2 rounded-lg bg-sky-600 text-white text-sm" href={link} target="_blank" rel="nofollow">Pedir agora</a>}
        </dl>
      </div>
    )
  }
  return null
}
