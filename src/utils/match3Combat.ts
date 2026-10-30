/**
 * ELEMENTAL FUSION COMO COMBATE — a regra PURA (pedido do dono, 18/10/2026, stories D-03…D-07).
 *
 * Combinar peças de um elemento causa dano DAQUELE elemento ao inimigo ATIVO. São três Soulmon inimigos, em fila (1→3), que contam como
 * UM time: o dano só atinge o ativo; a sobra de um golpe que o derruba é descartada; zerou o HP, o próximo assume; os três derrotados = vitória.
 * Depois de cada jogada VÁLIDA do jogador (troca válida, pontue ou não) o inimigo ativo MEXE as peças (uma troca, D-83) e os combos dele tiram HP do Soulmon do jogador;
 * HP 0 = a rodada acaba (sem custo nenhum: perder não cobra coração, Bit nem nada — só rende menos).
 *
 * O placar sai do combate e SÓ dele: `dano causado − dano recebido + bônus por inimigo derrotado`, nunca abaixo de 0. É o único número que
 * vira Bits (`match3Bits(placar)`, mesmo teto `M3_MAX_BITS` de antes — o combate nunca paga mais que a regra dos pontos pagava; régua em
 * `utils/mente/balanco.test.ts`).
 *
 * Tudo determinístico: o rng do tabuleiro vem por PARÂMETRO (`mulberry32` de `combate/rng`) — nunca `Math.random`.
 * O estado é imutável: cada função devolve um estado novo.
 */
import { chainMultiplier, match3Bits, trySwap, validMoves, M3_TILE_ELEMENTS, type Board, type Pos, type Rng, type Step } from './match3';
import { mulberry32 } from './combate/rng';
import { pickEnemy } from './enemyRoster';
import { LINE_ELEMENT, rosterEntryElement } from './spriteElement';
import { elementAdvantage } from './arena';
import { elementHits } from './combate/curve';
import { baseDominanteDoElemento } from './soulProfile/ficha/elementoNome';

/** Id de elemento (ícone). No Normal são os 6 de `M3_TILE_ELEMENTS`; no PVP, 6 sorteados do pool inteiro (`match3Pvp.ts`). */
export type M3Element = string;

/** HP do Soulmon do jogador. */
export const M3C_PLAYER_HP = 520;
/** HP de cada um dos três inimigos (1→3). O último é o mais duro. */
export const M3C_ENEMY_HP: readonly [number, number, number] = [290, 350, 410];
/** Dano por peça limpa (× o multiplicador da cascata). */
export const M3C_DMG_PER_TILE = 10;
/**
 * D-83 (19/10/2026): o inimigo da frente MEXE as peças (uma troca por vez de inimigo) e os combos dele tiram HP do jogador pela MESMA
 * fórmula do dano do jogador (`M3C_DMG_PER_TILE` × multiplicador da cascata). Como o inimigo escolhe sempre a melhor troca, o HP do jogador
 * subiu de 330 para `M3C_PLAYER_HP` e o dano dele leva o fator `M3C_ENEMY_DMG_FACTOR` (régua: `match3Combat.test.ts`, balanço).
 */
/** D-84: um lado joga no máximo este número de jogadas SEGUIDAS (uma combinação de 4+ dá a vez extra; sem loop infinito). */
export const M3C_MAX_STREAK = 3;
/** A alavanca de equilíbrio da D-83: o dano dos combos do inimigo = a fórmula do jogador × este fator (o inimigo escolhe SEMPRE a melhor troca; sem o fator o jogador comum nunca vencia). */
export const M3C_ENEMY_DMG_FACTOR = 0.2;
/** Bônus de placar por inimigo derrotado. */
export const M3C_DEFEAT_BONUS = 100;
/** Teto de segurança: a rodada que chega a este turno acaba como derrota SEM custo. */
export const M3C_MAX_TURNS = 60;

