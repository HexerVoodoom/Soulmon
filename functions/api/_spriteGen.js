// Núcleo de geração de sprite (HF + chroma-key + armazenamento), extraído de
// `generate-sprite.js` sem mudar comportamento, para a rota do GM (`gm-gerar-sprite.js`)
// usar o MESMO caminho. Os testes de `generate-sprite` continuam importando daquele módulo,
// que reexporta o que eles usam.
import { chromaKeyPng, chromaKeyOfPrompt, BadChromaError } from './_chroma.js';
import { kvOrThrow } from './_kv.js';

/** Binário republicado do caminho Gemini. Chave por TOKEN aleatório, não por
 *  saveId: o `saveId` é SHA-256 de e-mail (derivável por quem souber o e-mail),
 *  e a URL vai parar num `<img src>` que não pode mandar `Authorization`. URL
 *  de capacidade: quem não tem o token não acha. */
export const BLOB_PREFIX = 'sprite:blob:';

/** Teto de sanidade do republicado. O valor de KV vai a 25 MiB; um sprite não
 *  chega perto, e blob absurdo é sinal de resposta que não é imagem. */
const MAX_BLOB_BYTES = 8 * 1024 * 1024;

/** Grava os bytes sob um token novo e devolve a URL de capacidade. Devolve
 *  `null` sem lançar — ver a nota grande em `republicar`. */
export async function guardarBlob(env, request, bytes, contentType) {
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
export async function republicar(env, request, image) {
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

/** Erro que significa "o provedor recusou ESTE texto" — o único caso em que
 *  vale refazer com o prompt sem referências. Marcado na origem (`refusal`);
 *  o teste de texto é rede de segurança para formatos de erro que ainda não
 *  vimos, já que cada provedor recusa com uma mensagem diferente. */
const REFUSAL_WORDS =
  /nsfw|safety|policy|polic[ií]|moderation|blocked|prohibited|content[_ -]filter|copyright|trademark|intellectual property|recitation/i;

/** @param {{ refusal?: boolean, message?: string }} [err] */
export function isRefusal(err) {
  return Boolean(err?.refusal) || REFUSAL_WORDS.test(err?.message || '');
}

export function refusalError(message) {
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
// servidor aplica chroma-key (`_chroma.js`) DEPOIS de baixar.
// M14 (25/10/2026): criatura com verde (ou elemento planta) pede fundo MAGENTA #FF00FF no
// prompt; `chromaKeyOfPrompt` lê a cor do próprio prompt e o recorte usa a certa. Por isso o corpo NÃO leva
// `background`. `SPRITE_MODEL`: 'alpha' (padrão) | 'flare' | 'soul'.
const HF_API = 'https://api.higgsfield.ai';
const HF_ROUTES = { alpha: '/marketing-studio/image', flare: '/marketing-studio/image/flare' };
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export function hfCredentials(env) {
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

export function bytesToDataUrl(bytes, mime) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

/** Baixa a imagem do provedor e devolve o PNG com fundo removido (data URL). */
export async function baixarEChavear(url, key = 'green') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`higgsfield: download ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('higgsfield: imagem grande demais');
  try {
    return bytesToDataUrl(chromaKeyPng(buf, key), 'image/png');
  } catch (err) {
    if (err instanceof BadChromaError) {
      console.error('generate-sprite:', err.message);
      throw err;
    }
    throw new Error(`higgsfield: png ilegível (${err?.message})`);
  }
}

export async function generateHf(env, model, prompt, referenceImageUrls) {
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
      if (typeof url === 'string' && /^https:\/\//i.test(url)) return baixarEChavear(url, chromaKeyOfPrompt(prompt));
      throw new Error(`higgsfield ${model}: completed without url`);
    }
  }
  throw new Error(`higgsfield ${model}: timeout`);
}

/** Intervalo do polling (ms); teste reduz via `__setHfPollMs`. */
let hfPollMs = 2000;
export function __setHfPollMs(ms) { hfPollMs = ms; }

