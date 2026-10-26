// ---------------------------------------------------------------------------
// MOTOR DOS 50 USUÁRIOS SIMULADOS (BACKLOG-BETA3 M11) — densidade populacional, sem custo de API.
//
// REGRAS DO DONO (não reverter):
//   • parecem jogadores reais para quem joga. A flag `simulated: true` existe SÓ no servidor — no perfil KV
//     (`profile:<id>`) e no `metadata` do ranking (`sim`). `stripSimulated` tira o campo de TODA resposta de rota
//     (`community.js` e `rankings.js` passam por ela): o cliente nunca o recebe;
//   • NUNCA levam prêmio: `payablePlacements` (`_rankings.js`) pula `sim`/`simulated` e também o id `sim_NNNN`, e o
//     fechamento do Endless Rift (`_riftPayout.js`) usa a mesma régua; `closeSeason` não dá troféu a eles; presente
//     para um simulado é aceito SEM efeito (nada é gravado nem debitado — ver `community.js`, action `gift`).
//
// ATIVAÇÃO — `SIMULADOS_ON=1` (var do Worker, ligada pelo DONO; sem ela o motor é no-op e nenhuma rota muda). Não há
// cron: a execução é PREGUIÇOSA. As rotas de ranking/diretório/torneio/arena chamam `ensureSimuladosDia(env)`:
//   1. trava `sim:dia:<YYYY-MM-DD>` (UTC) — `{ state, next }`. Ausente = grava `running/0` e começa;
//   2. a cada chamada processa UM LOTE de `CHUNK` simulados (teto de subrequests do Worker: ~40 operações de KV por
//      simulado no pior caso) e avança `next`; no último lote grava `done` (definitivo, e cache em memória);
//   3. cada passo é IDEMPOTENTE (perfil só regrava se mudou; ranking só guarda o MELHOR score; reserva de apelido
//      repete sem efeito) — duas chamadas concorrentes no mesmo lote só duplicam trabalho, nunca dado;
//   4. NUNCA lança: falha do motor vira `{ status: 'skipped' }` e a rota segue.
//
// DETERMINISMO — PRNG semeado com hash(id do simulado + dia): o mesmo dia produz sempre o mesmo resultado.
// O estado do simulado (level, estágio, Vínculo, scores) é função PURA de (perfil, dia).
//
// O QUE O MOTOR ESCREVE (todo o resto do jogo lê pelos caminhos normais — não há `if (simulado)` espalhado):
//   • `<id>` (o SAVE: só o que o duelo/Vínculo derivam — `evolutionStage`, `perfectDays`, `totalXP`, pontos), com
//     `metadata.f` = 1ª gravação (o teto S1 do duelo: 1 level por dia de "conta");
//   • `profile:<id>` público (pvpEnabled, publicHidden=false → entra no diretório/oponentes) + `pid:<pid>`;
//   • `nick:*` / `nickof:<id>` (apelido único, mesma régua do jogador);
//   • `rank:<season>:<id>` (placar do Torneio) quando ausente;
//   • scores de `_rankings.js` (`submitScore`), semanais e mensais por jogo.
// ---------------------------------------------------------------------------

import { kv, kvOrThrow } from './_kv.js';
import { flagOn } from './_killSwitch.js';
import { getProfile, putProfile, indexPublicId, claimNick } from './_profile.js';
import { xpForLevel } from './_bond.js';
import { artLineOrNull, spriteUrlOrNull } from './_artLine.js';
import { RANKED_GAMES, TIER_CUTS, MAX_SCORE_BY_GAME, submitScore } from './_rankings.js';
import { SIMULADOS, SIM_EPOCH } from './_simulados.data.js';

const DAY_MS = 86_400_000;
/** Simulados processados por chamada (cada um custa ≤ ~40 operações de KV; o Worker aceita 1000 subrequests). */
export const CHUNK = 8;
const LOCK_TTL = { expirationTtl: 86400 * 3 };
const PROFILE_REFRESH_MS = 30 * DAY_MS;

export const SIM_ID_RE = /^sim_\d{4}$/;
export const isSimuladoId = (id) => typeof id === 'string' && SIM_ID_RE.test(id);

