// Cloudflare Pages Function — gera 1 sprite de Soulmon.
// Provedor primário: HIGGSFIELD (platform.higgsfield.ai, modelo Soul).
//   Secrets: HF_API_KEY + HF_SECRET (já configurados via `wrangler secret`).
//   Suporta referência de imagem (cadeia de evolução: champion parte do
//   rookie etc. — ver src/utils/spritePrompts.ts).
// Fallback: Gemini (GEMINI_API_KEY, modelo gemini-2.5-flash-image), texto puro.
//
// POST { prompt, referenceImageUrls?: string[] } → { image: <url|dataURL> }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const HF_BASE = 'https://platform.higgsfield.ai';
const GEMINI_MODEL = 'gemini-2.5-flash-image';

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

async function generateHiggsfield(env, prompt, referenceImageUrls) {
  const auth = `Key ${env.HF_API_KEY}:${env.HF_SECRET}`;
  const hasRef = Array.isArray(referenceImageUrls) && referenceImageUrls.length > 0;
  // Soul: texto puro; com referência usa o endpoint image2image do Soul.
  const path = hasRef ? '/v1/image2image/soul' : '/v1/text2image/soul';
  const params = {
    prompt,
    width_and_height: '1536x1536',
    quality: '720p',
    batch_size: 1,
    ...(hasRef ? { image_url: referenceImageUrls[0], image_urls: referenceImageUrls } : {}),
  };
  const createRes = await fetch(HF_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ params }),
  });
  if (!createRes.ok) {
    throw new Error(`higgsfield create ${createRes.status}: ${(await createRes.text()).slice(0, 300)}`);
  }
  const jobSet = await createRes.json();
  const jobSetId = jobSet.id || jobSet.job_set_id;
  if (!jobSetId) throw new Error('higgsfield: no job set id');

  // Poll até completar (limite ~80s)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const st = await fetch(`${HF_BASE}/v1/job-sets/${jobSetId}`, {
      headers: { Authorization: auth },
    });
    if (!st.ok) continue;
    const data = await st.json();
    const jobs = data.jobs || [];
    if (jobs.some(j => j.status === 'failed' || j.status === 'nsfw')) {
      throw new Error('higgsfield: generation failed');
    }
    const doneJob = jobs.find(j => j.status === 'completed');
    if (doneJob) {
      const url = doneJob.results?.raw?.url || doneJob.results?.min?.url;
      if (url) return url;
      throw new Error('higgsfield: completed without url');
    }
  }
  throw new Error('higgsfield: timeout');
}

async function generateGemini(env, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find(p => p.inlineData?.data || p.inline_data?.data);
  const inline = imgPart?.inlineData || imgPart?.inline_data;
  if (!inline?.data) throw new Error('gemini: no image');
  const mime = inline.mimeType || inline.mime_type || 'image/png';
  return `data:${mime};base64,${inline.data}`;
}

export async function onRequestPost({ request, env }) {
  try {
    const { prompt, referenceImageUrls } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt required' }, { status: 400, headers: CORS });
    }

    let hfError = null;
    if (env.HF_API_KEY && env.HF_SECRET) {
      try {
        const image = await generateHiggsfield(env, prompt, referenceImageUrls);
        return Response.json({ image, provider: 'higgsfield' }, { headers: CORS });
      } catch (err) {
        hfError = err.message;
        console.error('Higgsfield falhou, tentando fallback:', err.message);
      }
    }

    if (env.GEMINI_API_KEY) {
      const image = await generateGemini(env, prompt);
      return Response.json({ image, provider: 'gemini', hfError }, { headers: CORS });
    }

    return Response.json({ error: 'image generation not configured (HF_API_KEY/HF_SECRET ou GEMINI_API_KEY)', hfError }, { status: 503, headers: CORS });
  } catch (err) {
    console.error('generate-sprite error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: CORS });
  }
}
