// app/dashboard/posts/[id]/page.tsx
import { notFound } from "next/navigation"
import PostForm from "@/components/dashboard/PostForm"

export const dynamic = "force-dynamic"

async function getPost(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/dashboard/posts/${id}`,
    { cache: "no-store" }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function EditPostPage({
  params,
}: {
  params: { id: string }
}) {
  const post = await getPost(params.id)
  if (!post) return notFound()

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar post</h1>

      <PostForm initial={post} />

    </main>
  )
}
