import { describe, expect, it } from 'vitest';
import {
  REVIVE_HP_FRAC, addOne, canOfferRevive, consumeOne, heartsOwned, reviveSeed, reviveStart, rollSparkDrop, sparksOwned,
  SPARK_ITEM_EMOJI,
} from './dungeonRevive';
import { HEART_ITEM_EMOJI, SPARK_HOME_ENERGY, SPECIAL_ITEMS } from './shop';
import { specialRefusal, applySpecialItem } from './specialItemUse';
import { dungeonFoe } from './dungeonBase';
import { dungeonFight, dungeonFightSeed } from './dungeonFight';
import { groupFightSteps, type GroupEvent, type GroupResult, type GroupOptions } from './combate/group';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import { ENERGY_TRIGGER } from './combate/specials';
import { dropName } from './dungeonDrops';

function run(opts: Partial<GroupOptions>, L = 3, slot = 2) {
  const f = dungeonFight({ combatant: combatantAt(L, REFERENCE_BUILDS.balanced), family: 'direct' }, dungeonFoe(L, slot, 1), 1234, true);
  const g = groupFightSteps(f.player, f.foes, { seed: f.seed, hitScale: f.hitScale, ...opts });
  const evs: GroupEvent[] = [];
  let r = g.next();
  while (!r.done) { evs.push(r.value); r = g.next(r.value.kind === 'cast' ? 1 : undefined); }
  return { evs, res: r.value as GroupResult };
}

describe('Coraçãozinho na queda', () => {
  it('a oferta só existe com ao menos 1 Coraçãozinho', () => {
    expect(canOfferRevive({})).toBe(false);
    expect(canOfferRevive(undefined)).toBe(false);
    expect(canOfferRevive({ [HEART_ITEM_EMOJI]: 0 })).toBe(false);
    expect(canOfferRevive({ [HEART_ITEM_EMOJI]: 1 })).toBe(true);
    expect(heartsOwned({ [HEART_ITEM_EMOJI]: 3 })).toBe(3);
  });
  it('gasta exatamente 1 do inventário e some a chave ao zerar; sem estoque não muda nada', () => {
    const inv = { [HEART_ITEM_EMOJI]: 2, '🍎': 1 };
    const a = consumeOne(inv, HEART_ITEM_EMOJI);
    expect(a[HEART_ITEM_EMOJI]).toBe(1);
    expect(inv[HEART_ITEM_EMOJI]).toBe(2); // não muta
    const b = consumeOne(a, HEART_ITEM_EMOJI);
    expect(HEART_ITEM_EMOJI in b).toBe(false);
    expect(b['🍎']).toBe(1);
    expect(consumeOne(b, HEART_ITEM_EMOJI)).toBe(b); // idempotente
  });
  it('volta com 50% do HP máximo e o inimigo mantém o HP que tinha', () => {
    expect(REVIVE_HP_FRAC).toBe(0.5);
    const s = reviveStart(0.37);
    expect(s.hp).toBe(0.5);
    expect(s.foesHp).toEqual([0.37]);
    expect(s.energy).toBe(0);
    expect(reviveStart(2).foesHp[0]).toBe(1);
    expect(reviveStart(0).foesHp[0]).toBeGreaterThan(0);
  });
  it('a continuação é determinística e usa semente derivada diferente da original', () => {
    expect(reviveSeed(99, 1)).toBe(reviveSeed(99, 1));
    expect(reviveSeed(99, 1)).not.toBe(99);
    expect(reviveSeed(99, 1)).not.toBe(reviveSeed(99, 2));
    const st = reviveStart(0.4);
    const a = run({ seed: reviveSeed(1234, 1), startHp: st.hp, startEnergy: 0, startFoesHp: st.foesHp });
    const b = run({ seed: reviveSeed(1234, 1), startHp: st.hp, startEnergy: 0, startFoesHp: st.foesHp });
    expect(a.res).toEqual(b.res);
    expect(a.evs.length).toBe(b.evs.length);
  });
  it('o inimigo segue do HP da queda (não reinicia cheio) e o Soulmon começa com 50%', () => {
    const { evs } = run({ startHp: 0.5, startFoesHp: [0.25] });
    expect(evs[0].foesHp[0]).toBeLessThanOrEqual(0.25 + 1e-9);
    const cheio = run({ startHp: 0.5 });
    expect(cheio.evs[0].foesHp[0]).toBeGreaterThan(0.25);
  });
  it('o Coraçãozinho continua com o uso antigo (cura na pastinha)', () => {
    expect(SPECIAL_ITEMS[HEART_ITEM_EMOJI].kind).toBe('heart');
  });
});

describe('Faísca de Alma', () => {
  it('é um item NOVO, separado do coração, com nome PT/EN', () => {
    expect(SPARK_ITEM_EMOJI).not.toBe(HEART_ITEM_EMOJI);
    expect(SPECIAL_ITEMS[SPARK_ITEM_EMOJI].kind).toBe('spark');
    expect(dropName('spark', true)).toBe('Faísca de Alma');
    expect(dropName('spark', false)).toBe('Soul Spark');
  });
  it('cai como o coraçãozinho (sorteio por inimigo) e soma 1 ao inventário', () => {
    expect(rollSparkDrop(() => 0)).toBe(true);
    expect(rollSparkDrop(() => 0.99)).toBe(false);
    const inv = addOne({}, SPARK_ITEM_EMOJI);
    expect(sparksOwned(inv)).toBe(1);
  });
  it('nos Arquivos restaura a energia da Home e gasta 1; cheia, recusa e volta intacta', () => {
    const base = { foodInventory: { [SPARK_ITEM_EMOJI]: 2 }, energyPoints: 1, evolutionStage: 'rookie', energyClock: { at: 1000, carry: 0 } } as never;
    const now = new Date(1000);
    expect(specialRefusal(base, SPARK_ITEM_EMOJI, now)).toBeUndefined();
    const r = applySpecialItem(base, SPARK_ITEM_EMOJI, now);
    expect(r.refused).toBeUndefined();
    expect((r.state as { energyPoints: number }).energyPoints).toBe(1 + SPARK_HOME_ENERGY);
    expect((r.state as { foodInventory: Record<string, number> }).foodInventory[SPARK_ITEM_EMOJI]).toBe(1);
    const cheia = { ...(base as object), energyPoints: 8 } as never;
    expect(specialRefusal(cheia, SPARK_ITEM_EMOJI, now)).toBe('already-full');
    expect(applySpecialItem(cheia, SPARK_ITEM_EMOJI, now).state).toBe(cheia);
  });
  it('a energia não passa do máximo do estágio', () => {
    const base = { foodInventory: { [SPARK_ITEM_EMOJI]: 1 }, energyPoints: 6, evolutionStage: 'rookie', energyClock: { at: 1000, carry: 0 } } as never;
    expect((applySpecialItem(base, SPARK_ITEM_EMOJI, new Date(1000)).state as { energyPoints: number }).energyPoints).toBe(8);
  });
});
void dungeonFightSeed;
