'use client'
import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Stat } from '@/components/ui/Stat'

type CardIn  = { nome:string; anuidade:number; cashbackPct:number; gastoMensal:number }
type CardOut = CardIn & { cashbackAno:number; custoLiquido:number }
const fmt = (n:number)=> n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

export default function ComparadorCartoesUI() {
  const [a,setA]=useState<CardIn>({ nome:'Cartão A', anuidade:240, cashbackPct:1.0, gastoMensal:1500 })
  const [b,setB]=useState<CardIn>({ nome:'Cartão B', anuidade:  0, cashbackPct:0.5, gastoMensal:1500 })

  const res = useMemo(()=>{
    const calc=(c:CardIn):CardOut=>{
      const cashbackAno = (c.cashbackPct/100)*(c.gastoMensal*12)
      return {...c,cashbackAno,custoLiquido:c.anuidade-cashbackAno}
    }
    const ca = calc(a), cb = calc(b)
    const vencedor = ca.custoLiquido<cb.custoLiquido ? 'A' : cb.custoLiquido<ca.custoLiquido ? 'B':'Empate'
    return { ca, cb, vencedor }
  },[a,b])

  const Preset = ({label,va,vb}:{label:string;va:CardIn;vb:CardIn})=>(
    <button
      onClick={()=>{setA(va);setB(vb)}}
      className="px-3 py-1.5 rounded-xl text-sm border border-white/40 bg-white/60 hover:bg-white"
    >
      {label}
    </button>
  )

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black leading-tight">
          Comparador de <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">cartões</span>
        </h1>
        <p className="text-slate-600 mt-1">Compare anuidade × cashback para ver o <strong>custo líquido</strong> anual real.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* ESQUERDA: FORM */}
        <div className="space-y-6">
          {/* Presets */}
          <Glass className="p-5">
            <div className="flex flex-wrap gap-2">
              <Preset label="Sem anuidade vs 1% cashback"
                va={{nome:'Cartão A',anuidade:0,cashbackPct:0.5,gastoMensal:1500}}
                vb={{nome:'Cartão B',anuidade:0,cashbackPct:1.0,gastoMensal:1500}} />
              <Preset label="A: R$240 +1%  •  B: R$0 +0.5%"
                va={{nome:'Cartão A',anuidade:240,cashbackPct:1.0,gastoMensal:1500}}
                vb={{nome:'Cartão B',anuidade:0,cashbackPct:0.5,gastoMensal:1500}} />
              <Preset label="Milhas 2% vs Cashback 1%"
                va={{nome:'Milhas 2%',anuidade:600,cashbackPct:2,gastoMensal:2500}}
                vb={{nome:'Cashback 1%',anuidade:0,cashbackPct:1,gastoMensal:2500}} />
            </div>
          </Glass>

          {/* Campos A e B */}
          <div className="grid md:grid-cols-2 gap-6">
            <CardEditor title="Cartão A" v={a} set={setA}/>
            <CardEditor title="Cartão B" v={b} set={setB}/>
          </div>

          {/* Observações */}
          <Glass className="p-5">
            <h3 className="font-semibold mb-1">Observações</h3>
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Cashback real depende de categorias/campanhas; ajuste a taxa conforme seu perfil.</li>
              <li>Se o emissor oferecer desconto de anuidade por gasto, reduza a anuidade manualmente.</li>
            </ul>
          </Glass>
        </div>

        {/* DIREITA: RESULTADOS “STICKY” */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <Glass className="p-5">
            <h3 className="font-bold mb-3">Resumo</h3>
            <div className="grid gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">{a.nome}</div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Cashback anual" value={fmt(res.ca.cashbackAno)} />
                  <Stat label="Custo líquido" value={fmt(res.ca.custoLiquido)} accent={res.ca.custoLiquido<=0?'text-emerald-700':'text-rose-700'}/>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">{b.nome}</div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Cashback anual" value={fmt(res.cb.cashbackAno)} />
                  <Stat label="Custo líquido" value={fmt(res.cb.custoLiquido)} accent={res.cb.custoLiquido<=0?'text-emerald-700':'text-rose-700'}/>
                </div>
              </div>
            </div>
          </Glass>

          <Glass className="p-5">
            <div className="text-sm text-slate-500">Vantagem</div>
            <div className="text-2xl font-extrabold mt-1">
              {res.vencedor==='Empate' ? 'Empate' : `Cartão ${res.vencedor}`}
            </div>
            <button className="mt-4 w-full rounded-xl bg-sky-600 text-white font-bold py-2 hover:bg-sky-700">
              Ver cartões sem anuidade
            </button>
          </Glass>
        </div>
      </div>
    </main>
  )
}

/* —— subcomponentes —— */
function CardEditor({title,v,set}:{title:string; v:CardIn; set:(x:CardIn)=>void}) {
  return (
    <Glass className="p-5">
      <h3 className="font-bold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome">
          <input className="w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 outline-none backdrop-blur focus:ring-2 focus:ring-sky-200"
            value={v.nome} onChange={e=>set({...v,nome:e.target.value})}/>
        </Field>
        <Field label="Anuidade (R$/ano)">
          <Number value={v.anuidade} onChange={n=>set({...v,anuidade:n})} min={0} step={10}/>
        </Field>
        <Field label="Cashback (%)">
          <Number value={v.cashbackPct} onChange={n=>set({...v,cashbackPct:n})} min={0} step={0.1}/>
          <Range  value={v.cashbackPct} onChange={n=>set({...v,cashbackPct:n})} min={0} max={5} step={0.1}/>
        </Field>
        <Field label="Gasto mensal (R$)">
          <Number value={v.gastoMensal} onChange={n=>set({...v,gastoMensal:n})} min={0} step={50}/>
          <Range  value={v.gastoMensal} onChange={n=>set({...v,gastoMensal:n})} min={0} max={10000} step={50}/>
        </Field>
      </div>
    </Glass>
  )
}
function Field({label,children}:{label:string;children:React.ReactNode}){ return <label className="text-sm block">{label}<div className="mt-1 space-y-2">{children}</div></label> }
function Number({value,onChange,min=0,step=1}:{value:number;onChange:(n:number)=>void;min?:number;step?:number}){
  return <input className="w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 outline-none backdrop-blur focus:ring-2 focus:ring-sky-200" type="number" value={value} min={min} step={step} onChange={e=>onChange(+e.target.value)} />
}
function Range({value,onChange,min,max,step}:{value:number;onChange:(n:number)=>void;min:number;max:number;step:number}){
  return <input className="w-full accent-sky-600" type="range" value={value} min={min} max={max} step={step} onChange={e=>onChange(+e.target.value)} />
}
