/**
 * BOSS do Elemental Fusion — a regra PURA (pedido do dono, 03/11/2026).
 *
 * Toda partida NORMAL do Fusion (PvE ou PvP; nunca o modo desafio do Calabouço) tem `BOSS_CHANCE` (3%) de virar BOSS, decidido na
 * largada pela SEMENTE da partida (determinístico, testável). O boss é UM inimigo com o HP do jogador e 3 regras sorteadas do pool
 * (`BOSS_RULES`), com dois pares que nunca saem juntos (1×2 e 4×5). Vencer dá +1 Fragmento de Boss (`utils/bossShards.ts`); a partida
 * não vale ranking nem Bits/recorde.
 *
 * As regras de TABULEIRO (4, 6, 7, 12) viram `BoardRules` (`utils/match3.ts`); a 10 é `petrify`; as de DANO (1, 2, 3, 8, 9) viram o
 * multiplicador por peça de `bossTurn`; a 5 é `noExtra` em `playTurn`; a 11 é o relógio (`clockTick`). Nada aqui usa `Math.random`.
 */
import { M3_COLS, M3_KINDS, M3_ROWS, cloneBoard, type Board, type BoardRules, type Rng, type Step } from './match3';
import { mulberry32 } from './combate/rng';
import { pickEnemy } from './enemyRoster';
import { rosterEntryElement } from './spriteElement';
import { M3C_MAX_TURNS, M3C_PLAYER_HP, enemyPhase, type M3Combat, type M3DamageMult, type M3Exchange, type M3TurnOpts } from './match3Combat';

export const BOSS_CHANCE = 0.03;

export type BossRuleId =
  | 'same-element' | 'inverse' | 'diverse-chain' | 'cross' | 'no-extra' | 'neighbor-specials'
  | 'soul-quartz' | 'rising-cascade' | 'elemental-tide' | 'corrupted-stones' | 'short-clock' | 'inverted-gravity';

export interface BossRuleInfo { id: BossRuleId; pt: { name: string; line: string }; en: { name: string; line: string } }

/** O pool, na ordem do pedido do dono (1..12). */
export const BOSS_RULES: readonly BossRuleInfo[] = [
  { id: 'same-element', pt: { name: 'Mesmo elemento em sequência', line: 'Repetir o elemento do seu golpe anterior aumenta o dano, acumulando até +100%.' }, en: { name: 'Same element streak', line: 'Repeating your previous strike’s element raises damage, stacking up to +100%.' } },
  { id: 'inverse', pt: { name: 'Inverso', line: 'Repetir o elemento do golpe anterior corta o dano pela metade.' }, en: { name: 'Inverse', line: 'Repeating your previous strike’s element halves the damage.' } },
  { id: 'diverse-chain', pt: { name: 'Sequência de diferentes', line: 'Cada elemento novo na sequência dá +20% de dano; repetir um já usado zera o bônus.' }, en: { name: 'Diverse chain', line: 'Each new element in the chain adds +20% damage; repeating one resets the bonus.' } },
  { id: 'cross', pt: { name: 'Cruz', line: 'Linha de 3 na horizontal e na vertical ao mesmo tempo vale como 4: cria a peça especial e dá outra jogada.' }, en: { name: 'Cross', line: 'A line of 3 across and down at once counts as 4: it makes the special tile and gives another move.' } },
  { id: 'no-extra', pt: { name: 'Especial sem segundo turno', line: 'Criar uma peça especial não dá mais a jogada extra.' }, en: { name: 'No extra turn', line: 'Making a special tile no longer gives an extra move.' } },
  { id: 'neighbor-specials', pt: { name: 'Especiais vizinhos', line: 'Duas peças especiais encostadas explodem juntas, com área maior, sem precisar trocá-las.' }, en: { name: 'Neighbouring specials', line: 'Two special tiles side by side blow up together, wider, without swapping them.' } },
  { id: 'soul-quartz', pt: { name: 'Quartzo da alma', line: 'Às vezes nasce um cristal coringa: combina com qualquer elemento e explode a área 3×3 em volta.' }, en: { name: 'Soul quartz', line: 'Sometimes a wildcard crystal appears: it matches any element and blasts the 3×3 area around it.' } },
  { id: 'rising-cascade', pt: { name: 'Cascata crescente', line: 'Cada cascata no mesmo turno soma +25% de dano.' }, en: { name: 'Rising cascade', line: 'Each cascade in the same turn adds +25% damage.' } },
  { id: 'elemental-tide', pt: { name: 'Maré elemental', line: 'A cada 3 turnos um elemento vira o da maré e causa o dobro de dano.' }, en: { name: 'Elemental tide', line: 'Every 3 turns one element becomes the tide and deals double damage.' } },
  { id: 'corrupted-stones', pt: { name: 'Pedras corrompidas', line: 'O boss petrifica 3 peças por turno; a pedra só quebra com uma linha ao lado dela.' }, en: { name: 'Corrupted stones', line: 'The boss petrifies 3 tiles per turn; a stone only breaks when a line clears next to it.' } },
  { id: 'short-clock', pt: { name: 'Relógio curto', line: '15 segundos por jogada; se o tempo acabar, você perde a vez.' }, en: { name: 'Short clock', line: '15 seconds per move; if time runs out, you lose your turn.' } },
  { id: 'inverted-gravity', pt: { name: 'Gravidade invertida', line: 'As peças novas sobem de baixo para cima.' }, en: { name: 'Inverted gravity', line: 'New tiles rise from the bottom up.' } },
];

