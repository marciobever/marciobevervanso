import PostEditor from '@/components/dashboard/PostEditor'
import { supaAdmin } from '@/lib/supa-admin'

type SearchParams = { searchParams: { edit?: string } }

type InitialPost = {
  id?: string
  title: string
  slug: string
  category: string | null
  badge: string | null
  image_url: string | null
  content: string | null
  minutes: number | null
  status: 'draft' | 'published'
  type: string
  extras: Record<string, any>
  gallery: any[]
  sources: any[]
}

function normalizeStatus(v?: string | null): 'draft' | 'published' {
  const s = (v || '').toLowerCase()
  if (s === 'published' || s === 'publicado') return 'published'
  // tudo que não for published vira draft (inclui '', 'rascunho', null, etc.)
  return 'draft'
}

async function getInitial(editId?: string): Promise<InitialPost> {
  if (!editId) {
    return {
      title: '',
      slug: '',
      category: '',
      badge: '',
      image_url: '',
      content: '',
      minutes: null,
      status: 'draft',          // 👈 default correto
      type: 'outros',
      extras: {},
      gallery: [],
      sources: [],
    }
  }

  const db = supaAdmin()
  const { data } = await db
    .from('posts')
    .select('id,title,slug,category,badge,image_url,content,minutes,status,type,extras,gallery,sources')
    .eq('id', editId)
    .maybeSingle()

  if (!data) {
    // fallback se não encontrar
    return {
      title: '',
      slug: '',
      category: '',
      badge: '',
      image_url: '',
      content: '',
      minutes: null,
      status: 'draft',
      type: 'outros',
      extras: {},
      gallery: [],
      sources: [],
    }
  }

  return {
    id: data.id,
    title: data.title || '',
    slug: data.slug || '',
    category: (data.category ?? '') as string,
    badge: (data.badge ?? '') as string,
    image_url: (data.image_url ?? '') as string,
    content: data.content ?? '',
    minutes: (data.minutes ?? null) as number | null,
    status: normalizeStatus(data.status), // 👈 normaliza PT->EN
    type: (data.type || 'outros') as string,
    extras: data.extras ?? {},
    gallery: data.gallery ?? [],
    sources: data.sources ?? [],
  }
}

export default async function NewPostPage({ searchParams }: SearchParams) {
  const initial = await getInitial(searchParams.edit)
  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-black mb-4">
        {searchParams.edit ? 'Editar post' : 'Novo post'}
      </h1>
      <PostEditor initial={initial as any} />
    </main>
  )
}
