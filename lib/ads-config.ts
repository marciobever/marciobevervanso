'use server'
import 'server-only'
import { supaAdmin } from '@/lib/supa-admin'

export type SlotKey =
  | 'content_top'
  | 'content_middle'
  | 'content_bottom'
  | 'sidebar'
  | 'floating_left'
  | 'floating_right'
  | 'modal'
  | 'inarticle'
  | 'infeed'
  | 'modal_quiz_mobile'   // novo
  | 'modal_quiz_desktop'  // novo

export type AdsenseBlocks = {
  content_responsive: string
  sidebar: string
  inarticle: string
  infeed: { id: string; layoutKey?: string }
  modal_300x250: string
  floating_left: string
  floating_right: string
  modal_mobile: string     // novo
  modal_desktop: string    // novo
}

export type SlotsCfg = Record<
  SlotKey,
  { enabled: boolean; block: keyof AdsenseBlocks }
>

export type AdsConfig = {
  provider: 'adsense'
  max_ads_per_page: number
  adsense: {
    client: string
    autoAdsEnabled: boolean
    extraSnippet?: string
    blocks: AdsenseBlocks
    slots: SlotsCfg
  }
}

const ENV_CLIENT = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '').trim()

const DEFAULT: AdsConfig = {
  provider: 'adsense',
  max_ads_per_page: 3,
  adsense: {
    client: ENV_CLIENT,
    autoAdsEnabled: true,
    extraSnippet: '',
    blocks: {
      content_responsive: '',
      sidebar: '',
      inarticle: '',
      infeed: { id: '', layoutKey: '' },
      modal_300x250: '',
      floating_left: '',
      floating_right: '',
      modal_mobile: '',   // novo
      modal_desktop: '',  // novo
    },
    slots: {
      content_top:        { enabled: false, block: 'content_responsive' },
      content_middle:     { enabled: false, block: 'content_responsive' },
      content_bottom:     { enabled: false, block: 'content_responsive' },
      sidebar:            { enabled: false, block: 'sidebar' },
      floating_left:      { enabled: false, block: 'floating_left' },
      floating_right:     { enabled: false, block: 'floating_right' },
      modal:              { enabled: false, block: 'modal_300x250' },
      inarticle:          { enabled: false, block: 'inarticle' },
      infeed:             { enabled: false, block: 'infeed' },

      // novos
      modal_quiz_mobile:  { enabled: false, block: 'modal_mobile' },
      modal_quiz_desktop: { enabled: false, block: 'modal_desktop' },
    },
  },
}

const TABLE = 'ads_config'
const ADS_ROW_ID = '00000000-0000-0000-0000-000000000001' // UUID fixo da linha única