/**
 * VANTAGEM ELEMENTAL (decisão do dono, 27/10/2026): a mesma do Arena/Duelo — `elementAdvantage` (+1/-1/0, pela base dominante) vira ±1 golpe EXIBIDO
 * (`elementHits`, h0 = 10): o dano multiplica por `1 / elementHits(adv)` (+1 → ×1,111; -1 → ×0,909), arredondado só no fim. Sem elemento = neutro.
 */
export function m3ElementMult(atacante: string | undefined, defensor: string | undefined): number {
  if (!atacante || !defensor) return 1;
  return 1 / elementHits(elementAdvantage(baseDominanteDoElemento(atacante), [baseDominanteDoElemento(defensor)]));
}

/**
 * O selo da tela: a vantagem líquida das PEÇAS do jogador contra o inimigo ativo (soma do sinal de cada elemento do tabuleiro; >0 = +1, <0 = -1, 0 = neutro).
 * É o MESMO cálculo que o dano usa (`m3ElementMult`), então o selo nunca discorda da luta.
 */
export function m3BoardAdvantage(s: M3Combat): -1 | 0 | 1 {
  const alvo = s.enemies[s.active];
  if (!alvo || s.outcome !== 'playing') return 0;
  let net = 0;
  for (const el of s.elements ?? M3_TILE_ELEMENTS) {
    const m = m3ElementMult(el, alvo.element);
    net += m > 1 ? 1 : m < 1 ? -1 : 0;
  }
  return net > 0 ? 1 : net < 0 ? -1 : 0;
}

export interface M3Fighter { hp: number; max: number }
export interface M3Enemy extends M3Fighter {
  element: M3Element;
  /** Linha de arte (`DUNGEON_LINE_SPRITES`). */
  line?: string;
  /** M10: chave do roster (`enemyRoster.ts`, `<id>-<estágio>`) quando o combate foi montado com o level do jogador; manda na arte/nome. */
  roster?: string;
}
export type M3Target = 'player' | 0 | 1 | 2;
export interface M3Event {
  by: 'player' | 'enemy';
  /** Elemento do golpe (o da peça do jogador; o do inimigo que bateu). */
  element: M3Element;
  /** Dano que de fato tirou HP (a sobra descartada não conta). */
  dmg: number;
  target: M3Target;
}
export type M3Outcome = 'playing' | 'win' | 'loss';
export interface M3Combat {
  player: M3Fighter;
  /** 3 no Normal; 1 no PVP (1 contra 1). */
  enemies: M3Enemy[];
  /** PVP: o elemento de cada TIPO de peça (índice = `Tile.k`). Ausente = os 6 fixos `M3_TILE_ELEMENTS` (save/estado antigo e Normal). */
  elements?: readonly string[];
  /** Elemento do Soulmon do jogador (base ou par): o defensor da conta de vantagem dos golpes do INIMIGO. Ausente = neutro. */
  playerElement?: string;
  /** Índice (0..2) do inimigo ativo. */
  active: number;
  log: M3Event[];
  /** Dano total causado pelo jogador / recebido. */
  dealt: number;
  taken: number;
  /** Quantos inimigos já caíram. */
  defeated: number;
  /** Jogadas válidas já feitas. */
  turns: number;
  outcome: M3Outcome;
}

/**
 * Um combate novo. `lines` = linhas de arte candidatas (a tela passa as de `DUNGEON_LINE_SPRITES`); `exclude` = a do jogador (ninguém encara
 * um espelho). Os três elementos são DISTINTOS e as três linhas também — tudo sorteado pelo `rng` por parâmetro.
 */
