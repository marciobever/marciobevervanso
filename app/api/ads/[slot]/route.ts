// app/api/ads/[slot]/route.ts
import { NextResponse } from 'next/server'

type SlotCfg = {
  path: string
  enabled: boolean
  sizes: number[][]
  fluid?: boolean
  lazy?: boolean
}

// IMPORTANTE: seus ad units no GAM usam subpasta "receitapopular/"
// Ex.: /23308685722/receitapopular/receitapopular_Content1
const U = (n: number) => `/23308685722/receitapopular/receitapopular_Content${n}`

const SLOTS: Record<string, SlotCfg> = {
  // —— Home
  home_top: {
    path: U(1),
    enabled: true,
    sizes: [
      [728, 90],
      [970, 90],
      [320, 100],
      [300, 100],
      [300, 250], // fallback
    ],
    lazy: false,
  },
  home_sidebar: {
    path: U(2),
    enabled: true,
    sizes: [
      [300, 250],
      [336, 280],
      [250, 250],
    ],
    fluid: true,
    lazy: false,
  },

  // —— Modal Quiz (sidebar do modal)
  modal_quiz_sidebar: {
    path: U(3),
    enabled: true,
    sizes: [
      [300, 250],
      [336, 280],
    ],
    lazy: false,
  },

  // —— Página Oportunidades
  oportunidades_top: {
    path: U(4),
    enabled: true,
    sizes: [
      [728, 90],
      [970, 90],
      [320, 100],
      [300, 100],
    ],
    lazy: false,
  },
  oportunidades_bottom: {
    path: U(5),
    enabled: true,
    sizes: [
      [728, 90],
      [970, 90],
      [320, 100],
      [300, 100],
    ],
    lazy: false,
  },
  oportunidades_sidebar: {
    path: U(6),
    enabled: true,
    sizes: [
      [300, 250],
      [336, 280],
      [250, 250],
    ],
    fluid: true,
    lazy: false,
  },

  // —— Slots genéricos (caso outra página use)
  Content1: { path: U(1), enabled: true, sizes: [[300, 250], [336, 280], [250, 250]], fluid: true, lazy: false },
  Content2: { path: U(2), enabled: true, sizes: [[300, 250], [336, 280], [250, 250]], fluid: true, lazy: false },
  Content3: { path: U(3), enabled: true, sizes: [[300, 250], [336, 280]], lazy: false },
  Content4: { path: U(4), enabled: true, sizes: [[728, 90], [970, 90], [320, 100], [300, 100]], lazy: false },
  Content5: { path: U(5), enabled: true, sizes: [[728, 90], [970, 90], [320, 100], [300, 100]], lazy: false },
  Content6: { path: U(6), enabled: true, sizes: [[300, 250], [336, 280], [250, 250]], fluid: true, lazy: false },
  Content7: { path: U(7), enabled: true, sizes: [[300, 250], [336, 280]], lazy: true },
  Content8: { path: U(8), enabled: true, sizes: [[300, 250], [336, 280]], lazy: true },
  Content9: { path: U(9), enabled: true, sizes: [[300, 250], [336, 280]], lazy: true },
}

export async function GET(_: Request, { params }: { params: { slot: string } }) {
  const key = params.slot
  const slot = SLOTS[key] ?? null
  return NextResponse.json({ slot })
}
