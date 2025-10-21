// lib/quizPosts.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchQuizPosts(slugs: string[]) {
  const { data, error } = await supabase
    .from('quiz_posts')
    .select('slug, title, summary, badge:subtitle, highlight:summary') // ajusta conforme suas colunas
    .in('slug', slugs)
    .eq('is_published', true)

  if (error) throw error
  return data
}