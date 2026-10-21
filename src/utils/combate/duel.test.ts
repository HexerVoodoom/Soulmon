/**
 * O duelo do lado do CLIENTE no núcleo v3 (PR5, contexto §2.19): o NPC do treino e a torcida por balde.
 * (A paridade com o servidor está em `functions/api/combate.parity.test.js`; as regras do servidor, em
 * `functions/api/_duel.v3.test.js`.)
 */
import { describe, it, expect } from 'vitest';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, STAGE_LEVEL_CAPS, combatantAt, firstLevelOfStage, stageOfLevel } from './level';
import { CHEER, SPECIAL_FAMILIES, specialOf } from './specials';
import { fight, PVP_HP_SCALE } from './fight';
import {
  DUEL_CHEER_BUCKETS, NPC_ATK_HANDICAP, NPC_LEVEL_GAP, bucketTapTimes, duelCheerEvents, npcCombatant, npcSide, sanitizeTaps, simulatePvp,
} from './duel';

const N = 1200;
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

/** A vitória do jogador (qualquer build e família) contra o NPC do treino, em cada estágio, com o NPC de `npcLevel(L)`. */
function vitoriaPorEstagio(npcLevel: (L: number) => ReturnType<typeof combatantAt>) {
  return STAGE_LEVEL_CAPS.map((hi, st) => {
    const lo = firstLevelOfStage(st);
    let w = 0;
    for (let s = 0; s < N; s++) {
      const L = lo + (s % (hi - lo + 1));
      const me = { combatant: combatantAt(L, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[s % 4]]), special: specialOf(fam(s >> 2)) };
      const npc = { combatant: npcLevel(L), special: specialOf('direct') };
      const r = fight(me, npc, { seed: s * 17 + 3, hpScale: PVP_HP_SCALE });
      w += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0;
    }
    return w / N;
  });
}

describe('AC9. o NPC do treino: o espelho do MESMO level com um handicap de ataque; o jogador vence 55–75% em CADA level (QA L04-01)', () => {
  it('NPC_LEVEL_GAP = 0 e o NPC é o espelho EQUILIBRADO do level do jogador, com bônus de ataque negativo (o handicap)', () => {
    expect(NPC_LEVEL_GAP).toBe(0);
    expect(NPC_ATK_HANDICAP).toBeGreaterThan(0);
    for (let L = 1; L <= 40; L++) {
      const npc = npcCombatant(L);
      expect(npc).toEqual({ ...combatantAt(L, REFERENCE_BUILDS.balanced), bonus: -NPC_ATK_HANDICAP });
      expect(stageOfLevel(npc.level)).toBe(stageOfLevel(L));
    }
    expect(npcCombatant(1).level).toBe(1);
    expect(npcCombatant(9).level).toBe(9);
    expect(npcSide(20).special.family).toBe('direct');
  });

  /** A vitória do jogador (qualquer build e família) em UM level contra o NPC do treino. */
  const vitoriaNoLevel = (L: number, npcOf: (L: number) => ReturnType<typeof combatantAt>, n = 400) => {
    let w = 0;
    for (let s = 0; s < n; s++) {
      const me = { combatant: combatantAt(L, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[s % 4]]), special: specialOf(fam(s >> 2)) };
      const npc = { combatant: npcOf(L), special: specialOf('direct') };
      const r = fight(me, npc, { seed: s * 17 + 3, hpScale: PVP_HP_SCALE });
      w += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0;
    }
    return w / n;
  };
  /** O 1º, o do meio e o último level de cada estágio (a régua de 15 levels): o gate de antes só media a média do estágio. */
  const NIVEIS = [...new Set(STAGE_LEVEL_CAPS.flatMap((hi, st) => { const lo = firstLevelOfStage(st); return [lo, Math.round((lo + hi) / 2), hi]; }))];

  it('a vitória do jogador fica entre 55% e 75% em TODO level amostrado, o 1º level de cada estágio incluído (impressa)', () => {
    const linhas = NIVEIS.map(L => [L, vitoriaNoLevel(L, npcCombatant)] as const);
    console.log('[QA L04-01] NPC do treino, vitória do jogador por level:', linhas.map(([L, w]) => `${L}:${pct(w)}`).join(' '));
    for (const [L, w] of linhas) {
      expect(w, `level ${L}`).toBeGreaterThanOrEqual(0.55);
      expect(w, `level ${L}`).toBeLessThanOrEqual(0.75);
    }
  });

  it('RED: o NPC antigo ("2 levels abaixo", piso no estágio) tinha o pico e o vale que o gate por média escondia', () => {
    const antigo = (L: number) => combatantAt(Math.max(firstLevelOfStage(stageOfLevel(L)), L - 2), REFERENCE_BUILDS.balanced);
    const v = NIVEIS.map(L => vitoriaNoLevel(L, antigo, 240));
    console.log('[QA L04-01] RED NPC antigo por level:', NIVEIS.map((L, i) => `${L}:${pct(v[i])}`).join(' '));
    expect(Math.min(...v)).toBeLessThan(0.55); // o vale do 1º level de cada estágio (espelho puro)
    expect(Math.max(...v)).toBeGreaterThan(0.92); // o pico no meio do estágio
  });
});

describe('a torcida por balde (a conta do cliente é a do servidor)', () => {
  it('sanitizeTaps, bucketTapTimes e duelCheerEvents', () => {
    expect(DUEL_CHEER_BUCKETS).toBe(20);
    expect(sanitizeTaps([99, -1, 'x', 4.9])).toEqual([CHEER.tapsCapPerBucket, 0, 0, 4, ...Array(16).fill(0)]);
    expect(sanitizeTaps(undefined)).toEqual(Array(20).fill(0));
    expect(bucketTapTimes([2, 0, 1])).toEqual([3, 3, 9]);
    expect(duelCheerEvents([16, 16])).toEqual([{ t: 6, side: 0 }]);
    expect(duelCheerEvents(Array(100).fill(1e9))).toEqual(duelCheerEvents(Array(20).fill(16)));
  });

  it('simulatePvp: determinístico pela semente; o empate existe; a torcida só soma', () => {
    const a = { combatant: combatantAt(10, REFERENCE_BUILDS.balanced), special: specialOf('direct') };
    expect(simulatePvp({ me: a, opp: a, seed: 5, taps: [] })).toEqual(simulatePvp({ me: a, opp: a, seed: 5, taps: [] }));
    let ganhou = 0, perdeu = 0;
    for (let s = 0; s < 400; s++) {
      const sem = simulatePvp({ me: a, opp: a, seed: s, taps: [] }).winner;
      const com = simulatePvp({ me: a, opp: a, seed: s, taps: Array(20).fill(16) }).winner;
      if (sem === 'me' && com !== 'me') perdeu++;
      if (sem !== 'me' && com === 'me') ganhou++;
    }
    expect(ganhou).toBeGreaterThan(perdeu); // a torcida desequilibra a favor de quem torce
  });
});
