/**
 * Índice ORDENÁVEL da season do Torneio (REGISTRO §23, "plano do que falta", decisão do dono 31/10/2026).
 *
 * Por que existe: o `rank` e o `closeSeason` liam até 300 chaves `rank:<season>:*` em ordem de CHAVE (saveId),
 * não de pontos. Com mais de 300 jogadores na season o pódio podia sair sem o campeão e o `myPlace` mentia.
 * Ler todas as chaves esbarra no teto de subrequests do Worker (1 `get` por jogador).
 *
 * Desenho (a opção KV do §23): `rankIndex:<season>` = `{ v: 1, p: { <saveId>: pontos }, done, cursor }`,
 * regravado em todo `putRank` (partida, empate, sorteio, simulado). Um `get` dá a season inteira já ordenável.
 *
 *   · `p` é só CANDIDATO à ordem. A verdade continua em `rank:<season>:<saveId>`: quem lê o índice reconfere a
 *     linha dos poucos que vai mostrar/premiar, e linha ausente (conta apagada, TTL) sai do índice ali mesmo.
 *   · Preenchimento de quem já tinha `rank:` antes do índice: `done: false` + `cursor` do `list`. Cada leitura
 *     avança um lote com ORÇAMENTO de `get` (o `list` vem com `metadata.pts` para as linhas novas, sem `get`).
 *     Enquanto `done` for falso, quem lê usa o caminho antigo; o índice nunca é tratado como completo antes da hora.
 *   · Só leitura AUTENTICADA (e o `closeSeason`) preenche ou poda: consulta anônima nunca escreve (L07-04).
 *   · Limite honesto: o KV não tem escrita condicional. Duas partidas no MESMO instante podem perder a atualização
 *     de uma delas no índice; o jogador volta a ficar certo na próxima partida dele. Por isso o `closeSeason`
 *     reconfere com a linha `rank:` os primeiros colocados antes de premiar.
 */
import { kvOrThrow } from './_kv.js';

const TTL = 86400 * 120; // o mesmo das linhas `rank:` — o índice morre junto com a season
export const RANK_INDEX_PREFIX = 'rankIndex:';
const indexKey = season => `${RANK_INDEX_PREFIX}${season}`;
const rankPrefix = season => `rank:${season}:`;

function vazio() { return { v: 1, p: {}, done: false, cursor: null }; }

/** Lê o índice. Ilegível conta como ausente (recomeça o preenchimento; nada de dinheiro mora aqui). */
export async function lerIndice(env, season) {
  const raw = await kvOrThrow(env).get(indexKey(season));
  if (!raw) return vazio();
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object' || !o.p || typeof o.p !== 'object' || Array.isArray(o.p)) return vazio();
    return { v: 1, p: o.p, done: o.done === true, cursor: typeof o.cursor === 'string' ? o.cursor : null };
  } catch { return vazio(); }
}

async function gravar(env, season, idx) {
  await kvOrThrow(env).put(indexKey(season), JSON.stringify(idx), { expirationTtl: TTL });
}

/** Chamado por todo `putRank`: atualiza (ou cria) a entrada do jogador. */
export async function indexarPontos(env, season, id, points) {
  // Best-effort: o KV aceita ~1 escrita/s por chave e o índice é UMA chave por season. Estourar isso não pode
  // derrubar a partida (a linha `rank:` já foi gravada e é a verdade); a entrada fica velha até a próxima partida.
  try {
    const idx = await lerIndice(env, season);
    idx.p[id] = Number(points) || 0;
    await gravar(env, season, idx);
  } catch (err) {
    console.warn(JSON.stringify({ event: 'rankIndex.write.failed', season, err: String(err?.message ?? err).slice(0, 80) }));
  }
}

/** Tira entradas cuja linha `rank:` não existe mais. */
export async function podarIndice(env, season, ids) {
  if (!ids.length) return;
  const idx = await lerIndice(env, season);
  let mudou = false;
  for (const id of ids) if (id in idx.p) { delete idx.p[id]; mudou = true; }
  if (mudou) await gravar(env, season, idx);
}

/**
 * Avança o preenchimento a partir do `cursor`, gastando no máximo `orcamento` `get`s. Entrada que já está no índice
 * é mais nova que a linha (veio do `putRank`) e não é sobrescrita.
 * @returns {Promise<{ p: Record<string, number>, done: boolean }>}
 */
export async function completarIndice(env, season, orcamento = 100) {
  const idx = await lerIndice(env, season);
  if (idx.done) return idx;
  const store = kvOrThrow(env);
  const pre = rankPrefix(season);
  let gastos = 0;
  let cursor = idx.cursor ?? undefined;
  let done = false;
  // Página de no máximo `orcamento` chaves: se o orçamento acabar no meio dela, o cursor
  // não pularia as chaves que ficaram sem ler.
  const limit = Math.max(1, Math.min(1000, orcamento));
  while (!done) {
    const page = await store.list({ prefix: pre, cursor, limit });
    let faltam = 0;
    for (const k of page.keys) if (!(k.name.slice(pre.length) in idx.p) && !Number.isFinite(k.metadata?.pts)) faltam++;
    if (gastos > 0 && gastos + faltam > orcamento) break; // esta página fica para a próxima leitura
    for (const k of page.keys) {
      const id = k.name.slice(pre.length);
      if (id in idx.p) continue;
      if (Number.isFinite(k.metadata?.pts)) { idx.p[id] = k.metadata.pts; continue; }
      const raw = await store.get(k.name);
      gastos++;
      if (!raw) continue;
      try { idx.p[id] = Number(JSON.parse(raw)?.points) || 0; } catch { /* linha ilegível: fora da ordem */ }
    }
    if (page.list_complete || !page.cursor) { done = true; cursor = undefined; } else cursor = page.cursor;
    if (gastos >= orcamento) break;
  }
  // Releitura antes de gravar: um `putRank` durante o lote não pode ser desfeito pelo valor antigo da linha.
  const atual = await lerIndice(env, season);
  const out = { v: 1, p: { ...idx.p, ...atual.p }, done, cursor: done ? null : (cursor ?? null) };
  await gravar(env, season, out);
  return out;
}

/** Entradas ordenadas por pontos (desempate por saveId, a mesma régua do `myPlace` antigo). */
export function ordenar(p) {
  return Object.entries(p)
    .map(([owner, points]) => ({ owner, points: Number(points) || 0 }))
    .sort((a, b) => (b.points - a.points) || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0));
}
