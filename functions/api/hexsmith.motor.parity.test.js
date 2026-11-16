/**
 * PARIDADE da HEXSMITH H2 (16/11/2026): o motor 1v1 do app (`fight.ts`) e o do servidor (`_combate.js`) leem o MESMO `specialEffect`
 * (`hot`, `slow`, `silence`) e as 3 famílias só de Coroa (`defBuff`, `atkDebuff`, `spdDebuff`), com o MESMO log de eventos inteiro.
 * Se uma cópia divergir, o duelo PvP que o cliente anima não é o que o servidor decidiu, e não há erro nenhum.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_combate.js';
import * as duelSrv from './_duel.js';
import * as hexSrv from './_hexsmith.js';
import * as fightApp from '../../src/utils/combate/fight';
import * as levelApp from '../../src/utils/combate/level';
import * as specialsApp from '../../src/utils/combate/specials';
import * as duelApp from '../../src/utils/combate/duel';
import * as hexApp from '../../src/utils/hexsmith';

const BUILDS = Object.keys(levelApp.REFERENCE_BUILDS);
/** As 10 famílias + as 3 variantes de efeito, em ordem estável: `[família, efeito?]`. */
const ESPECIAIS = [
  ...specialsApp.ALL_SPECIAL_FAMILIES.map((f) => [f, undefined]),
  ['shield', 'hot'], ['defDebuff', 'slow'], ['defDebuff', 'silence'],
];
const SEEDS = [13, 7932, 15851, 23770, 31689];
const TETO = Array.from({ length: duelApp.DUEL_CHEER_BUCKETS }, () => specialsApp.CHEER.tapsCapPerBucket);

const ladoApp = (L, build, [fam, ef]) => ({ combatant: levelApp.combatantAt(L, levelApp.REFERENCE_BUILDS[build]), special: specialsApp.specialOf(fam, ef) });
const ladoSrv = (L, build, [fam, ef]) => ({ combatant: srv.combatantAt(L, srv.REFERENCE_BUILDS[build]), special: srv.specialOf(fam, ef) });
const jogar = (mod, a, b, opts) => {
  const g = mod.fightSteps(a, b, opts);
  const events = [];
  let r = g.next();
  while (!r.done) { events.push(r.value); r = g.next(1); }
  return { events, result: r.value };
};

describe('constantes da H2 iguais nos dois lados', () => {
  it('famílias, poder, botões do 1v1 e efeito válido por família', () => {
    expect([...srv.SPECIAL_FAMILIES]).toEqual([...specialsApp.SPECIAL_FAMILIES]);
    expect([...srv.CROWN_ONLY_FAMILIES]).toEqual([...specialsApp.CROWN_ONLY_FAMILIES]);
    expect([...srv.ALL_SPECIAL_FAMILIES]).toEqual([...specialsApp.ALL_SPECIAL_FAMILIES]);
    expect(srv.SPECIAL_POWER).toEqual(specialsApp.SPECIAL_POWER);
    expect(srv.EFFECT_TUNE_PVP).toEqual(specialsApp.EFFECT_TUNE_PVP);
    expect(srv.FAMILY_TUNE).toEqual(specialsApp.FAMILY_TUNE);
    expect(srv.EFFECT_FAMILY).toEqual(specialsApp.EFFECT_FAMILY);
    expect(hexSrv.HEX_MAX_OWNED).toBe(hexApp.HEX_MAX_OWNED);
  });

  it('specialOf(família, efeito): igual com efeito válido, fora da família ou lixo (o efeito só vale na família-base)', () => {
    const lixo = [undefined, null, '', 'x', 7, {}, 'hot', 'slow', 'silence'];
    for (const f of [...specialsApp.ALL_SPECIAL_FAMILIES, 'nada', undefined]) {
      for (const e of lixo) {
        const a = specialsApp.specialOf(typeof f === 'string' && specialsApp.isSpecialFamily(f) ? f : 'direct', typeof e === 'string' ? e : undefined);
        const b = srv.specialOf(f, e);
        if (typeof f === 'string' && specialsApp.isSpecialFamily(f)) expect(b, `${f}/${String(e)}`).toEqual(a);
        else expect(b.family).toBe('direct');
      }
    }
    expect(srv.specialOf('shield', 'hot').effect).toBe('hot');
    expect(srv.specialOf('direct', 'hot').effect).toBeUndefined();
    expect(srv.specialOf('defDebuff', 'hot').effect).toBeUndefined();
  });

  it('as Coroas novas valem no servidor e no app: mesmo id aceito, mesma reescrita', () => {
    for (const v of [...specialsApp.CROWN_ONLY_FAMILIES, ...hexApp.HEX_CROWN_EFFECTS]) {
      const id = `coroa:${v}`;
      expect(hexSrv.parseHexItem(id), id).toEqual(hexApp.parseHexItem(id));
      const state = { owned: [id], equipped: { coroa: id } };
      expect(hexSrv.hexOverrides(state), id).toEqual(hexApp.hexOverrides(state));
    }
    expect(hexSrv.parseHexItem('coroa:naoexiste')).toBeUndefined();
  });
});

