// Cloudflare Pages Function — gera 1 sprite de Soulmon.
// Provedor primário: HIGGSFIELD API pública — 2.0 Alpha low (padrão) ou 2.5 Flare
// (SPRITE_MODEL=flare), com fundo VERDE + chroma-key no servidor (§48); sem
// HF_CREDENTIALS, Soul.
//   Secrets: HF_API_KEY + HF_SECRET (já configurados via `wrangler secret`).
//   Suporta referência de imagem (cadeia de evolução: champion parte do
//   rookie etc. — ver `composeSpritePrompts` em `src/utils/oracle.ts`).
//   ⚠️ Esta linha apontava para `src/utils/spritePrompts.ts`, um SEGUNDO
//   compositor de prompt que existia em paralelo, tinha zero consumidores e
//   **não carregava a cláusula "Do not copy any existing franchise
//   character"**. Ninguém o chamava, mas o comentário aqui mandava o leitor
//   para ele — e quem fosse ligá-lo publicaria prompts sem a única trava que
//   impede o gerador de devolver personagem registrado. Apagado em
//   07/09/2026; o dono do prompt é, e sempre foi, o `oracle.ts`.
// Fallback: Gemini (GEMINI_API_KEY, modelo gemini-2.5-flash-image), texto puro.
//
// DUAS TENTATIVAS DE PROMPT (decisão do dono do projeto): `prompt` cita as
// referências de gênero (Digimon/Pokémon/…) porque o resultado sai melhor, e
// `promptFallback` é o mesmo pedido SEM citar ninguém. Toda criação começa pelo
// primeiro; se o provedor RECUSAR por política de conteúdo (`isRefusal`), a
// mesma requisição refaz sozinha com o fallback. Erro que não é recusa (timeout,
// 5xx, sem crédito) NÃO refaz — repetir ali só dobra o custo sem mudar nada.
//
// ─────────────────────────────────────────────────────────────────────────────
// CONTRATO DA ROTA (é o que o `alpha-frontend` implementa; caminho feliz não é
// contrato — `custo-geracao-sprite.md` §5, `spec-geracao-incremental.md` §2.2).
//
//   POST /api/generate-sprite
//   corpo: { prompt, promptFallback?, referenceImageUrls?: string[],
//            id: <saveId>, formId?: <uma das 11 formas> }
//   header: Authorization: Bearer <token Firebase>  (via `aiFetch`)
//
// | HTTP | corpo                                            | o cliente faz |
// |------|--------------------------------------------------|---------------|
// | 200  | `{ image, provider?, cached? }`                   | troca a reserva pelo próprio |
// | 202  | `{ pending: true, retryAfter: 20 }`              | **não é erro** — fica na reserva, card `GERANDO`, repergunta |
// | 400  | `{ error: 'prompt required' \| 'invalid-form-id' \| 'missing-save-id' }` | bug de cliente; não retenta |
// | 401  | `{ error: 'unauthenticated' }`                    | renova token e retenta |
// | 402  | `{ error: 'paid-tier-required' }`                 | não gera: conta não é paga |
// | 402  | `{ error: 'sprite-lifetime-cap', message }`       | **para para sempre** nesta conta ⇒ `RESERVA-FINAL`, sem botão |
// | 403  | `{ error: 'forbidden' }`                          | `SAVE_ID` errado; `reconcileSaveId`, nunca retentar |
// | 409  | `{ error: 'sprite-form-cap', message }`           | **só ESTA forma** esgotou as 3 ⇒ `RESERVA-FINAL` nela; as outras 10 seguem |
// | 429  | `{ error: 'ai-daily-limit', message }`            | retenta amanhã, não hoje |
// | 503  | `{ error: 'ai-monthly-budget-reached' \| 'ai-daily-budget-reached' \| 'ai-quota-unavailable' \| 'tier-unavailable' \| 'image generation not configured…' }` | reserva, em silêncio |
// | 500  | `{ error: 'internal error' }`                     | conta como tentativa (retentativa com backoff) |
//
// **`image` é SEMPRE uma URL nossa (`/api/sprite-image?k=…`), nunca `data:` e
// nunca a URL de outro domínio.** O servidor REPUBLICA toda imagem antes de
// responder (ver `republicar`) — os DOIS provedores, não só o Gemini: a URL
// que o Higgsfield devolve pode expirar (pergunta sem resposta em
// `custo-geracao-sprite.md` §9; o dono escolheu o lado seguro em 27/08/2026
// em vez de esperar confirmar), e sem republicar o sprite pago do provedor
// PRIMÁRIO podia sumir sozinho meses depois, sem erro na tela. Data URL de
// 256×256 × 11 formas no `GameState` iria para o `localStorage` (cota
// compartilhada com o DigiApp) e para a KV a cada save — já estourou uma vez
// neste projeto; é o motivo original do Gemini republicar, que agora vale
// para os dois provedores igualmente.
// ─────────────────────────────────────────────────────────────────────────────

