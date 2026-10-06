/**
 * PARIDADE do núcleo de combate v3 entre o app e o servidor (combate v3, PR5).
 *
 * `_combate.js` é um ESPELHO de `src/utils/combate/` (as Pages Functions não importam de `src/`), e o duelo
 * PvP é decidido no servidor. Se as duas cópias divergirem não há erro nenhum: só um duelo que o cliente
 * anima de um jeito e o servidor decide de outro. Por isso o encontro é COMPORTAMENTAL, como em
 * `soulXP.parity.test.js` e `bond.parity.test.js`: o log de eventos inteiro e o vencedor de `fight()`,
 * lidos dos DOIS módulos, em 15 `RULER_LEVELS` × 4 builds × 7 famílias × 10 sementes, com e sem torcida.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_combate.js';
import * as duelSrv from './_duel.js';
import * as fightApp from '../../src/utils/combate/fight';
import * as levelApp from '../../src/utils/combate/level';
import * as curveApp from '../../src/utils/combate/curve';
import * as rngApp from '../../src/utils/combate/rng';
import * as specialsApp from '../../src/utils/combate/specials';
import * as bonusApp from '../../src/utils/combate/bonus';
import * as duelApp from '../../src/utils/combate/duel';
import { soulCombatant as soulCombatantApp } from '../../src/utils/soulXP';
import { ESCOLA_FAMILY_PROVISORIO } from '../../src/utils/arena';

const BUILDS = Object.keys(levelApp.REFERENCE_BUILDS);
const FAMILIES = specialsApp.SPECIAL_FAMILIES;
const SEEDS = Array.from({ length: 10 }, (_, i) => i * 7919 + 13);
/** Torcida no teto: 16 toques em cada balde de 3 s, até 60 s. */
const TETO = Array.from({ length: duelApp.DUEL_CHEER_BUCKETS }, () => specialsApp.CHEER.tapsCapPerBucket);

const sideApp = (L, build, family) => ({ combatant: levelApp.combatantAt(L, levelApp.REFERENCE_BUILDS[build]), special: specialsApp.specialOf(family) });
const sideSrv = (L, build, family) => ({ combatant: srv.combatantAt(L, srv.REFERENCE_BUILDS[build]), special: srv.specialOf(family) });
const play = (mod, a, b, opts) => {
  const g = mod.fightSteps(a, b, opts);
  const events = [];
  let r = g.next();
  while (!r.done) { events.push(r.value); r = g.next(1); }
  return { events, result: r.value };
};

describe('as constantes do núcleo são as mesmas nos dois lados', () => {
  it('curve, level, rng, bonus, specials e fight', () => {
    expect(srv.CURVE_K).toBe(curveApp.CURVE_K);
    expect(srv.BASE_ATTACKS_PER_WINDOW).toBe(curveApp.BASE_ATTACKS_PER_WINDOW);
    expect([...srv.STAGE_LEVEL_CAPS]).toEqual([...levelApp.STAGE_LEVEL_CAPS]);
    expect(srv.MAX_LEVEL).toBe(levelApp.MAX_LEVEL);
    expect([srv.MAX_SHARE, srv.MIN_SHARE, srv.HP_BASE, srv.HP_LEVEL_DIVISOR, srv.STAGE_FACTOR])
      .toEqual([levelApp.MAX_SHARE, levelApp.MIN_SHARE, levelApp.HP_BASE, levelApp.HP_LEVEL_DIVISOR, levelApp.STAGE_FACTOR]);
    expect(srv.VARIANCE).toEqual(rngApp.VARIANCE);
    expect(srv.PHASE_SALT).toBe(rngApp.PHASE_SALT);
    expect(srv.COMBAT_BONUS_CAP).toBe(bonusApp.COMBAT_BONUS_CAP);
    expect(srv.SPECIAL_BUDGET_HITS).toBe(specialsApp.SPECIAL_BUDGET_HITS);
    expect([...srv.SPECIAL_FAMILIES]).toEqual([...specialsApp.SPECIAL_FAMILIES]);
    expect(srv.SPECIAL_POWER).toEqual(specialsApp.SPECIAL_POWER);
    expect(srv.ENERGY).toEqual(specialsApp.ENERGY);
    expect(srv.ENERGY_TRIGGER).toBe(specialsApp.ENERGY_TRIGGER);
    expect(srv.CHEER).toEqual(specialsApp.CHEER);
    expect([srv.MIRROR_SECONDS, srv.HIT_UNIT_H0, srv.PVP_HP_SCALE, srv.EPS, srv.DRAW_EPS])
      .toEqual([fightApp.MIRROR_SECONDS, fightApp.HIT_UNIT_H0, fightApp.PVP_HP_SCALE, fightApp.EPS, fightApp.DRAW_EPS]);
  });

  it('o mulberry32 e o combatente batem em todo level, com qualquer peso', () => {
    for (const seed of [0, 1, 42, 2 ** 31, 0xdeadbeef]) {
      const a = srv.mulberry32(seed), b = rngApp.mulberry32(seed);
      for (let i = 0; i < 20; i++) expect(a()).toBe(b());
      expect(srv.sideSeed(seed, 1)).toBe(rngApp.sideSeed(seed, 1));
      expect(srv.sideSeed(seed, 2)).toBe(rngApp.sideSeed(seed, 2));
    }
    const pesos = [levelApp.REFERENCE_BUILDS.atk, levelApp.REFERENCE_BUILDS.balanced, { atk: 5, def: 0, spd: 2 }, { atk: 0, def: 0, spd: 0 }, { atk: NaN, def: -3, spd: Infinity }];
    for (let L = 0; L <= levelApp.MAX_LEVEL + 3; L++) {
      for (const w of pesos) expect(srv.combatantAt(L, w, 0.05), `L${L} ${JSON.stringify(w)}`).toEqual(levelApp.combatantAt(L, w, 0.05));
    }
    expect(srv.clampLevel(NaN)).toBe(levelApp.clampLevel(NaN));
  });

  it('combinedBonus: o mesmo teto de 5% e a mesma limpeza de lixo', () => {
    const casos = [{}, { talent: 0.03 }, { talent: 0.03, equipment: 0.04 }, { talent: -1 }, { talent: NaN, equipment: Infinity }, { commerce: 0.02, rebirth: 0.02 }];
    for (const c of casos) expect(srv.combinedBonus(c), JSON.stringify(c)).toBe(bonusApp.combinedBonus(c));
  });

  it('a tabela escola → família do servidor é a PROVISÓRIA do app', () => {
    expect(duelSrv.ESCOLA_FAMILY).toEqual(ESCOLA_FAMILY_PROVISORIO);
  });
});

