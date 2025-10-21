import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function WebstoryEntry({
  params,
}: { params: { slug: string } }) {
  // cache-buster pra evitar qualquer cache agressivo no navegador/CDN
  redirect(`/webstories/${params.slug}/amp?rnd=${Date.now()}`)
}