function deepMerge<T>(base: T, over?: Partial<T>): T {
  if (!over) return base
  if (Array.isArray(base) || Array.isArray(over)) return (over as T) ?? base
  const out: any = { ...(base as any) }
  for (const k of Object.keys(over as any)) {
    const v: any = (over as any)[k]
    if (v === undefined || v === null || v === '') continue // não sobrescreve com vazio
    if (typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null) {
      out[k] = deepMerge(out[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

function cleanEmptyStrings<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return (obj.trim() === '' ? (undefined as any) : (obj as any))
  if (Array.isArray(obj)) return obj.map(cleanEmptyStrings) as any
  if (typeof obj === 'object') {
    const o: any = {}
    for (const [k, v] of Object.entries(obj as any)) {
      const cleaned = cleanEmptyStrings(v as any)
      if (cleaned !== undefined) o[k] = cleaned
    }
    return o
  }
  return obj
}

/**
 * Normaliza config legada (top-level) para o formato novo dentro de adsense.{client,blocks,slots}.
 */
function normalizeLegacy(raw: any): AdsConfig {
  // Já no formato novo? (tem adsense.blocks ou adsense.slots)
  if (raw?.adsense?.blocks || raw?.adsense?.slots) {
    // Ainda assim, garante que os novos campos existam
    const withNewFields = deepMerge(DEFAULT, raw as Partial<AdsConfig>)
    return withNewFields
  }

  // LEGADO
  const legacyClient   = (raw?.client || '').trim()
  const legacyMax      = typeof raw?.max_ads_per_page === 'number' ? raw.max_ads_per_page : undefined
  const legacyEnabled  = raw?.enabled || {}
  const legacySlots    = raw?.slots || {}

  const out: AdsConfig = deepMerge(DEFAULT, {
    max_ads_per_page: legacyMax,
    adsense: {
      client: legacyClient || DEFAULT.adsense.client,
      autoAdsEnabled: typeof raw?.autoAdsEnabled === 'boolean' ? raw.autoAdsEnabled : DEFAULT.adsense.autoAdsEnabled,
      extraSnippet: typeof raw?.extraSnippet === 'string' ? raw.extraSnippet : DEFAULT.adsense.extraSnippet,
      blocks: {
        content_responsive: legacySlots.content_responsive || '',
        sidebar: legacySlots.sidebar || '',
        inarticle: legacySlots.inarticle || '',
        infeed: {
          id: legacySlots?.infeed?.id || '',
          layoutKey: legacySlots?.infeed?.layoutKey || '',
        },
        modal_300x250: legacySlots.modal_300x250 || '',
        floating_left: legacySlots.floating_left || '',
        floating_right: legacySlots.floating_right || '',

        // novos (se vierem do legado, mantém; senão, ficam vazios)
        modal_mobile: legacySlots.modal_mobile || '',
        modal_desktop: legacySlots.modal_desktop || '',
      },
      slots: {
        content_top:        { enabled: !!legacyEnabled.content_top,        block: 'content_responsive' },
        content_middle:     { enabled: !!legacyEnabled.content_middle,     block: 'content_responsive' },
        content_bottom:     { enabled: !!legacyEnabled.content_bottom,     block: 'content_responsive' },
        sidebar:            { enabled: !!legacyEnabled.sidebar,            block: 'sidebar' },
        floating_left:      { enabled: !!legacyEnabled.floating_left,      block: 'floating_left' },
        floating_right:     { enabled: !!legacyEnabled.floating_right,     block: 'floating_right' },
        modal:              { enabled: !!legacyEnabled.modal,              block: 'modal_300x250' },
        inarticle:          { enabled: !!legacyEnabled.inarticle,          block: 'inarticle' },
        infeed:             { enabled: !!legacyEnabled.infeed,             block: 'infeed' },

        // novos
        modal_quiz_mobile:  { enabled: !!legacyEnabled.modal_quiz_mobile,  block: 'modal_mobile' },
        modal_quiz_desktop: { enabled: !!legacyEnabled.modal_quiz_desktop, block: 'modal_desktop' },
      },
    },
  })

  return out
}

export async function getAdsConfig(): Promise<AdsConfig> {
  try {
    const supa = supaAdmin()
    let { data, error } = await supa
      .from(TABLE)
      .select('data')
      .eq('id', ADS_ROW_ID)
      .maybeSingle()

    if (error) {
      console.error('ads_config select error', error)
    }

    // se não existir a linha, cria com DEFAULT
    if (!data) {
      const seed = deepMerge(DEFAULT, {}) // cópia do default
      const up = await supa
        .from(TABLE)
        .upsert({ id: ADS_ROW_ID, data: seed }, { onConflict: 'id' })
      if (up.error) {
        console.error('ads_config seed error', up.error)
        return DEFAULT
      }
      return seed
    }

    const raw = data.data || {}

    // normaliza legado -> novo e dá merge com DEFAULT
    const normalized = normalizeLegacy(raw)

    // fallback do client (se banco veio vazio)
    if (!normalized.adsense.client) normalized.adsense.client = ENV_CLIENT

    return normalized
  } catch (e) {
    console.error('ads_config get error', e)
    return DEFAULT
  }
}

export async function saveAdsConfig(cfg: Partial<AdsConfig>): Promise<AdsConfig> {
  // remove strings vazias para não "zerar" campos
  const sanitized = cleanEmptyStrings(cfg)
  // garante defaults + override do usuário
  const merged = deepMerge(DEFAULT, sanitized as Partial<AdsConfig>)

  // ainda garante client do ambiente se ficar vazio
  if (!merged.adsense.client) merged.adsense.client = ENV_CLIENT

  try {
    const supa = supaAdmin()
    const { error } = await supa
      .from(TABLE)
      .upsert({ id: ADS_ROW_ID, data: merged }, { onConflict: 'id' })
    if (error) throw error
  } catch (e) {
    console.error('ads_config save error', e)
  }
  return merged
}