import { chromaKeyPng, BadChromaError } from './_chroma.js';
import { guardAiRequest, VALID_FORM_ID } from './_aiGuard.js';
import { legacyFormIdOf } from './_branchLegacy.js';
import { requirePaidTier } from './_entitlements.js';
import { verifiedAdmin } from './_admin.js';
import { verifiedBetaFull } from './_betaFull.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { kvOrThrow } from './_kv.js';
import { flagOn } from './_killSwitch.js';
import { takeIpQuota } from './_ipHash.js';
import { AI_REFUSAL_MESSAGES } from './_aiGuard.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const HF_BASE = 'https://platform.higgsfield.ai';
const GEMINI_MODEL = 'gemini-2.5-flash-image';

// ── Dedupe multi-device (`custo-geracao-sprite.md` §5) ──────────────────────
//
// Dois aparelhos no mesmo `saveId` não veem o estado um do outro: qualquer
// dedupe de CLIENTE é um dedupe que não dedupa. Duas chaves, e é o servidor que
// decide — mesma tese do `adr-conta-e-save.md`.
//
//  - **resultado**, sem TTL: acerto devolve a URL com custo ZERO. É isto que
//    faz o segundo aparelho, a reinstalação, o Steam e toda **re-subida para uma
//    forma já gerada** (o caminho do `ultra` obriga a cair e re-subir,
//    `spec-geracao-incremental.md` §3.4) não cobrarem nada.
//  - **lock**, TTL 120 s: ocupado ⇒ 202. 120 porque o poll do Higgsfield vai a
//    ~80 s — lock mais curto que a geração deixa dois aparelhos gerarem em
//    paralelo, e lock eterno tranca a forma para sempre depois de um crash.
//
// **Corrida de lock aceita e declarada**: a KV não tem compare-and-swap, então
// dois `put` no mesmo milissegundo passam os dois. O dano é UMA geração
// duplicada num evento raríssimo, e a chave de resultado torna a segunda
// escrita inofensiva. Fechar isso exigiria Durable Object — a mesma peça, e a
// mesma recusa, do `adr-conta-e-save.md` §3.
const CACHE_PREFIX = 'sprite:img:';
const LOCK_PREFIX = 'sprite:lock:';
/** Binário republicado do caminho Gemini. Chave por TOKEN aleatório, não por
 *  saveId: o `saveId` é SHA-256 de e-mail (derivável por quem souber o e-mail),
 *  e a URL vai parar num `<img src>` que não pode mandar `Authorization`. URL
 *  de capacidade: quem não tem o token não acha. */
const BLOB_PREFIX = 'sprite:blob:';
const LOCK_TTL_SECONDS = 120;
const LOCK_RETRY_AFTER = 20;
/** Teto de sanidade do republicado. O valor de KV vai a 25 MiB; um sprite não
 *  chega perto, e blob absurdo é sinal de resposta que não é imagem. */
const MAX_BLOB_BYTES = 8 * 1024 * 1024;

const cacheKey = (saveId, formId) => `${CACHE_PREFIX}${saveId}:${formId}`;
const lockKey = (saveId, formId) => `${LOCK_PREFIX}${saveId}:${formId}`;

/** Apagar o lock nunca pode derrubar a resposta: no pior caso ele expira em
 *  120 s sozinho, e é para isso que o TTL existe. */
async function destravar(env, key) {
  if (!key) return;
  try {
    await kvOrThrow(env).delete(key);
  } catch (err) {
    console.error('generate-sprite: falha ao soltar o lock', err?.message);
  }
}

/** Grava os bytes sob um token novo e devolve a URL de capacidade. Devolve
 *  `null` sem lançar — ver a nota grande em `republicar`. */
