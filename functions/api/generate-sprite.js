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

import { chromaKeyPng, chromaKeyOfPrompt, BadChromaError } from './_chroma.js';
import { guardAiRequest, VALID_FORM_ID } from './_aiGuard.js';
import { legacyFormIdOf } from './_branchLegacy.js';
import { requirePaidTier } from './_entitlements.js';
import { reserveRegen, completeRegen, refundRegen, REGEN_STALE_MS } from './_spriteRegen.js';
import { verifiedAdmin } from './_admin.js';
import { verifiedBetaFull } from './_betaFull.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { kvOrThrow } from './_kv.js';
import {
  republicar, isRefusal, refusalError, hfCredentials, bytesToDataUrl, baixarEChavear, generateHf,
  spriteModel, spriteQuality, hfRequestBody, __setHfPollMs,
} from './_spriteGen.js';
// Reexportados: testes e outras rotas importam daqui (comportamento inalterado).
export { spriteModel, spriteQuality, hfRequestBody, __setHfPollMs };
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
/** E-mail no registro da geração (página GM). Ligado em 26/10/2026: o dono aprovou o texto
 *  da política (privacidade.html §6d, #image-email) e PRIVACY_VERSION subiu para 2026-10-26. */
const GRAVAR_EMAIL_DO_SPRITE = true;
const LOCK_PREFIX = 'sprite:lock:';
const LOCK_TTL_SECONDS = 120;
const LOCK_RETRY_AFTER = 20;

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


