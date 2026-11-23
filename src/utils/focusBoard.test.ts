import { describe, it, expect } from 'vitest';
import { applyJourneyGrants, keyEarned, sanitizeJourneyCredited, type JourneyCreditState } from './focusBoard';
import { emptyDraft } from './focoSessao';

describe('quadro da Oficina (§247)', () => {
  it('cada chave pede a técnica feita; cards de tarefa valem sem tarefas (D-3)', () => {
    const d = emptyDraft();
    const o = { noTasks: false, dumpDone: false };
    expect(keyEarned('bancada', d, o)).toBe(false);
    expect(keyEarned('bancada', { ...d, prepChecked: { water: true } }, o)).toBe(true);
    expect(keyEarned('relampago', d, o)).toBe(false);
    expect(keyEarned('relampago', d, { ...o, noTasks: true })).toBe(true);
    expect(keyEarned('brejo', { ...d, frog: 't1' }, o)).toBe(true);
    expect(keyEarned('elo', { ...d, ifThen: { cue: 'a', action: '' } }, o)).toBe(false);
    expect(keyEarned('elo', { ...d, ifThen: { cue: 'a', action: 'b' } }, o)).toBe(true);
    expect(keyEarned('pena', d, { ...o, dumpDone: true })).toBe(true);
  });
  it('crédito idempotente: o mesmo recibo não credita duas vezes; chave da masmorra entra', () => {
    const s0: JourneyCreditState = { foodInventory: {}, essences: {} };
    const grants = { 'x:0': [{ kind: 'material' as const, id: 'moss' as const, qty: 1 }], 'x:1': [{ kind: 'essence' as const, id: 'planta', qty: 2 }, { kind: 'food' as const, id: '🍎', qty: 1 }] };
    const s1 = applyJourneyGrants(s0, '2026-11-08', grants, '2026-11-08');
    expect(s1.buildingQuests?.materials.moss).toBe(1);
    expect(s1.essences?.planta).toBe(2);
    expect(s1.foodInventory['🍎']).toBe(1);
    expect(s1.dungeonKeyDay).toBe('2026-11-08');
    expect(applyJourneyGrants(s1, '2026-11-08', grants, '2026-11-08')).toBe(s1);
    const s2 = applyJourneyGrants(s1, '2026-11-08', { ...grants, 'x:2': [{ kind: 'material', id: 'moss', qty: 1 }] });
    expect(s2.buildingQuests?.materials.moss).toBe(2);
  });
  it('lixo no save vira undefined', () => {
    expect(sanitizeJourneyCredited({ day: 'x', ids: [] })).toBeUndefined();
    expect(sanitizeJourneyCredited({ day: '2026-11-08', ids: ['a', 'a', 3] })).toEqual({ day: '2026-11-08', ids: ['a'] });
  });
});
