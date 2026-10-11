// ---------------------------------------------------------------------------
// A GUERRA DE GUILDA (guilda-lancamento PR4, 11/10/2026; pedido do dono).
//
// 4 × 4: você + 3 aliados contra 4 inimigos. O PAREAMENTO É POR TAMANHO: uma guilda que escala 3
// pessoas só pareia com uma que escala 3; com 2, com 2 (de 5 membros em diante, escala 4). O
// SERVIDOR decide tudo: monta as fichas dos dois lados a partir dos SAVES (`loadDuelSide`, o mesmo
// teto S1 do duelo), sorteia a semente e resolve cada confronto com o combate v3 (`simulateDuel`) —
// o cliente só pede para procurar e lê o resultado. Nenhum dinheiro real entra, e nada na ficha é
// comprável: o resultado só rega a CASA (seiva `guerra`, cosmético).
//
// Fluxo (assíncrono — ninguém espera ninguém):
//   buscar → a guilda monta o esquadrão (quem pediu + os mais antigos, só quem tem ficha) e olha a
//   fila do SEU tamanho: se há outra guilda esperando, resolve na hora e grava o resultado nas duas;
//   senão entra na fila e o resultado chega quando outra guilda do mesmo tamanho buscar.
//
// Chaves (todas de guilda, TTL curto; nada vai para a vista principal — o orçamento de KV é apertado):
//   coopWarQ:<size>     fila: { gid, roster:[saveId…], at }           (só o servidor lê os saveIds)
//   coopWarWait:<gid>   "estou na fila": { size, at }
//   coopWarRes:<gid>    o último resultado: { day, outcome, duels[], size, enemy }
//
// A resposta NUNCA traz saveId, estágio, HP, nem número de dano de ninguém; os inimigos aparecem só como
// "N criaturas" e o nome (já higienizado) da guilda deles.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { loadDuelSide } from './_duelLoad.js';
import { simulateDuel, duelSeed } from './_duel.js';
import { somarPontos } from './_casa.js';

export const WAR_MIN = 2;
export const WAR_MAX = 4;
/** Seiva da casa por esquadrão e por resultado — vencer rende mais, perder nunca rende zero. */
export const WAR_PTS = Object.freeze({ win: 24, draw: 12, loss: 8 });
export const WAR_QUEUE_TTL = 86400 * 2;
export const WAR_RES_TTL = 86400 * 30;

export const coopWarQKey = size => `coopWarQ:${size}`;
export const coopWarWaitKey = gid => `coopWarWait:${gid}`;
export const coopWarResKey = gid => `coopWarRes:${gid}`;

const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };

/**
 * O esquadrão: quem pediu primeiro, depois os membros mais antigos, só quem tem ficha de luta; até `WAR_MAX`.
 * @returns {Promise<Array<{ save: string, side: any }>>}
 */
export async function montarEsquadrao(env, g, requester) {
  const ordem = [requester, ...g.members.filter(m => m !== requester)];
  const lados = await Promise.all(ordem.map(async m => ({ save: m, side: await loadDuelSide(env, m) })));
  return lados.filter(x => x.side).slice(0, WAR_MAX);
}

/** Os mais fortes se encontram: ordena por level (desc), estável pela ordem de entrada. */
const porNivel = lados => lados
  .map((x, i) => ({ ...x, i }))
  .sort((a, b) => (b.side.combatant.level - a.side.combatant.level) || (a.i - b.i));

/**
 * Resolve a guerra entre dois esquadrões do mesmo tamanho. PURA e determinística na semente.
 * @returns {{ aWins: number, bWins: number, duels: Array<'a'|'b'|'draw'> }}
 */
export function resolverGuerra(A, B, sementeBase) {
  const a = porNivel(A), b = porNivel(B);
  const n = Math.min(a.length, b.length);
  /** @type {Array<'a'|'b'|'draw'>} */
  const duels = [];
  let aWins = 0, bWins = 0;
  for (let i = 0; i < n; i++) {
    const r = simulateDuel({ me: a[i].side, opp: b[i].side, seed: duelSeed(sementeBase, i), taps: [] });
    if (r.winner === 'me') { aWins++; duels.push('a'); } else if (r.winner === 'opp') { bWins++; duels.push('b'); } else duels.push('draw');
  }
  return { aWins, bWins, duels };
}

const resultadoDe = (meus, deles) => (meus > deles ? 'win' : meus < deles ? 'loss' : 'draw');
/** @param {string[]} duels @param {'a'|'b'} lado */
const duelosDe = (duels, lado) => duels.map(d => (d === 'draw' ? 'draw' : d === lado ? 'win' : 'loss'));