async function guardarBlob(env, request, bytes, contentType) {
  if (bytes.length > MAX_BLOB_BYTES) {
    console.error(`generate-sprite: imagem republicada grande demais (${bytes.length} bytes)`);
    return null;
  }
  const token = crypto.randomUUID().replace(/-/g, '');
  try {
    // Sem TTL: é arte PAGA. Um sprite que some meses depois some em silêncio —
    // o visor não tem estado de erro por spec (§2.1), então ninguém veria.
    await kvOrThrow(env).put(`${BLOB_PREFIX}${token}`, bytes.buffer, {
      metadata: { contentType },
    });
  } catch (err) {
    console.error('generate-sprite: falha ao republicar a imagem', err?.message);
    return null;
  }
  return `${new URL(request.url).origin}/api/sprite-image?k=${token}`;
}

/**
 * Republica QUALQUER imagem (data URL do Gemini OU URL `https://` do
 * Higgsfield) no nosso armazenamento e devolve uma URL `https://` nossa.
 *
 * **Por que os DOIS provedores, e não só o Gemini** (decisão do dono,
 * 27/08/2026): a URL que o Higgsfield devolve pode expirar — a pergunta
 * ficou sem resposta em `custo-geracao-sprite.md` §9, e o dono escolheu o
 * lado seguro em vez de esperar confirmar. Sem isto, o sprite pago do
 * provedor PRIMÁRIO podia sumir sozinho meses depois, sem erro na tela (o
 * visor não tem estado de "arte sumiu" por spec).
 *
 * **Por que é obrigatório e não otimização, no caso do Gemini:** o contrato
 * desta rota é que `image` vira URL no `GameState`, que vai para o
 * `localStorage` E para a KV a cada save (debounce de 3 s). Base64 ali
 * estoura a cota — já aconteceu neste projeto.
 *
 * Devolve `null` quando não deu para republicar. **Não lança de propósito:**
 * lançar cairia no `catch` que chama `release`, devolvendo uma cota que o
 * provedor já cobrou de verdade.
 */
