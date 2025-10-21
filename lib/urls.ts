export function kindToSegment(s?: string) {
  if (!s) return ''
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
}
export function postUrl(p: { slug: string; type?: string | null; category?: string | null }) {
  const seg = kindToSegment(p.type || p.category || 'guias') || 'guias'
  return `/posts/${seg}/${encodeURIComponent(p.slug)}`
}
