export type Kind = 'cartoes' | 'beneficios' | 'concursos' | 'empregos'

export type NavItem = {
  label: string
  indexHref?: string
  kind?: Kind
  megamenu?: boolean
  icon?: any
}

export type FeaturedItem = {
  id: string
  title: string
  slug?: string | null
  image_url?: string | null
  type?: string | null
  extras?: any
  flags?: any
  groups?: any
}

export type FeaturedSection = {
  label: string
  items: FeaturedItem[]
}

export type FeaturedByKind = Partial<Record<Kind, FeaturedItem[]>>
export type FeaturedSectionsByKind = Partial<Record<Kind, FeaturedSection[]>>