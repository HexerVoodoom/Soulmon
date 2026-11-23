// Conjuntos de andares do Rift (REGISTRO §445): ordem, 2 andares por conjunto, mini-boss, estágios por nº de elementos, determinismo.
import { describe, expect, it } from 'vitest';
import {
  RIFT_MINIBOSS_EXTRA_FLOORS, RIFT_MINIBOSS_SLOT, RIFT_SET_COUNT, RIFT_STAGE_BY_COUNT, isMiniBossFight, isMiniBossLayer, riftSetOfLayer, riftWavePlan,
  type RiftCount,
} from './riftSets';
import { dungeonWaveOf } from './dungeonAway';
import { buildDungeonWave } from './dungeon';
import { dungeonFoe } from './dungeonBase';
import { DUNGEON_FIGHTS_PER_FLOOR } from './dungeonIdle';
import { ELEMENTOS_DA_MASMORRA } from './dungeonElementos';
import { ENEMY_ROSTER, pickEnemyDoConjunto } from './enemyRoster';
import { mulberry32 } from './combate/rng';

const ORDEM = ['rookie', 'champion', 'ultimate', 'mega'] as const;
/** A melhor forma que o PRÓPRIO elemento tem no estágio pedido ou abaixo (Ultimate → Champion → Rookie); só então acima. */
const melhorForma = (el: string, pedido: (typeof ORDEM)[number]): string => {
  const tem = new Set(ENEMY_ROSTER.filter(e => e.element === el && e.kind !== 'mascote').map(e => e.stage));
  const i0 = ORDEM.indexOf(pedido);
  return [...ORDEM.slice(0, i0 + 1).reverse(), ...ORDEM.slice(i0 + 1)].find(st => tem.has(st))!;
};
const stageDe = (key: string): string => key.slice(key.lastIndexOf('-') + 1);
/** A primeira camada (1-based) de cada contagem de elementos. */
const primeiraCamada = (n: RiftCount): number => {
  const i = ELEMENTOS_DA_MASMORRA.findIndex((_, k) => riftSetOfLayer(2 * k + 1).count === n);
  return 2 * i + 1;
};

describe('riftSets: a ordem dos conjuntos', () => {
  it('são 273 conjuntos: 20 base, 190 pares, 44 trios, 19 quádruplos, nesta ordem', () => {
    expect(RIFT_SET_COUNT).toBe(273);
    const seq = Array.from({ length: RIFT_SET_COUNT }, (_, k) => riftSetOfLayer(2 * k + 1).count);
    const corridas: [number, number][] = [];
    for (const c of seq) {
      const u = corridas[corridas.length - 1];
      if (u && u[0] === c) u[1]++; else corridas.push([c, 1]);
    }
    expect(corridas).toEqual([[1, 20], [2, 190], [3, 44], [4, 19]]);
  });

  it('cada conjunto ocupa 2 andares seguidos e o seguinte começa no andar 2k+3', () => {
    for (let k = 0; k < 40; k++) {
      const a = riftSetOfLayer(2 * k + 1);
      const b = riftSetOfLayer(2 * k + 2);
      expect(b.element).toBe(a.element);
      expect([a.part, b.part]).toEqual([1, 2]);
      expect(riftSetOfLayer(2 * k + 3).element).not.toBe(a.element);
    }
  });

  it('depois do último conjunto a lista dá a volta (o andar 547 é o 1)', () => {
    expect(riftSetOfLayer(2 * RIFT_SET_COUNT + 1).element).toBe(riftSetOfLayer(1).element);
    expect(riftSetOfLayer(999).index).toBeLessThan(RIFT_SET_COUNT);
  });

  it('entrada ruim cai no andar 1', () => {
    expect(riftSetOfLayer(Number.NaN).index).toBe(0);
    expect(riftSetOfLayer(-5).part).toBe(1);
  });
});

describe('riftSets: estágios e mini-boss', () => {
  it('estágios por nº de elementos: comuns e mini-boss', () => {
    expect(RIFT_STAGE_BY_COUNT[1]).toEqual({ common: 'rookie', boss: 'champion' });
    expect(RIFT_STAGE_BY_COUNT[2]).toEqual({ common: 'champion', boss: 'ultimate' });
    expect(RIFT_STAGE_BY_COUNT[3]).toEqual({ common: 'ultimate', boss: 'mega' });
    expect(RIFT_STAGE_BY_COUNT[4].common).toBe('mega');
  });

  it('o mini-boss é a ÚLTIMA luta do 2º andar do conjunto, e só ela', () => {
    expect(RIFT_MINIBOSS_SLOT).toBe(DUNGEON_FIGHTS_PER_FLOOR - 1);
    for (let layer = 1; layer <= 12; layer++) {
      for (let slot = 0; slot < DUNGEON_FIGHTS_PER_FLOOR; slot++) {
        expect(isMiniBossFight(layer, slot)).toBe(layer % 2 === 0 && slot === 5);
      }
    }
    expect(isMiniBossLayer(1)).toBe(false);
    expect(isMiniBossLayer(2)).toBe(true);
  });

  it('o plano só traz mini-boss no último andar; o gancho do Ultra só nos de 4 elementos', () => {
    for (const n of [1, 2, 3, 4] as RiftCount[]) {
      const l = primeiraCamada(n);
      expect(riftWavePlan(l).miniBoss).toBeUndefined();
      expect(riftWavePlan(l + 1).miniBoss).toBe(RIFT_STAGE_BY_COUNT[n].boss);
      expect(riftWavePlan(l + 1).comum).toBe(RIFT_STAGE_BY_COUNT[n].common);
      expect(riftWavePlan(l + 1).miniBossUltra).toBe(n === 4);
      expect(riftWavePlan(l).miniBossUltra).toBe(false);
    }
  });
});