describe('fight(): o MESMO log de eventos e o MESMO vencedor nos dois lados', () => {
  it('15 levels × 4 builds × 7 famílias × 10 sementes, com e sem torcida (8400 lutas)', () => {
    let n = 0;
    let comTorcida = 0;
    for (const L of levelApp.RULER_LEVELS) {
      BUILDS.forEach((build, bi) => {
        FAMILIES.forEach((family, fi) => {
          SEEDS.forEach((seed, si) => {
            const outro = BUILDS[(bi + 1 + (si % 3)) % 4];
            const outraFamilia = FAMILIES[(fi + 1 + (si % 5)) % 7];
            for (const torcida of [false, true]) {
              const optsApp = { seed, hpScale: fightApp.PVP_HP_SCALE, ...(torcida ? { cheer: duelApp.duelCheerEvents(TETO, 0) } : {}) };
              const optsSrv = { seed, hpScale: srv.PVP_HP_SCALE, ...(torcida ? { cheer: duelSrv.duelCheerEvents(TETO, 0) } : {}) };
              const a = play(fightApp, sideApp(L, build, family), sideApp(L, outro, outraFamilia), optsApp);
              const b = play(srv, sideSrv(L, build, family), sideSrv(L, outro, outraFamilia), optsSrv);
              if (a.result.winner !== b.result.winner || JSON.stringify(a.events) !== JSON.stringify(b.events) || JSON.stringify(a.result) !== JSON.stringify(b.result)) {
                expect(b, `L${L} ${build}/${family} × ${outro}/${outraFamilia} seed ${seed} torcida ${torcida}`).toEqual(a);
              }
              n++;
              if (torcida) comTorcida++;
            }
          });
        });
      });
    }
    expect(n).toBe(15 * 4 * 7 * 10 * 2);
    expect(comTorcida).toBe(n / 2);
  });

  it('com stopAtFirstKo, hitScale, startHp e startEnergy também (os ganchos do núcleo)', () => {
    for (let s = 0; s < 40; s++) {
      const L = levelApp.RULER_LEVELS[s % 15];
      const opts = {
        seed: s * 31 + 1, stopAtFirstKo: s % 2 === 0, startHp: [1, 0.6], startEnergy: [30, 10],
        hitScale: (who, n) => (who === 0 ? 1 : n % 3 === 0 ? 0 : 1.2),
      };
      const a = play(fightApp, sideApp(L, BUILDS[s % 4], FAMILIES[s % 7]), sideApp(L, 'balanced', 'direct'), opts);
      const b = play(srv, sideSrv(L, BUILDS[s % 4], FAMILIES[s % 7]), sideSrv(L, 'balanced', 'direct'), opts);
      expect(b).toEqual(a);
    }
  });
});