describe('fightSteps(): o MESMO log de eventos e o MESMO resultado, com os efeitos e as famílias novas', () => {
  it('15 levels × 4 builds × 13 especiais × 5 sementes, com e sem torcida (7800 lutas)', () => {
    let n = 0;
    for (const L of levelApp.RULER_LEVELS) {
      BUILDS.forEach((build, bi) => {
        ESPECIAIS.forEach((esp, ei) => {
          SEEDS.forEach((seed, si) => {
            const outro = BUILDS[(bi + 1 + (si % 3)) % 4];
            const outroEsp = ESPECIAIS[(ei + 1 + (si % 11)) % ESPECIAIS.length];
            for (const torcida of [false, true]) {
              const optsApp = { seed, hpScale: fightApp.PVP_HP_SCALE, ...(torcida ? { cheer: duelApp.duelCheerEvents(TETO, 0) } : {}) };
              const optsSrv = { seed, hpScale: srv.PVP_HP_SCALE, ...(torcida ? { cheer: duelSrv.duelCheerEvents(TETO, 0) } : {}) };
              const a = jogar(fightApp, ladoApp(L, build, esp), ladoApp(L, outro, outroEsp), optsApp);
              const b = jogar(srv, ladoSrv(L, build, esp), ladoSrv(L, outro, outroEsp), optsSrv);
              if (JSON.stringify(a) !== JSON.stringify(b)) expect(b, `L${L} ${build}/${esp} × ${outro}/${outroEsp} seed ${seed} torcida ${torcida}`).toEqual(a);
              n++;
            }
          });
        });
      });
    }
    expect(n).toBe(15 * 4 * 13 * 5 * 2);
  });

  it('com stopAtFirstKo, hitScale, startHp e startEnergy também (os ganchos do núcleo)', () => {
    for (let s = 0; s < 60; s++) {
      const L = levelApp.RULER_LEVELS[s % 15];
      const opts = {
        seed: s * 31 + 1, stopAtFirstKo: s % 2 === 0, startHp: [1, 0.6], startEnergy: [30, 10],
        hitScale: (who, n) => (who === 0 ? 1 : n % 3 === 0 ? 0 : 1.2),
      };
      const a = jogar(fightApp, ladoApp(L, BUILDS[s % 4], ESPECIAIS[s % 13]), ladoApp(L, 'balanced', ESPECIAIS[(s + 5) % 13]), opts);
      const b = jogar(srv, ladoSrv(L, BUILDS[s % 4], ESPECIAIS[s % 13]), ladoSrv(L, 'balanced', ESPECIAIS[(s + 5) % 13]), opts);
      expect(b).toEqual(a);
    }
  });

  it('simulateDuel (servidor) = simulatePvp (cliente) com os especiais de efeito', () => {
    for (let s = 0; s < 80; s++) {
      const L = levelApp.RULER_LEVELS[s % 15];
      const me = ladoSrv(L, BUILDS[s % 4], ESPECIAIS[s % 13]);
      const opp = ladoSrv(L, BUILDS[(s >> 2) % 4], ESPECIAIS[(s * 5 + 3) % 13]);
      const taps = s % 2 ? TETO : undefined;
      const a = duelApp.simulatePvp({ me, opp, seed: s * 97 + 5, taps });
      const b = duelSrv.simulateDuel({ me, opp, seed: s * 97 + 5, taps });
      const { fx: _fx, ...aSemFx } = a;
      expect(b).toEqual(aSemFx);
    }
  });
});

describe('H4: o servidor publica fx.efeito e o nome do especial segue o léxico do efeito (cliente = servidor)', () => {
  const save = (coroa) => ({ evolutionStage: 'rookie', perfectDays: 30, hexsmith: { owned: [`coroa:${coroa}`], equipped: { coroa: `coroa:${coroa}` } } });
  it('Coroa de efeito publica efeito; Coroa de família e sem Coroa não publicam', () => {
    expect(duelSrv.duelSide(save('slow')).fx.efeito).toBe('slow');
    expect(duelSrv.duelSide(save('silence')).fx.efeito).toBe('silence');
    expect(duelSrv.duelSide(save('hot')).fx.efeito).toBe('hot');
    expect('efeito' in duelSrv.duelSide(save('dot')).fx).toBe(false);
    expect('efeito' in duelSrv.duelSide({ evolutionStage: 'rookie', perfectDays: 30 }).fx).toBe(false);
  });
});