describe('riftSets: a onda do Rift', () => {
  const wave = (layer: number) => dungeonWaveOf(12345, layer, 20, 'ultimate');

  it('conjunto de 1 elemento: comuns Rookie e mini-boss Champion', () => {
    expect(wave(1).map(e => stageDe(e.stage))).toEqual(Array(6).fill('rookie'));
    expect(wave(2).map(e => stageDe(e.stage))).toEqual([...Array(5).fill('rookie'), 'champion']);
  });

  it('conjunto de 2 elementos: comuns Champion e mini-boss Ultimate (ou a melhor forma que o próprio par tem)', () => {
    const l = primeiraCamada(2);
    const el = riftSetOfLayer(l).element;
    const boss = melhorForma(el, 'ultimate');
    expect(wave(l).map(e => stageDe(e.stage))).toEqual(Array(6).fill('champion'));
    expect(wave(l + 1).map(e => stageDe(e.stage))).toEqual([...Array(5).fill('champion'), boss]);
  });

  it('conjunto de 3 elementos: comuns Ultimate e mini-boss Mega', () => {
    const l = primeiraCamada(3);
    expect(wave(l).map(e => stageDe(e.stage))).toEqual(Array(6).fill('ultimate'));
    expect(wave(l + 1).map(e => stageDe(e.stage))).toEqual([...Array(5).fill('ultimate'), melhorForma(riftSetOfLayer(l).element, 'mega')]);
  });

  it('conjunto de 4 elementos: comuns Mega e mini-boss Mega (gancho do Ultra)', () => {
    const l = primeiraCamada(4);
    expect(wave(l).map(e => stageDe(e.stage))).toEqual(Array(6).fill('mega'));
    expect(wave(l + 1).map(e => stageDe(e.stage))).toEqual(Array(6).fill('mega'));
  });

  it('todo conjunto, nos quatro estágios, tem criatura (nunca falha)', () => {
    for (const el of ELEMENTOS_DA_MASMORRA) {
      for (const stage of ['rookie', 'champion', 'ultimate', 'mega'] as const) {
        expect(pickEnemyDoConjunto(30, mulberry32(7), { stage, element: el }), `${el}/${stage}`).toBeDefined();
      }
    }
  });

  it('mini-boss dos 190 pares e dos 44 trios: sempre forma do PRÓPRIO conjunto, no melhor estágio que ele tem', () => {
    let pares = 0;
    let trios = 0;
    for (const el of ELEMENTOS_DA_MASMORRA) {
      const n = riftSetOfLayer(2 * ELEMENTOS_DA_MASMORRA.indexOf(el) + 1).count;
      if (n !== 2 && n !== 3) continue;
      n === 2 ? pares++ : trios++;
      const pedido = RIFT_STAGE_BY_COUNT[n].boss;
      for (const seed of [1, 2, 3]) {
        const e = pickEnemyDoConjunto(30, mulberry32(seed), { stage: pedido, element: el })!;
        expect(e.element, `${el} seed ${seed}`).toBe(el);
        expect(e.stage, `${el} seed ${seed}`).toBe(melhorForma(el, pedido));
      }
    }
    expect([pares, trios]).toEqual([190, 44]);
  });

  it('o inimigo é do elemento do conjunto quando existe forma dele no estágio', () => {
    const l = primeiraCamada(1);
    const el = riftSetOfLayer(l).element;
    const doElemento = new Set(ENEMY_ROSTER.filter(e => e.element === el).map(e => e.key));
    for (const e of wave(l)) expect(doElemento.has(e.stage), e.stage).toBe(true);
  });

  it('o mini-boss é mais forte que o mesmo lugar sem mini-boss; os comuns não mudam', () => {
    const el = riftSetOfLayer(2).element;
    const com = buildDungeonWave(10, 'ultimate', mulberry32(9), 20, el, riftWavePlan(2));
    const sem = buildDungeonWave(10, 'ultimate', mulberry32(9), 20, el, riftWavePlan(1));
    for (let s = 0; s < 5; s++) expect(com[s].foe.combatant).toEqual(sem[s].foe.combatant);
    expect(com[5].foe.combatant.hp).toBeGreaterThan(sem[5].foe.combatant.hp);
    expect(com[5].foe.combatant.bonus).toBeGreaterThan(sem[5].foe.combatant.bonus);
    expect(com[5].foe.combatant).toEqual(dungeonFoe(20, 5, 10 + RIFT_MINIBOSS_EXTRA_FLOORS).combatant);
  });

  it('determinístico: mesma semente e andar, mesma onda', () => {
    expect(dungeonWaveOf(1, 300, 12, 'champion')).toEqual(dungeonWaveOf(1, 300, 12, 'champion'));
  });

  it('soft lock é possível: nada abranda a força com a profundidade (HP e força só sobem)', () => {
    const f = (floor: number) => dungeonFoe(40, 5, floor).combatant;
    expect(f(900).hp).toBeGreaterThan(f(100).hp * 5);
    expect(f(900).bonus).toBeGreaterThan(f(100).bonus);
  });

  it('sem plano (Pesadelo, RogueFight) a onda é a de antes', () => {
    const a = buildDungeonWave(3, 'ultimate', mulberry32(5), 20);
    const b = buildDungeonWave(3, 'ultimate', mulberry32(5), 20, undefined, undefined);
    expect(a).toEqual(b);
  });
});
