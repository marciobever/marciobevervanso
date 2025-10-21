// lib/post-path.ts
export function postPath(type: string | null | undefined, slug: string | null, id: string) {
  const safeSlug = slug || id
  switch (type) {
    case 'concursos':
      return `/posts/concurso/${safeSlug}`
    case 'cartoes':
      return `/posts/cartoes/${safeSlug}`
    case 'empregos':
      return `/posts/empregos/${safeSlug}`
    default:
      return `/posts/concurso/${safeSlug}` // fallback
  }
}
