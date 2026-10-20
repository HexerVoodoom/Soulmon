import { cleanKey } from './_llm.js';
/**
 * POST /api/transcribe — a VOZ do jogador vira texto.
 *
 * ## Para onde o áudio vai
 *
 * O navegador (ou o APK) manda o áudio para ESTA rota, na nossa própria origem
 * (a CSP não precisa abrir `connect-src` para ninguém). O Worker repassa ao
 * Groq (`api.groq.com`, modelo `whisper-large-v3`) com a chave
 * `GROQ_API_KEY`, que vive só no ambiente do servidor e nunca chega ao
 * navegador. A chamada entra no mesmo regime das outras rotas caras: balde por
 * IP, ID token do Firebase verificado, cota por conta/dia/global e allowlist
 * do beta.
 *
 * ## Privacidade — leia antes de mexer
 *
 * ⚠️ Isto envia a VOZ da pessoa ao Groq, via o nosso Worker. Está declarado em
 * `public/privacidade.html` e em `docs/PLAY-DATA-SAFETY.md`, e as duas coisas
 * são parte do contrato desta rota. Se você mudar PARA ONDE o áudio vai, os
 * dois têm que mudar junto — e o guard `src/security/transcribe.contract.test.ts`
 * existe para essa mudança não passar calada.
 *
 * O áudio é REPASSADO, nunca gravado: não há `put` de KV nem de R2 em lugar
 * nenhum deste arquivo, e não pode haver. Só o `text` volta ao cliente.
 *
 * ## Desligada por padrão
 *
 * Sem `GROQ_API_KEY` no ambiente do servidor, a rota responde 503
 * `transcribe-not-configured` e `/api/config` diz `transcribeAvailable: false`
 * — o que faz o botão de microfone NÃO aparecer no app. Botão que existe e
 * falha é pior que botão que não existe.
 */
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { bearerToken, verifyIdToken, emailToSaveId } from './_auth.js';
import { guardAiRequest, perMinuteGate } from './_aiGuard.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (corpo, status = 200) => Response.json(corpo, { status, headers: CORS });

/**
 * Transcrição é a rota mais cara por chamada do projeto (segundos de áudio
 * num modelo de fala), e o corpo é grande. O teto é mais apertado que o das
 * outras: 6/minuto por IP é um humano falando, não um laço.
 */
const LIMITE = { limit: 6, windowMs: 60_000 };
// (O balde por IP é só amortecedor: vive na memória do isolate. Quem fecha a porta é auth + cota.)

/**
 * 2 MB. O limite de gravação é 60 s; a 256 kbps (bem acima do Opus/AAC de um
 * MediaRecorder, que fica em 32-128 kbps) 60 s dão 60 * 256_000 / 8 = 1,92 MB.
 * Teto apertado para não virar túnel de upload gratuito na nossa borda: o corpo
 * é lido em memória no Worker, e sem teto um POST de 100 MB derruba a
 * requisição por limite de isolate.
 */
const MAX_BYTES = 2 * 1024 * 1024;

/** Duração máxima aceita (60 s do cliente + folga de 5 s de container/relógio). */
const MAX_DURACAO_S = 65;

/** Teto do provedor. O cliente espera 30 s: o servidor tem que desistir antes. */
const TIMEOUT_MS = 25_000;

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/** Extensão decidida pelo servidor a partir do mime REAL; o nome do cliente é ignorado. */
const EXTENSAO = { webm: 'webm', ogg: 'ogg', mp4: 'mp4', 'x-m4a': 'm4a', mpeg: 'mp3', wav: 'wav' };
const extensaoDe = tipo => EXTENSAO[String(tipo).split(';')[0].split('/')[1]?.trim().toLowerCase()] ?? 'webm';

/** Só formatos que um `MediaRecorder` produz. */
const TIPOS = /^audio\/(webm|ogg|mp4|mpeg|wav|x-m4a)(;.*)?$/i;

