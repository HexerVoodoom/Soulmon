// ---------------------------------------------------------------------------
// FORMAS SOB DEMANDA DOS SIMULADOS — arte da forma nova só quando um jogador vê o simulado.
//
// DESLIGADO por padrão: sem `SIMULADOS_FORMAS_ON` nada é lido, gravado ou gerado. `SPRITE_DISABLED` também para tudo.
// A chave Higgsfield (`HF_CREDENTIALS`) fica só no servidor; nada passa por conta de jogador nem pela cota de IA deles.
//
// CHAVES:
//   `sim:sprite:<id>`          ponteiro: a arte mais recente pronta. É o FALLBACK: só muda quando a forma nova fica pronta,
//                              então as rotas não ganham leitura nova;
//   `sim:sprite:<id>:<forma>`  arquivo da forma (metadata { el, line, form, sha }): existir = não gerar de novo;
//   `sim:prompt:<id>:<forma>`  { prompt, fallback } do Oráculo; sem ela, a forma não é gerada;
//   `sim:form:<id>:<forma>`    fila { estado, requestId, tentativas, em };
//   `sim:gen:<AAAA-MM>` e `sim:gen:<AAAA-MM-DD>`  tetos próprios.
//
// EM PASSOS, sem esperar: `waitUntil` dá 30 s e o provedor pode levar mais. Cada chamada envia OU consulta, e a seguinte continua.
// O provedor por API não entrega alfa (`generate-sprite.js`): aqui vale o mesmo recorte do pipeline do jogador.
// O PROMPT é o do Oráculo real (REGISTRO §231), semeado por `scripts/simulados-prompts.ts`: as Functions não importam o Oráculo.
// ---------------------------------------------------------------------------
import { kv, kvOrThrow } from './_kv.js';
import { flagOn } from './_killSwitch.js';
import { chromaKeyPng, chromaKeyOfPrompt } from './_chroma.js';
import { spriteUrlOrNull } from './_artLine.js';
import { HF_API, HF_ROUTES, hfRequestBody, spriteModel } from './generate-sprite.js';
import { SIMULADOS } from './_simulados.data.js';

export const FORMAS_DIA_MAX = 8;
export const FORMAS_MES_MAX = 150;
export const FORMA_TENTATIVAS_MAX = 3;
const POR_PASSO = 3;
const ENVIO_VENCE_MS = 30 * 60_000;
const ORDEM = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const POR_ID = new Map(SIMULADOS.map((s) => [s.id, s]));
/** Antigos cuja âncora passa do teto Champion: nada é gerado para eles sem decisão do dono (REGISTRO §232). */
const ACIMA_DO_TETO = new Set(SIMULADOS.filter((s) => !['rookie', 'champion'].includes(s.ancora.estagio)).map((s) => s.id));

export const formasLigadas = (env) => flagOn(env?.SIMULADOS_FORMAS_ON) && !flagOn(env?.SPRITE_DISABLED);
export const chaveDaForma = (id, forma) => `sim:sprite:${id}:${forma}`;
export const chaveDoPrompt = (id, forma) => `sim:prompt:${id}:${forma}`;
export const chaveDaFila = (id, forma) => `sim:form:${id}:${forma}`;
const FORMA_RE = /^(?:rookie|ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))$/;
const posicao = (forma) => ORDEM.indexOf(String(forma).split('-')[0]);

/** O prompt gravado da forma, ou `null` se faltar ou estiver ilegível. */
async function promptGravado(store, id, forma) {
  try {
    const p = JSON.parse((await store.get(chaveDoPrompt(id, forma))) || 'null');
    return typeof p?.prompt === 'string' && p.prompt ? p : null;
  } catch {
    return null;
  }
}

async function sha256Hex(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Um jogador viu o simulado nesta forma: entra na fila se a arte ainda não existe. No-op desligado. Nunca lança. */
export async function enfileirarForma(env, id, forma, now = new Date()) {
  try {
    if (!formasLigadas(env) || !kv(env) || !POR_ID.has(id) || ACIMA_DO_TETO.has(id) || !FORMA_RE.test(forma)) return false;
    const store = kvOrThrow(env);
    if (await store.get(chaveDaForma(id, forma))) return false;
    if (await store.get(chaveDaFila(id, forma))) return false;
    await store.put(chaveDaFila(id, forma), JSON.stringify({ estado: 'fila', tentativas: 0, em: now.getTime() }));
    return true;
  } catch {
    return false;
  }
}

async function reservarOrcamento(store, now) {
  const iso = now.toISOString();
  const dia = `sim:gen:${iso.slice(0, 10)}`; const mes = `sim:gen:${iso.slice(0, 7)}`;
  const nDia = Number(await store.get(dia)) || 0; const nMes = Number(await store.get(mes)) || 0;
  if (nDia >= FORMAS_DIA_MAX || nMes >= FORMAS_MES_MAX) return false;
  await store.put(dia, String(nDia + 1), { expirationTtl: 86400 * 3 });
  await store.put(mes, String(nMes + 1), { expirationTtl: 86400 * 70 });
  return true;
}

async function enviar(env, store, p, prompt, origin) {
  const model = spriteModel(env) === 'flare' ? 'flare' : 'alpha';
  const ponteiro = spriteUrlOrNull(await store.get(`sim:sprite:${p.id}`));
  const refs = ponteiro && origin && ponteiro.startsWith('/api/sprite-image') ? [`${origin}${ponteiro}`] : [];
  const r = await fetch(`${HF_API}${HF_ROUTES[model]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${env.HF_CREDENTIALS}`, 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(hfRequestBody(env, model, prompt, refs)),
  });
  if (!r.ok) throw new Error(`envio ${r.status}`);
  const j = await r.json();
  const requestId = j.request_id || j.id;
  if (typeof requestId !== 'string' || !/^[\w-]{1,80}$/.test(requestId)) throw new Error('sem request id');
  return requestId;
}

