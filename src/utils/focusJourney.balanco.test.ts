/**
 * BALANÇO da jornada do foco (§247, D-6: "medindo antes do merge"). Mede a renda por sessão e por dia contra a Oficina de antes
 * (teto de 8 itens por dia, sem essência), em 2000 seeds por cenário. Rode com `JORNADA_MEDIR=1` para imprimir a tabela.
 */
import { describe, it, expect } from 'vitest';
import {
  JOURNEY_ESSENCES_DAILY_CAP, JOURNEY_ITEMS_DAILY_CAP, JOURNEY_SESSION_ITEMS_CAP, JOURNEY_KEYS, capLoot, chestLoot, completionLoot, emptyLedger, journeyChests,
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
  it('uma sessão sem chave rende ~6,3 itens + ~0,7 essência (6 baús + a conclusão; 10% dos baús comuns viram essência com 1 elemento)', () => {
    expect(sem1.itens + sem1.ess).toBeCloseTo(7, 1);
    expect(sem1.ess).toBeCloseTo(0.7, 1);
  });
  it('teto por sessão: itens (fora essência) de uma sessão nunca passam de 1 por baú (6 no p25, 10 no p50)', () => {
    for (const mode of ['p25', 'p50'] as const) for (let s = 0; s < 500; s++) {
      const n = journeyChests(s, mode).reduce((a, ch) => a + chestLoot(s, ch, JOURNEY_KEYS, 'forest').filter(i => i.kind !== 'essence').reduce((q, i) => q + i.qty, 0), 0);
      expect(n).toBeLessThanOrEqual(JOURNEY_SESSION_ITEMS_CAP[mode]);
    }
  });
  it('essência por nº de elementos: a chance no baú comum sobe 10% → 25%', () => {
    const taxa = (elems: number) => { let e = 0; for (let s = 0; s < 4000; s++) if (chestLoot(s, { k: 0, at: 0.1, type: 'common' }, [], 'forest', elems)[0].kind === 'essence') e++; return e / 4000; };
    expect(taxa(1)).toBeCloseTo(0.10, 1);
    expect(taxa(2)).toBeCloseTo(0.15, 1);
    expect(taxa(3)).toBeCloseTo(0.20, 1);
    expect(taxa(4)).toBeCloseTo(0.25, 1);
    expect(chestLoot(3, { k: 0, at: 0.1, type: 'brejo' }, ['brejo'], 'forest', 3)).toEqual([{ kind: 'essence', id: 'planta', qty: 2 }]);
  });
  it('as chaves rendem mais, sem passar dos tetos do dia', () => {
    /* Opção A (22/11/2026): especial paga 1 item raro, então as chaves mudam a qualidade, não a contagem. */
    expect(com1.itens + com1.ess).toBeGreaterThanOrEqual(sem1.itens + sem1.ess - 0.01);
    expect(com1.ess).toBeGreaterThan(sem1.ess);
    expect(com4.itens).toBeLessThanOrEqual(JOURNEY_ITEMS_DAILY_CAP);
    expect(com4.ess).toBeLessThanOrEqual(JOURNEY_ESSENCES_DAILY_CAP);
  });
  it('o teto do dia (28, aprovado pelo dono em 22/11/2026) é no máximo 3,5x a Oficina de antes', () => {
    expect(JOURNEY_ITEMS_DAILY_CAP).toBeLessThanOrEqual(FOCUS_LOOT_DAILY_CAP * 3.5);
    expect(com2.itens).toBeLessThanOrEqual(JOURNEY_ITEMS_DAILY_CAP);
  });
});