export function newCombat(rng: Rng, lines: readonly string[] = [], exclude?: string, level?: number, playerElement?: string): M3Combat {
  const pool = lines.filter(l => l !== exclude);
  const els: M3Element[] = [...M3_TILE_ELEMENTS];
  const pick = <T,>(arr: T[]): T => arr.splice(Math.min(arr.length - 1, Math.floor(rng() * arr.length)), 1)[0];
  const mk = (i: 0 | 1 | 2): M3Enemy => ({
    hp: M3C_ENEMY_HP[i], max: M3C_ENEMY_HP[i], element: pick(els),
    ...(lines.length > 0 ? { line: pick(pool.length > 0 ? pool : [...lines]) } : {}),
  });
  const enemies: M3Enemy[] = [mk(0), mk(1), mk(2)];
  // O elemento do inimigo É o do sprite dele (`spriteElement.ts`; dono, 30/10/2026) — o sorteio acima só gasta o rng (sequência antiga intacta).
  for (const e of enemies) { const le = e.line ? LINE_ELEMENT[e.line] : undefined; if (le) e.element = le; }
  if (level !== undefined) {
    // M10: as 3 vagas pedem rookie/champion/ultimate, rebaixadas ao teto do level (progressão do roster); sem repetir criatura.
    // Sorteado DEPOIS do resto, então o rng das jogadas antigas (sem level) não muda.
    const used = new Set<string>();
    const pedido = ['rookie', 'champion', 'ultimate'] as const;
    enemies.forEach((e, i) => { const r = pickEnemy(level, rng, { stage: pedido[i], used }); used.add(r.id); e.roster = r.key; e.element = rosterEntryElement(r); });
  }
  return { player: { hp: M3C_PLAYER_HP, max: M3C_PLAYER_HP }, enemies, ...(playerElement ? { playerElement } : {}), active: 0, log: [], dealt: 0, taken: 0, defeated: 0, turns: 0, outcome: 'playing' };
}

/** PVP: HP do único inimigo = a SOMA do time do Normal (o placar, e portanto os Bits, ficam na mesma escala; SUPOSIÇÃO a confirmar pelo dono). */
export const M3C_PVP_ENEMY_HP: number = M3C_ENEMY_HP.reduce((a, b) => a + b, 0);

/**
 * Um combate de PVP (1 contra 1): UM inimigo, com os 6 `elements` da partida (o do inimigo sai deles, sorteado pelo `rng`).
 * `roster` = chave do roster quando o adversário é um NPC (bestiário); jogador real não leva nada (arte e level vêm da tela).
 */
export function newPvpCombat(rng: Rng, elements: readonly string[], roster?: string, playerElement?: string, foeElement?: string): M3Combat {
  // O elemento do oponente é o do SPRITE dele (NPC: o do roster; jogador real: o que o perfil publica); só sem ele cai no sorteio dos 6 da partida.
  const el = foeElement ?? elements[Math.min(elements.length - 1, Math.floor(rng() * elements.length))];
  return {
    player: { hp: M3C_PLAYER_HP, max: M3C_PLAYER_HP },
    enemies: [{ hp: M3C_PVP_ENEMY_HP, max: M3C_PVP_ENEMY_HP, element: el, ...(roster ? { roster } : {}) }],
    elements: [...elements], ...(playerElement ? { playerElement } : {}), active: 0, log: [], dealt: 0, taken: 0, defeated: 0, turns: 0, outcome: 'playing',
  };
}

const cloneCombat = (s: M3Combat): M3Combat => ({
  ...s, player: { ...s.player }, enemies: s.enemies.map(e => ({ ...e })), log: [...s.log],
});

/**
 * O dano do jogador: para cada passo da cascata, UM evento por elemento (peças limpas daquele elemento × `M3C_DMG_PER_TILE` × multiplicador
 * da cascata), todos no inimigo ATIVO. A sobra de um golpe que zera o HP é descartada; o próximo inimigo assume para o evento seguinte.
 * Terminada a vitória (3 derrotados), o resto é ignorado.
 */