async function instalar(env, store, p, forma, urlImagem, { chroma, sha }) {
  const res = await fetch(urlImagem);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const png = chromaKeyPng(new Uint8Array(await res.arrayBuffer()), chroma);
  const token = crypto.randomUUID().replace(/-/g, '');
  await store.put(`sprite:blob:${token}`, png.buffer, { metadata: { contentType: 'image/png' } });
  const url = `/api/sprite-image?k=${token}`;
  const metadata = { el: p.element, line: p.line, form: forma, sha };
  await store.put(chaveDaForma(p.id, forma), url, { metadata });
  const atual = await store.getWithMetadata(`sim:sprite:${p.id}`);
  // O ponteiro nunca volta para uma forma anterior (geração fora de ordem).
  if (posicao(atual?.metadata?.form ?? 'rookie') <= posicao(forma) || !atual?.value) await store.put(`sim:sprite:${p.id}`, url, { metadata });
}

/** Avança a fila um passo curto. No-op desligado ou sem credencial. Nunca lança. */
export async function passoFormas(env, { now = new Date(), origin = '' } = {}) {
  try {
    if (!formasLigadas(env) || !kv(env) || !String(env.HF_CREDENTIALS || '').includes(':')) return { status: 'off' };
    const store = kvOrThrow(env);
    const page = await store.list({ prefix: 'sim:form:', limit: 20 });
    let feitos = 0;
    for (const { name } of page.keys) {
      if (feitos >= POR_PASSO) break;
      const [, , id, forma] = name.split(':');
      const p = POR_ID.get(id);
      let f = null;
      try { f = JSON.parse((await store.get(name)) || 'null'); } catch { /* entrada ilegível sai abaixo */ }
      if (!p || !f || !FORMA_RE.test(forma ?? '')) { await store.delete(name); continue; }
      if (f.estado === 'falhou') continue;
      feitos++;
      try {
        if (f.estado === 'fila') {
          const gravado = await promptGravado(store, id, forma);
          // Sem prompt do Oráculo não há o que gerar: para sem gastar orçamento nem crédito.
          if (!gravado) { await store.put(name, JSON.stringify({ ...f, estado: 'falhou', motivo: 'sem-prompt', em: now.getTime() })); continue; }
          // Recusa do provedor: a tentativa seguinte vai com o fallback, como no jogador.
          const prompt = f.usarFallback && gravado.fallback ? gravado.fallback : gravado.prompt;
          if (!(await reservarOrcamento(store, now))) return { status: 'teto' };
          const requestId = await enviar(env, store, p, prompt, origin);
          await store.put(name, JSON.stringify({ ...f, estado: 'enviado', requestId, chroma: chromaKeyOfPrompt(prompt), sha: await sha256Hex(prompt), em: now.getTime() }));
          continue;
        }
        const st = await fetch(`${HF_API}/requests/${f.requestId}/status`, { headers: { Authorization: `Key ${env.HF_CREDENTIALS}` } });
        const data = st.ok ? await st.json() : null;
        if (data?.status === 'completed') {
          const img = data.images?.[0]?.url;
          if (typeof img !== 'string' || !img.startsWith('https://')) throw new Error('sem imagem');
          await instalar(env, store, p, forma, img, { chroma: f.chroma === 'magenta' ? 'magenta' : 'green', sha: f.sha });
          await store.delete(name);
        } else if (data?.status === 'failed' || data?.status === 'canceled' || data?.status === 'nsfw' || now.getTime() - Number(f.em) > ENVIO_VENCE_MS) {
          throw new Error(`provedor ${data?.status ?? 'vencido'}`);
        }
      } catch (err) {
        const tentativas = (Number(f.tentativas) || 0) + 1;
        console.error('simFormas:', id, forma, err?.message);
        await store.put(name, JSON.stringify({ estado: tentativas >= FORMA_TENTATIVAS_MAX ? 'falhou' : 'fila', tentativas, usarFallback: Boolean(f.usarFallback) || /nsfw/.test(String(err?.message)), em: now.getTime() }));
      }
    }
    return { status: 'ok', feitos };
  } catch {
    return { status: 'skipped' };
  }
}
