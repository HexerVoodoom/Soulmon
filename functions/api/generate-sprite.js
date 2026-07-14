// Cloudflare Pages Function — gera 1 sprite via API de imagem do Gemini
// ("Nano Banana" = modelo gemini-2.5-flash-image). O cliente orquestra as 11
// chamadas (uma por forma) com barra de progresso; fazemos 1 imagem por
// request para não estourar o tempo de CPU da Function.
//
// Config: definir a secret GEMINI_API_KEY no Cloudflare (Pages → Settings →
// Environment variables, marcando Production E Preview). A chave nunca é
// exposta ao cliente.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MODEL = 'gemini-2.5-flash-image';

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt required' }, { status: 400, headers: CORS });
    }

    const key = env.GEMINI_API_KEY;
    if (!key) {
      return Response.json({ error: 'image generation not configured' }, { status: 503, headers: CORS });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // pede explicitamente imagem na resposta
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Gemini image error:', res.status, detail);
      return Response.json({ error: 'image service error', status: res.status }, { status: 502, headers: CORS });
    }

    const data = await res.json();
    // Procura a parte com imagem inline (base64)
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find(p => p.inlineData?.data || p.inline_data?.data);
    const inline = imgPart?.inlineData || imgPart?.inline_data;
    if (!inline?.data) {
      console.error('Gemini: no image in response', JSON.stringify(data).slice(0, 500));
      return Response.json({ error: 'no image returned' }, { status: 502, headers: CORS });
    }

    const mime = inline.mimeType || inline.mime_type || 'image/png';
    return Response.json({ image: `data:${mime};base64,${inline.data}` }, { headers: CORS });
  } catch (err) {
    console.error('generate-sprite error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: CORS });
  }
}