describe('o duelo (`_duel.js`) é o do cliente (`combate/duel.ts`)', () => {
  it('simulateDuel: eventos, vencedor e placar iguais, com e sem torcida', () => {
    for (let s = 0; s < 60; s++) {
      const L = levelApp.RULER_LEVELS[s % 15];
      const me = sideSrv(L, BUILDS[s % 4], FAMILIES[s % 7]);
      const opp = sideSrv(L, BUILDS[(s >> 2) % 4], FAMILIES[(s >> 3) % 7]);
      const taps = s % 3 === 0 ? undefined : s % 3 === 1 ? TETO : Array.from({ length: 30 }, (_, i) => (i * 5 + s) % 20);
      const a = duelApp.simulatePvp({ me, opp, seed: s * 97 + 5, taps });
      const b = duelSrv.simulateDuel({ me, opp, seed: s * 97 + 5, taps });
      expect(b).toEqual(a);
    }
  });

  it('a higienização dos toques e a conta por balde são as mesmas', () => {
    const lixo = [undefined, null, 'x', [], [999, -4, NaN, '7', 3.9, Infinity], Array(60).fill(999), { 0: 5 }];
    for (const raw of lixo) {
      expect(duelSrv.sanitizeTaps(raw)).toEqual(duelApp.sanitizeTaps(raw));
      expect(duelSrv.duelCheerEvents(raw)).toEqual(duelApp.duelCheerEvents(raw));
    }
    expect(duelSrv.DUEL_CHEER_BUCKETS).toBe(duelApp.DUEL_CHEER_BUCKETS);
    expect(duelSrv.DUEL_CHEER_BUCKETS).toBe(20);
  });

  it('o combatente do SAVE: o servidor deriva o que o app deriva (level, galho, teto do estágio)', () => {
    const estagios = ['rookie', 'champion-power', 'ultimate-harmony', 'mega-benevolence', 'ultra', 'lixo', ''];
    for (const evolutionStage of estagios) {
      for (const perfectDays of [0, 1, 5, 20, 90, 400]) {
        for (const galho of [{}, { powerPoints: 10 }, { powerPoints: 2, harmonyPoints: 7, benevolencePoints: 4 }]) {
          const st = { evolutionStage, perfectDays, ...galho };
          expect(srv.soulCombatant(st), JSON.stringify(st)).toEqual(soulCombatantApp(st));
        }
      }
    }
  });
});

describe('RED: a divergência de uma constante SÓ no espelho derruba o encontro (o teste pode falhar)', () => {
  it('VARIANCE.sigma 0,08 → 0,15 só no servidor muda o log de eventos', () => {
    const L = 21;
    const optsApp = { seed: 5, hpScale: fightApp.PVP_HP_SCALE };
    const antes = JSON.stringify(play(fightApp, sideApp(L, 'atk', 'direct'), sideApp(L, 'def', 'dot'), optsApp).events);
    const velho = srv.VARIANCE.sigma;
    try {
      srv.VARIANCE.sigma = 0.15;
      const depois = JSON.stringify(play(srv, sideSrv(L, 'atk', 'direct'), sideSrv(L, 'def', 'dot'), { seed: 5, hpScale: srv.PVP_HP_SCALE }).events);
      expect(depois).not.toBe(antes);
      expect(srv.VARIANCE).not.toEqual(rngApp.VARIANCE);
    } finally { srv.VARIANCE.sigma = velho; }
    expect(srv.VARIANCE).toEqual(rngApp.VARIANCE);
  });
  it('CHEER.pvpEnergyPerDischarge 2,5 → 3 só no servidor muda a luta com torcida', () => {
    const L = 14;
    const run = (mod, cheer) => play(mod, mod === srv ? sideSrv(L, 'balanced', 'direct') : sideApp(L, 'balanced', 'direct'), mod === srv ? sideSrv(L, 'balanced', 'direct') : sideApp(L, 'balanced', 'direct'), { seed: 9, hpScale: 1.7, cheer }).events;
    const ev = duelApp.duelCheerEvents(TETO, 0);
    const antes = JSON.stringify(run(fightApp, ev));
    const velho = srv.CHEER.pvpEnergyPerDischarge;
    try {
      srv.CHEER.pvpEnergyPerDischarge = 3;
      expect(JSON.stringify(run(srv, ev))).not.toBe(antes);
    } finally { srv.CHEER.pvpEnergyPerDischarge = velho; }
    expect(JSON.stringify(run(srv, ev))).toBe(antes);
  });
});

describe('o espelho NÃO vai para o bundle do app (AC11: orçamento de bytes)', () => {
  it('nenhum arquivo de produção em src/ importa `functions/api/_combate` nem `_duel` (só testes)', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const raiz = resolve(__dirname, '../../src');
    const achados = [];
    const varre = (dir) => {
      for (const nome of readdirSync(dir)) {
        const p = join(dir, nome);
        if (statSync(p).isDirectory()) { varre(p); continue; }
        if (!/\.(ts|tsx)$/.test(nome) || /\.test\.(ts|tsx)$/.test(nome)) continue;
        const src = readFileSync(p, 'utf8');
        if (/from\s+['"][^'"]*functions\/api\/_(combate|duel)(\.js)?['"]/.test(src)) achados.push(p);
      }
    };
    varre(raiz);
    expect(achados).toEqual([]);
  });
});
