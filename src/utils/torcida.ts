/**
 * TORCIDA — o pet golpeia sozinho, o dono TORCE tocando na tela.
 *
 * Decisão do dono (02/10/2026): torcer é TOCAR EM QUALQUER LUGAR da tela de
 * combate. Cada toque dá um efeito no ponto tocado e enche um GAUGE; com o gauge
 * cheio o pet GASTA tudo num golpe ESPECIAL (dano maior, efeito próprio). Os
 * golpes normais continuam sendo do pet, sozinho. A torcida só SOMA — sem
 * torcer o golpe é o golpe-base, nunca menos.
 *
 * Esta é a conta do lado PvE (Pesadelo e Masmorra). O duelo do Torneio é
 * servidor-autoritativo e mora em `functions/api/_duel.js`; as constantes do
 * gauge (toques para encher, força do especial) são IMPORTADAS de lá — uma
 * regra, um arquivo (CLAUDE.md, footgun 9).
 *
 * A torcida por TIMING (barra/anel no momento certo) está desligada
 * (`TIMING_CHEER_ENABLED = false` em `_duel.js`) e nenhum caminho de UI a usa:
 * o código fica para reaproveitar em outro lugar depois.
 *
 * O Duelo da Arena (`ArenaGame`, contra NPCs) TAMBÉM usa o gauge e o grito
 * (`TorcidaLayer`/`TorcidaGauge`), mas a conta do golpe de torcida mora em
 * `utils/arena.ts` (`arenaTorcidaTurn`): ele tem a curva e a carga de especial
 * próprias, espelhadas em `simulateArenaRun` (H14, 02/10/2026).
 */
import { DUEL_TAPS_FULL, DUEL_TAPS_CAP, TIMING_CHEER_ENABLED } from '../../functions/api/_duel.js';

export { TIMING_CHEER_ENABLED };

/**
 * Toques que enchem o gauge no DUELO (Torneio fantasma e Duelo da Arena): o
 * número de `_duel.js` (16 desde 02/10/2026, rodada 5 I10 — eram 8).
 */
export const TORCIDA_TAPS_FULL = DUEL_TAPS_FULL;

/**
 * Toques que enchem o gauge no PvE (Pesadelo e Masmorra): continuam 8. A cena
 * nova de combate (`BattleStage`, I10) ainda não chegou neles e o ritmo deles
 * não mudou, então o gauge também não. Quando entrarem, é só passar
 * `TORCIDA_TAPS_FULL` no `full` das funções abaixo.
 */
export const TORCIDA_PVE_TAPS_FULL = 8;

/** Toques que contam por janela/turno (o resto é descartado: toque ilimitado não rende mais). */
export const TORCIDA_TAPS_CAP = DUEL_TAPS_CAP;

/**
 * Fração do `dmg` do estágio que é o golpe-BASE do pet (sem torcida). 0,5 mantém
 * o dano médio de antes da troca: a curva do timing (`0,25 + 0,75·acc²`,
 * crítico ×1,5) rendia ~0,54 do `dmg` com toque uniforme.
 */
export const TORCIDA_BASE_FRAC = 0.5;

/**
 * Força do golpe ESPECIAL no PvE, em múltiplos do golpe-base. Decisão do dono
 * (02/10/2026, TORC-1): 3× (era 2×, provisório). O Duelo continua em 1,35×
 * (servidor, `_duel.js`). Com a defesa automática (`utils/autoDefesa.ts`) a vida
 * dos inimigos é reajustada em `dungeon.ts` (`ENEMY_HP_MULT`) para manter a curva.
 */
export const TORCIDA_PVE_SPECIAL_MULT = 3;

/** Um toque: o gauge sobe um e para no cheio (toque a mais não rende nada). `full` padrão = PvE. */
export function torcidaTap(taps: number, full = TORCIDA_PVE_TAPS_FULL): number {
  return Math.min(full, Math.max(0, Math.floor(taps)) + 1);
}

/** 0..1 para a barra. */
export function torcidaFill(taps: number, full = TORCIDA_PVE_TAPS_FULL): number {
  return Math.min(1, Math.max(0, taps) / full);
}

export function torcidaCheio(taps: number, full = TORCIDA_PVE_TAPS_FULL): boolean {
  return taps >= full;
}

export interface TorcidaStrike {
  dmg: number;
  /** O gauge estava cheio: este golpe é o ESPECIAL e o gauge foi gasto. */
  special: boolean;
  /** Toques que sobram no gauge depois do golpe (0 se gastou). */
  tapsLeft: number;
}

/**
 * O golpe do pet. `dmgReduction` é a casca do inimigo (0..~0,7). Pura:
 * quem chama guarda `tapsLeft`.
 */
export function torcidaStrike(petDmg: number, taps: number, dmgReduction = 0): TorcidaStrike {
  const special = torcidaCheio(taps);
  const raw = petDmg * TORCIDA_BASE_FRAC * (special ? TORCIDA_PVE_SPECIAL_MULT : 1);
  return {
    dmg: Math.max(1, Math.round(raw * (1 - dmgReduction))),
    special,
    tapsLeft: special ? 0 : Math.max(0, taps),
  };
}
