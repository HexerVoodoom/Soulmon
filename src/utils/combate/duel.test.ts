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
  DUEL_CHEER_BUCKETS, NPC_LEVEL_GAP, bucketTapTimes, duelCheerEvents, npcCombatant, npcSide, sanitizeTaps, simulatePvp,
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

describe('AC9. o NPC do treino: 2 levels abaixo, dentro do estágio, e o jogador vence 75–92% em cada estágio', () => {
  it('NPC_LEVEL_GAP = 2 e o NPC é o espelho EQUILIBRADO, nunca abaixo do 1º level do estágio do jogador', () => {
    expect(NPC_LEVEL_GAP).toBe(2);
    for (let L = 1; L <= 40; L++) {
      const npc = npcCombatant(L);
      expect(npc).toEqual(combatantAt(Math.max(firstLevelOfStage(stageOfLevel(L)), L - 2), REFERENCE_BUILDS.balanced));
      expect(stageOfLevel(npc.level)).toBe(stageOfLevel(L));
      expect(npc.bonus).toBe(0);
    }
    expect(npcCombatant(1).level).toBe(1);
    expect(npcCombatant(9).level).toBe(7);
    expect(npcCombatant(7).level).toBe(7); // o 1º level do estágio: não desce para o estágio de baixo
    expect(npcSide(20).special.family).toBe('direct');
  });

  it('a vitória do jogador por estágio fica entre 75% e 92% (impressa)', () => {
    const v = vitoriaPorEstagio((L) => npcCombatant(L));
    console.log('[PR5] NPC do treino, vitória do jogador por estágio (rookie..ultra):', v.map(pct).join(' · '));
    for (const [st, w] of v.entries()) {
      expect(w, `estágio ${st}`).toBeGreaterThanOrEqual(0.75);
      expect(w, `estágio ${st}`).toBeLessThanOrEqual(0.92);
    }
  });

  it('RED: o NPC "2 levels abaixo" SEM o piso do estágio (cruza para o estágio de baixo) estoura os 92%', () => {
    const v = vitoriaPorEstagio((L) => combatantAt(Math.max(1, L - 2), REFERENCE_BUILDS.balanced));
    console.log('[PR5] RED sem o piso do estágio:', v.map(pct).join(' · '));
    expect(Math.max(...v)).toBeGreaterThan(0.92);
  });

  it('RED: com 1 level de folga o estágio mais alto cai abaixo dos 75%', () => {
    const v = vitoriaPorEstagio((L) => combatantAt(Math.max(firstLevelOfStage(stageOfLevel(L)), L - 1), REFERENCE_BUILDS.balanced));
    console.log('[PR5] RED com gap 1:', v.map(pct).join(' · '));
    expect(Math.min(...v)).toBeLessThan(0.75);
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