export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}


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
async function chaveioOpcional(image, key = 'green') {
  try {
    if (image.startsWith('data:image/png;base64,')) {
      const bin = atob(image.slice(22));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytesToDataUrl(chromaKeyPng(bytes, key), 'image/png');
    }
    if (/^https:\/\//i.test(image)) return await baixarEChavear(image, key);
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
      const image = hf.keyed ? hf.image : await chaveioOpcional(hf.image, chromaKeyOfPrompt(prompt));
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
      const image = await chaveioOpcional(await generateGemini(env, prompt), chromaKeyOfPrompt(prompt));
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

/**
 * Resposta para o MESMO `opId` de "Gerar de novo" repetido (retry de rede, aba duplicada): nunca debita nem gera de novo.
 *  · `done`      → devolve a imagem que aquele gesto já gerou (está no cache da forma);
 *  · `debited`   → ainda em andamento (202); se passou de `REGEN_STALE_MS` sem terminar, o Worker caiu: devolve o débito;
 *  · `refunded`  → 409 (o cliente usa um `opId` novo para tentar de novo).
 */
async function respostaDeRegenRepetida(env, id, formId, opId, op) {
  if (op.s === 'done') {
    let guardada = null;
    try { guardada = JSON.parse(await kvOrThrow(env).get(cacheKey(id, formId))); } catch { guardada = null; }
    if (guardada?.image) return Response.json({ image: guardada.image, provider: guardada.provider, cached: true, regen: true }, { headers: CORS });
    return Response.json({ error: 'regen-duplicate' }, { status: 409, headers: CORS });
  }
  if (op.s === 'debited') {
    if (Date.now() - (Number(op.at) || 0) > REGEN_STALE_MS) {
      await refundRegen(env, id, opId);
      return Response.json({ error: 'regen-refunded' }, { status: 502, headers: CORS });
    }
    return Response.json({ pending: true, retryAfter: LOCK_RETRY_AFTER }, { status: 202, headers: CORS });
  }
  return Response.json({ error: 'regen-duplicate' }, { status: 409, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  let lock = null;
  // "Gerar de novo" (rodada 5, `_spriteRegen.js`): o gesto cobrado (`opId`) e se a imagem já chegou ao jogador. No `finally`, gesto
  // cobrado e NÃO entregue = débito devolvido (idempotente) — cobre recusa de teto, falha do provedor, republicação e exceção.
  let regenOp = null;
  let regenId = null;
  let regenEntregue = false;
  let regenCredits = null;
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
    // "Gerar de novo" é uma COMPRA em Créditos: só conta paga DE VERDADE (`ent.tier === 'paid'`). Admin e beta-full passam no
    // direito de gerar acima, mas não têm Créditos a gastar por aqui; quem não é paga recebe 402 sem tocar em cota nem em saldo.
    const regenPago = corpo.regenPaid === true;
    if (regenPago && !tier.ok) {
      return Response.json({ error: 'paid-tier-required' }, { status: 402, headers: CORS });
    }
    // Kill-switch próprio da regeração paga (`SPRITE_REGEN_DISABLED`, plano de rollback do REGISTRO §34b): desliga SÓ o "Gerar de novo", antes de
    // qualquer débito, sem derrubar a geração gratuita. Sem deploy: é uma variável do painel.
    if (regenPago && flagOn(env?.SPRITE_REGEN_DISABLED)) {
      return Response.json({ error: 'sprite-regen-disabled' }, { status: 503, headers: CORS });
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
      // "Gerar Soulmon" (teste fechado, 23/10/2026): `regenerate: true` pula o resultado em cache e pede desenho NOVO.
      // Só chega aqui quem já passou pela autorização do save e pelo `tierOk` (conta paga/admin/beta-full);
      // o lock, o teto vitalício por conta e o teto por forma seguem valendo.
      const regenerar = corpo.regenerate === true || regenPago;
      try {
        pronta = regenerar ? null : await kvOrThrow(env).get(cacheKey(id, formId));
        // Cache gravado com o id de forma ANTIGO (antes de 29/09/2026): só leitura.
        const antigo = legacyFormIdOf(formId);
        if (!pronta && antigo && !regenerar) pronta = await kvOrThrow(env).get(cacheKey(id, antigo));
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
    // COBRA ANTES: o débito dos Créditos (e a cota do mês da forma) sai ANTES de qualquer chamada de IA, numa escrita só, idempotente
    // por `opId`. O `finally` devolve se a imagem não chegar. A cota de volume (`guardAiRequest`) vem DEPOIS: se ela recusar, devolve.
    if (regenPago) {
      let r;
      try {
        r = await reserveRegen(env, id, formId, corpo.opId);
      } catch (err) {
        console.error('generate-sprite: reserva da regeração ilegível, recusando', err?.message);
        return Response.json({ error: 'ai-quota-unavailable' }, { status: 503, headers: CORS });
      }
      if (!r.ok) {
        if (r.reason === 'regen-duplicate' && r.op) return await respostaDeRegenRepetida(env, id, formId, corpo.opId, r.op);
        return Response.json({ error: r.reason }, { status: r.status, headers: CORS });
      }
      regenOp = corpo.opId;
      regenId = id;
      regenCredits = r.credits;
    }
    const gate = await guardAiRequest(request, env, 'sprite', id, 1, formId, null, regenPago ? { regenPaid: true } : null);
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
            JSON.stringify({ image, provider: out.provider, at: Date.now(), ...(GRAVAR_EMAIL_DO_SPRITE && typeof auth.email === 'string' && auth.email ? { email: auth.email } : {}) }),
          );
        } catch (err) {
          // Cache que não gravou custa uma regeração futura, não a resposta de
          // agora. O jogador recebe a arte que acabou de pagar.
          console.error('generate-sprite: falha ao cachear o resultado', err?.message);
        }
      }
      if (regenOp) {
        // A imagem está guardada e vai ao jogador: o gesto passa a `done` (repetir o `opId` devolve esta imagem, sem cobrar).
        // Se o registro falhar, o `finally` NÃO devolve (já entregamos): `regenEntregue` é a trava local.
        regenEntregue = true;
        try { await completeRegen(env, id, regenOp); } catch (err) { console.error('generate-sprite: falha ao fechar a regeração', err?.message); }
        return Response.json({ ...out, image, regen: true, credits: regenCredits }, { headers: CORS });
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
          // L07-05: código fixo; a mensagem crua (nomes de variável) fica só no log.
          console.warn('sprite: provedor não configurado:', err.message);
          return Response.json({ error: 'sprite-provider-not-configured' }, { status: 503, headers: CORS });
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
      const extra = await guardAiRequest(request, env, 'sprite', id, 1, null, null, regenPago ? { regenPaid: true } : null);
      if (!extra.ok) {
        return Response.json(
          { error: extra.reason, ...(extra.message ? { message: extra.message } : {}) },
          { status: extra.status, headers: CORS },
        );
      }
      console.warn('Prompt com referências recusado, refazendo sem elas:', err.message);
      try {
        const out = await generateWithProviders(env, promptFallback, referenceImageUrls);
        return await responder({ ...out, usedFallbackPrompt: true, refusal: 'content-refused' });
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
    // "Gerar de novo": cobrado e não entregue = o débito volta (idempotente; só desfaz um gesto ainda `debited`).
    if (regenOp && !regenEntregue) {
      try { await refundRegen(env, regenId, regenOp); } catch (err) { console.error('generate-sprite: falha ao devolver a regeração', err?.message); }
    }
    // Sempre, inclusive nos caminhos de recusa de teto e de erro. Lock que
    // sobrevive a uma falha faz o próximo pedido tomar 202 por 120 s — e a
    // retentativa automática do cliente (backoff de 60 s) cairia dentro dele.
    await destravar(env, lock);
  }
}