async function republicar(env, request, image) {
  const dataMatch = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(image);
  if (dataMatch) {
    const [, contentType, b64] = dataMatch;
    let bytes;
    try {
      const bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch (err) {
      console.error('generate-sprite: base64 ilegível do provedor', err?.message);
      return null;
    }
    return guardarBlob(env, request, bytes, contentType);
  }

  // URL remota (Higgsfield hoje; qualquer provedor futuro que devolva URL em
  // vez de base64 cai aqui também, sem código novo). Buscamos o binário UMA
  // vez e guardamos com o resto do sprite — se a URL de origem expirar depois,
  // já não importa, a nossa é permanente.
  if (/^https:\/\//i.test(image)) {
    let res;
    try {
      res = await fetch(image);
    } catch (err) {
      console.error('generate-sprite: falha ao buscar a imagem do provedor', err?.message);
      return null;
    }
    if (!res.ok) {
      console.error(`generate-sprite: provedor devolveu ${res.status} ao buscar a imagem`);
      return null;
    }
    const contentTypeHeader = (res.headers.get('content-type') || '').split(';')[0].trim();
    const contentType = /^image\/[a-z0-9.+-]+$/i.test(contentTypeHeader)
      ? contentTypeHeader
      : 'image/png';
    let buf;
    try {
      buf = new Uint8Array(await res.arrayBuffer());
    } catch (err) {
      console.error('generate-sprite: corpo ilegível do provedor', err?.message);
      return null;
    }
    return guardarBlob(env, request, buf, contentType);
  }

  return null;
}

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

// API REST pública do Higgsfield (dono, 14/10/2026, §48). Modelos: `alpha` = "2.0 Alpha"
// (`/marketing-studio/image`, PADRÃO, qualidade low) e `flare` = "2.5 Flare"
// (`/marketing-studio/image/flare`, opcional por `SPRITE_MODEL=flare`). Credencial única
// `HF_CREDENTIALS` = "keyId:keySecret" (`Authorization: Key id:secret`). Ausente -> Soul/Gemini.
// A API NÃO gera transparência (testado: `background`, `remove_bg` e "transparent
// background" são ignorados e vem PNG RGB branco): o prompt pede fundo verde #00FF00 e o
// servidor aplica chroma-key (`_chroma.js`) DEPOIS de baixar. Por isso o corpo NÃO leva
// `background`. `SPRITE_MODEL`: 'alpha' (padrão) | 'flare' | 'soul'.
const HF_API = 'https://api.higgsfield.ai';
const HF_ROUTES = { alpha: '/marketing-studio/image', flare: '/marketing-studio/image/flare' };
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function hfCredentials(env) {
  const c = String(env.HF_CREDENTIALS || '').trim();
  return /^[^:\s]+:[^:\s]+$/.test(c) ? c : null;
}

/** 'alpha' | 'flare' | 'soul'. Valor desconhecido cai no padrão (alpha). */
export function spriteModel(env) {
  const forced = String(env.SPRITE_MODEL || '').trim().toLowerCase();
  return forced === 'flare' || forced === 'soul' ? forced : 'alpha';
}

export function spriteQuality(env, model = 'alpha') {
  const q = String(env.SPRITE_QUALITY || '').trim().toLowerCase();
  const ok = model === 'flare' ? ['low', 'medium', 'high', 'xhigh', 'max'] : ['low', 'medium', 'high'];
  return ok.includes(q) ? q : 'low';
}

/** Corpo do POST (exportado p/ teste: não pode ter `background`). */
export function hfRequestBody(env, model, prompt, referenceImageUrls) {
  const hasRef = Array.isArray(referenceImageUrls) && referenceImageUrls.length > 0;
  return {
    prompt,
    quality: spriteQuality(env, model),
    resolution: '1k',
    aspect_ratio: '1:1',
    moderation: 'auto',
    enhance_prompt: false,
    ...(hasRef ? { image_urls: referenceImageUrls } : {}),
  };
}

function bytesToDataUrl(bytes, mime) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

/** Baixa a imagem do provedor e devolve o PNG com fundo removido (data URL). */
async function baixarEChavear(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`higgsfield: download ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('higgsfield: imagem grande demais');
  try {
    return bytesToDataUrl(chromaKeyPng(buf), 'image/png');
  } catch (err) {
    if (err instanceof BadChromaError) {
      console.error('generate-sprite:', err.message);
      throw err;
    }
    throw new Error(`higgsfield: png ilegível (${err?.message})`);
  }
}

async function generateHf(env, model, prompt, referenceImageUrls) {
  const auth = `Key ${hfCredentials(env)}`;
  const createRes = await fetch(`${HF_API}${HF_ROUTES[model]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(hfRequestBody(env, model, prompt, referenceImageUrls)),
  });
  if (!createRes.ok) {
    const body = (await createRes.text()).slice(0, 300);
    const msg = `higgsfield ${model} create ${createRes.status}: ${body}`;
    if (createRes.status === 400 || createRes.status === 422) throw refusalError(msg);
    throw new Error(msg);
  }
  const created = await createRes.json();
  const requestId = created.request_id || created.id;
  if (!requestId) throw new Error(`higgsfield ${model}: no request id`);
  // status_url vem na resposta; só seguimos se for do próprio domínio da API.
  const statusUrl =
    typeof created.status_url === 'string' && created.status_url.startsWith(`${HF_API}/`)
      ? created.status_url
      : `${HF_API}/requests/${requestId}/status`;
  const interval = hfPollMs;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, interval));
    // Consulta que falha (rede, 5xx, corpo que não é JSON) NÃO aborta: o provedor já aceitou e cobra o job; o teto é o timeout.
    let data;
    try {
      const st = await fetch(statusUrl, { headers: { Authorization: auth } });
      if (!st.ok) continue;
      data = await st.json();
    } catch { continue; }
    if (data.status === 'nsfw') throw refusalError(`higgsfield ${model}: nsfw/policy rejection`);
    if (data.status === 'failed' || data.status === 'canceled') throw new Error(`higgsfield ${model}: generation failed`);
    if (data.status === 'completed') {
      const url = data.images?.[0]?.url;
      if (typeof url === 'string' && /^https:\/\//i.test(url)) return baixarEChavear(url);
      throw new Error(`higgsfield ${model}: completed without url`);
    }
  }
  throw new Error(`higgsfield ${model}: timeout`);
}

/** Intervalo do polling (ms); teste reduz via `__setHfPollMs`. */
let hfPollMs = 2000;
export function __setHfPollMs(ms) { hfPollMs = ms; }