export function applyPlayerSteps(state: M3Combat, steps: readonly Step[]): M3Combat {
  const s = cloneCombat(state);
  for (const st of steps) {
    const porElemento = new Map<number, number>();
    for (const k of st.kinds) porElemento.set(k, (porElemento.get(k) ?? 0) + 1);
    for (const k of [...porElemento.keys()].sort((a, b) => a - b)) {
      if (s.outcome !== 'playing') return s;
      const alvo = s.enemies[s.active];
      const elTile = (s.elements ?? M3_TILE_ELEMENTS)[k];
      const bruto = Math.round(porElemento.get(k)! * M3C_DMG_PER_TILE * chainMultiplier(st.chain) * m3ElementMult(elTile, alvo.element));
      const dmg = Math.min(alvo.hp, bruto); // a sobra se perde
      alvo.hp -= dmg;
      s.dealt += dmg;
      s.log.push({ by: 'player', element: (s.elements ?? M3_TILE_ELEMENTS)[k], dmg, target: s.active as 0 | 1 | 2 });
      if (alvo.hp <= 0) {
        s.defeated += 1;
        if (s.active >= s.enemies.length - 1) s.outcome = 'win';
        else s.active += 1;
      }
    }
  }
  return s;
}

/** D-84: a jogada formou uma combinação de 4+ peças (nasce uma peça especial) — vale uma RODADA EXTRA. */
export const grantsExtraTurn = (steps: readonly Step[]): boolean => steps.some(st => st.created.length > 0);

/** A semente FIXA da sonda: a escolha olha para a frente com ela, nunca com sorte escondida. */
const PROBE_SEED = 0x2c1b3c6d;

/**
 * A MELHOR jogada de um tabuleiro (D-83 e D-85: a IA inimiga e a dica do jogador são ESTA função): a troca que mais pontua, medida
 * com a sonda de semente fixa; empate = a PRIMEIRA na ordem de `validMoves` (linha a linha). Determinística: mesmo tabuleiro, mesma jogada.
 */
export function chooseMove(board: Board): { a: Pos; b: Pos; score: number } | null {
  let melhor: { a: Pos; b: Pos; score: number } | null = null;
  for (const m of validMoves(board)) {
    const r = trySwap(board, m.a, m.b, mulberry32(PROBE_SEED));
    if (r.ok && (!melhor || r.score > melhor.score)) melhor = { a: m.a, b: m.b, score: r.score };
  }
  return melhor;
}

/** O dano dos combos do INIMIGO no jogador: a mesma conta do jogador (peças × `M3C_DMG_PER_TILE` × cascata), um evento por elemento por passo. */
export function applyEnemySteps(state: M3Combat, steps: readonly Step[]): M3Combat {
  const s = cloneCombat(state);
  for (const st of steps) {
    const porElemento = new Map<number, number>();
    for (const k of st.kinds) porElemento.set(k, (porElemento.get(k) ?? 0) + 1);
    for (const k of [...porElemento.keys()].sort((a, b) => a - b)) {
      if (s.outcome !== 'playing') return s;
      const bruto = Math.max(1, Math.round(porElemento.get(k)! * M3C_DMG_PER_TILE * chainMultiplier(st.chain) * M3C_ENEMY_DMG_FACTOR * m3ElementMult(s.enemies[s.active]?.element, s.playerElement)));
      const dmg = Math.min(s.player.hp, bruto);
      s.player.hp -= dmg;
      s.taken += dmg;
      s.log.push({ by: 'enemy', element: (s.elements ?? M3_TILE_ELEMENTS)[k], dmg, target: 'player' });
      if (s.player.hp <= 0) s.outcome = 'loss';
    }
  }
  return s;
}

/** Uma troca do inimigo, inteira (a tela a anima): as casas, o tabuleiro trocado, os passos da cascata e o tabuleiro final. */
export interface EnemyMove { a: Pos; b: Pos; swapped: Board; steps: Step[]; board: Board; reshuffled: Board | null }

/**
 * A vez do inimigo da frente (D-83): UMA troca (a melhor, `chooseMove`) no mesmo tabuleiro, com o rng do tabuleiro. Uma combinação de 4+
 * dá outra troca (D-84), até `M3C_MAX_STREAK` seguidas. Cada troca tira HP do jogador pela fórmula do combate; HP 0 = derrota.
 */
