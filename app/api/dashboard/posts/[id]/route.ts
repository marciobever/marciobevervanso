// app/api/dashboard/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const db = createClient(url, key, { auth: { persistSession: false } })

// GET - Buscar post pelo id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    console.error("[posts/:id] GET error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 404 })
  }

  return NextResponse.json({ ok: true, post: data })
}

// PATCH - Atualizar post pelo id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    // apenas campos permitidos
    const payload: any = {
      title: body.title ?? null,
      slug: body.slug ?? null,
      type: body.type ?? "outros",
      category: body.category ?? null,
      image_url: body.image_url ?? null,
      excerpt: body.excerpt ?? null,
      content_html: body.content_html ?? null,
      status: body.status ?? "draft",
      flags: body.flags ?? {},
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await db
      .from("posts")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[posts/:id] PATCH error:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, post: data })
  } catch (err: any) {
    console.error("[posts/:id] PATCH exception:", err)
    return NextResponse.json({ ok: false, error: err.message || "Erro inesperado" }, { status: 500 })
  }
}

// DELETE - Excluir post pelo id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await db.from("posts").delete().eq("id", params.id)

  if (error) {
    console.error("[posts/:id] DELETE error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