/** Pares que nunca saem juntos. */
const EXCLUSIVE: ReadonlyArray<readonly [BossRuleId, BossRuleId]> = [['same-element', 'inverse'], ['cross', 'no-extra']];

const bossRng = (seed: number, salt: number): Rng => mulberry32(((seed | 0) ^ salt) | 0);

/** A partida desta semente é BOSS? (3%, só pela semente.) */
export function isBossMatch(seed: number): boolean {
  return bossRng(seed, 0xb055)() < BOSS_CHANCE;
}

/** As 3 regras desta semente: embaralha o pool e pega na ordem, pulando quem conflita com uma já escolhida. */
export function drawBossRules(seed: number, n = 3): BossRuleId[] {
  const rng = bossRng(seed, 0x2a1e5);
  const pool = BOSS_RULES.map(r => r.id);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out: BossRuleId[] = [];
  for (const id of pool) {
    if (out.length >= n) break;
    if (EXCLUSIVE.some(([a, b]) => (id === a && out.includes(b)) || (id === b && out.includes(a)))) continue;
    out.push(id);
  }
  return out;
}

export const bossRuleInfo = (id: BossRuleId): BossRuleInfo => BOSS_RULES.find(r => r.id === id)!;

/** Chance de cada peça nova nascer Quartzo da alma (regra 7). */
export const BOSS_WILD_CHANCE = 0.04;
/** Regras de tabuleiro do conjunto sorteado. */
export function bossBoardRules(rules: readonly BossRuleId[]): BoardRules {
  return {
    ...(rules.includes('cross') ? { cross: true } : {}),
    ...(rules.includes('neighbor-specials') ? { neighborSpecials: true } : {}),
    ...(rules.includes('soul-quartz') ? { wildChance: BOSS_WILD_CHANCE } : {}),
    ...(rules.includes('inverted-gravity') ? { invertGravity: true } : {}),
  };
}

/** O combate do BOSS: UM inimigo com o HP do jogador, um roster de estágio final (level alto = a arte mais imponente). */
export const BOSS_ROSTER_LEVEL = 99;
export function newBossCombat(rng: Rng, playerHp: number = M3C_PLAYER_HP, playerElement?: string): M3Combat {
  const r = pickEnemy(BOSS_ROSTER_LEVEL, rng, { stage: 'ultimate' });
  return {
    player: { hp: playerHp, max: playerHp },
    enemies: [{ hp: playerHp, max: playerHp, element: rosterEntryElement(r), roster: r.key }],
    ...(playerElement ? { playerElement } : {}), active: 0, log: [], dealt: 0, taken: 0, defeated: 0, turns: 0, outcome: 'playing',
  };
}

// ── as regras de dano (1, 2, 3, 8, 9) ───────────────────────────────────────────────────────────────────────────────

/** O que as regras de dano lembram entre jogadas. */
export interface BossTrack { last?: number; streak: number; chain: number[] }
export const newBossTrack = (): BossTrack => ({ streak: 0, chain: [] });

export const BOSS_SAME_STEP = 0.25;
export const BOSS_SAME_CAP = 4;
export const BOSS_INVERSE_MULT = 0.5;
export const BOSS_DIVERSE_STEP = 0.2;
export const BOSS_CASCADE_STEP = 0.25;
export const BOSS_TIDE_MULT = 2;
export const BOSS_TIDE_EVERY = 3;

/** O elemento do golpe: o tipo com mais peças no 1º passo (empate = o menor `k`); sem passo = `undefined`. */
export function attackKind(steps: readonly Step[]): number | undefined {
  const st = steps.find(s => s.chain === 1) ?? steps[0];
  if (!st || st.kinds.length === 0) return undefined;
  const n = new Map<number, number>();
  for (const k of st.kinds) n.set(k, (n.get(k) ?? 0) + 1);
  let best: number | undefined;
  for (const [k, v] of [...n.entries()].sort((a, b) => a[0] - b[0])) if (best === undefined || v > n.get(best)!) best = k;
  return best;
}

