/**
 * BALANÇO da jornada do foco (§247, D-6: "medindo antes do merge"). Mede a renda por sessão e por dia contra a Oficina de antes
 * (teto de 8 itens por dia, sem essência), em 2000 seeds por cenário. Rode com `JORNADA_MEDIR=1` para imprimir a tabela.
 */
import { describe, it, expect } from 'vitest';
import {
  JOURNEY_ESSENCES_DAILY_CAP, JOURNEY_ITEMS_DAILY_CAP, JOURNEY_KEYS, capLoot, chestLoot, completionLoot, emptyLedger, journeyChests,
  type JourneyKeyId,
} from './focusJourney';
import { FOCUS_LOOT_DAILY_CAP } from './focusExpedition';

function dia(sessoes: number, chaves: readonly JourneyKeyId[], seed0: number) {
  let l = emptyLedger('2026-11-08');
  for (let s = 0; s < sessoes; s++) {
    const seed = seed0 * 31 + s;
    for (const ch of journeyChests(seed, 'p25')) l = capLoot(l, `${seed}:${ch.k}`, chestLoot(seed, ch, chaves, 'forest')).ledger;
    l = capLoot({ ...l, done: l.done + 1 }, `${seed}:done`, completionLoot(seed, l.done + 1, 'forest')).ledger;
  }
  return l;
}
const media = (sessoes: number, chaves: readonly JourneyKeyId[]) => {
  let it = 0, ess = 0;
  for (let s = 0; s < 2000; s++) { const l = dia(sessoes, chaves, s); it += l.items; ess += l.ess; }
  return { itens: it / 2000, ess: ess / 2000 };
};

describe('balanço da jornada (§247)', () => {
  const sem1 = media(1, []), com1 = media(1, JOURNEY_KEYS), sem2 = media(2, []), com2 = media(2, JOURNEY_KEYS), com4 = media(4, JOURNEY_KEYS);
  it.skipIf(!process.env.JORNADA_MEDIR)('tabela', () => {
    for (const [n, m] of Object.entries({ sem1, com1, sem2, com2, com4 })) console.log(`MED ${n} itens=${m.itens.toFixed(2)} ess=${m.ess.toFixed(2)}`);
  });
  it('uma sessão sem chave rende 7 itens (6 baús + a conclusão), sem essência', () => {
    expect(sem1.itens).toBeCloseTo(7, 1);
    expect(sem1.ess).toBe(0);
  });
  it('as chaves rendem mais, sem passar dos tetos do dia', () => {
    expect(com1.itens + com1.ess).toBeGreaterThan(sem1.itens + 1);
    expect(com4.itens).toBeLessThanOrEqual(JOURNEY_ITEMS_DAILY_CAP);
    expect(com4.ess).toBeLessThanOrEqual(JOURNEY_ESSENCES_DAILY_CAP);
  });
  it('o teto do dia é no máximo o dobro da Oficina de antes', () => {
    expect(JOURNEY_ITEMS_DAILY_CAP).toBeLessThanOrEqual(FOCUS_LOOT_DAILY_CAP * 2);
    expect(com2.itens).toBeLessThanOrEqual(JOURNEY_ITEMS_DAILY_CAP);
  });
});
