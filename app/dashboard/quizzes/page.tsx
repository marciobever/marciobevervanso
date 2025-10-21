'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [quiz, setQuiz] = useState<any>({ slug: '', title: '', description: '' })
  const [qs, setQs] = useState<any[]>([]) // perguntas+opções do quiz selecionado

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  async function load() { const { data } = await supabase.from('quizzes').select('*').order('created_at',{ascending:false}); setQuizzes(data||[]) }
  useEffect(()=>{ load() },[])

  async function saveQuiz(){ if(quiz.id) await supabase.from('quizzes').update(quiz).eq('id',quiz.id); else await supabase.from('quizzes').insert(quiz); setQuiz({slug:'',title:'',description:''}); load() }
  async function delQuiz(id:string){ if(!confirm('Excluir quiz e tudo dentro?'))return; await supabase.from('quizzes').delete().eq('id',id); setQs([]); load() }

  async function openQuiz(q:any){
    setQuiz(q)
    const { data:questions } = await supabase.from('quiz_questions').select('*').eq('quiz_id', q.id).order('order_idx')
    const ids = (questions||[]).map((x:any)=>x.id)
    const { data:options } = await supabase.from('quiz_options').select('*').in('question_id', ids)
    const byQ: Record<string, any[]> = {}; (options||[]).forEach((o:any)=>{ (byQ[o.question_id] ||= []).push(o) })
    setQs((questions||[]).map((qq:any)=>({ ...qq, options: byQ[qq.id]||[] })))
  }

  async function addQuestion(){
    const payload = { quiz_id: quiz.id, order_idx: qs.length, prompt: 'Nova pergunta' }
    const { data, error } = await supabase.from('quiz_questions').insert(payload).select().single()
    if(!error) setQs([...qs, { ...data, options: [] }])
  }
  async function saveQuestion(row:any){
    await supabase.from('quiz_questions').update({ prompt: row.prompt, order_idx: row.order_idx }).eq('id', row.id)
  }
  async function delQuestion(id:string){
    await supabase.from('quiz_questions').delete().eq('id', id)
    setQs(qs.filter(x=>x.id!==id))
  }
  async function addOption(qid:string){
    const { data } = await supabase.from('quiz_options').insert({ question_id: qid, label: 'Opção', is_correct: false, score: 0 }).select().single()
    setQs(qs.map(q=> q.id===qid ? { ...q, options: [...q.options, data] } : q ))
  }
  async function saveOption(opt:any){
    await supabase.from('quiz_options').update({ label: opt.label, is_correct: opt.is_correct, score: opt.score }).eq('id', opt.id)
  }
  async function delOption(qid:string, oid:string){
    await supabase.from('quiz_options').delete().eq('id', oid)
    setQs(qs.map(q=> q.id===qid ? { ...q, options: q.options.filter((o:any)=>o.id!==oid) } : q ))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quizzes</h1>

      {/* criar/editar quiz */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded bg-white p-3 space-y-2">
          <input className="border rounded px-2 py-1 w-full" placeholder="slug (ex: perfil-de-credito)"
            value={quiz.slug||''} onChange={e=>setQuiz((f:any)=>({...f,slug:e.target.value}))}/>
          <input className="border rounded px-2 py-1 w-full" placeholder="Título"
            value={quiz.title||''} onChange={e=>setQuiz((f:any)=>({...f,title:e.target.value}))}/>
          <textarea className="border rounded px-2 py-1 w-full h-20" placeholder="Descrição"
            value={quiz.description||''} onChange={e=>setQuiz((f:any)=>({...f,description:e.target.value}))}/>
          <div className="flex gap-2">
            <button onClick={saveQuiz} className="px-3 py-1.5 rounded bg-sky-600 text-white text-sm">{quiz.id?'Salvar':'Criar quiz'}</button>
            <button onClick={()=>setQuiz({slug:'',title:'',description:''})} className="px-3 py-1.5 rounded bg-slate-100 text-sm">Limpar</button>
          </div>
        </div>

        {/* lista de quizzes */}
        <div className="space-y-2">
          {quizzes.map(q=>(
            <div key={q.id} className="border rounded bg-white p-2 flex justify-between">
              <div>
                <div className="font-semibold">{q.title}</div>
                <div className="text-xs text-slate-500">{q.slug}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>openQuiz(q)} className="px-2 py-1 bg-slate-100 rounded text-xs">Abrir</button>
                <button onClick={()=>setQuiz(q)} className="px-2 py-1 bg-slate-100 rounded text-xs">Editar</button>
                <button onClick={()=>delQuiz(q.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* perguntas & opções do quiz aberto */}
      {quiz?.id && (
        <div className="border rounded bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Perguntas de: {quiz.title}</div>
            <button onClick={addQuestion} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm">+ Pergunta</button>
          </div>
          <div className="space-y-3">
            {qs.map((q:any, idx:number)=>(
              <div key={q.id} className="border rounded p-2">
                <div className="flex gap-2 mb-2">
                  <input className="border rounded px-2 py-1 w-16 text-center" value={q.order_idx} onChange={e=>{ const v=+e.target.value||0; setQs(prev=>prev.map(x=>x.id===q.id?{...x,order_idx:v}:x)); saveQuestion({...q, order_idx:v})}}/>
                  <input className="border rounded px-2 py-1 flex-1" value={q.prompt} onChange={e=>{ const v=e.target.value; setQs(prev=>prev.map(x=>x.id===q.id?{...x,prompt:v}:x))}} onBlur={()=>saveQuestion(q)}/>
                  <button onClick={()=>delQuestion(q.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs">Excluir</button>
                </div>
                <div className="space-y-2">
                  {q.options.map((o:any)=>(
                    <div key={o.id} className="flex gap-2">
                      <input className="border rounded px-2 py-1 flex-1" value={o.label} onChange={e=>{o.label=e.target.value; setQs([...qs])}} onBlur={()=>saveOption(o)}/>
                      <input className="border rounded px-2 py-1 w-16" type="number" value={o.score||0} onChange={e=>{o.score=+e.target.value||0; setQs([...qs])}} onBlur={()=>saveOption(o)}/>
                      <label className="text-xs flex items-center gap-1">
                        <input type="checkbox" checked={!!o.is_correct} onChange={e=>{o.is_correct=e.target.checked; setQs([...qs]); saveOption(o)}}/> correta
                      </label>
                      <button onClick={()=>delOption(q.id,o.id)} className="px-2 py-1 bg-slate-100 rounded text-xs">remover</button>
                    </div>
                  ))}
                  <button onClick={()=>addOption(q.id)} className="px-2 py-1 bg-slate-100 rounded text-xs">+ opção</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
