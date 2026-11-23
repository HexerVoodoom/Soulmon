import { describe, it, expect } from 'vitest';
import { sanitizeSeenIds, unionSeenIds, addSeenToState, SEEN_MAX } from './librarySeen';
import { sanitizeFormsMap, unionFormsMaps, recordFormsInState, MAX_PLAYERS_FORMS, MAX_FORMS_PER_PLAYER } from './libraryForms';

const OK = 'https://images.higgs.ai/';
const f = (stage: string, date = 1, url: string | null = null) => ({ stage, spriteUrl: url, element: 'fogo', date });

describe('librarySeen no save', () => {
  it('sanitiza: só ids seguros, sem repetir, ordem preservada, lixo = []', () => {
    expect(sanitizeSeenIds(['a', 'b', 'a', 7, null, '<x>', '', 'c'.repeat(65), 'sim_0001'])).toEqual(['a', 'b', 'sim_0001']);
    expect(sanitizeSeenIds('x')).toEqual([]);
    expect(sanitizeSeenIds({ a: 1 })).toEqual([]);
  });
  it('teto de 500: os mais recentes ficam', () => {
    const ids = Array.from({ length: SEEN_MAX + 20 }, (_, i) => 'id' + i);
    const r = sanitizeSeenIds(ids);
    expect(r).toHaveLength(SEEN_MAX);
    expect(r[r.length - 1]).toBe('id519');
    expect(r[0]).toBe('id20');
  });
  it('união: o save manda na ordem, o local entra, nunca perde id e rodar 2x = no-op', () => {
    const u = unionSeenIds(['n1', 'n2'], ['n2', 'l1']);
    expect(u).toEqual(['n1', 'n2', 'l1']);
    expect(unionSeenIds(u, ['n2', 'l1'])).toEqual(u);
    expect(unionSeenIds(u, u)).toEqual(u);
  });
  it('addSeenToState: já visto/inválido devolve o MESMO objeto (sem save à toa)', () => {
    const s = { librarySeen: ['a'] };
    expect(addSeenToState(s, 'a')).toBe(s);
    expect(addSeenToState(s, '')).toBe(s);
    expect(addSeenToState(s, '<b>')).toBe(s);
    expect(addSeenToState(s, 'b').librarySeen).toEqual(['a', 'b']);
    expect(addSeenToState({} as { librarySeen?: string[] }, 'z').librarySeen).toEqual(['z']);
  });
});

describe('libraryForms no save', () => {
  it('sanitiza: ids seguros, formas validas, URL fora da allowlist vira null, <= 8 por jogador', () => {
    const forms = Array.from({ length: 30 }, (_, i) => f('rookie', i + 1, OK + i + '.png'));
    const m = sanitizeFormsMap({ ok: [f('mega-power', 5, 'https://atacante.example/x.png')], '<x>': [f('rookie')], vazio: [], lixo: 'x', muitos: forms });
    expect(Object.keys(m).sort()).toEqual(['muitos', 'ok']);
    expect(m.ok[0].spriteUrl).toBeNull();
    expect(m.muitos.length).toBe(MAX_FORMS_PER_PLAYER);
    expect(sanitizeFormsMap([1])).toEqual({});
    expect(sanitizeFormsMap(null)).toEqual({});
  });
  it('teto de jogadores', () => {
    const big: Record<string, unknown[]> = {};
    for (let i = 0; i < MAX_PLAYERS_FORMS + 30; i++) big['p' + i] = [f('rookie')];
    expect(Object.keys(sanitizeFormsMap(big))).toHaveLength(MAX_PLAYERS_FORMS);
  });
  it('união por jogador: nunca perde forma, sem duplicar, 2x = no-op', () => {
    const a = { amigo: [f('rookie', 5), f('mega-power', 9)] };
    const b = { amigo: [f('rookie', 2), f('ultra', 11)], outro: [f('rookie', 1)] };
    const u = unionFormsMaps(a, b);
    expect(u.amigo.map(x => x.stage)).toEqual(['rookie', 'mega-power', 'ultra']);
    expect(u.amigo[0].date).toBe(2);
    expect(Object.keys(u)).toEqual(['amigo', 'outro']);
    expect(unionFormsMaps(u, b)).toEqual(u);
    expect(unionFormsMaps(u, u)).toEqual(u);
  });
  it('recordFormsInState: nada mudou = o MESMO objeto', () => {
    const s0 = { libraryForms: { a: [f('rookie', 5)] } };
    expect(recordFormsInState(s0, 'a', [f('rookie', 99)])).toBe(s0);
    const s1 = recordFormsInState(s0, 'a', [f('ultra', 3)]);
    expect(s1).not.toBe(s0);
    expect(s1.libraryForms.a.map(x => x.stage)).toEqual(['rookie', 'ultra']);
    expect(recordFormsInState(s0, '<x>', [f('rookie')])).toBe(s0);
  });
});
