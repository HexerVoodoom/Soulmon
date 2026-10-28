// ---------------------------------------------------------------------------
// A FEIRA: O CHEFE E O DESAFIO (plano `docs/PLANO-FEIRA-CHEFE.md`, 28/10/2026; decisões do dono no §11).
//
// A Missão (30 min fora, `guildRaidHit`) NÃO muda. Quando o Solmon VOLTA, o clã encontra um mistério:
//   · um CHEFE de HP compartilhado (1 ataque/dia/pessoa, nunca regenera, nunca morre sozinho); ou
//   · uma TRILHA de desafios pessoais (cada um cumpre o seu para liberar a PRÓPRIA próxima incursão).
// O servidor decide TUDO: o dano nasce de uma re-simulação com semente do servidor (mesmo padrão de
// `_guerra.js`: ficha do SAVE + `fightSteps`), nunca de um número vindo do cliente. Nada por pessoa sai daqui
// (LV-G1): a resposta traz só a porcentagem do clã, o dano do PRÓPRIO golpe e o registro para o replay.
//
// DESLIGADO por padrão: `FEIRA_CHEFE_DESDE` está no futuro. Ligar = mudar a data aqui (ou a variável de
// ambiente de mesmo nome, sem deploy de código). Desligado, nenhuma rota responde e `guildRaidHit.evento` não existe.
//
// Chaves (todas em `_coop.js`, cada membro escreve só a sua; totais derivados na leitura):
//   feiraEvt:<gid>               foto do mistério ATUAL  {k, kind, level, bossId, hp0, spawnDay}
//   feiraHit:<gid>:<k>:<save>    {k, days[], dmg} do próprio membro neste chefe
//   feiraDead:<gid>:<k>          constante e idempotente {day, level, hp0, kind}: o mistério acabou, PARA SEMPRE
//   feiraDone:<gid>              {n, bosses, trails, lastDay}: mistérios concluídos; só cresce (max)
//   feiraTrail:<gid>:<k>:<save>  desafio pessoal {day, game, seed, startedAt, attempts, clearedDay}
//   feiraGate:<save>             porta da próxima incursão da pessoa
//   feiraPart / feiraClaim / feiraRight   direito de participação, recibo do resgate e ponteiro (A-1)
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import {
  numDia, diaDeNum, membrosAtivos, lerCartoes, fiosDosCartoes,
  FEIRA_TTL, FEIRA_PESSOAL_TTL, FEIRA_TRILHA_TTL,
  feiraEvtKey, feiraDoneKey, feiraDeadKey, feiraHitKey, feiraTrailKey, feiraClaimKey, feiraPartKey, feiraGateKey, feiraRightKey, feiraTrofeusKey,
  lerFeiraHit, lerConjunto, unirConjunto,
} from './_coop.js';
import { somarPontos, CASA_PTS_FONTE_DIA_MAX } from './_casa.js';
import { scoreIsPlausible } from './_rankings.js';
import { loadDuelSide } from './_duelLoad.js';
import { duelSide } from './_duel.js';
import {
  fightSteps, combatantAt, REFERENCE_BUILDS, PVP_HP_SCALE, specialOf, cleanStartEnergy, mulberry32,
} from './_combate.js';

// ── liga / desliga ──────────────────────────────────────────────────────────
/** Dia (UTC) a partir do qual o Chefe e o Desafio existem. NO FUTURO = desligado (decisão do dono, 28/10/2026). */
export const FEIRA_CHEFE_DESDE = '2099-12-31';
const ISO_DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Está ligada? A variável de ambiente `FEIRA_CHEFE_DESDE` (se for uma data válida) manda sobre a constante. */
export function feiraLigada(env, agora = new Date()) {
  const e = env && typeof env.FEIRA_CHEFE_DESDE === 'string' && ISO_DIA.test(env.FEIRA_CHEFE_DESDE) ? env.FEIRA_CHEFE_DESDE : null;
  return agora.toISOString().slice(0, 10) >= (e ?? FEIRA_CHEFE_DESDE);
}

// ── constantes de calibração (plano §2) ─────────────────────────────────────
/** Dano médio de UM ataque (estágio médio, `stagePower` 3). */
export const DANO_MEDIO = 100;
/** Comparecimento esperado. */
export const COMPARECIMENTO = 0.9;
/** Teto de UM ataque: 1,5 × a média. `HP ≥ 3 × teto` para todo nível e tamanho (teste). */
export const ATAQUE_TETO = 150;
export const DESEMPENHO_MIN = 0.7;
export const DESEMPENHO_MAX = 1.5;
/** Piso de membros no cálculo do HP (clã de 1–2 não fica trivial). */
export const FEIRA_MIN_MEMBROS = 3;
export const NIVEL_MAX = 20;
/** Trilha: 30% dos mistérios (o 0 é sempre Chefe). */
export const TRAIL_PCT = 30;
/** A trilha sem ninguém cumprir termina sozinha (LV-G3/G9: sem estagnação). */
export const TRAIL_MAX_DAYS = 3;
/** Descanso de 1 dia; o mistério seguinte abre 2 dias depois do fim do anterior (decisão do dono). */
export const SPAWN_GAP_DIAS = 2;
/** O Arauto do Fim só como chefe final, a partir deste nível. */
export const ARAUTO_NIVEL_MIN = 15;
/** Janela da luta em segundos (a repetição é recortada aqui). */
export const FIGHT_SECONDS = 30;
/** Quanto o chefe da simulação bate (ele nunca derruba o jogador: o ataque é só de dano ao chefe). */
const CHEFE_FORCA_NA_SIM = 0.25;
const HP_ENORME = 1e9;
export const LOG_MAX = 160;

