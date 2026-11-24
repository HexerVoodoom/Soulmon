import { describe, it, expect } from 'vitest';
import {
  JOURNEY_ESSENCES_DAILY_CAP, JOURNEY_ITEMS_DAILY_CAP, JOURNEY_KEYS, capLoot, chestLoot, completionLoot, emptyLedger, focusElapsed,
  journeyChests, journeyProgress, trailAt, trailSpine,
} from './focusJourney';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';

describe('jornada do foco (§247)', () => {
  it('baús: 6 em 25 min e 10 em 50, em ordem dentro do foco, mesma seed = mesma lista', () => {
    const a = journeyChests(42, 'p25');
    expect(a).toHaveLength(6);
    expect(journeyChests(42, 'p50')).toHaveLength(10);
    expect(journeyChests(42, 'p25')).toEqual(a);
    for (let i = 1; i < a.length; i++) expect(a[i].at).toBeGreaterThan(a[i - 1].at);
    expect(a.every(c => c.at > 0 && c.at < 1)).toBe(true);
  });
  it('cerca de 40% dos baús são especiais, de todos os tipos', () => {
    const all = Array.from({ length: 2000 }, (_, s) => journeyChests(s, 'p25')).flat();
    const esp = all.filter(c => c.type !== 'common');
    expect(esp.length / all.length).toBeGreaterThan(0.37);
    expect(esp.length / all.length).toBeLessThan(0.43);
    for (const k of JOURNEY_KEYS) expect(esp.some(c => c.type === k)).toBe(true);
  });
  it('relógio: pausa não conta; progresso trava em 1', () => {
    const c = { startAt: 0, pausedMs: 60_000, pausedAt: null, mode: 'p25' as const };
    expect(focusElapsed(c, 5 * 60_000)).toBe(4 * 60_000);
    expect(focusElapsed({ ...c, pausedAt: 5 * 60_000 }, 9 * 60_000)).toBe(4 * 60_000);
    expect(journeyProgress(c, 3_600_000)).toBe(1);
  });
  it('especial sem a chave dá o comum (D-2); com a chave, o conteúdo do tipo', () => {
    const chest = { k: 2, at: 0.4, type: 'brejo' as const };
    const sem = chestLoot(7, chest, [], 'forest');
    expect(sem).toHaveLength(1);
    expect(sem[0].kind).not.toBe('essence');
    expect(chestLoot(7, chest, ['brejo'], 'forest', 1)).toEqual([{ kind: 'essence', id: expect.stringMatching(/^(planta|vida|vigor|ar)$/), qty: 1 }]);
    expect(chestLoot(7, chest, ['brejo'], 'forest')).toEqual(chestLoot(7, chest, ['brejo'], 'forest'));
  });
  it('material do baú é sempre do cenário', () => {
    for (const env of FOCUS_ENVIRONMENTS) for (let s = 0; s < 50; s++) for (const it of chestLoot(s, { k: 0, at: 0.1, type: 'relampago' }, ['relampago'], env.id)) {
      if (it.kind === 'material') expect(env.materials as readonly string[]).toContain(it.id);
    }
  });
  it('conclusão: 1ª dá baú comum, 2ª a 4ª essência + comida, 5ª a 7ª um item simples, 8ª nada', () => {
    expect(completionLoot(1, 1, 'shore')).toHaveLength(1);
    expect(completionLoot(1, 3, 'shore').map(i => i.kind)).toEqual(['essence', 'food']);
    expect(completionLoot(1, 5, 'shore')).toHaveLength(1);
    expect(completionLoot(1, 8, 'shore')).toEqual([]);
  });
  it('tetos do dia cortam o excesso e o mesmo recibo não paga duas vezes', () => {
    let l = emptyLedger('2026-11-08');
    for (let i = 0; i < JOURNEY_ITEMS_DAILY_CAP + 2; i++) l = capLoot(l, `c${i}`, [{ kind: 'food', id: '🍎', qty: 1 }, { kind: 'essence', id: 'agua', qty: 1 }]).ledger;
    expect(l.items).toBe(JOURNEY_ITEMS_DAILY_CAP);
    expect(l.ess).toBe(JOURNEY_ESSENCES_DAILY_CAP);
    expect(capLoot(l, 'c3', [{ kind: 'food', id: '🍎', qty: 1 }]).granted).toEqual([]);
  });
  it('trilha: dentro das margens, sobe do começo ao fim', () => {
    const sp = trailSpine(9, 'p25');
    expect(sp.every(p => p.x >= 0.2 && p.x <= 0.8)).toBe(true);
    expect(trailAt(sp, 0).y).toBe(0);
    expect(trailAt(sp, 1).y).toBeCloseTo(6, 6);
    expect(trailAt(sp, 0.5).y).toBeGreaterThan(trailAt(sp, 0.25).y);
  });
});

describe('pausa longa (D-4)', () => {
  it('parado além de 30 min volta a contar como foco', () => {
    const c = { startAt: 0, pausedMs: 0, pausedAt: 60_000, mode: 'p25' as const };
    expect(focusElapsed(c, 60_000 + 10 * 60_000)).toBe(60_000);
    expect(focusElapsed(c, 60_000 + 40 * 60_000)).toBe(60_000 + 10 * 60_000);
  });
});
