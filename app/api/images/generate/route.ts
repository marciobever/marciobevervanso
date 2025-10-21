// app/api/images/generate/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenBody = {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  CFGScale?: number;
  numberResults?: number;
  model?: string;
  seed?: number;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { ok: false, error: 'missing_env', detail: 'RUNWARE_API_KEY ausente' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as GenBody;
    const {
      prompt,
      negativePrompt = 'logos, icon, ui, text, watermark, illustration, cartoon, clipart, blur, lowres, overexposed, underexposed',
      width = 720,
      height = 1280,
      steps = 40,
      CFGScale = 7,
      numberResults = 1,
      model = 'rundiffusion:130@100',
      seed = Date.now(),
    } = body || {};

    if (!prompt || !prompt.trim()) {
      return Response.json({ ok: false, error: 'invalid_prompt' }, { status: 400 });
    }

    const payload = [
      {
        taskType: 'imageInference',
        taskUUID: (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        positivePrompt: prompt,
        negativePrompt,
        height,
        width,
        steps,
        CFGScale,
        numberResults,
        model,
        seed,
      },
    ];

    const r = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) {
      return Response.json(
        { ok: false, error: 'runware_failed', status: r.status, detail: text },
        { status: 502 },
      );
    }

    let data: any = {};
    try { data = JSON.parse(text); } catch { /* ignore */ }

    const url =
      data?.data?.[0]?.imageURL ||
      data?.[0]?.data?.[0]?.imageURL ||
      data?.imageURL ||
      null;

    if (!url) {
      return Response.json(
        { ok: false, error: 'no_image_url', detail: data },
        { status: 500 },
      );
    }

    return Response.json({ ok: true, url, raw: data }, { status: 200 });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: 'proxy_failed', detail: String(err?.message || err) },
      { status: 500 },
    );
  }
}