/** O estado da guerra para a vista de uma guilda (2 leituras). */
export async function estadoDaGuerra(env, gid) {
  const [res, wait] = await Promise.all([
    kvOrThrow(env).get(coopWarResKey(gid)).then(parse),
    kvOrThrow(env).get(coopWarWaitKey(gid)).then(parse),
  ]);
  const last = res && typeof res === 'object' && typeof res.day === 'string' && ['win', 'draw', 'loss'].includes(res.outcome)
    ? { day: res.day, outcome: res.outcome, duels: (Array.isArray(res.duels) ? res.duels : []).filter(d => ['win', 'draw', 'loss'].includes(d)).slice(0, WAR_MAX), size: Math.min(WAR_MAX, Math.max(0, Number(res.size) || 0)), enemy: typeof res.enemy === 'string' ? res.enemy.slice(0, 24) : '' }
    : null;
  const waiting = wait && Number.isInteger(wait.size) && wait.size >= WAR_MIN && wait.size <= WAR_MAX ? { size: wait.size } : null;
  return { waiting, last };
}

/**
 * Procurar uma guilda rival. Uma guerra por guilda por dia do jogador. Devolve `{ state, ... }`:
 *   'small'    — esquadrão com menos de `WAR_MIN` fichas (a guilda é pequena demais, ou ninguém tem ficha);
 *   'already'  — a guilda já lutou hoje (o resultado está em `last`);
 *   'waiting'  — entrou na fila do tamanho `size`;
 *   'done'     — pareou e resolveu agora.
 * @param {(gid: string) => Promise<{ id: string, name: string, members: string[] } | null>} lerGrupo
 */
export async function buscarGuerra(env, g, requester, hoje, lerGrupo) {
  const kvs = kvOrThrow(env);
  const antes = await estadoDaGuerra(env, g.id);
  if (antes.last?.day === hoje) return { state: 'already', ...antes };
  if (antes.waiting) return { state: 'waiting', ...antes };

  const meus = await montarEsquadrao(env, g, requester);
  if (meus.length < WAR_MIN) return { state: 'small', ...antes };
  const size = meus.length;

  const fila = parse(await kvs.get(coopWarQKey(size)));
  const rival = fila && typeof fila.gid === 'string' && fila.gid !== g.id && Array.isArray(fila.roster) ? await lerGrupo(fila.gid) : null;
  if (!rival) {
    // Ninguém (válido) esperando: entra na fila. A fila guarda só saveIds de ESQUADRÃO, nunca devolvidos.
    await kvs.put(coopWarQKey(size), JSON.stringify({ gid: g.id, roster: meus.map(x => x.save), at: Date.now() }), { expirationTtl: WAR_QUEUE_TTL });
    await kvs.put(coopWarWaitKey(g.id), JSON.stringify({ size, at: Date.now() }), { expirationTtl: WAR_QUEUE_TTL });
    return { state: 'waiting', waiting: { size }, last: antes.last };
  }

  // Pareou. Tira a guilda da fila ANTES de resolver (duas buscas ao mesmo tempo não lutam duas vezes com ela).
  await kvs.delete(coopWarQKey(size));
  const deles = (await Promise.all(fila.roster.filter(m => rival.members.includes(m)).map(async m => ({ save: m, side: await loadDuelSide(env, m) })))).filter(x => x.side).slice(0, WAR_MAX);
  if (deles.length < WAR_MIN) {
    // O esquadrão rival não existe mais: descarta e entra na fila no lugar dele.
    await kvs.put(coopWarQKey(size), JSON.stringify({ gid: g.id, roster: meus.map(x => x.save), at: Date.now() }), { expirationTtl: WAR_QUEUE_TTL });
    await kvs.put(coopWarWaitKey(g.id), JSON.stringify({ size, at: Date.now() }), { expirationTtl: WAR_QUEUE_TTL });
    return { state: 'waiting', waiting: { size }, last: antes.last };
  }
  const n = Math.min(meus.length, deles.length);
  const A = meus.slice(0, n), B = deles.slice(0, n);
  const { aWins, bWins, duels } = resolverGuerra(A, B, `guerra|${g.id}|${rival.id}|${hoje}`);
  const meu = resultadoDe(aWins, bWins);
  const dele = resultadoDe(bWins, aWins);
  const grava = (gid, outcome, d, lado, nomeInimigo) => kvs.put(
    coopWarResKey(gid),
    JSON.stringify({ day: hoje, outcome, duels: duelosDe(d, lado), size: n, enemy: nomeInimigo }),
    { expirationTtl: WAR_RES_TTL },
  );
  await Promise.all([
    grava(g.id, meu, duels, 'a', rival.name),
    grava(rival.id, dele, duels, 'b', g.name),
    kvs.delete(coopWarWaitKey(rival.id)),
    kvs.delete(coopWarWaitKey(g.id)),
    // A seiva da casa vai para os dois esquadrões (cada um na casa da própria guilda; perder nunca rende zero).
    ...A.map(x => somarPontos(env, g.id, x.save, 'guerra', WAR_PTS[meu])),
    ...B.map(x => somarPontos(env, rival.id, x.save, 'guerra', WAR_PTS[dele])),
  ]);
  return { state: 'done', waiting: null, last: { day: hoje, outcome: meu, duels: duelosDe(duels, 'a'), size: n, enemy: rival.name } };
}
