// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mergeForms, recordForms, readAllForms, readFormsOf, sanitizeForm, formStageLabel, MAX_FORMS_PER_PLAYER } from './libraryForms';
import { STORAGE_KEYS } from './storageKeys';

const OK = 'https://images.higgs.ai/a.png';
const f = (stage: string, spriteUrl: string | null = OK, date = 10, element: string | null = 'fogo') => ({ stage, spriteUrl, element, date });

describe('libraryForms', () => {
  beforeEach(() => localStorage.clear());

  it('dedupe: mesma forma (estagio + URL) nao duplica, fica a data mais antiga; idempotente', () => {
    const a = mergeForms([f('rookie', OK, 50)], [f('rookie', OK, 20), f('champion-power', OK + '?2', 30)]);
    expect(a).toHaveLength(2);
    expect(a[0]).toMatchObject({ stage: 'rookie', date: 20 });
    expect(mergeForms(a, [f('rookie', OK, 99)])).toEqual(a);
  });

  it('ordena por estagio e data e limita a 8', () => {
    const muitas = Array.from({ length: 12 }, (_, i) => f('rookie', `${OK}?${i}`, i + 1));
    const m = mergeForms([], [...muitas, f('mega-power')]);
    expect(m).toHaveLength(MAX_FORMS_PER_PLAYER);
    expect(m[0].stage).toBe('rookie');
  });

  it('seguranca: host fora da allowlist e data: viram null; lixo e estagio invalido saem', () => {
    expect(sanitizeForm(f('rookie', 'https://atacante.example/x.png'))!.spriteUrl).toBeNull();
    expect(sanitizeForm(f('rookie', 'https://images.higgs.ai@atacante.example/x.png'))!.spriteUrl).toBeNull();
    expect(sanitizeForm(f('rookie', 'data:image/png;base64,AAAA'))!.spriteUrl).toBeNull();
    expect(sanitizeForm(f('rookie', 'javascript:alert(1)'))!.spriteUrl).toBeNull();
    expect(sanitizeForm({ stage: '<x>', spriteUrl: OK })).toBeNull();
    expect(sanitizeForm(null)).toBeNull();
    expect(mergeForms([], [42, 'x', null])).toEqual([]);
  });

  it('persistencia: recordForms grava por id; leitura tolera lixo no storage', () => {
    recordForms('p1', [f('rookie')]);
    recordForms('p1', [f('rookie'), f('champion-harmony')]);
    expect(readFormsOf('p1').map(x => x.stage)).toEqual(['rookie', 'champion-harmony']);
    expect(readFormsOf('outro')).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.LIBRARY_FORMS, '[1,2]');
    expect(readAllForms()).toEqual({});
    localStorage.setItem(STORAGE_KEYS.LIBRARY_FORMS, JSON.stringify({ p: [f('rookie'), 'lixo'], q: 7 }));
    expect(Object.keys(readAllForms())).toEqual(['p']);
  });

  it('migracao: quem estava so em LIBRARY_SEEN ganha 1 forma ao gravar a atual', () => {
    localStorage.setItem(STORAGE_KEYS.LIBRARY_SEEN, JSON.stringify(['velho']));
    expect(readFormsOf('velho')).toEqual([]);
    recordForms('velho', [f('champion-power')]);
    expect(readFormsOf('velho')).toHaveLength(1);
  });

  it('rotulos PT/EN', () => {
    expect(formStageLabel('champion-power', false)).toBe('Champion · Power');
    expect(formStageLabel('mega-harmony', true)).toBe('Mega · Harmonia');
    expect(formStageLabel('rookie', true)).toBe('Iniciante');
  });
});