/** O elemento da maré (regra 9) no turno `turns`: muda a cada `BOSS_TIDE_EVERY` turnos, pela semente. */
export function tideKind(seed: number, turns: number): number {
  const block = Math.floor(Math.max(0, turns) / BOSS_TIDE_EVERY);
  return Math.floor(bossRng(seed, 0x71de + block * 7919)() * M3_KINDS) % M3_KINDS;
}

/**
 * Uma jogada do jogador sob as regras do boss: devolve o multiplicador por peça (`mult(k, chain)`) e o rastro novo.
 * 1 · mesmo elemento do golpe anterior: +25% por repetição seguida, até +100%. 2 · repetir: ×0,5.
 * 3 · elemento fora da sequência atual: +20% por elemento na sequência; repetir zera (a sequência recomeça nele).
 * 8 · cascata: +25% por passo depois do 1º. 9 · peça da maré: ×2.
 */
export function bossTurn(rules: readonly BossRuleId[], track: BossTrack, steps: readonly Step[], turns: number, seed: number): { mult: M3DamageMult; track: BossTrack } {
  const el = attackKind(steps);
  let base = 1;
  let next: BossTrack = { last: track.last, streak: track.streak, chain: [...track.chain] };
  if (el !== undefined) {
    const repeat = track.last === el;
    next.streak = repeat ? track.streak + 1 : 0;
    if (rules.includes('same-element')) base *= 1 + BOSS_SAME_STEP * Math.min(next.streak, BOSS_SAME_CAP);
    if (rules.includes('inverse') && repeat) base *= BOSS_INVERSE_MULT;
    if (rules.includes('diverse-chain')) {
      if (next.chain.includes(el)) next.chain = [el];
      else next.chain.push(el);
      base *= 1 + BOSS_DIVERSE_STEP * (next.chain.length - 1);
    }
    next = { ...next, last: el };
  }
  const tide = rules.includes('elemental-tide') ? tideKind(seed, turns) : -1;
  const cascade = rules.includes('rising-cascade');
  const mult: M3DamageMult = (k, chain) => base * (cascade ? 1 + BOSS_CASCADE_STEP * (Math.max(1, chain) - 1) : 1) * (k === tide ? BOSS_TIDE_MULT : 1);
  return { mult, track: next };
}

/** As opções de `playTurn` para esta jogada do boss. */
export function bossTurnOpts(rules: readonly BossRuleId[], mult: M3DamageMult): M3TurnOpts {
  return { mult, rules: bossBoardRules(rules), noExtra: rules.includes('no-extra') };
}

// ── regra 10: pedras ────────────────────────────────────────────────────────────────────────────────────────────────

export const BOSS_STONES_PER_TURN = 3;
/** Petrifica `n` peças comuns (sem especial, coringa nem pedra), sorteadas pelo `rng`. Devolve um tabuleiro NOVO. */
export function petrify(board: Board, rng: Rng, n = BOSS_STONES_PER_TURN): Board {
  const b = cloneBoard(board);
  const livres: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < M3_ROWS; r++) for (let c = 0; c < M3_COLS; c++) { const t = b[r][c]; if (t && !t.sp && !t.wild && !t.stone) livres.push({ r, c }); }
  for (let i = 0; i < n && livres.length > 0; i++) {
    const p = livres.splice(Math.min(livres.length - 1, Math.floor(rng() * livres.length)), 1)[0];
    b[p.r][p.c] = { ...b[p.r][p.c]!, stone: true };
  }
  return b;
}

// ── regra 11: relógio ───────────────────────────────────────────────────────────────────────────────────────────────

export const BOSS_CLOCK_MS = 15000;
/** Desconta `dt` ms do relógio; com a aba escondida o relógio PARA. Devolve o que sobra (nunca < 0). */
export function clockTick(left: number, dt: number, hidden: boolean): number {
  if (hidden || !(dt > 0)) return left;
  return Math.max(0, left - dt);
}

/** O tempo acabou (regra 11): o jogador PERDE a vez — conta o turno e o boss joga, sem golpe do jogador. */
export function passTurn(state: M3Combat, board: Board, boardRng: Rng, rules: BoardRules = {}): M3Exchange {
  if (state.outcome !== 'playing') return { state, board, extra: false, enemyMoves: [] };
  const ph = enemyPhase({ ...state, turns: state.turns + 1 }, board, boardRng, rules);
  const s = ph.state.outcome === 'playing' && ph.state.turns >= M3C_MAX_TURNS ? { ...ph.state, outcome: 'loss' as const } : ph.state;
  return { state: s, board: ph.board, extra: false, enemyMoves: ph.moves };
}