export function enemyPhase(state: M3Combat, board: Board, boardRng: Rng): { state: M3Combat; board: Board; moves: EnemyMove[] } {
  let s = state;
  let b = board;
  const moves: EnemyMove[] = [];
  for (let i = 0; i < M3C_MAX_STREAK && s.outcome === 'playing'; i++) {
    const m = chooseMove(b);
    if (!m) break;
    const r = trySwap(b, m.a, m.b, boardRng);
    if (!r.ok) break;
    moves.push({ a: m.a, b: m.b, swapped: r.swapped, steps: r.steps, board: r.board, reshuffled: r.reshuffled });
    s = applyEnemySteps(s, r.steps);
    b = r.board;
    if (!grantsExtraTurn(r.steps)) break;
  }
  return { state: s, board: b, moves };
}

export interface M3Exchange {
  state: M3Combat;
  /** O tabuleiro depois de tudo (o do jogador, ou o que o inimigo deixou). */
  board: Board;
  /** D-84: a jogada do jogador deu RODADA EXTRA — o inimigo NÃO jogou e o turno não foi contado. */
  extra: boolean;
  enemyMoves: EnemyMove[];
}

/**
 * Uma jogada VÁLIDA do jogador inteira. `board` = o tabuleiro já resolvido pela jogada dele; `streak` = quantas jogadas SEGUIDAS ele já fez
 * contando esta (1 na primeira). O dano do jogador entra; a vitória acaba ali. Combinação de 4+ com `streak < M3C_MAX_STREAK` = RODADA EXTRA
 * (sem resposta do inimigo e SEM consumir turno: `turns` só conta jogadas que passam a vez). Senão conta o turno e o inimigo joga (`enemyPhase`).
 * Ao chegar a `M3C_MAX_TURNS` sem fim, a rodada acaba como derrota sem custo.
 */
export function playTurn(state: M3Combat, steps: readonly Step[], board: Board, boardRng: Rng, streak = 1): M3Exchange {
  if (state.outcome !== 'playing') return { state, board, extra: false, enemyMoves: [] };
  let s = applyPlayerSteps(state, steps);
  if (s.outcome !== 'playing') return { state: { ...s, turns: s.turns + 1 }, board, extra: false, enemyMoves: [] };
  if (grantsExtraTurn(steps) && streak < M3C_MAX_STREAK) return { state: s, board, extra: true, enemyMoves: [] };
  s = { ...s, turns: s.turns + 1 };
  const ph = enemyPhase(s, board, boardRng);
  s = ph.state;
  if (s.outcome === 'playing' && s.turns >= M3C_MAX_TURNS) s = { ...s, outcome: 'loss' };
  return { state: s, board: ph.board, extra: false, enemyMoves: ph.moves };
}

/** D-85: usos de dica por partida e o preço (em Bits) de mais um uso. SUPOSIÇÃO do agente: barato — uma rodada típica rende ~3 Bits. O dono ajusta aqui. */
export const M3_HINTS_PER_GAME = 3;
export const M3_HINT_PRICE_BITS = 3;
/** O que o botão de dica faz agora: `use` (ainda há usos), `buy` (acabaram, mas o saldo cobre o preço) ou `blocked` (saldo insuficiente — botão desabilitado, nunca erro). */
export function hintAction(left: number, bits: number, price: number = M3_HINT_PRICE_BITS): 'use' | 'buy' | 'blocked' {
  if (left > 0) return 'use';
  return Number.isFinite(bits) && bits >= price ? 'buy' : 'blocked';
}

/** O placar: dano causado − dano recebido + bônus por inimigo derrotado, nunca abaixo de 0. */
export function combatScore(s: M3Combat): number {
  return Math.max(0, Math.round(s.dealt - s.taken + s.defeated * M3C_DEFEAT_BONUS));
}

/** Teto REAL de Bits por partida (placar perfeito: todo HP inimigo, nenhum dano recebido). Derivado, nunca literal. */
export const M3C_MAX_BITS: number = match3Bits(M3C_ENEMY_HP.reduce((a, b) => a + b, 0) + M3C_ENEMY_HP.length * M3C_DEFEAT_BONUS);
