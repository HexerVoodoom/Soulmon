/**
 * QA do combate (30/10/2026, depois da v223): invariantes de ORDEM e de NÚMERO sobre o núcleo, com sementes — Arena (1–3 inimigos,
 * largada justa), grupo sem largada (Masmorra/Fenda/Pesadelo usam o mesmo `groupFightSteps`) e 1v1 (`fight`, Duelo).
 */
import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './level';
import { groupFightSteps, type GroupEvent } from './group';
import { fightSteps, type FightEvent } from './fight';
import { SPECIAL_FAMILIES, specialOf } from './specials';

const side = (fam: (typeof SPECIAL_FAMILIES)[number], lvl: number, b = 0) => ({ combatant: combatantAt(lvl, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[b % 4]]), special: specialOf(fam) });

function run(n: number, seed: number, fairStart: boolean) {
  const fams = SPECIAL_FAMILIES;
  const pl = side(fams[seed % 7], 5 + (seed % 30), seed);
  const foes = Array.from({ length: n }, (_, i) => side(fams[(seed + i + 1) % 7], 5 + (seed % 30), seed + i));
  const g = groupFightSteps(pl, foes, { seed, fairStart });
  const evs: GroupEvent[] = [];
  let r = g.next();
  while (!r.done) { evs.push(r.value); r = g.next(1); }
  return { evs, res: r.value };
}

describe('QA núcleo de grupo', () => {
  for (const n of [1, 2, 3]) for (const fair of [true, false]) {
    it(`${n} inimigo(s), largada ${fair ? 'justa' : 'livre'}: ordem, números e KO`, () => {
      for (let seed = 1; seed <= 150; seed++) {
        const { evs, res } = run(n, seed, fair);
        const dead = new Set<number>();
        let prev = { hp: 1, foes: Array(n).fill(1) as number[] };
        let lastT = 0;
        for (let i = 0; i < evs.length; i++) {
          const e = evs[i];
          expect(e.t).toBeGreaterThanOrEqual(lastT - 1e-9); // o relógio nunca volta
          lastT = e.t;
          if (e.kind === 'attack' || e.kind === 'cast') expect(dead.has(e.who), `seed ${seed}: quem caiu não age`).toBe(false); // o DoT já lançado segue (é dano já pago)
          if (e.kind === 'ko') dead.add(e.who);
          // o número do golpe = o que saiu da barra do alvo (nada some, nada sobra)
          const afterCast = i > 0 && evs[i - 1].kind === 'cast'; // o evento do cast é o retrato ANTES do efeito (cura/escudo entram no seguinte)
          if (!afterCast && (e.kind === 'attack' || e.kind === 'tick') && e.who > 0) expect(prev.hp - e.hp).toBeCloseTo(e.frac, 9);
          if (!afterCast && (e.kind === 'attack' || e.kind === 'tick') && e.who === 0) {
            const lost = prev.foes.reduce((a, h, k) => a + Math.max(0, h - e.foesHp[k]), 0);
            expect(lost).toBeCloseTo(e.frac, 9);
          }
          // um especial: o próximo evento nunca é o cast de OUTRO lutador no mesmo instante antes dos golpes dele (§196)
          if (e.kind === 'cast' && ['direct'].includes(String((e.who === 0 ? SPECIAL_FAMILIES[seed % 7] : '')))) {
            const nx = evs[i + 1];
            if (nx) expect(nx.kind === 'cast' && nx.who !== e.who).toBe(false);
          }
          prev = { hp: e.hp, foes: [...e.foesHp] };
        }
        // KO na hora do zero, e o vencedor bate com quem ficou de pé
        if (res.winner === 'player') expect(evs.at(-1)!.foesHp.every((h) => h <= 1e-9)).toBe(true);
        if (res.winner === 'foes') expect(res.hpLeft).toBeLessThanOrEqual(1e-9);
        // largada justa: o 1º golpe do jogador não sai junto com o de um inimigo (v223: "parece simultâneo")
        if (fair) {
          const p = evs.find((x) => x.kind === 'attack' && x.who === 0);
          const f = evs.find((x) => x.kind === 'attack' && x.who > 0);
          if (p && f) expect(Math.abs(f.t - p.t), `seed ${seed}`).toBeGreaterThan(1e-6); // (builds diferentes: velocidade diferente, então só o empate conta)
        }
      }
    });
  }
});

describe('QA 1v1 (Duelo)', () => {
  it('relógio monótono, número = barra, quem caiu não age', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const g = fightSteps(side(SPECIAL_FAMILIES[seed % 7], 12, seed), side(SPECIAL_FAMILIES[(seed + 3) % 7], 12, seed + 1), { seed, stopAtFirstKo: true }); // o Duelo para no 1º KO (sem ele, a régua mede o "fantasma")
      const evs: FightEvent[] = [];
      let r = g.next();
      while (!r.done) { evs.push(r.value); r = g.next(1); }
      let lastT = 0; const dead = new Set<number>(); let prev: readonly number[] = [1, 1];
      for (let i = 0; i < evs.length; i++) {
        const e = evs[i];
        expect(e.t).toBeGreaterThanOrEqual(lastT - 1e-9); lastT = e.t;
        if (e.kind === 'attack' || e.kind === 'cast') expect(dead.has(e.side)).toBe(false); if (e.kind === 'ko') dead.add(e.side);
        if (!(i > 0 && evs[i - 1].kind === 'cast') && (e.kind === 'attack' || e.kind === 'tick')) expect(prev[1 - e.side] - e.hp[1 - e.side]).toBeCloseTo(e.frac, 9);
        prev = e.hp;
      }
    }
  });
});