/** Os dois idiomas do app, no código de base que o modelo de fala espera. */
const IDIOMAS = new Set(['pt', 'en']);

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const gate = takeToken('transcribe', clientKey(request), LIMITE);
  if (!gate.ok) {
    console.warn('[transcribe] rate limited', { retryAfter: gate.retryAfter });
    return tooManyRequests(gate.retryAfter, CORS);
  }

  // ORDEM: a configuração é conferida ANTES de ler o corpo. Ler 2 MB para
  // descobrir que o serviço não existe gasta o que a pessoa pagou de dados
  // móveis por nada.
  if (!env.GROQ_API_KEY) {
    return json({ error: 'transcribe-not-configured' }, 503);
  }

  // QUEM (auditoria de lançamento, 11/10/2026). Até aqui a rota era ANÔNIMA:
  // o único freio era o balde por IP, que vive na memória do isolate (cada
  // isolate tem o seu, e trocar de IP zera). Qualquer um na internet usava a
  // nossa conta de transcrição como serviço gratuito. Exigir um ID token do
  // Firebase VERIFICADO amarra o custo a uma conta real. FAIL-CLOSED, como
  // `requireVerifiedOwner`: sem `FIREBASE_PROJECT_ID` não há como saber quem
  // é, e a dúvida nega numa rota que custa dinheiro por segundo de áudio.
  if (!env.FIREBASE_PROJECT_ID) return json({ error: 'auth-unavailable' }, 503);
  let claims = null;
  try {
    claims = await verifyIdToken(bearerToken(request), env.FIREBASE_PROJECT_ID);
  } catch {
    return json({ error: 'auth-unavailable' }, 503);
  }
  if (!claims) return json({ error: 'unauthenticated' }, 401);

  // Content-Length declarado grande demais: nega sem ler o corpo. Sem o header
  // (chunked), segue e o teto por `audio.size` continua valendo.
  const declarado = request.headers.get('content-length');
  if (declarado !== null && Number(declarado) > MAX_BYTES + 64 * 1024) {
    return json({ error: 'audio-too-large' }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'invalid-form' }, 400);
  }

  const audio = form.get('audio');
  if (!audio || typeof audio === 'string') {
    return json({ error: 'missing-audio' }, 400);
  }
  if (audio.size === 0) return json({ error: 'empty-audio' }, 400);
  if (audio.size > MAX_BYTES) return json({ error: 'audio-too-large' }, 413);
  if (!TIPOS.test(audio.type || '')) return json({ error: 'unsupported-audio-type' }, 415);

  const bruto = String(form.get('language') ?? '').slice(0, 5).split('-')[0].toLowerCase();
  const language = IDIOMAS.has(bruto) ? bruto : 'en';

  // COTA (release/beta-1, `abuso-e-custo` V4.5): a transcrição não passava pelo
  // `_aiGuard` — sem teto diário nem global. Agora: 4/min e 10/dia por conta,
  // 100/dia no total, e a allowlist do beta. Conferido DEPOIS de validar o
  // áudio (corpo ruim não gasta cota) e ANTES do provedor.
  const saveId = await emailToSaveId(claims.email);
  const rajada = perMinuteGate('transcribe', saveId);
  if (rajada) return json({ error: rajada.reason, message: rajada.message }, 429);
  const cota = await guardAiRequest(request, env, 'transcribe', saveId, 1, null, { ok: true, email: claims.email });
  if (!cota.ok) return json({ error: cota.reason, ...(cota.message ? { message: cota.message } : {}) }, cota.status);

  const repasse = new FormData();
  repasse.append('file', audio, `audio.${extensaoDe(audio.type)}`);
  repasse.append('model', 'whisper-large-v3');
  repasse.append('language', language);
  repasse.append('response_format', 'verbose_json');
  repasse.append('temperature', '0');

  let upstream;
  try {
    upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cleanKey(env.GROQ_API_KEY)}` },
      body: repasse,
      // Sem teto a requisição fica pendurada até o limite do isolate e o app
      // mostra "falhou" tarde. 25 s < 30 s do cliente.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // Só o nome do erro vai ao log; a mensagem não volta ao cliente.
    console.error('[transcribe] falha ao falar com o provedor:', err?.name);
    await cota.release('provedor de transcrição indisponível');
    return json({ error: 'transcribe-unavailable' }, 502);
  }

  if (!upstream.ok) {
    console.error('[transcribe] provedor respondeu', upstream.status);
    await cota.release(`provedor respondeu ${upstream.status}`);
    return json({ error: 'transcribe-failed' }, 502);
  }

  let dados;
  try {
    dados = await upstream.json();
  } catch {
    // Cota NÃO liberada: o provedor respondeu 200, então o custo já ocorreu.
    return json({ error: 'transcribe-failed' }, 502);
  }

  // Limite de 60 s também no servidor: o corpo de 2 MB não prova a duração.
  // NÃO libera a cota: o custo já ocorreu no provedor. O texto não volta.
  // FAIL-CLOSED: o Groq sempre manda `duration` em verbose_json; se faltar ou
  // não for número, a dúvida nega.
  const d = Number(dados?.duration);
  if (!Number.isFinite(d) || d > MAX_DURACAO_S) {
    return json({ error: 'audio-too-long' }, 413);
  }

  // Só o TEXTO atravessa. O que mais o provedor mandar (id de requisição,
  // segmentos, metadado do modelo) fica do lado de cá.
  return json({ text: String(dados?.text ?? '').slice(0, 2000) });
}