async function generateHiggsfield(env, prompt, referenceImageUrls) {
  const model = spriteModel(env);
  if (model !== 'soul' && hfCredentials(env)) {
    try {
      return { image: await generateHf(env, model, prompt, referenceImageUrls), keyed: true };
    } catch (err) {
      // Recusa de conteúdo sobe (troca o prompt); `bad-chroma` e outras falhas caem no
      // Soul se o par antigo existir (sem inventar regeração).
      if (isRefusal(err) || !(env.HF_API_KEY && env.HF_SECRET)) throw err;
      console.error('API Higgsfield falhou, tentando Soul:', err.message);
    }
  }
  if (!(env.HF_API_KEY && env.HF_SECRET)) throw new Error('higgsfield: soul not configured');
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
      if (url) return { image: url, keyed: false };
      throw new Error('higgsfield: completed without url');
    }
  }
  throw new Error('higgsfield: timeout');
}

async function generateGemini(env, prompt) {
  // Chave em HEADER, nunca na URL (URL vai parar em log de proxy; `abuso-e-custo` V1.6).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
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

/** Chroma-key "se der" para Soul/Gemini: qualquer falha devolve a imagem original. */
async function chaveioOpcional(image) {
  try {
    if (image.startsWith('data:image/png;base64,')) {
      const bin = atob(image.slice(22));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytesToDataUrl(chromaKeyPng(bytes), 'image/png');
    }
    if (/^https:\/\//i.test(image)) return await baixarEChavear(image);
  } catch (err) {
    console.error('generate-sprite: chroma opcional falhou, imagem mantida:', err?.message);
  }
  return image;
}

/** Roda os provedores na ordem (Higgsfield → Gemini) para UM texto de prompt.
 *  Devolve `{ image, provider, hfError }` ou lança — o erro carrega `refusal`
 *  quando o motivo foi política de conteúdo, que é o que decide a 2ª tentativa. */
async function generateWithProviders(env, prompt, referenceImageUrls) {
  let hfError = null;
  let hfRefusal = false;

  if ((env.HF_API_KEY && env.HF_SECRET) || hfCredentials(env)) {
    try {
      const hf = await generateHiggsfield(env, prompt, referenceImageUrls);
      // Soul (e Gemini abaixo) também recebem o prompt de fundo verde: tira o fundo se der,
      // senão entrega como veio (nunca derruba uma geração já paga).
      const image = hf.keyed ? hf.image : await chaveioOpcional(hf.image);
      return { image, provider: 'higgsfield', hfError: null };
    } catch (err) {
      hfError = err.message;
      hfRefusal = isRefusal(err);
      console.error('Higgsfield falhou, tentando fallback de provedor:', err.message);
    }
  }

  // Gemini Image DESLIGADO por padrão (dono, 11/10/2026): a `GEMINI_API_KEY`
  // fica só no plano gratuito do chat; imagem no Gemini não tem gratuito e
  // ligar billing naquele projeto tiraria o chat do gratuito. Religar só com
  // `SPRITE_GEMINI_IMAGE=1` E uma chave de OUTRO projeto (decisão do dono).
  if (env.GEMINI_API_KEY && flagOn(env.SPRITE_GEMINI_IMAGE)) {
    try {
      const image = await chaveioOpcional(await generateGemini(env, prompt));
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
    new Error('image generation not configured (HF_API_KEY/HF_SECRET)')
  );
  err.notConfigured = true;
  throw err;
}

/** Teto de tamanho do prompt (auditoria de lançamento, 11/10/2026). O prompt
 *  vem do CLIENTE e era repassado sem limite ao provedor pago; os prompts
 *  compostos pelo `oracle.ts` ficam muito abaixo disto. */
export const MAX_PROMPT_CHARS = 12000;
const MAX_REFERENCE_URLS = 4;
const SPRITE_TOKEN = /^[0-9a-f]{32}$/;

/**
 * Só aceita como referência do image2image a URL de sprite que NÓS
 * republicamos (`/api/sprite-image?k=<token>` na mesma origem). Antes, o
 * cliente mandava qualquer string e ela ia crua para o Higgsfield, que a
 * BUSCA: um jogador pago podia fazer o provedor baixar URL arbitrária em nome
 * da nossa conta (SSRF de terceiro) e injetar imagem de terceiro no pipeline.
 * Referência inválida é DESCARTADA (cai no text2image), nunca recusa a geração.
 */
export function referenciasSeguras(request, referenceImageUrls) {
  if (!Array.isArray(referenceImageUrls)) return undefined;
  const origem = new URL(request.url).origin;
  const ok = [];
  for (const raw of referenceImageUrls.slice(0, MAX_REFERENCE_URLS)) {
    if (typeof raw !== 'string' || raw.length > 512) continue;
    let u;
    try { u = new URL(raw); } catch { continue; }
    if (u.protocol !== 'https:' || u.origin !== origem) continue;
    if (u.pathname !== '/api/sprite-image') continue;
    if (!SPRITE_TOKEN.test(u.searchParams.get('k') || '')) continue;
    ok.push(u.toString());
  }
  return ok.length ? ok : undefined;
}

export async function onRequestPost({ request, env }) {
  let lock = null;
  try {
    // Kill-switch `SPRITE_DISABLED`: nada de provedor, nada de cota; o app fica
    // na arte de reserva com a mensagem do ateliê fechado.
    if (flagOn(env?.SPRITE_DISABLED)) {
      return Response.json({ error: 'sprite-disabled', message: AI_REFUSAL_MESSAGES['sprite-disabled'] }, { status: 503, headers: CORS });
    }
    const corpo = await request.json().catch(() => null);
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      return Response.json({ error: 'prompt required' }, { status: 400, headers: CORS });
    }
    const { prompt, promptFallback, referenceImageUrls: refsCruas, id, formId } = corpo;
    // UMA geração por forma (dono, 11/10): sem `formId` não há dedupe nem teto
    // por forma — então não há geração.
    if (typeof formId !== 'string' || !formId) {
      return Response.json({ error: 'form-id-required' }, { status: 400, headers: CORS });
    }
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt required' }, { status: 400, headers: CORS });
    }
    if (
      prompt.length > MAX_PROMPT_CHARS ||
      (promptFallback != null && (typeof promptFallback !== 'string' || promptFallback.length > MAX_PROMPT_CHARS))
    ) {
      return Response.json({ error: 'prompt too long' }, { status: 400, headers: CORS });
    }
    const referenceImageUrls = referenciasSeguras(request, refsCruas);

    // DOIS portões, nesta ordem, e ambos ANTES de qualquer chamada de IA.
    //
    // 1) DIREITO (`requirePaidTier`): quem NÃO paga não gera. Vem primeiro de
    //    propósito — recusar antes do `_aiGuard` faz com que uma conta demo em
    //    loop não consuma nem o teto global do dia (que é o disjuntor da conta
    //    de quem paga). É fail-closed: tier indeterminável recusa.
    // 2) VOLUME (`guardAiRequest`): cota por conta + teto global. Mede quantas,
    //    não quem — por isso não substitui o de cima.
    // ADMIN (`_admin.js`) passa no DIREITO, só com token verificado do PRÓPRIO
    // save. O VOLUME (`guardAiRequest`) continua valendo, com o teto global intacto.
    // AUTENTICA PRIMEIRO (QA3): sem login a resposta é sempre 401, qualquer que seja o tier da conta (senão 401 x 402 revela
    // se um e-mail é pagante).
    const auth = await authorizeSaveAccess(request, env, id);
    if (!auth.ok) {
      return Response.json(
        { error: auth.reason },
        { status: authStatus(auth), headers: CORS },
      );
    }

    const tier = await requirePaidTier(env, id);
    const tierOk = tier.ok || (tier.status === 402
      && ((await verifiedAdmin(env, request, id)).admin || (await verifiedBetaFull(env, request, id)).betaFull));
    if (!tierOk) {
      return Response.json({ error: tier.reason }, { status: tier.status, headers: CORS });
    }

    // O dedupe (§5) roda ENTRE os dois portões, e a ordem não é arbitrária:
    //
    //  - depois de `requirePaidTier` **e da autorização**, porque a chave de
    //    cache é derivada do `saveId`, que é SHA-256 de e-mail — público, para
    //    quem souber o e-mail. Consultar o acervo de alguém antes de provar quem
    //    é seria vazar o sprite pago de terceiro. `guardAiRequest` autoriza de
    //    novo lá embaixo (leitura idempotente); autorizar duas vezes é barato,
    //    ler o cache sem autorizar não é.
    //  - **ANTES de `guardAiRequest`**, porque acerto de cache tem de custar
    //    ZERO. Debitar-e-devolver daria 402 `sprite-lifetime-cap` para a conta
    //    que já estourou o teto e só queria de volta a arte que já pagou —
    //    exatamente o segundo aparelho / a reinstalação / o Steam.
    //
    // `formId` é validado aqui e não só no `_aiGuard`: ele entra na CHAVE, e
    // texto livre em chave de KV é o cliente escolhendo onde escrevemos.
    if (formId !== null && formId !== undefined) {
      if (typeof formId !== 'string' || !VALID_FORM_ID.test(formId)) {
        return Response.json({ error: 'invalid-form-id' }, { status: 400, headers: CORS });
      }
    }

    if (typeof formId === 'string' && formId.length > 0) {
      let pronta = null;
      let ocupada = null;
      try {
        pronta = await kvOrThrow(env).get(cacheKey(id, formId));
        // Cache gravado com o id de forma ANTIGO (antes de 29/09/2026): só leitura.
        const antigo = legacyFormIdOf(formId);
        if (!pronta && antigo) pronta = await kvOrThrow(env).get(cacheKey(id, antigo));
        ocupada = pronta ? null : await kvOrThrow(env).get(lockKey(id, formId));
      } catch (err) {
        // Não deu para ler o dedupe → seguir gerando duplicaria a cobrança.
        // FAIL-CLOSED, mesma regra do `_aiGuard`.
        console.error('generate-sprite: dedupe ilegível, recusando', err?.message);
        return Response.json({ error: 'ai-quota-unavailable' }, { status: 503, headers: CORS });
      }
      if (pronta) {
        let guardada = null;
        try {
          guardada = JSON.parse(pronta);
        } catch {
          guardada = null;
        }
        if (guardada?.image) {
          return Response.json(
            { image: guardada.image, provider: guardada.provider, cached: true },
            { headers: CORS },
          );
        }
        // Entrada corrompida não pode trancar a forma para sempre: cai adiante
        // e gera de novo, pagando o teto como qualquer tentativa.
      }
      if (ocupada) {
        // 202 **não é erro** — o outro aparelho está gerando esta mesma forma.
        // O visor fica na reserva (Invariante nº 1) e o card fica `GERANDO`.
        return Response.json(
          { pending: true, retryAfter: LOCK_RETRY_AFTER },
          { status: 202, headers: CORS },
        );
      }
      lock = lockKey(id, formId);
      try {
        await kvOrThrow(env).put(lock, String(Date.now()), { expirationTtl: LOCK_TTL_SECONDS });
      } catch (err) {
        // Lock que não gravou é dedupe que não dedupa — e o próximo aparelho
        // geraria a mesma forma pagando de novo. Numa rota que queima dinheiro,
        // a dúvida nega.
        console.error('generate-sprite: falha ao gravar o lock, recusando', err?.message);
        lock = null;
        return Response.json({ error: 'ai-quota-unavailable' }, { status: 503, headers: CORS });
      }
    }

    // A rota mais cara do app, e a única em que o PROMPT vem do cliente: sem
    // portão, era geração de imagem ilimitada e livre na nossa conta.
    // `formId` liga o teto POR FORMA (`perFormLifetime`, _aiGuard.js). É ele o
    // disjuntor de loop de retentativa numa forma só — sem estrangular quem
    // percorre a árvore inteira até o `ultra`. Opcional: ausente, os outros três
    // tetos seguem inteiros e a conta continua presa ao vitalício de 26.
    const gate = await guardAiRequest(request, env, 'sprite', id, 1, formId);
    if (!gate.ok) {
      return Response.json(
        { error: gate.reason, ...(gate.message ? { message: gate.message } : {}) },
        { status: gate.status, headers: CORS },
      );
    }
    // Antiabuso de múltiplas contas: gerações por ip-hash/dia (`_ipHash.js`).
    const porIp = await takeIpQuota(env, request, 'sprite');
    if (!porIp.ok) {
      await gate.release('limite por ip-hash');
      return Response.json({ error: porIp.reason, message: AI_REFUSAL_MESSAGES[porIp.reason] }, { status: porIp.status, headers: CORS });
    }

    /**
     * Único ponto de saída bem-sucedido: republica SEMPRE (data: do Gemini OU
     * https: do Higgsfield — decisão do dono em 27/08/2026, "joga seguro"
     * contra a URL do provedor primário expirar em silêncio), guarda no cache
     * e responde. Escrito uma vez porque são DOIS caminhos de sucesso (a 1ª
     * tentativa e a refeitura pelo `promptFallback`) — dois blocos aqui seriam
     * a mesma regra em duas cópias, e uma delas esqueceria de cachear.
     */
    const responder = async out => {
      let image = out.image;
      if (typeof image === 'string') {
        const republicada = await republicar(env, request, image);
        if (!republicada) {
          // Base64/URL do provedor NUNCA chega ao cliente sem passar por nós.
          // Sem republicação não há resposta — e a cota fica debitada, porque
          // o provedor gerou e cobrou.
          return Response.json({ error: 'image republish failed' }, { status: 502, headers: CORS });
        }
        image = republicada;
      }
      if (typeof formId === 'string' && formId.length > 0) {
        try {
          await kvOrThrow(env).put(
            cacheKey(id, formId),
            JSON.stringify({ image, provider: out.provider, at: Date.now() }),
          );
        } catch (err) {
          // Cache que não gravou custa uma regeração futura, não a resposta de
          // agora. O jogador recebe a arte que acabou de pagar.
          console.error('generate-sprite: falha ao cachear o resultado', err?.message);
        }
      }
      return Response.json({ ...out, image }, { headers: CORS });
    };

    // 1ª tentativa: SEMPRE o prompt com as referências de gênero.
    try {
      const out = await generateWithProviders(env, prompt, referenceImageUrls);
      return await responder(out);
    } catch (err) {
      const canRetry =
        typeof promptFallback === 'string' && promptFallback.length > 0 && promptFallback !== prompt;
      if (!canRetry || !isRefusal(err)) {
        // X-1: a unidade foi RESERVADA antes da chamada (o KV não tem transação
        // e reserva não-escrita não segura concorrência). Como não saiu imagem
        // nenhuma e o motivo NÃO foi política de conteúdo, ela volta.
        //
        // Recusa sem prompt de reserva (`!canRetry && isRefusal`) NÃO volta: o
        // provedor foi chamado e cobrou, e é esse caso que o teto por forma
        // existe para limitar.
        if (!isRefusal(err)) await gate.release(err.notConfigured ? 'provedor não configurado' : `falha do provedor: ${err.message}`);
        if (err.notConfigured) {
          return Response.json({ error: err.message }, { status: 503, headers: CORS });
        }
        throw err;
      }
      // 2ª tentativa: mesmo pedido, sem citar franquia nenhuma.
      //
      // Ela é uma SEGUNDA COBRANÇA do provedor — uma recusa custa duas imagens.
      // Por isso passa pelo portão de volume de novo, debitando a unidade extra
      // ANTES de gerar: teto que não conta a refeitura é teto que mente.
      // `formId` null: a refeitura por recusa não saiu imagem nenhuma, então não
      // conta como a "uma geração" da forma — só no vitalício/diário/global.
      const extra = await guardAiRequest(request, env, 'sprite', id, 1, null);
      if (!extra.ok) {
        return Response.json(
          { error: extra.reason, ...(extra.message ? { message: extra.message } : {}) },
          { status: extra.status, headers: CORS },
        );
      }
      console.warn('Prompt com referências recusado, refazendo sem elas:', err.message);
      try {
        const out = await generateWithProviders(env, promptFallback, referenceImageUrls);
        return await responder({ ...out, usedFallbackPrompt: true, refusal: err.message });
      } catch (err2) {
        // Mesma regra da 1ª tentativa, aplicada à unidade EXTRA. A unidade da 1ª
        // segue debitada: aquela foi uma recusa de conteúdo, e recusa custa.
        if (!isRefusal(err2)) await extra.release(`falha do provedor na refeitura: ${err2.message}`);
        throw err2;
      }
    }
  } catch (err) {
    console.error('generate-sprite error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: CORS });
  } finally {
    // Sempre, inclusive nos caminhos de recusa de teto e de erro. Lock que
    // sobrevive a uma falha faz o próximo pedido tomar 202 por 120 s — e a
    // retentativa automática do cliente (backoff de 60 s) cairia dentro dele.
    await destravar(env, lock);
  }
}