export const lockKeyDia = (day) => `sim:dia:${day}`;
export const spriteKeyOf = (id) => `sim:sprite:${id}`;

// ── PRNG determinístico ──────────────────────────────────────────────────────
function hash32(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
/** mulberry32 semeado por hash(chave). */
export function prngOf(key) {
  let a = hash32(key);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Tempo ────────────────────────────────────────────────────────────────────
export const dayKeyOf = (now = new Date()) => new Date(now).toISOString().slice(0, 10);
const dayStart = (day) => Date.parse(`${day}T00:00:00Z`);
/** Dias desde o dia-zero (nunca negativo). */
export const dayIndexOf = (day) => Math.max(0, Math.floor((dayStart(day) - dayStart(SIM_EPOCH)) / DAY_MS));

// ── Estado do simulado no dia (função pura) ──────────────────────────────────
const STAGE_FIRST_LEVEL = { rookie: 1, champion: 7, ultimate: 14, mega: 22, ultra: 31 };
const PATH_SUFFIX = { poder: 'power', harmonia: 'harmony', benevolencia: 'benevolence' };
const MAX_LEVEL = 40;
const FREQ_P = { casual: 0.3, regular: 0.6, assiduo: 0.9 };

export function stageForLevel(level) {
  if (level <= 6) return 'rookie';
  if (level <= 13) return 'champion';
  if (level <= 21) return 'ultimate';
  if (level <= 30) return 'mega';
  return 'ultra';
}

/** Level, estágio e Vínculo do simulado no dia (curva de progresso: `lv0 + floor(rate * dias)`). */
export function estadoDoDia(p, day) {
  const d = dayIndexOf(day);
  const level = Math.min(MAX_LEVEL, p.lv0 + Math.floor(p.rate * d));
  const stage = stageForLevel(level);
  const bond = Math.max(5, p.bond0 + Math.floor(p.rate * d * 0.8));
  const evolutionStage = stage === 'rookie' || stage === 'ultra' ? stage : `${stage}-${PATH_SUFFIX[p.line]}`;
  return { level, stage, bond, evolutionStage };
}

/** O save mínimo que o duelo e o Vínculo derivam (`_soulXP.js`: level = f(evolutionStage, perfectDays)). */
export function saveDoSimulado(p, day) {
  const e = estadoDoDia(p, day);
  const perfectDays = Math.max(0, e.level - STAGE_FIRST_LEVEL[e.stage]);
  const peso = (alvo) => (p.line === alvo ? 40 + e.level * 6 : 10 + e.level * 2);
  return {
    evolutionStage: e.evolutionStage,
    perfectDays,
    totalXP: xpForLevel(e.bond),
    powerPoints: peso('poder'),
    harmonyPoints: peso('harmonia'),
    benevolencePoints: peso('benevolencia'),
    demoCharacterId: artLineOrNull(p.artLine) ?? undefined,
  };
}

/** Hoje o simulado joga? (frequência) */
export function jogaHoje(p, day) {
  return prngOf(`${p.id}|${day}|joga`)() < FREQ_P[p.frequency];
}

/**
 * Scores do dia: `[{ game, score }]` — só dos jogos que ele joga e se jogou hoje. Função pura de (perfil, dia).
 * Escala pelo corte mais alto de `TIER_CUTS` (`ceil`): habilidade e competitividade do jogo puxam para o topo,
 * o ruído do dia a dia (0,75–1,10) mantém o placar vivo. O Endless Rift (camada) fica em ~45% do teto da descida.
 */
export function scoresDoDia(p, day) {
  if (!jogaHoje(p, day)) return [];
  const out = [];
  for (const [game, compRaw] of Object.entries(p.prefs)) {
    const comp = compRaw ?? 0;
    if (!RANKED_GAMES.includes(game)) continue;
    const rng = prngOf(`${p.id}|${day}|${game}`);
    if (rng() > 0.35 + comp * 0.6) continue; // nem todo dia ele joga todo jogo que gosta
    const cuts = TIER_CUTS[game];
    const topo = cuts[cuts.length - 1] * (game === 'endless-rift' ? 0.45 : 1);
    const forca = Math.min(1, p.skill * 0.6 + comp * 0.4);
    let score = Math.round(topo * (0.04 + 0.96 * Math.pow(forca, 1.3) * (0.75 + 0.35 * rng())));
    const teto = MAX_SCORE_BY_GAME[game];
    if (teto !== undefined) score = Math.min(score, teto);
    if (score >= 1) out.push({ game, score });
  }
  return out;
}

// ── Escrita (idempotente) ────────────────────────────────────────────────────
const pidDeterministico = (id) => {
  const h = (s) => hash32(s).toString(16).padStart(8, '0');
  return `${h(`sim-pid-a|${id}`)}${h(`sim-pid-b|${id}`)}${h(`sim-pid-c|${id}`)}`; // 24 hex, sem relação com o saveId
};

async function reservarApelido(env, p) {
  const candidatos = [p.nick, ...[2, 3, 4, 5, 6, 7, 8, 9].map(n => `${p.nick}${n}`), `${p.nick}_${p.id.slice(-4)}`];
  for (const nome of candidatos) {
    if (await claimNick(env, p.id, nome)) return nome;
  }
  return null;
}

/** Cria/atualiza save + perfil + índices do simulado. Só grava o que mudou (poupa subrequests). */
export async function upsertSimulado(env, p, day, now = new Date()) {
  const store = kvOrThrow(env);
  const prev = await getProfile(env, p.id).catch(() => null);
  const spriteRaw = await store.get(spriteKeyOf(p.id)).catch(() => null);
  const spriteUrl = spriteUrlOrNull(spriteRaw);
  const e = estadoDoDia(p, day);
  const sig = `${e.level}|${e.bond}|${spriteUrl ?? ''}`;
  if (prev?.simulated === true && prev.simSig === sig && now.getTime() - Number(prev.simAt || 0) < PROFILE_REFRESH_MS) {
    return { wrote: false, name: prev.name };
  }
  const name = prev?.simulated === true && prev.name ? prev.name : (await reservarApelido(env, p)) ?? p.nick;
  const pid = prev?.pid || pidDeterministico(p.id);
  const criadoEm = dayStart(SIM_EPOCH) - p.daysPlaying * DAY_MS;
  const lifetimeBase = Math.round(p.skill * p.skill * 1300 + e.level * 6);
  const peso = (alvo) => (p.line === alvo ? 40 + e.level * 6 : 10 + e.level * 2);
  const unlocked = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'].filter((s) => STAGE_FIRST_LEVEL[s] <= e.level);
  const perfil = {
    ...(prev || {}),
    id: p.id,
    pid,
    name,
    petName: p.petName,
    stage: e.evolutionStage,
    avatarId: null,
    frameId: null,
    artLine: artLineOrNull(p.artLine),
    element: p.element,
    ...(spriteUrl ? { spriteUrl } : {}),
    unlockedStages: unlocked,
    pvpEnabled: true,
    publicHidden: false,
    attrs: { power: peso('poder'), harmony: peso('harmonia'), benevolence: peso('benevolencia') },
    tasksDone: Math.round(e.level * 9 + p.daysPlaying * 0.4),
    friends: prev?.friends || [],
    createdAt: prev?.createdAt || criadoEm,
    updatedAt: now.getTime(),
    // O duelo só soma (`settleMatch`): nunca recuar o que o Torneio já creditou.
    lifetimePoints: Math.max(Number(prev?.lifetimePoints) || 0, lifetimeBase),
    simulated: true, // SÓ servidor — `stripSimulated` garante que nunca sai
    simSig: sig,
    simAt: now.getTime(),
  };
  await store.put(p.id, JSON.stringify(saveDoSimulado(p, day)), { expirationTtl: 86400 * 400, metadata: { f: criadoEm } });
  await putProfile(env, p.id, perfil);
  await indexPublicId(env, p.id, pid);
  return { wrote: true, name };
}

/** Placar do Torneio da season corrente: só quando ausente (duelos reais passam a mexer nele). */
async function garantirRankDaSeason(env, p, now) {
  const store = kvOrThrow(env);
  const season = new Date(now).toISOString().slice(0, 7);
  const key = `rank:${season}:${p.id}`;
  if (await store.get(key)) return;
  const rng = prngOf(`${p.id}|${season}|rank`);
  const points = Math.round(p.skill * 380 + rng() * 60);
  const jogos = 3 + Math.floor(p.skill * 14 + rng() * 6);
  const wins = Math.round(jogos * (0.3 + p.skill * 0.5));
  await store.put(key, JSON.stringify({ points, wins, losses: Math.max(0, jogos - wins), day: SIM_EPOCH, matchesToday: 0 }), { expirationTtl: 86400 * 120 });
}

/** Escreve os scores do dia do simulado nos rankings (`submitScore`: só o MELHOR vale no período). */
async function escreverScores(env, p, day, now) {
  const quando = new Date(dayStart(day) + 12 * 3600_000);
  void now;
  let n = 0;
  for (const { game, score } of scoresDoDia(p, day)) {
    const periodos = game === 'endless-rift' ? ['monthly'] : ['weekly', 'monthly'];
    for (const period of periodos) {
      await submitScore(env, { game, period, saveId: p.id, score, now: quando });
      n++;
    }
  }
  return n;
}

async function processarSimulado(env, p, day, now) {
  await upsertSimulado(env, p, day, now);
  await garantirRankDaSeason(env, p, now);
  await escreverScores(env, p, day, now);
}

// ── Orquestração preguiçosa ──────────────────────────────────────────────────
/** WeakMap por store: o cache em memória não vaza entre ambientes (testes) nem entre namespaces. */
const concluidos = new WeakMap();

/**
 * Garante o dia dos simulados (ver cabeçalho). Seguro de chamar em TODA requisição: depois do dia concluído custa 0
 * operações (cache em memória) e, num worker novo, 1 `get`. Nunca lança.
 * @returns {Promise<{ status: 'off'|'already'|'progress'|'done'|'skipped', day?: string, next?: number }>}
 */
export async function ensureSimuladosDia(env, now = new Date()) {
  try {
    if (!flagOn(env?.SIMULADOS_ON) || !kv(env)) return { status: 'off' };
    const store = kvOrThrow(env);
    const day = dayKeyOf(now);
    let set = concluidos.get(store);
    if (!set) { set = new Set(); concluidos.set(store, set); }
    if (set.has(day)) return { status: 'already', day };

    let lock = null;
    try { lock = JSON.parse((await store.get(lockKeyDia(day))) || 'null'); } catch { lock = null; }
    if (lock?.state === 'done') { set.add(day); return { status: 'already', day }; }
    if (!lock) {
      lock = { state: 'running', next: 0, at: now.getTime() };
      await store.put(lockKeyDia(day), JSON.stringify(lock), LOCK_TTL); // a trava ANTES do trabalho
    }
    const ini = Math.max(0, Math.floor(Number(lock.next) || 0));
    const fim = Math.min(SIMULADOS.length, ini + CHUNK);
    for (let i = ini; i < fim; i++) {
      try { await processarSimulado(env, SIMULADOS[i], day, now); } catch { /* um simulado ruim não derruba o lote */ }
    }
    const acabou = fim >= SIMULADOS.length;
    await store.put(lockKeyDia(day), JSON.stringify({ state: acabou ? 'done' : 'running', next: fim, at: now.getTime() }), LOCK_TTL);
    if (acabou) { set.add(day); return { status: 'done', day, next: fim }; }
    return { status: 'progress', day, next: fim };
  } catch {
    return { status: 'skipped' };
  }
}

// ── O cliente NUNCA vê `simulated` ───────────────────────────────────────────
const CAMPOS_INTERNOS = new Set(['simulated', 'sim', 'simSig', 'simAt']);

/** Remove os campos internos dos simulados de qualquer resposta (recursivo; devolve o MESMO objeto se não houver nada). */
export function stripSimulated(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    let mudou = false;
    const out = value.map((v) => { const n = stripSimulated(v, depth + 1); if (n !== v) mudou = true; return n; });
    return mudou ? out : value;
  }
  let mudou = false;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (CAMPOS_INTERNOS.has(k)) { mudou = true; continue; }
    const n = stripSimulated(v, depth + 1);
    if (n !== v) mudou = true;
    out[k] = n;
  }
  return mudou ? out : value;
}
