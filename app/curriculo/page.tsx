'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

type Experience = {
  company: string
  role: string
  start: string // MM/AAAA
  end: string   // MM/AAAA ou "Atual"
  activities: string // bullets separados por linha
  achievements?: string // bullets separados por linha (opcional)
}

type Education = {
  level: 'Superior' | 'Pós-graduação/MBA' | 'Técnico' | 'Ensino Médio'
  course: string
  institution: string
  endYear: string // AAAA
}

type Course = {
  name: string
  org: string
  hours?: string
  year?: string
}

type Language = {
  name: string
  level: 'Básico' | 'Intermediário' | 'Avançado' | 'Fluente'
  cert?: string
}

type ApiResult = {
  ok: boolean
  pdf_url?: string
  docx_url?: string
  [k: string]: any
}

export default function CVPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ---- ESTADO DO FORM DINÂMICO ----
  const [experiences, setExperiences] = useState<Experience[]>([
    { company: '', role: '', start: '', end: '', activities: '', achievements: '' },
  ])

  const [educations, setEducations] = useState<Education[]>([
    { level: 'Superior', course: '', institution: '', endYear: '' },
  ])

  const [courses, setCourses] = useState<Course[]>([])
  const [languages, setLanguages] = useState<Language[]>([])

  const [skillsText, setSkillsText] = useState('') // chips por vírgula
  const [emailTo, setEmailTo] = useState('')

  const printRef = useRef<HTMLDivElement>(null)

  // helpers
  const addExperience = () =>
    setExperiences((v) => [...v, { company: '', role: '', start: '', end: '', activities: '', achievements: '' }])

  const removeExperience = (i: number) =>
    setExperiences((v) => v.filter((_, idx) => idx !== i))

  const setExperience = (i: number, key: keyof Experience, val: string) =>
    setExperiences((v) => v.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)))

  const addEducation = () =>
    setEducations((v) => [...v, { level: 'Superior', course: '', institution: '', endYear: '' }])

  const removeEducation = (i: number) =>
    setEducations((v) => v.filter((_, idx) => idx !== i))

  const setEducation = (i: number, key: keyof Education, val: string) =>
    setEducations((v) => v.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)))

  const addCourse = () =>
    setCourses((v) => [...v, { name: '', org: '', hours: '', year: '' }])

  const removeCourse = (i: number) =>
    setCourses((v) => v.filter((_, idx) => idx !== i))

  const setCourse = (i: number, key: keyof Course, val: string) =>
    setCourses((v) => v.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)))

  const addLanguage = () =>
    setLanguages((v) => [...v, { name: '', level: 'Intermediário', cert: '' }])

  const removeLanguage = (i: number) =>
    setLanguages((v) => v.filter((_, idx) => idx !== i))

  const setLanguage = (i: number, key: keyof Language, val: string) =>
    setLanguages((v) => v.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)))

  function stringifyExperiences(xs: Experience[]) {
    // gera texto “compatível” se o backend ainda usa experience_text
    return xs
      .map((e) => {
        const header = `• ${e.role} — ${e.company} (${e.start} – ${e.end || 'Atual'})`
        const acts =
          e.activities?.trim()
            ? e.activities
                .split('\n')
                .map((a) => a.trim())
                .filter(Boolean)
                .map((a) => `  - ${a}`)
                .join('\n')
            : ''
        const achs =
          e.achievements?.trim()
            ? e.achievements
                .split('\n')
                .map((a) => a.trim())
                .filter(Boolean)
                .map((a) => `  * ${a}`)
                .join('\n')
            : ''
        return [header, acts, achs].filter(Boolean).join('\n')
      })
      .join('\n\n')
  }

  function stringifyEducations(xs: Education[], cs: Course[]) {
    const edus = xs
      .map((e) => `• ${e.level}: ${e.course} — ${e.institution} (${e.endYear})`)
      .join('\n')
    const cur = cs
      .map((c) => `  - ${c.name} — ${c.org}${c.year ? ` (${c.year})` : ''}${c.hours ? ` • ${c.hours}h` : ''}`)
      .join('\n')
    return [edus, cur ? 'Cursos complementares:\n' + cur : ''].filter(Boolean).join('\n\n')
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setResult(null); setError(null)

    const form = new FormData(e.currentTarget)
    const skills = (skillsText || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      // DADOS PESSOAIS
      name: form.get('name')?.toString().trim(),
      email: form.get('email')?.toString().trim(),
      phone: form.get('phone')?.toString().trim() || null,
      city: form.get('city')?.toString().trim() || null,
      linkedin: form.get('linkedin')?.toString().trim() || null,
      portfolio: form.get('portfolio')?.toString().trim() || null,

      // OBJETIVO + RESUMO
      role_target: form.get('role_target')?.toString().trim() || null,
      summary: form.get('summary')?.toString().trim() || null,
      seniority: form.get('seniority')?.toString().trim() || 'Júnior',

      // BLOCOS
      experiences,
      educations,
      courses,
      languages,
      skills,

      // compat: se o backend ainda usa estes
      experience_text: stringifyExperiences(experiences),
      education_text: stringifyEducations(educations, courses),

      // extras
      cnh: form.get('cnh')?.toString().trim() || null,
      travel: form.get('travel') === 'on',
      relocation: form.get('relocation') === 'on',

      source: 'curriculo_page',
    }

    try {
      const r = await fetch('/api/curriculo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await r.json()) as ApiResult
      if (!r.ok || !data?.ok) throw new Error((data as any)?.error || 'Falha ao gerar currículo.')
      setResult(data)
      // rola para o bloco de resultado
      requestAnimationFrame(() => {
        document.getElementById('cv-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (e: any) {
      setError(e?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    // se tiver PDF do servidor, abre em nova aba (melhor qualidade p/ impressão)
    if (result?.pdf_url) {
      window.open(result.pdf_url, '_blank', 'noopener,noreferrer')
      return
    }
    // fallback: imprime a página focando no preview
    window.print()
  }

  function handleSendEmail() {
    const url = result?.pdf_url || result?.docx_url
    if (!emailTo || !url) return
    const subject = encodeURIComponent('Meu currículo')
    const body = encodeURIComponent(`Olá! Segue meu currículo:\n\n${url}\n`)
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 p-[1px] shadow-lg">
        <div className="rounded-3xl bg-white px-6 py-6 md:px-10 md:py-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:gap-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Crie um currículo profissional em minutos
              </h1>
              <p className="mt-2 text-slate-600">
                Layout limpo, padrão BR e compatível com ATS. Exporte em <strong>PDF</strong> ou <strong>DOCX</strong>.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
                <span className="rounded-full bg-slate-100 px-3 py-1">Gratuito</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Sem cadastro</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Rápido</span>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-end">
              <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Dica: tenha em mãos datas e resultados (ex.: “reduzi custos em 12%”).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={onSubmit} className="mt-8 grid gap-6 rounded-2xl border bg-white p-4 md:p-6">
        {/* 1. DADOS PESSOAIS */}
        <section>
          <h2 className="mb-3 text-lg font-bold">1) Dados pessoais</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input name="name" required placeholder="Nome completo" className="border rounded-xl px-3 py-2" />
            <input name="email" type="email" required placeholder="E-mail profissional" className="border rounded-xl px-3 py-2" />
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <input name="phone" placeholder="Telefone/WhatsApp" className="border rounded-xl px-3 py-2" />
            <input name="city" placeholder="Cidade/UF (ex.: São Paulo/SP)" className="border rounded-xl px-3 py-2" />
            <select name="seniority" className="border rounded-xl px-3 py-2">
              <option>Júnior</option><option>Pleno</option><option>Sênior</option>
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <input name="linkedin" placeholder="LinkedIn (opcional)" className="border rounded-xl px-3 py-2" />
            <input name="portfolio" placeholder="Portfólio / GitHub / Behance (opcional)" className="border rounded-xl px-3 py-2" />
          </div>
        </section>

        {/* 2. OBJETIVO PROFISSIONAL + RESUMO */}
        <section>
          <h2 className="mb-3 text-lg font-bold">2) Objetivo e resumo</h2>
          <input name="role_target" placeholder="Objetivo (ex.: Analista de Suporte Júnior)" className="border rounded-xl px-3 py-2 w-full" />
          <textarea
            name="summary"
            placeholder="Resumo (3–5 linhas com forças e resultados)"
            className="border rounded-xl px-3 py-2 min-h-[80px] mt-3"
          />
        </section>

        {/* 3. EXPERIÊNCIA PROFISSIONAL */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">3) Experiência profissional</h2>
            <button type="button" onClick={addExperience} className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">Adicionar</button>
          </div>

          <div className="mt-3 grid gap-4">
            {experiences.map((exp, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    placeholder="Empresa"
                    className="border rounded-xl px-3 py-2"
                    value={exp.company}
                    onChange={(e) => setExperience(i, 'company', e.target.value)}
                  />
                  <input
                    placeholder="Cargo"
                    className="border rounded-xl px-3 py-2"
                    value={exp.role}
                    onChange={(e) => setExperience(i, 'role', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    placeholder="Início (MM/AAAA)"
                    className="border rounded-xl px-3 py-2"
                    value={exp.start}
                    onChange={(e) => setExperience(i, 'start', e.target.value)}
                  />
                  <input
                    placeholder="Fim (MM/AAAA) ou 'Atual'"
                    className="border rounded-xl px-3 py-2"
                    value={exp.end}
                    onChange={(e) => setExperience(i, 'end', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Atividades (uma por linha)"
                  className="border rounded-xl px-3 py-2 min-h-[80px] mt-3"
                  value={exp.activities}
                  onChange={(e) => setExperience(i, 'activities', e.target.value)}
                />
                <textarea
                  placeholder="Conquistas/resultados (opcional – uma por linha, com números quando possível)"
                  className="border rounded-xl px-3 py-2 min-h-[60px] mt-3"
                  value={exp.achievements}
                  onChange={(e) => setExperience(i, 'achievements', e.target.value)}
                />
                {experiences.length > 1 && (
                  <div className="mt-2">
                    <button type="button" onClick={() => removeExperience(i)} className="text-sm text-red-600 hover:underline">
                      Remover experiência
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. FORMAÇÃO ACADÊMICA */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">4) Formação acadêmica</h2>
            <button type="button" onClick={addEducation} className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">Adicionar</button>
          </div>

          <div className="mt-3 grid gap-4">
            {educations.map((ed, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <select
                    className="border rounded-xl px-3 py-2"
                    value={ed.level}
                    onChange={(e) => setEducation(i, 'level', e.target.value as Education['level'])}
                  >
                    <option>Superior</option>
                    <option>Pós-graduação/MBA</option>
                    <option>Técnico</option>
                    <option>Ensino Médio</option>
                  </select>
                  <input
                    placeholder="Curso"
                    className="border rounded-xl px-3 py-2"
                    value={ed.course}
                    onChange={(e) => setEducation(i, 'course', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    placeholder="Instituição"
                    className="border rounded-xl px-3 py-2"
                    value={ed.institution}
                    onChange={(e) => setEducation(i, 'institution', e.target.value)}
                  />
                  <input
                    placeholder="Ano de conclusão (AAAA)"
                    className="border rounded-xl px-3 py-2"
                    value={ed.endYear}
                    onChange={(e) => setEducation(i, 'endYear', e.target.value)}
                  />
                </div>
                {educations.length > 1 && (
                  <div className="mt-2">
                    <button type="button" onClick={() => removeEducation(i)} className="text-sm text-red-600 hover:underline">
                      Remover formação
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. CURSOS COMPLEMENTARES */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">5) Cursos complementares</h2>
            <button type="button" onClick={addCourse} className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">Adicionar</button>
          </div>

          <div className="mt-3 grid gap-4">
            {courses.map((c, i) => (
              <div key={i} className="rounded-xl border p-3 grid md:grid-cols-4 gap-3">
                <input
                  placeholder="Curso"
                  className="border rounded-xl px-3 py-2"
                  value={c.name}
                  onChange={(e) => setCourse(i, 'name', e.target.value)}
                />
                <input
                  placeholder="Instituição"
                  className="border rounded-xl px-3 py-2"
                  value={c.org}
                  onChange={(e) => setCourse(i, 'org', e.target.value)}
                />
                <input
                  placeholder="Carga horária (h)"
                  className="border rounded-xl px-3 py-2"
                  value={c.hours || ''}
                  onChange={(e) => setCourse(i, 'hours', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Ano (AAAA)"
                    className="border rounded-xl px-3 py-2 w-full"
                    value={c.year || ''}
                    onChange={(e) => setCourse(i, 'year', e.target.value)}
                  />
                  <button type="button" onClick={() => removeCourse(i)} className="text-sm text-red-600 hover:underline">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. COMPETÊNCIAS TÉCNICAS */}
        <section>
          <h2 className="text-lg font-bold mb-2">6) Competências técnicas</h2>
          <input
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="Separe por vírgula (ex.: Excel, Power BI, SAP, Inglês)"
            className="border rounded-xl px-3 py-2 w-full"
          />
          {!!skillsText.trim() && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {skillsText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => (
                  <span key={s} className="rounded-full border px-2 py-0.5 text-slate-600">
                    {s}
                  </span>
                ))}
            </div>
          )}
        </section>

        {/* 7. IDIOMAS */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">7) Idiomas</h2>
            <button type="button" onClick={addLanguage} className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">Adicionar</button>
          </div>

          <div className="mt-3 grid gap-4">
            {languages.map((l, i) => (
              <div key={i} className="rounded-xl border p-3 grid md:grid-cols-3 gap-3">
                <input
                  placeholder="Idioma (ex.: Inglês)"
                  className="border rounded-xl px-3 py-2"
                  value={l.name}
                  onChange={(e) => setLanguage(i, 'name', e.target.value)}
                />
                <select
                  className="border rounded-xl px-3 py-2"
                  value={l.level}
                  onChange={(e) => setLanguage(i, 'level', e.target.value as Language['level'])}
                >
                  <option>Básico</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                  <option>Fluente</option>
                </select>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Certificação (opcional)"
                    className="border rounded-xl px-3 py-2 w-full"
                    value={l.cert || ''}
                    onChange={(e) => setLanguage(i, 'cert', e.target.value)}
                  />
                  <button type="button" onClick={() => removeLanguage(i)} className="text-sm text-red-600 hover:underline">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. INFORMAÇÕES ADICIONAIS */}
        <section>
          <h2 className="text-lg font-bold mb-2">8) Informações adicionais</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input name="cnh" placeholder="CNH (ex.: B)" className="border rounded-xl px-3 py-2" />
            <label className="inline-flex items-center gap-2 border rounded-xl px-3 py-2">
              <input type="checkbox" name="travel" /> Disponibilidade para viagens
            </label>
            <label className="inline-flex items-center gap-2 border rounded-xl px-3 py-2">
              <input type="checkbox" name="relocation" /> Disponibilidade para mudança
            </label>
          </div>
        </section>

        {/* Ações do formulário */}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={loading} className="rounded-xl bg-slate-900 text-white px-4 py-2.5 hover:bg-slate-800">
            {loading ? 'Gerando…' : 'Gerar currículo'}
          </button>
          <span className="text-slate-500 text-sm">ou</span>
          <Link href="/" className="rounded-xl border px-4 py-2.5 hover:bg-slate-50">Voltar para início</Link>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* RESULTADO */}
      {result && (
        <section id="cv-result" className="mt-8 grid gap-4 rounded-2xl border bg-white p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold">Seu currículo está pronto!</h2>
            <div className="flex flex-wrap gap-2">
              {result.pdf_url && (
                <a
                  href={result.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-white hover:bg-sky-700"
                  title="Baixar PDF gerado pelo servidor"
                >
                  Baixar PDF
                </a>
              )}
              {result.docx_url && (
                <a
                  href={result.docx_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border px-3 py-2 hover:bg-slate-50"
                  title="Baixar DOCX gerado pelo servidor"
                >
                  Baixar DOCX
                </a>
              )}
              <button
                onClick={handlePrint}
                className="inline-flex items-center rounded-lg border px-3 py-2 hover:bg-slate-50"
                title="Imprimir / Salvar como PDF pelo navegador"
              >
                Imprimir / Salvar em PDF
              </button>
            </div>
          </div>

          {/* Preview simples do PDF (quando existir) */}
          {result.pdf_url ? (
            <div className="rounded-xl overflow-hidden border" ref={printRef}>
              <iframe
                src={result.pdf_url}
                className="h-[680px] w-full"
                title="Pré-visualização do currículo"
              />
            </div>
          ) : (
            <div
              ref={printRef}
              className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600"
            >
              O PDF será exibido aqui quando disponível. Você também pode usar o botão
              <strong> “Imprimir / Salvar em PDF”</strong> para gerar via navegador.
            </div>
          )}

          {/* Enviar por e-mail (mailto com link) */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="email"
              placeholder="Enviar para (e-mail)"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="border rounded-xl px-3 py-2"
            />
            <button
              onClick={handleSendEmail}
              disabled={!emailTo || !(result.pdf_url || result.docx_url)}
              className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
              title="Abre o cliente de e-mail com o link do currículo"
            >
              Enviar por e-mail
            </button>
          </div>
        </section>
      )}

      {/* Estilos de impressão (oculta navegação/controles e foca no preview) */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #cv-result, #cv-result * { visibility: visible; }
          #cv-result { position: absolute; inset: 0; margin: 0; padding: 0; border: 0; }
          #cv-result iframe { height: 100vh !important; }
        }
      `}</style>
    </main>
  )
}
