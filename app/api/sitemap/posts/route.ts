// app/api/sitemap/posts/route.ts
import { NextResponse } from "next/server";
// Se você usa Supabase no server:
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // evita cache duro no build

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !key) return NextResponse.json([], { status: 200 });

    const supabase = createClient(url, key, { auth: { persistSession: false } });

    // EXEMPLO: tabela "posts" com colunas: slug, updated_at, status
    const { data, error } = await supabase
      .from("posts")
      .select("slug, updated_at, status")
      .eq("status", "published")
      .limit(5000); // ajuste conforme volume

    if (error || !data) return NextResponse.json([], { status: 200 });

    const items = data
      .filter((r) => r.slug)
      .map((r) => ({
        slug: r.slug,
        updatedAt: r.updated_at ?? null,
      }));

    return NextResponse.json(items, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
