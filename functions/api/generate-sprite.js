// Cloudflare Pages Function — gera 1 sprite de Soulmon.
// Provedor primário: HIGGSFIELD (platform.higgsfield.ai, modelo Soul).
//   Secrets: HF_API_KEY + HF_SECRET (já configurados via `wrangler secret`).
//   Suporta referência de imagem (cadeia de evolução: champion parte do
//   rookie etc. — ver src/utils/spritePrompts.ts).
// Fallback: Gemini (GEMINI_API_KEY, modelo gemini-2.5-flash-image), texto puro.
//
// DUAS TENTATIVAS DE PROMPT (decisão do dono do projeto): `prompt` cita as
// referências de gênero (Digimon/Pokémon/…) porque o resultado sai melhor, e
// `promptFallback` é o mesmo pedido SEM citar ninguém. Toda criação começa pelo
// primeiro; se o provedor RECUSAR por política de conteúdo (`isRefusal`), a
// mesma requisição refaz sozinha com o fallback. Erro que não é recusa (timeout,
// 5xx, sem crédito) NÃO refaz — repetir ali só dobra o custo sem mudar nada.
//
// POST { prompt, promptFallback?, referenceImageUrls?: string[] }
//   → { image: <url|dataURL>, usedFallbackPrompt?: true, refusal?: <motivo> }

import { guardAiRequest } from './_aiGuard.js';
import { requirePaidTier } from './_entitlements.js';

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

/** Erro que significa "o provedor recusou ESTE texto" — o único caso em que
 *  vale refazer com o prompt sem referências. Marcado na origem (`refusal`);
 *  o teste de texto é rede de segurança para formatos de erro que ainda não
 *  vimos, já que cada provedor recusa com uma mensagem diferente. */
const REFUSAL_WORDS =
  /nsfw|safety|policy|polic[ií]|moderation|blocked|prohibited|content[_ -]filter|copyright|trademark|intellectual property|recitation/i;

/** @param {{ refusal?: boolean, message?: string }} [err] */
function isRefusal(err) {
  return Boolean(err?.refusal) || REFUSAL_WORDS.test(err?.message || '');
}

function refusalError(message) {
  const err = /** @type {Error & { refusal?: boolean }} */ (new Error(message));
  err.refusal = true;
  return err;
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
    const body = (await createRes.text()).slice(0, 300);
    const msg = `higgsfield create ${createRes.status}: ${body}`;
    // 400/422 no create é o formato em que o Higgsfield reprova o TEXTO do
    // prompt (o 402/429 de crédito e os 5xx não são recusa de conteúdo).
    if (createRes.status === 400 || createRes.status === 422) throw refusalError(msg);
    throw new Error(msg);
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
    if (jobs.some(j => j.status === 'nsfw')) {
      throw refusalError('higgsfield: nsfw/policy rejection');
    }
    if (jobs.some(j => j.status === 'failed')) {
      // 'failed' cru acontece sem motivo aparente (falha transitória do
      // provedor); não é recusa de conteúdo, então não troca o prompt.
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
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    if (res.status === 400) throw refusalError(`gemini 400: ${body}`);
    throw new Error(`gemini ${res.status}: ${body}`);
  }
  const data = await res.json();
  // O Gemini recusa de duas formas: bloqueando o prompt (promptFeedback) ou
  // devolvendo um candidato sem imagem com finishReason SAFETY/PROHIBITED.
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) throw refusalError(`gemini blocked: ${blockReason}`);
  const finish = data?.candidates?.[0]?.finishReason;
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find(p => p.inlineData?.data || p.inline_data?.data);
  const inline = imgPart?.inlineData || imgPart?.inline_data;
  if (!inline?.data) {
    if (finish && finish !== 'STOP') throw refusalError(`gemini: no image (${finish})`);
    throw new Error('gemini: no image');
  }
  const mime = inline.mimeType || inline.mime_type || 'image/png';
  return `data:${mime};base64,${inline.data}`;
}

/** Roda os provedores na ordem (Higgsfield → Gemini) para UM texto de prompt.
 *  Devolve `{ image, provider, hfError }` ou lança — o erro carrega `refusal`
 *  quando o motivo foi política de conteúdo, que é o que decide a 2ª tentativa. */
async function generateWithProviders(env, prompt, referenceImageUrls) {
  let hfError = null;
  let hfRefusal = false;

  if (env.HF_API_KEY && env.HF_SECRET) {
    try {
      const image = await generateHiggsfield(env, prompt, referenceImageUrls);
      return { image, provider: 'higgsfield', hfError: null };
    } catch (err) {
      hfError = err.message;
      hfRefusal = isRefusal(err);
      console.error('Higgsfield falhou, tentando fallback de provedor:', err.message);
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      const image = await generateGemini(env, prompt);
      return { image, provider: 'gemini', hfError };
    } catch (err) {
      // Se QUALQUER provedor recusou o texto, o erro que sobe é de recusa —
      // é o sinal para trocar o prompt em vez de desistir.
      if (isRefusal(err) || hfRefusal) throw refusalError(err.message);
      throw err;
    }
  }

  if (hfRefusal) throw refusalError(hfError);
  if (hfError) throw new Error(hfError);
  const err = /** @type {Error & { notConfigured?: boolean }} */ (
    new Error('image generation not configured (HF_API_KEY/HF_SECRET ou GEMINI_API_KEY)')
  );
  err.notConfigured = true;
  throw err;
}

export async function onRequestPost({ request, env }) {
  try {
    const { prompt, promptFallback, referenceImageUrls, id } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt required' }, { status: 400, headers: CORS });
    }

    // DOIS portões, nesta ordem, e ambos ANTES de qualquer chamada de IA.
    //
    // 1) DIREITO (`requirePaidTier`): quem NÃO paga não gera. Vem primeiro de
    //    propósito — recusar antes do `_aiGuard` faz com que uma conta demo em
    //    loop não consuma nem o teto global do dia (que é o disjuntor da conta
    //    de quem paga). É fail-closed: tier indeterminável recusa.
    // 2) VOLUME (`guardAiRequest`): cota por conta + teto global. Mede quantas,
    //    não quem — por isso não substitui o de cima.
    const tier = await requirePaidTier(env, id);
    if (!tier.ok) {
      return Response.json({ error: tier.reason }, { status: tier.status, headers: CORS });
    }

    // A rota mais cara do app, e a única em que o PROMPT vem do cliente: sem
    // portão, era geração de imagem ilimitada e livre na nossa conta.
    const gate = await guardAiRequest(request, env, 'sprite', id);
    if (!gate.ok) return Response.json({ error: gate.reason }, { status: gate.status, headers: CORS });

    // 1ª tentativa: SEMPRE o prompt com as referências de gênero.
    try {
      const out = await generateWithProviders(env, prompt, referenceImageUrls);
      return Response.json(out, { headers: CORS });
    } catch (err) {
      const canRetry =
        typeof promptFallback === 'string' && promptFallback.length > 0 && promptFallback !== prompt;
      if (!canRetry || !isRefusal(err)) {
        if (err.notConfigured) {
          return Response.json({ error: err.message }, { status: 503, headers: CORS });
        }
        throw err;
      }
      // 2ª tentativa: mesmo pedido, sem citar franquia nenhuma.
      console.warn('Prompt com referências recusado, refazendo sem elas:', err.message);
      const out = await generateWithProviders(env, promptFallback, referenceImageUrls);
      return Response.json({ ...out, usedFallbackPrompt: true, refusal: err.message }, { headers: CORS });
    }
  } catch (err) {
    console.error('generate-sprite error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: CORS });
  }
}
