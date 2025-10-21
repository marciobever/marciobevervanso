import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest){
  const secret = req.nextUrl.searchParams.get('secret')
  if(secret !== process.env.REVALIDATE_SECRET) return NextResponse.json({ ok:false },{ status:401 })
  return NextResponse.json({ revalidated:true })
}
