'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // se preferir, use SERVICE_ROLE em rotas de API
)

export type PostInput = {
  id?: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  status: 'draft'|'published'
  image_url?: string
  categoryIds?: string[]
}

export async function listPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, status, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function getPost(id: string) {
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content, status, image_url')
    .eq('id', id).single()
  if (error) throw error

  const { data: cats } = await supabase
    .from('post_categories')
    .select('category_id')
    .eq('post_id', id)

  const categoryIds = (cats||[]).map(c => c.category_id)
  return { ...post, categoryIds }
}

export async function upsertPost(input: PostInput) {
  const payload = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    content: input.content ?? null,
    status: input.status,
    image_url: input.image_url ?? null,
    published_at: input.status === 'published' ? new Date().toISOString() : null
  }

  let postId = input.id
  if (postId) {
    const { error } = await supabase.from('posts').update(payload).eq('id', postId)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('posts').insert(payload).select('id').single()
    if (error) throw error
    postId = data.id
  }

  // Atualiza categorias
  if (input.categoryIds) {
    await supabase.from('post_categories').delete().eq('post_id', postId!)
    const rows = input.categoryIds.map(cid => ({ post_id: postId!, category_id: cid }))
    if (rows.length) {
      const { error } = await supabase.from('post_categories').insert(rows)
      if (error) throw error
    }
  }

  revalidatePath('/dashboard/posts')
  return { id: postId }
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/posts')
}

// ===== categories =====
export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}

export async function createCategory(name: string, slug: string) {
  const { data, error } = await supabase.from('categories').insert({ name, slug }).select('id').single()
  if (error) throw error
  revalidatePath('/dashboard/posts')
  return data.id as string
}

// ===== cards =====
export type CardInput = { id?: string; title: string; badge?: string; meta?: string; image_url?: string }

export async function listCards() {
  const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertCard(card: CardInput) {
  if (card.id) {
    const { error } = await supabase.from('cards').update(card).eq('id', card.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('cards').insert(card)
    if (error) throw error
  }
  revalidatePath('/dashboard/cards')
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/cards')
}