/** Teto de Bits do resgate do chefe (o piso do plano é `30 + 10·L`; o teto da masmorra a que o plano se refere não é conhecido do servidor). */
export const CHEFE_BITS_TETO = 150;
export const CHEFE_EMBLEMAS_TETO = 10;
export const TRILHA_SEIVA = 3;
export const TRILHA_EMBLEMAS = 1;
export const TRILHA_TENTATIVAS_DIA = 12;

// ── funções puras ───────────────────────────────────────────────────────────
/** FNV-1a 32 bits. */
export function hash32(texto) {
  let h = 0x811c9dc5;
  const s = String(texto);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Nível do mistério k (k = mistérios concluídos pelo clã): `min(20, 1 + k)`. */
export function nivelDoMisterio(k) {
  const n = Math.max(0, Math.floor(Number(k) || 0));
  return Math.min(NIVEL_MAX, 1 + n);
}

/**
 * Dias CONTÍNUOS de dano que o chefe do nível `level` aguenta: `min(7, 1,5 + 0,25·(L−1))`.
 * CORREÇÃO DO PLANO (28/10/2026): o plano usava 2,00 no nível 1, mas dias são inteiros e a presença é 90%: simulado (Monte Carlo,
 * 4 membros, estágios 1–3), HP 720 leva em média 2,5–3,1 dias — o alvo do dono é ~2. Com 1,5 o clã de 4 leva em média 2,0–2,2 dias
 * (80–96% terminam em até 2). O arredondamento para dias inteiros e a ausência somam ~0,5 dia, daí a base 1,5.
 */
export const DIAS_BASE = 1.5;
export function diasAlvo(level) {
  const L = Math.min(NIVEL_MAX, Math.max(1, Math.floor(Number(level) || 1)));
  return Math.min(7, DIAS_BASE + 0.25 * (L - 1));
}

/**
 * HP do chefe: foto no dia em que surge. `round(max(N,3)·100·0,9·dias/10)·10`, com piso de `3 × ATAQUE_TETO`
 * (um golpe nunca passa de 1/3 do chefe, nem no clã mínimo). Nunca regenera.
 */
export function bossHpFor(level, ativos) {
  const N = Math.max(FEIRA_MIN_MEMBROS, Math.floor(Number(ativos) || 0));
  return Math.max(3 * ATAQUE_TETO, Math.round((N * DANO_MEDIO * COMPARECIMENTO * diasAlvo(level)) / 10) * 10);
}

/** Dano base de um ataque pelo estágio (`stagePower` 1..5): `70 + 10·p` (p=3 → 100). */
export function danoBaseFor(power) {
  const p = Math.min(5, Math.max(1, Math.floor(Number(power) || 1)));
  return 70 + 10 * p;
}

/** `chefe` ou `trilha`: 30% Trilha, 70% Chefe; o mistério 0 é SEMPRE chefe. Determinístico em (gid, k). */
export function kindDoMisterio(gid, k) {
  const n = Math.max(0, Math.floor(Number(k) || 0));
  if (n === 0) return 'boss';
  return hash32(`${gid}:${n}`) % 100 < TRAIL_PCT ? 'trail' : 'boss';
}

/** Espelho de `src/data/bossRoster.ts` (as ids e o PRIMEIRO elemento): Pages Functions não importam de `src/`. Travado por `feira.paridade.test.js`. */
export const BOSS_ROSTER = Object.freeze([
  ['cinderhorn', 'fervor'], ['thrummer', 'tempestade'], ['squallstride', 'trovao'], ['orbitant', 'peso_descomunal'],
  ['mycelar', 'miasma'], ['obsidarch', 'obsidiana'], ['bladeveil', 'lamina_viva'], ['sabrefin', 'lamina_oculta'],
  ['glimmerswarm', 'alento'], ['corallume', 'mare'], ['halorune', 'runa'], ['chorale', 'cristal'],
  ['drifela', 'nascente'], ['hollowmere', 'florescer'], ['astrawing', 'estratosfera'], ['nebulara', 'nebulosa'],
  ['voltbloom', 'sinapse'], ['graftfang', 'mutacao'], ['duskveil', 'crepusculo'], ['dawnloom', 'aurora'],
  ['aeonyx', 'eon'], ['tallyjack', 'ouro_vivo'], ['cuprex', 'aco'],
].map(([id, element]) => Object.freeze({ id, element })));
export const ARAUTO = Object.freeze({ id: 'arauto-do-fim', element: 'juizo_final' });

/**
 * O chefe do mistério k. O Arauto do Fim SÓ aparece como chefe final, a partir do nível 15: no nível 20 (o teto,
 * que se repete) é sempre ele; entre 15 e 19, 1 mistério em 4. Fora disso, sorteio determinístico no elenco comum.
 */
export function bossDoMisterio(gid, k) {
  const level = nivelDoMisterio(k);
  if (level >= ARAUTO_NIVEL_MIN && (level === NIVEL_MAX || hash32(`${gid}:${k}:arauto`) % 4 === 0)) return ARAUTO;
  return BOSS_ROSTER[hash32(`${gid}:${k}:boss`) % BOSS_ROSTER.length];
}

/** Soma de dias a um `YYYY-MM-DD`. */
const maisDias = (dia, n) => diaDeNum(numDia(dia) + n);

const lerJson = async (env, chave) => {
  const raw = await kvOrThrow(env).get(chave);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};
const diaValido = d => typeof d === 'string' && ISO_DIA.test(d);

function normalizarDone(r) {
  const n = Number.isInteger(r?.n) && r.n > 0 ? r.n : 0;
  return {
    n,
    bosses: Number.isInteger(r?.bosses) && r.bosses > 0 ? r.bosses : 0,
    trails: Number.isInteger(r?.trails) && r.trails > 0 ? r.trails : 0,
    lastDay: diaValido(r?.lastDay) ? r.lastDay : null,
    lastKind: r?.lastKind === 'boss' || r?.lastKind === 'trail' ? r.lastKind : null,
  };
}

function normalizarEvt(r) {
  if (!r || typeof r !== 'object' || !Number.isInteger(r.k) || r.k < 0 || !diaValido(r.spawnDay)) return null;
  const boss = r.kind !== 'trail';
  const nome = boss ? [ARAUTO, ...BOSS_ROSTER].find(b => b.id === r.bossId) : null;
  if (boss && !nome) return null;
  return {
    k: r.k, kind: boss ? 'boss' : 'trail', level: nivelDoMisterio(r.k),
    bossId: nome?.id ?? null, element: nome?.element ?? null,
    hp0: boss && Number.isFinite(r.hp0) && r.hp0 > 0 ? Math.floor(r.hp0) : 0,
    spawnDay: r.spawnDay,
  };
}

// ── o estado, derivado na leitura ───────────────────────────────────────────
/**
 * O estado do clã na Feira em `hoje`, RESOLVIDO NA LEITURA (nenhuma transição é agendada):
 *   'boss'  — chefe vivo; 'trail' — trilha aberta; 'rest' — dia de descanso (o último mistério acabou há pouco).
 * Escreve (idempotente, valores determinísticos) a foto do mistério, o fim dele e o contador `feiraDone`. USO INTERNO:
 * o retorno tem números por clã e NUNCA vai inteiro ao cliente (use `eventoDaFeira`).
 * @param {{ cartoes?: Record<string, any> | null, escrever?: boolean }} [opts]
 */
export async function lerEstadoFeira(env, g, hoje, opts = {}) {
  const { cartoes = null, escrever = true } = opts;
  const kvs = kvOrThrow(env);
  const cart = cartoes ?? await lerCartoes(env, g);
  let done = normalizarDone(await lerJson(env, feiraDoneKey(g.id)));
  for (let volta = 0; volta < 3; volta++) {
    let evt = normalizarEvt(await lerJson(env, feiraEvtKey(g.id)));
    if (evt && evt.k < done.n) evt = null; // foto de um mistério que já acabou
    if (!evt) {
      const spawnDay = done.n === 0 || !done.lastDay ? hoje : maisDias(done.lastDay, SPAWN_GAP_DIAS);
      if (hoje < spawnDay) return { phase: 'rest', k: done.n, level: nivelDoMisterio(done.n), spawnDay, done, lastDay: done.lastDay };
      const kind = kindDoMisterio(g.id, done.n);
      const chefe = kind === 'boss' ? bossDoMisterio(g.id, done.n) : null;
      const ativos = membrosAtivos(g, fiosDosCartoes(g, cart), spawnDay).length;
      const level = nivelDoMisterio(done.n);
      evt = { k: done.n, kind, level, bossId: chefe?.id ?? null, element: chefe?.element ?? null, hp0: kind === 'boss' ? bossHpFor(level, ativos) : 0, spawnDay };
      if (escrever) {
        await kvs.put(feiraEvtKey(g.id), JSON.stringify({ k: evt.k, kind: evt.kind, level, bossId: evt.bossId, hp0: evt.hp0, spawnDay }), { expirationTtl: FEIRA_TTL });
      }
    }
    // O fim do mistério é CONSTANTE: gravado uma vez, vale para sempre (saída de membro não reabre).
    let fim = await lerJson(env, feiraDeadKey(g.id, evt.k));
    let dmg = 0;
    let marks = 0;
    if (evt.kind === 'boss') {
      dmg = await danoDoChefe(env, g, evt.k);
      if (!fim && dmg >= evt.hp0) {
        fim = { day: hoje, level: evt.level, hp0: evt.hp0, kind: 'boss' };
        if (escrever) await kvs.put(feiraDeadKey(g.id, evt.k), JSON.stringify(fim), { expirationTtl: FEIRA_TTL });
      }
    } else {
      const trilhas = await Promise.all(g.members.map(m => lerJson(env, feiraTrailKey(g.id, evt.k, m))));
      const limpos = trilhas.map(t => (diaValido(t?.clearedDay) ? t.clearedDay : null)).filter(Boolean).sort();
      const teto = maisDias(evt.spawnDay, TRAIL_MAX_DAYS - 1);
      const fimDia = limpos.length ? (limpos[0] < teto ? limpos[0] : teto) : teto;
      marks = limpos.filter(d => d <= fimDia).length;
      if (!fim && hoje > fimDia) {
        fim = { day: fimDia, level: evt.level, hp0: 0, kind: 'trail', marks };
        if (escrever) await kvs.put(feiraDeadKey(g.id, evt.k), JSON.stringify(fim), { expirationTtl: FEIRA_TTL });
      }
      if (fim && Number.isInteger(fim.marks)) marks = fim.marks;
    }
    if (fim && diaValido(fim.day)) {
      // Avança o contador. Todo escritor parte do MESMO `done` anterior: o resultado é o mesmo (max).
      if (done.n <= evt.k) {
        done = { n: evt.k + 1, bosses: done.bosses + (evt.kind === 'boss' ? 1 : 0), trails: done.trails + (evt.kind === 'trail' ? 1 : 0), lastDay: fim.day, lastKind: evt.kind };
        if (escrever) await kvs.put(feiraDoneKey(g.id), JSON.stringify(done), { expirationTtl: FEIRA_TTL });
      }
      continue; // relê: pode ser descanso, ou já abrir o próximo
    }
    const hpPct = evt.kind === 'boss' ? pctDoChefe(evt.hp0, dmg) : null;
    return {
      phase: evt.kind, k: evt.k, kind: evt.kind, level: evt.level, bossId: evt.bossId, element: evt.element,
      hp0: evt.hp0, dmg, hpPct, spawnDay: evt.spawnDay, marks, done,
    };
  }
  return { phase: 'rest', k: done.n, level: nivelDoMisterio(done.n), spawnDay: null, done, lastDay: done.lastDay };
}

/** Quanto do chefe resta, em % inteira (1..100 enquanto vive; arredonda PARA CIMA: vivo nunca mostra 0). */
export function pctDoChefe(hp0, dmg) {
  if (!(hp0 > 0)) return 100;
  const resta = Math.max(0, hp0 - Math.max(0, dmg));
  return resta <= 0 ? 0 : Math.min(100, Math.max(1, Math.ceil((100 * resta) / hp0)));
}

/** Dano acumulado no chefe k: a soma das chaves pessoais dos membros ATUAIS + o legado de quem saiu. */
export async function danoDoChefe(env, g, k) {
  const hits = await Promise.all(g.members.map(m => lerFeiraHit(env, g.id, k, m)));
  const legado = g.feiraLegado && g.feiraLegado.k === k && Number.isFinite(g.feiraLegado.dmg) ? Math.max(0, Math.floor(g.feiraLegado.dmg)) : 0;
  return hits.reduce((s, h) => s + h.dmg, legado);
}

// ── o ataque ────────────────────────────────────────────────────────────────
/** Uma semente de 32 bits de `crypto` (o dano não é do cliente). */
export function sementeDoServidor() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

/** Quanto dano a repetição rende: soma das frações que o LADO 0 tirou do chefe na janela, e o registro para animar. */
function janela(side, nivel, seed) {
  const chefe = combatantAt(nivel, REFERENCE_BUILDS.balanced);
  const g = fightSteps(
    { combatant: side.combatant, special: side.special, dotResist: side.dotResist },
    { combatant: chefe, special: null, dotResist: 0 },
    {
      seed, hpScale: PVP_HP_SCALE, startHp: [1, HP_ENORME], startEnergy: [cleanStartEnergy(side.startEnergy), 0],
      hitScale: (who) => (who === 1 ? CHEFE_FORCA_NA_SIM : 1),
    },
  );
  let total = 0;
  const log = [];
  for (let r = g.next(); !r.done; r = g.next(1)) {
    const e = r.value;
    if (e.t > FIGHT_SECONDS) break;
    if (e.kind === 'ko') continue;
    if (e.side === 0 && (e.kind === 'attack' || e.kind === 'tick')) total += e.frac;
    if (log.length < LOG_MAX) log.push({ k: e.kind === 'attack' ? 'a' : e.kind === 'cast' ? 'c' : 't', t: Math.round(e.t * 100) / 100, s: e.side, f: Math.round(e.frac * 1e4) / 1e4 });
  }
  return { total, log };
}

/**
 * O ataque de UM jogador, PURO e determinístico na semente. O desempenho é a razão entre o que a ficha DELE rende na janela
 * e o que a ficha de referência (equilibrada, do mesmo level, mesma semente) rende — limitada a [0,7; 1,5] —, aplicada ao dano
 * base do estágio. Nunca passa de `ATAQUE_TETO`.
 * @param {{ combatant: any, special: any, dotResist?: number, startEnergy?: number }} side
 * @param {number} power `stagePower` 1..5
 */
export function simularAtaque(side, power, seed) {
  const nivel = side.combatant.level;
  const eu = janela(side, nivel, seed);
  const ref = janela({ combatant: combatantAt(nivel, REFERENCE_BUILDS.balanced), special: specialOf('direct'), dotResist: 0, startEnergy: 0 }, nivel, seed);
  const razao = ref.total > 0 ? eu.total / ref.total : 1;
  const desempenho = Math.min(DESEMPENHO_MAX, Math.max(DESEMPENHO_MIN, razao));
  const dmg = Math.min(ATAQUE_TETO, Math.max(1, Math.round(danoBaseFor(power) * desempenho)));
  return { dmg, desempenho, log: eu.log, seed: seed >>> 0 };
}

/** A ficha de luta de quem ataca: a do SAVE; sem save utilizável, um Solmon de level 1 (todo mundo pode bater). */
export async function fichaDoAtacante(env, save) {
  return (await loadDuelSide(env, save)) ?? duelSide({}, { maxLevel: 1 });
}

// ── o evento que a volta mostra (campo ADITIVO, só agregado) ────────────────
/**
 * O que sai para o cliente: o mistério do clã, sem nada por pessoa. `canAttack`/`trail.pending`/`gate` são do PRÓPRIO
 * jogador. Os números do clã são só a porcentagem do chefe e (trilha) a contagem agregada de marcas.
 */
export async function eventoDaFeira(env, g, save, hoje, estado) {
  if (estado.phase === 'rest') {
    const k = estado.done.n - 1;
    const claimable = k >= 0 ? await resgatavel(env, g.id, k, save) : false;
    return { k: estado.k, kind: 'rest', level: estado.level, rest: true, ...(claimable ? { claimable: true, claimK: k } : {}) };
  }
  if (estado.phase === 'boss') {
    const meu = await lerFeiraHit(env, g.id, estado.k, save);
    return {
      k: estado.k, kind: 'boss', level: estado.level, bossId: estado.bossId, element: estado.element,
      bossHpPct: estado.hpPct, canAttack: !meu.days.includes(hoje),
    };
  }
  const t = await lerJson(env, feiraTrailKey(g.id, estado.k, save));
  const cleared = diaValido(t?.clearedDay);
  return {
    k: estado.k, kind: 'trail', level: estado.level,
    trail: { pending: !cleared, cleared, marks: estado.marks },
    ...(cleared ? {} : { gate: 'locked' }),
  };
}

/** A vista segura (guildVista): estado e agregados do clã, nunca nada por pessoa. */
export function resumoDaFeira(estado) {
  if (estado.phase === 'rest') return { state: 'rest', level: estado.level };
  if (estado.phase === 'boss') return { state: 'boss', level: estado.level, bossId: estado.bossId, bossHpPct: estado.hpPct };
  return { state: 'trail', level: estado.level, marks: estado.marks };
}

async function resgatavel(env, gid, k, save) {
  const [fim, parte, recibo] = await Promise.all([lerJson(env, feiraDeadKey(gid, k)), lerJson(env, feiraPartKey(gid, k, save)), lerJson(env, feiraClaimKey(gid, k, save))]);
  return !!fim && fim.kind === 'boss' && !!parte && !recibo;
}

/** Marca a participação (chefe batido) e o ponteiro do direito ao resgate. */
export async function marcarFeira(env, gid, k, save, hoje) {
  const kvs = kvOrThrow(env);
  await Promise.all([
    kvs.put(feiraPartKey(gid, k, save), JSON.stringify({ day: hoje }), { expirationTtl: FEIRA_PESSOAL_TTL }),
    kvs.put(feiraRightKey(save), JSON.stringify({ gid, k }), { expirationTtl: FEIRA_PESSOAL_TTL }),
  ]);
}

/** Grava o golpe do dia (escrita SÓ na chave do próprio membro). */
export async function gravarGolpe(env, gid, k, save, antes, hoje, dmg) {
  await kvOrThrow(env).put(
    feiraHitKey(gid, k, save),
    JSON.stringify({ k, days: [...antes.days, hoje].slice(-4), dmg: antes.dmg + dmg }),
    { expirationTtl: FEIRA_PESSOAL_TTL },
  );
}

// ── o resgate do abate ──────────────────────────────────────────────────────
/** Recibo determinístico (o mesmo em qualquer aparelho): o cliente credita UMA vez por recibo. */
export async function reciboDaFeira(tipo, save, gid, k) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-feira-${tipo}|${save}|${gid}|${k}`)));
  return Array.from(h.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}

/** Essências do chefe (28/10/2026, REGISTRO §183): 5 + 1 a cada 5 níveis (5..9). Espelho de `essenceQtyOfBoss` (src/utils/essences.ts). */
export const essenceDoChefe = (L) => 5 + Math.floor(L / 5);

/** A recompensa do abate (plano §5): cosmético, Emblemas, Bits e seiva; nada pago, nenhuma odd. `essences` = [{id: elemento do chefe, n}] (vazio sem elemento). */
export function recompensaDoChefe(level, bossId, element, trofeuNovo) {
  const L = Math.min(NIVEL_MAX, Math.max(1, Math.floor(level)));
  return {
    emblems: Math.min(CHEFE_EMBLEMAS_TETO, 2 + Math.floor(L / 2)),
    bits: Math.min(CHEFE_BITS_TETO, 30 + 10 * L),
    sap: 10 * L,
    trophyId: trofeuNovo ? `trophy-boss-${bossId}` : null,
    essences: element ? [{ id: element, n: essenceDoChefe(L) }] : [],
    element: element ?? null,
  };
}

const guardaSeiva = async (env, gid, save, n) => {
  let total = 0;
  for (let resto = n; resto > 0; resto -= CASA_PTS_FONTE_DIA_MAX) total += await somarPontos(env, gid, save, 'missao', Math.min(resto, CASA_PTS_FONTE_DIA_MAX));
  return total;
};

/**
 * Resgata o abate do chefe `k` (ou o mais recente resgatável): idempotente por `feiraClaim`, exige `feiraPart`.
 * @returns {Promise<{ ok: true, claimed: any } | { ok: false, reason: 'nothing' } | { ok: false, reason: 'claimed', claimed: any }>}
 */
export async function resgatarChefe(env, g, save, pedidoK) {
  const kvs = kvOrThrow(env);
  const done = normalizarDone(g ? await lerJson(env, feiraDoneKey(g.id)) : null);
  const direito = await lerJson(env, feiraRightKey(save));
  /** @type {Array<{ gid: string, k: number }>} */
  const candidatos = [];
  if (g) for (let k = done.n - 1; k >= Math.max(0, done.n - 3); k--) candidatos.push({ gid: g.id, k });
  if (direito && typeof direito.gid === 'string' && Number.isInteger(direito.k) && !candidatos.some(c => c.gid === direito.gid && c.k === direito.k)) candidatos.push({ gid: direito.gid, k: direito.k });
  let jaResgatado = null;
  for (const c of candidatos) {
    if (pedidoK !== undefined && c.k !== pedidoK) continue;
    const [fim, parte, recibo] = await Promise.all([lerJson(env, feiraDeadKey(c.gid, c.k)), lerJson(env, feiraPartKey(c.gid, c.k, save)), lerJson(env, feiraClaimKey(c.gid, c.k, save))]);
    if (!fim || fim.kind !== 'boss' || !parte) continue;
    const evt = normalizarEvt(await lerJson(env, feiraEvtKey(c.gid)));
    // O chefe do mistério c.k: se a foto já foi trocada pelo próximo, recalcula (determinístico).
    const chefe = evt && evt.k === c.k ? { id: evt.bossId, element: evt.element } : bossDoMisterio(c.gid, c.k);
    const level = Number.isInteger(fim.level) ? fim.level : nivelDoMisterio(c.k);
    const recibo2 = await reciboDaFeira('chefe', save, c.gid, c.k);
    if (recibo) {
      jaResgatado ??= { k: c.k, level, bossId: chefe.id, receipt: recibo2, reward: recibo.reward ?? recompensaDoChefe(level, chefe.id, chefe.element, false) };
      continue;
    }
    // Dois aparelhos ao mesmo tempo (o KV não tem CAS): cada um grava um selo e relê; só quem encontra o PRÓPRIO resgatou.
    const selo = crypto.randomUUID();
    const trofeus = await lerConjunto(env, feiraTrofeusKey(save));
    const reward = recompensaDoChefe(level, chefe.id, chefe.element, !trofeus.includes(chefe.id));
    await kvs.put(feiraClaimKey(c.gid, c.k, save), JSON.stringify({ at: Date.now(), selo, reward }), { expirationTtl: FEIRA_PESSOAL_TTL });
    const gravado = await lerJson(env, feiraClaimKey(c.gid, c.k, save));
    if (gravado?.selo !== selo) return { ok: false, reason: 'claimed', claimed: { k: c.k, level, bossId: chefe.id, receipt: recibo2, reward: gravado?.reward ?? reward } };
    if (reward.trophyId) await unirConjunto(env, feiraTrofeusKey(save), [chefe.id]);
    // A seiva só entra na casa do clã ATUAL (quem saiu colhe o resto, mas não rega a casa de quem ficou).
    if (g && g.id === c.gid) await guardaSeiva(env, g.id, save, reward.sap);
    return { ok: true, claimed: { k: c.k, level, bossId: chefe.id, receipt: recibo2, reward } };
  }
  return jaResgatado ? { ok: false, reason: 'claimed', claimed: jaResgatado } : { ok: false, reason: 'nothing' };
}

// ===========================================================================
// A TRILHA (o Desafio): puzzles deterministas SEMEADOS PELO SERVIDOR. O servidor entrega a instância e RECONFERE a solução
// regerando-a da semente guardada (nunca confia no que o cliente diz da instância). Os geradores de Zip e Colcha espelham
// `src/utils/mente/{zip,patches}.ts` (mesmo rng ⇒ mesma instância; paridade em `feira.paridade.test.js`).
// ===========================================================================
export const TRAIL_GAMES = Object.freeze(['picross', 'zip', 'patches', 'troca', 'eco']);
/** Tempo mínimo plausível entre `start` e `done` (ms), por jogo — mais rápido que isso não é gente. */
export const TRAIL_MIN_MS = Object.freeze({ picross: 8000, zip: 4000, patches: 4000, troca: 10000, eco: 6000 });
export const TRAIL_PUZZLE_SIZE = 5;
export const TROCA_CARTAS = 30;
export const TROCA_PAR = 24;
/** Jogo de reflexo/memória: cumprir = atingir um alvo MODESTO (nunca ranking). */
export const REFLEXO_PAR = Object.freeze({ eco: 5 });

/** Mesmo RNG de `src/utils/mente/eco.ts › seededRng`. */
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** O jogo do desafio do dia da PESSOA: `hash(save:dia:k) % lista`. */
export const jogoDaTrilha = (save, dia, k) => TRAIL_GAMES[hash32(`${save}:${dia}:${k}`) % TRAIL_GAMES.length];

// Zip (espelho de `zip.ts`)
function vizinhos(cell, size) {
  const r = Math.floor(cell / size), c = cell % size, out = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}
function serpentina(size, rng) {
  const flip = rng() < 0.5, transpose = rng() < 0.5, path = [];
  for (let r = 0; r < size; r++) {
    for (let k = 0; k < size; k++) {
      const c = r % 2 === 0 ? k : size - 1 - k;
      const rr = flip ? size - 1 - r : r;
      path.push(transpose ? c * size + rr : rr * size + c);
    }
  }
  return path;
}
function caminhoAleatorio(size, rng) {
  const total = size * size;
  let start = Math.floor(rng() * total);
  if (size % 2 === 1) {
    const evens = [];
    for (let i = 0; i < total; i++) if ((Math.floor(i / size) + (i % size)) % 2 === 0) evens.push(i);
    start = evens[Math.floor(rng() * evens.length)];
  }
  const visited = new Array(total).fill(false), path = [];
  let budget = 20000;
  const free = c => vizinhos(c, size).filter(n => !visited[n]).length;
  const dfs = (cell) => {
    if (budget-- <= 0) return false;
    visited[cell] = true; path.push(cell);
    if (path.length === total) return true;
    const next = vizinhos(cell, size).filter(n => !visited[n]).map(n => ({ n, f: free(n), j: rng() })).sort((a, b) => a.f - b.f || a.j - b.j);
    for (const { n } of next) if (dfs(n)) return true;
    visited[cell] = false; path.pop();
    return false;
  };
  return dfs(start) ? path : serpentina(size, rng);
}
export function gerarZip(size, rng) {
  const n = Math.min(8, Math.max(4, Math.floor(size)));
  const path = caminhoAleatorio(n, rng), total = path.length;
  const k = Math.min(n + 2, Math.max(3, Math.floor(n * 1.2)));
  const positions = new Set([0, total - 1]);
  for (let i = 1; i < k - 1; i++) {
    const center = (i * (total - 1)) / (k - 1);
    const jitter = Math.round((rng() - 0.5) * (total / (k - 1)) * 0.5);
    positions.add(Math.min(total - 2, Math.max(1, Math.round(center) + jitter)));
  }
  return { size: n, numbers: [...positions].sort((a, b) => a - b).map(p => path[p]), solution: path };
}
export function validarZip(p, path) {
  const total = p.size * p.size;
  if (!Array.isArray(path) || path.length !== total) return false;
  const seen = new Set();
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (!Number.isInteger(c) || c < 0 || c >= total || seen.has(c)) return false;
    seen.add(c);
    if (i > 0 && !vizinhos(path[i - 1], p.size).includes(c)) return false;
  }
  let last = -1;
  for (const cell of p.numbers) { const idx = path.indexOf(cell); if (idx <= last) return false; last = idx; }
  return path[0] === p.numbers[0] && path[total - 1] === p.numbers[p.numbers.length - 1];
}

// Colcha (espelho de `patches.ts`)
const formaDe = rc => (rc.h === rc.w ? 'square' : rc.h > rc.w ? 'tall' : 'wide');
function particionar(size, rng) {
  const target = Math.max(4, Math.round((size * size) / (3 + rng() * 1.5)));
  const rects = [{ r: 0, c: 0, h: size, w: size }];
  let guard = 400;
  while (rects.length < target && guard-- > 0) {
    const cuttable = rects.map((x, i) => ({ x, i })).filter(({ x }) => x.h > 1 || x.w > 1);
    if (cuttable.length === 0) break;
    const total = cuttable.reduce((s, { x }) => s + x.h * x.w, 0);
    let pick = rng() * total;
    let chosen = cuttable[0];
    for (const cand of cuttable) { pick -= cand.x.h * cand.x.w; if (pick <= 0) { chosen = cand; break; } }
    const { x, i } = chosen;
    const vertical = x.w > 1 && (x.h === 1 || rng() < (x.w >= x.h ? 0.65 : 0.35));
    if (vertical) {
      const at = 1 + Math.floor(rng() * (x.w - 1));
      rects.splice(i, 1, { ...x, w: at }, { ...x, c: x.c + at, w: x.w - at });
    } else {
      const at = 1 + Math.floor(rng() * (x.h - 1));
      rects.splice(i, 1, { ...x, h: at }, { ...x, r: x.r + at, h: x.h - at });
    }
  }
  return rects;
}
export function gerarColcha(size, rng) {
  const n = Math.min(8, Math.max(4, Math.floor(size)));
  const solution = particionar(n, rng);
  const clues = solution.map(rc => {
    const cell = (rc.r + Math.floor(rng() * rc.h)) * n + rc.c + Math.floor(rng() * rc.w);
    const showShape = rc.h * rc.w > 1 && rng() < 0.45;
    return { cell, area: rc.h * rc.w, shape: showShape ? formaDe(rc) : 'any' };
  });
  clues.sort((a, b) => a.cell - b.cell);
  return { size: n, clues, solution };
}
export function validarColcha(p, rects) {
  const { size, clues } = p;
  if (!Array.isArray(rects) || rects.length > size * size) return false;
  const owner = new Array(size * size).fill(-1);
  for (let i = 0; i < rects.length; i++) {
    const rc = rects[i];
    if (!rc || ![rc.r, rc.c, rc.h, rc.w].every(Number.isInteger)) return false;
    if (rc.h < 1 || rc.w < 1 || rc.r < 0 || rc.c < 0 || rc.r + rc.h > size || rc.c + rc.w > size) return false;
    for (let r = rc.r; r < rc.r + rc.h; r++) for (let c = rc.c; c < rc.c + rc.w; c++) {
      if (owner[r * size + c] !== -1) return false;
      owner[r * size + c] = i;
    }
  }
  if (owner.some(o => o === -1)) return false;
  const porRect = new Array(rects.length).fill(0);
  for (const cl of clues) {
    const i = owner[cl.cell];
    if (i < 0) return false;
    porRect[i]++;
    const rc = rects[i];
    if (rc.h * rc.w !== cl.area) return false;
    if (cl.shape !== 'any' && formaDe(rc) !== cl.shape) return false;
  }
  return porRect.every(n => n === 1);
}

// Picross (grade sorteada pela semente; QUALQUER grade que bata as pistas vale, como no jogo do cliente)
const pistaDaLinha = (linha) => {
  const out = []; let run = 0;
  for (const v of linha) { if (v) run++; else if (run > 0) { out.push(run); run = 0; } }
  if (run > 0) out.push(run);
  return out;
};
const pistasDe = (grade) => ({
  rows: grade.map(pistaDaLinha),
  cols: grade[0].map((_, c) => pistaDaLinha(grade.map(r => r[c]))),
});
export function gerarPicross(size, rng) {
  const grade = Array.from({ length: size }, () => Array.from({ length: size }, () => rng() < 0.55));
  for (let r = 0; r < size; r++) if (!grade[r].some(Boolean)) grade[r][Math.floor(rng() * size)] = true;
  for (let c = 0; c < size; c++) if (!grade.some(r => r[c])) grade[Math.floor(rng() * size)][c] = true;
  return { size, ...pistasDe(grade), solution: grade };
}
export function validarPicross(p, celulas) {
  if (!Array.isArray(celulas) || celulas.length !== p.size || celulas.some(r => !Array.isArray(r) || r.length !== p.size)) return false;
  const mine = pistasDe(celulas.map(r => r.map(v => v === 1 || v === true)));
  const igual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  return mine.rows.every((r, i) => igual(r, p.rows[i])) && mine.cols.every((c, i) => igual(c, p.cols[i]));
}

// Troca de regra (baralho + regra por carta, ambos da semente; o cliente só responde esquerda/direita)
export function gerarTroca(rng) {
  const deck = [];
  let regra = 'forma', ate = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < TROCA_CARTAS; i++) {
    if (i === ate) { regra = regra === 'forma' ? 'lugar' : 'forma'; ate = i + 5 + Math.floor(rng() * 4); }
    deck.push({ forma: rng() < 0.5 ? 'young' : 'grown', lugar: rng() < 0.5 ? 'sky' : 'cave', rule: regra, art: Math.floor(rng() * 256) });
  }
  return { deck };
}
const ladoCerto = (c) => ((c.rule === 'forma' ? c.forma === 'young' : c.lugar === 'sky') ? 'left' : 'right');
export function validarTroca(p, respostas) {
  if (!Array.isArray(respostas) || respostas.length !== p.deck.length) return false;
  return respostas.filter((s, i) => s === ladoCerto(p.deck[i])).length >= TROCA_PAR;
}

/** A instância COMPLETA de um jogo e uma semente (com `solution`, que NUNCA sai do servidor).
 * @returns {any} */
export function gerarInstancia(game, seed) {
  const rng = seededRng(seed);
  if (game === 'zip') return gerarZip(TRAIL_PUZZLE_SIZE, rng);
  if (game === 'patches') return gerarColcha(TRAIL_PUZZLE_SIZE, rng);
  if (game === 'picross') return gerarPicross(TRAIL_PUZZLE_SIZE, rng);
  if (game === 'troca') return gerarTroca(rng);
  return { par: REFLEXO_PAR.eco };
}

/** A instância PÚBLICA (o que vai ao cliente): sem a solução. */
export function instanciaDaTrilha(game, seed) {
  const { solution: _solucao, ...publica } = gerarInstancia(game, seed);
  return publica;
}

/** O corpo de uma resposta CORRETA (para teste e para o simulador de calibração; o servidor nunca a entrega). */
export function solucaoDaTrilha(game, seed) {
  const p = gerarInstancia(game, seed);
  if (game === 'zip') return { path: p.solution };
  if (game === 'patches') return { rects: p.solution };
  if (game === 'picross') return { cells: p.solution.map(r => r.map(v => (v ? 1 : 0))) };
  if (game === 'troca') return { sides: p.deck.map(ladoCerto) };
  return { score: REFLEXO_PAR.eco };
}

/** Confere a resposta do cliente contra a instância REGERADA da semente guardada. */
export function conferirTrilha(game, seed, corpo) {
  const p = instanciaDaTrilha(game, seed);
  if (game === 'zip') return validarZip(p, corpo?.path);
  if (game === 'patches') return validarColcha(p, corpo?.rects);
  if (game === 'picross') return validarPicross(p, corpo?.cells);
  if (game === 'troca') return validarTroca(p, corpo?.sides);
  const score = typeof corpo?.score === 'number' && Number.isFinite(corpo.score) ? Math.floor(corpo.score) : null;
  return score !== null && scoreIsPlausible(game, score) && score >= REFLEXO_PAR[game];
}

/**
 * Abre (ou reabre, com a MESMA semente do dia) o desafio da pessoa.
 * @returns {Promise<{ ok: true, trail: any } | { ok: false, reason: 'no-trail' | 'already-cleared' }>}
 */
export async function iniciarTrilha(env, g, save, hoje, estado) {
  if (estado.phase !== 'trail') return { ok: false, reason: 'no-trail' };
  const atual = await lerJson(env, feiraTrailKey(g.id, estado.k, save));
  if (diaValido(atual?.clearedDay)) return { ok: false, reason: 'already-cleared' };
  const mesmoDia = atual && atual.day === hoje && TRAIL_GAMES.includes(atual.game) && Number.isInteger(atual.seed);
  const reg = mesmoDia ? atual : { k: estado.k, day: hoje, game: jogoDaTrilha(save, hoje, estado.k), seed: sementeDoServidor(), startedAt: Date.now(), attempts: 0, clearedDay: null };
  if (!mesmoDia) await kvOrThrow(env).put(feiraTrailKey(g.id, estado.k, save), JSON.stringify(reg), { expirationTtl: FEIRA_TRILHA_TTL });
  return { ok: true, trail: { k: estado.k, game: reg.game, seed: reg.seed >>> 0, puzzle: instanciaDaTrilha(reg.game, reg.seed) } };
}

/**
 * Entrega do desafio. Cumprir: marca o `clearedDay` da PESSOA, abre a porta dela e rega a Casa (seiva); não mexe na vida do chefe.
 * @returns {Promise<{ ok: true, reward: any, receipt: string } | { ok: false, reason: 'no-trail' | 'no-start' | 'limit' | 'too-fast' | 'wrong' | 'already-cleared', receipt?: string }>}
 */
export async function entregarTrilha(env, g, save, hoje, estado, corpo) {
  if (estado.phase !== 'trail') return { ok: false, reason: 'no-trail' };
  const kvs = kvOrThrow(env);
  const reg = await lerJson(env, feiraTrailKey(g.id, estado.k, save));
  const receipt = await reciboDaFeira('trilha', save, g.id, estado.k);
  if (diaValido(reg?.clearedDay)) return { ok: false, reason: 'already-cleared', receipt };
  if (!reg || reg.day !== hoje || !TRAIL_GAMES.includes(reg.game) || !Number.isInteger(reg.seed)) return { ok: false, reason: 'no-start' };
  if ((reg.attempts ?? 0) >= TRILHA_TENTATIVAS_DIA) return { ok: false, reason: 'limit' };
  const tentativas = (Number.isInteger(reg.attempts) ? reg.attempts : 0) + 1;
  if (Date.now() - (Number(reg.startedAt) || 0) < TRAIL_MIN_MS[reg.game]) {
    await kvs.put(feiraTrailKey(g.id, estado.k, save), JSON.stringify({ ...reg, attempts: tentativas }), { expirationTtl: FEIRA_TRILHA_TTL });
    return { ok: false, reason: 'too-fast' };
  }
  if (!conferirTrilha(reg.game, reg.seed, corpo)) {
    await kvs.put(feiraTrailKey(g.id, estado.k, save), JSON.stringify({ ...reg, attempts: tentativas }), { expirationTtl: FEIRA_TRILHA_TTL });
    return { ok: false, reason: 'wrong' };
  }
  await kvs.put(feiraTrailKey(g.id, estado.k, save), JSON.stringify({ ...reg, attempts: tentativas, clearedDay: hoje }), { expirationTtl: FEIRA_TRILHA_TTL });
  await kvs.put(feiraGateKey(save), JSON.stringify({ k: estado.k, day: hoje, open: true }), { expirationTtl: FEIRA_TRILHA_TTL });
  await somarPontos(env, g.id, save, 'missao', TRILHA_SEIVA);
  return { ok: true, receipt, reward: { emblems: TRILHA_EMBLEMAS, sap: TRILHA_SEIVA } };
}

