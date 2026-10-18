/**
 * COMBINA 3 COMO COMBATE — a regra PURA (pedido do dono, 18/10/2026, stories D-03…D-07).
 *
 * Combinar peças de um elemento causa dano DAQUELE elemento ao inimigo ATIVO. São três Soulmon inimigos, em fila (1→3), que contam como
 * UM time: o dano só atinge o ativo; a sobra de um golpe que o derruba é descartada; zerou o HP, o próximo assume; os três derrotados = vitória.
 * Depois de cada jogada VÁLIDA do jogador (troca válida, pontue ou não) o inimigo ativo faz UMA ação e tira HP do Soulmon do jogador;
 * HP 0 = a rodada acaba (sem custo nenhum: perder não cobra coração, Bit nem nada — só rende menos).
 *
 * O placar sai do combate e SÓ dele: `dano causado − dano recebido + bônus por inimigo derrotado`, nunca abaixo de 0. É o único número que
 * vira Bits (`match3Bits(placar)`, mesmo teto `M3_MAX_BITS` de antes — o combate nunca paga mais que a regra dos pontos pagava; régua em
 * `utils/mente/balanco.test.ts`).
 *
 * Tudo determinístico: o rng da ação do inimigo vem por PARÂMETRO (`mulberry32` de `combate/rng`) — nunca `Math.random`.
 * O estado é imutável: cada função devolve um estado novo.
 */
import { chainMultiplier, match3Bits, M3_TILE_ELEMENTS, type Rng, type Step } from './match3';

export type M3Element = (typeof M3_TILE_ELEMENTS)[number];

/** HP do Soulmon do jogador. */
export const M3C_PLAYER_HP = 330;
/** HP de cada um dos três inimigos (1→3). O último é o mais duro. */
export const M3C_ENEMY_HP: readonly [number, number, number] = [290, 350, 410];
/** Dano por peça limpa (× o multiplicador da cascata). */
export const M3C_DMG_PER_TILE = 10;
/** Dano da ação do inimigo: `base + floor(rng() × (spread + 1))`; o inimigo 2 e o 3 batem um pouco mais forte. */
export const M3C_ENEMY_BASE_DMG: readonly [number, number, number] = [9, 11, 13];
export const M3C_ENEMY_DMG_SPREAD = 4;
/** Bônus de placar por inimigo derrotado. */
export const M3C_DEFEAT_BONUS = 100;
/** Teto de segurança: a rodada que chega a este turno acaba como derrota SEM custo. */
export const M3C_MAX_TURNS = 60;

export interface M3Fighter { hp: number; max: number }
export interface M3Enemy extends M3Fighter { element: M3Element; /** Linha de arte (`DUNGEON_LINE_SPRITES`). */ line?: string }
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
  enemies: [M3Enemy, M3Enemy, M3Enemy];
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
export function newCombat(rng: Rng, lines: readonly string[] = [], exclude?: string): M3Combat {
  const pool = lines.filter(l => l !== exclude);
  const els: M3Element[] = [...M3_TILE_ELEMENTS];
  const pick = <T,>(arr: T[]): T => arr.splice(Math.min(arr.length - 1, Math.floor(rng() * arr.length)), 1)[0];
  const mk = (i: 0 | 1 | 2): M3Enemy => ({
    hp: M3C_ENEMY_HP[i], max: M3C_ENEMY_HP[i], element: pick(els),
    ...(lines.length > 0 ? { line: pick(pool.length > 0 ? pool : [...lines]) } : {}),
  });
  const enemies: [M3Enemy, M3Enemy, M3Enemy] = [mk(0), mk(1), mk(2)];
  return { player: { hp: M3C_PLAYER_HP, max: M3C_PLAYER_HP }, enemies, active: 0, log: [], dealt: 0, taken: 0, defeated: 0, turns: 0, outcome: 'playing' };
}

const cloneCombat = (s: M3Combat): M3Combat => ({
  ...s, player: { ...s.player }, enemies: s.enemies.map(e => ({ ...e })) as M3Combat['enemies'], log: [...s.log],
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
      const bruto = Math.round(porElemento.get(k)! * M3C_DMG_PER_TILE * chainMultiplier(st.chain));
      const dmg = Math.min(alvo.hp, bruto); // a sobra se perde
      alvo.hp -= dmg;
      s.dealt += dmg;
      s.log.push({ by: 'player', element: M3_TILE_ELEMENTS[k], dmg, target: s.active as 0 | 1 | 2 });
      if (alvo.hp <= 0) {
        s.defeated += 1;
        if (s.active >= 2) s.outcome = 'win';
        else s.active += 1;
      }
    }
  }
  return s;
}

/** A ação do inimigo ativo: tira HP do Soulmon do jogador. HP 0 = derrota. Sem efeito se a rodada já acabou. */
export function enemyTurn(state: M3Combat, rng: Rng): M3Combat {
  if (state.outcome !== 'playing') return state;
  const s = cloneCombat(state);
  const e = s.enemies[s.active];
  const bruto = M3C_ENEMY_BASE_DMG[s.active] + Math.floor(rng() * (M3C_ENEMY_DMG_SPREAD + 1));
  const dmg = Math.min(s.player.hp, bruto);
  s.player.hp -= dmg;
  s.taken += dmg;
  s.log.push({ by: 'enemy', element: e.element, dmg, target: 'player' });
  if (s.player.hp <= 0) s.outcome = 'loss';
  return s;
}

/**
 * Uma jogada VÁLIDA inteira: o dano do jogador e, se a rodada segue, a resposta do inimigo ativo. Conta o turno; ao chegar a
 * `M3C_MAX_TURNS` sem fim, a rodada acaba como derrota sem custo.
 */
export function playTurn(state: M3Combat, steps: readonly Step[], rng: Rng): M3Combat {
  if (state.outcome !== 'playing') return state;
  let s = applyPlayerSteps(state, steps);
  s = { ...s, turns: s.turns + 1 };
  if (s.outcome === 'playing') s = enemyTurn(s, rng);
  if (s.outcome === 'playing' && s.turns >= M3C_MAX_TURNS) s = { ...s, outcome: 'loss' };
  return s;
}

/** O placar: dano causado − dano recebido + bônus por inimigo derrotado, nunca abaixo de 0. */
export function combatScore(s: M3Combat): number {
  return Math.max(0, Math.round(s.dealt - s.taken + s.defeated * M3C_DEFEAT_BONUS));
}

/** Teto REAL de Bits por partida (placar perfeito: todo HP inimigo, nenhum dano recebido). Derivado, nunca literal. */
export const M3C_MAX_BITS: number = match3Bits(M3C_ENEMY_HP.reduce((a, b) => a + b, 0) + M3C_ENEMY_HP.length * M3C_DEFEAT_BONUS);
