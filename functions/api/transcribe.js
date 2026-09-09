/**
 * POST /api/transcribe — a VOZ do jogador vira texto.
 *
 * ## Por que esta rota existe, e não um `fetch` direto do navegador
 *
 * Até 09/09/2026 o `ChatBox` gravava áudio e mandava `POST` DIRETO para
 * `https://<projectId>.supabase.co/…/transcribe`, com o JWT anônimo commitado
 * em `src/utils/supabase/info.tsx`. Aquilo nunca funcionou em produção — a CSP
 * não tem `*.supabase.co` em `connect-src` —, e a saída óbvia ("libera a CSP")
 * era a pior das disponíveis:
 *
 *  · abrir `connect-src` para `*.supabase.co` deixa QUALQUER projeto Supabase
 *    ser destino, então um XSS passaria a poder exfiltrar para um projeto do
 *    atacante — a CSP deixaria de ser uma trava e viraria decoração;
 *  · a chave do projeto teria que continuar embarcada no bundle;
 *  · e a chamada ficaria FORA de tudo que o resto do app já tem: sem teto por
 *    IP, sem limite de tamanho, sem um lugar onde medir custo.
 *
 * Passando por aqui, o áudio sai da NOSSA origem para o NOSSO servidor
 * (same-origin: a CSP nem precisa mudar), a credencial do provedor vive em
 * variável de ambiente do servidor e nunca chega ao navegador, e a chamada
 * entra no mesmo regime das outras rotas caras.
 *
 * ## Privacidade — leia antes de mexer
 *
 * ⚠️ Isto envia a VOZ da pessoa para um processador externo. Está declarado em
 * `public/privacidade.html` e em `docs/PLAY-DATA-SAFETY.md`, e as duas coisas
 * são parte do contrato desta rota, não documentação opcional. Se você mudar
 * PARA ONDE o áudio vai, os dois têm que mudar junto — e o guard
 * `src/security/supabase.contract.test.ts` existe para essa mudança não passar
 * calada.
 *
 * O áudio é REPASSADO, nunca gravado: não há `put` de KV nem de R2 em lugar
 * nenhum deste arquivo, e não pode haver.
 *
 * ## Desligada por padrão
 *
 * Sem `SUPABASE_PROJECT_ID` + `SUPABASE_ANON_KEY` no ambiente do servidor, a
 * rota responde 503 `transcribe-not-configured` e `/api/config` diz
 * `transcribeAvailable: false` — o que faz o botão de microfone NÃO aparecer no
 * app. Botão que existe e falha é pior que botão que não existe.
 */
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (corpo, status = 200) => Response.json(corpo, { status, headers: CORS });

/**
 * Transcrição é a rota mais cara por chamada do projeto (segundos de áudio
 * num modelo de fala), e o corpo é grande. O teto é mais apertado que o das
 * outras: 6/minuto por IP é um humano falando, não um laço.
 */
const LIMITE = { limit: 6, windowMs: 60_000 };

/**
 * 4 MB. Opus a 32 kbps dá ~16 minutos — muito mais que qualquer recado para o
 * bichinho, e pouco o bastante para não virar um túnel de upload gratuito na
 * nossa borda. O corpo é lido em memória no Worker: sem teto, um POST de 100 MB
 * derruba a requisição inteira por limite de isolate, o que é um jeito caro de
 * descobrir que faltava um número aqui.
 */
const MAX_BYTES = 4 * 1024 * 1024;

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

  const projectId = env.SUPABASE_PROJECT_ID;
  const anonKey = env.SUPABASE_ANON_KEY;
  // ORDEM: a configuração é conferida ANTES de ler o corpo. Ler 4 MB para
  // descobrir que o serviço não existe gasta o que a pessoa pagou de dados
  // móveis por nada.
  if (!projectId || !anonKey) {
    return json({ error: 'transcribe-not-configured' }, 503);
  }
  // O id do projeto vira HOST. Sem esta checagem, um valor torto na variável
  // de ambiente monta uma URL para outro domínio — SSRF por configuração.
  if (!/^[a-z0-9]{16,40}$/.test(projectId)) {
    console.error('[transcribe] SUPABASE_PROJECT_ID fora do formato esperado');
    return json({ error: 'transcribe-not-configured' }, 503);
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

  const repasse = new FormData();
  repasse.append('audio', audio, 'recording.webm');
  repasse.append('language', language);

  let upstream;
  try {
    upstream = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7de212d9/transcribe`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${anonKey}` },
        body: repasse,
        // Áudio longo num modelo de fala é lento; sem teto a requisição fica
        // pendurada até o limite do isolate e o app mostra "falhou" tarde.
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch (err) {
    // ⚠️ A mensagem do erro NÃO volta ao cliente: ela carrega a URL montada,
    // e a URL carrega o id do projeto.
    console.error('[transcribe] falha ao falar com o provedor:', err?.name);
    return json({ error: 'transcribe-unavailable' }, 502);
  }

  if (!upstream.ok) {
    console.error('[transcribe] provedor respondeu', upstream.status);
    return json({ error: 'transcribe-failed' }, 502);
  }

  let dados;
  try {
    dados = await upstream.json();
  } catch {
    return json({ error: 'transcribe-failed' }, 502);
  }

  // Só o TEXTO atravessa. O que mais o provedor mandar (id de requisição,
  // metadado do modelo, o próprio áudio) fica do lado de cá — resposta de
  // terceiro repassada crua é como campo que ninguém revisou chega à tela.
  return json({ text: String(dados?.text ?? '').slice(0, 2000) });
}
