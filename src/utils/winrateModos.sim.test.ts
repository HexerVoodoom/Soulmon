/**
 * SIMULAÇÃO DE TAXA DE VITÓRIA POR MODO (dono, 28/10/2026: "as batalhas estão fáceis, principalmente as SEGUIDAS").
 *
 * Mede, com as MESMAS funções que o jogo joga (`playSequence`/`simulateDungeonRunV3` e `simulateRogueCombat`), a taxa de vitória das
 * lutas seguidas: Masmorra/Fenda (andar a andar, cura do ofício entre andares) e Calabouço (24 passos, vida contínua). Determinística
 * (semente = índice da corrida; `Math.random` proibido). Amostra: 15 níveis da régua × 4 builds × 7 famílias × 2 jogadores
 * (sem bônus e "equipado", bônus no teto de 5%). Imprime a tabela; as faixas travam a calibração (meta do dono: ~60-70% nas
 * sequências típicas, sem tornar o início impossível). Recalibrar = mudar `DUNGEON_FLOOR_GROWTH`/`DUNGEON_CURA_ANDAR`/`ROGUE_FOE_GROWTH`, nunca a faixa.
 *
 * Rodar só a tabela: `node node_modules/vitest/vitest.mjs run src/utils/winrateModos.sim.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';
import { simulateDungeonRunV3, type SequenceConfig } from './dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS, combatantAt } from './combate/level';
import { SPECIAL_FAMILIES, type SpecialFamily } from './combate/specials';
import { COMBAT_BONUS_CAP } from './combate/bonus';
import { mulberry32 } from './combate/rng';
import {
  BONUS_KINDS, ROGUE_MAX_STEPS, applyBonus, emptyRun, isForcedCombat, pathsFor, resolveStep, simulateRogueCombat, floorOf,
} from './rogueDungeon';
import type { RogueRun } from './rogueDungeon';

vi.setConfig({ testTimeout: 600_000 });

const fam = (i: number): SpecialFamily => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const PLAYERS = [{ nome: 'base', bonus: 0 }, { nome: 'equipado', bonus: COMBAT_BONUS_CAP }] as const;

/** A célula da corrida `s`: nível × build × família × jogador. */
function cell(s: number) {
  return {
    level: RULER_LEVELS[s % RULER_LEVELS.length],
    build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 4) % 4]],
    family: fam(s >> 6),
    player: PLAYERS[(s >> 9) % 2],
  };
}
const RUNS = 3360; // 15 níveis × 4 builds × 7 famílias × 2 jogadores × ~2 sementes

// ── Masmorra / Fenda ────────────────────────────────────────────────────────
const FLOORS = 8;
export function medirMasmorra(n = RUNS) {
  const reached = Array(FLOORS + 1).fill(0);
  const cleared = Array(FLOORS + 1).fill(0);
  for (let s = 0; s < n; s++) {
    const c = cell(s);
    const cfg: SequenceConfig = { level: c.level, build: c.build, family: c.family, bonus: c.player.bonus };
    const r = simulateDungeonRunV3(cfg, 1000 + s, 'media', FLOORS, 1);
    for (let f = 1; f <= FLOORS; f++) {
      if (r.floorsCleared >= f - 1) { reached[f]++; if (r.floorsCleared >= f) cleared[f]++; }
    }
  }
  return { porAndar: cleared.map((c, f) => (reached[f] ? c / reached[f] : 0)), cincoAndares: cleared[5] / n, tres: cleared[3] / n };
}

// ── Calabouço ───────────────────────────────────────────────────────────────
/** Política do jogador: caminho escolhido ao acaso entre os oferecidos; fora de combate acerta `pNaoCombate`; bônus ao acaso. */
export function medirCalabouco(n = RUNS, pNaoCombate = 0.75) {
  let completos = 0;
  const andarFim = [0, 0, 0, 0]; // quantos terminaram o andar 1..3
  let passos = 0;
  for (let s = 0; s < n; s++) {
    const c = cell(s);
    const rng = mulberry32((s * 2654435761) | 0);
    const combatant = combatantAt(c.level, c.build, c.player.bonus);
    let run: RogueRun = emptyRun(`2026-10-${String(1 + (s % 28)).padStart(2, '0')}-${s}`);
    while (!run.over && run.step < ROGUE_MAX_STEPS) {
      const opts = pathsFor(run.day, run.step);
      const kind = opts[Math.floor(rng() * opts.length)];
      let victory: boolean; let hpLeft: number | undefined;
      if (kind === 'combat') { const r = simulateRogueCombat(run, run.step, combatant); victory = r.won; hpLeft = r.hpLeft; }
      else victory = rng() < pNaoCombate;
      void isForcedCombat;
      run = resolveStep(run, kind, victory, hpLeft);
      if (run.bonusPending) run = applyBonus(run, BONUS_KINDS[Math.floor(rng() * BONUS_KINDS.length)]);
    }
    passos += run.step;
    if (!run.over) completos++;
    for (let a = 1; a <= 3; a++) if (!run.over || run.step > a * 8) andarFim[a]++;
  }
  return { completos: completos / n, andar1: andarFim[1] / n, andar2: andarFim[2] / n, passosMedios: passos / n };
}

describe('taxa de vitória por modo (tabela)', () => {
  it('imprime a tabela', () => {
    const m = medirMasmorra();
    const k = medirCalabouco();
    console.log(`[WINRATE] Masmorra/Fenda — P(limpar o andar f | chegou nele): ${m.porAndar.slice(1).map((x, i) => `a${i + 1} ${pct(x)}`).join(' · ')} | 3 andares ${pct(m.tres)} | 5 andares ${pct(m.cincoAndares)}`);
    console.log(`[WINRATE] Calabouço — incursão completa ${pct(k.completos)} | passa andar 1 ${pct(k.andar1)} | andar 2 ${pct(k.andar2)} | passos médios ${k.passosMedios.toFixed(1)}/24`);
    // Faixas da calibração de 28/10/2026 (meta do dono: ~60-70% nas sequências seguidas, início nunca impossível).
    // ANTES (growth.power 0.11, cura 0.25, sem rampa no Calabouço): Masmorra a1-a4 100% · a5 52,4% · a6 0,3% | Calabouço completa 100%.
    for (const a of [1, 2, 3]) expect(m.porAndar[a], `andar ${a}`).toBeGreaterThanOrEqual(0.97);
    expect(m.porAndar[4]).toBeGreaterThanOrEqual(0.6);
    expect(m.porAndar[4]).toBeLessThanOrEqual(0.72);
    expect(m.porAndar[5]).toBeLessThanOrEqual(0.05);
    expect(k.completos).toBeGreaterThanOrEqual(0.6);
    expect(k.completos).toBeLessThanOrEqual(0.75);
    expect(k.andar1).toBeGreaterThanOrEqual(0.97);
  });
});
