/**
 * MEMÓRIA DA BIBLIOTECA NO SAVE (10/11/2026): `librarySeen` e `libraryForms`. Paridade de forma entre o servidor
 * (`_libraryMemory.js`) e o cliente (`src/utils/librarySeen.ts`, `libraryForms.ts`) + o caminho real de `save.js`.
 */
import { describe, it, expect, vi } from 'vitest';
import { sanitizeLibrarySeen, sanitizeLibraryForms, SEEN_MAX, FORMS_PLAYERS_MAX, FORMS_PER_PLAYER_MAX } from './_libraryMemory.js';
import { sanitizeSeenIds, SEEN_MAX as C_SEEN_MAX } from '../../src/utils/librarySeen';
import { sanitizeFormsMap, MAX_PLAYERS_FORMS, MAX_FORMS_PER_PLAYER } from '../../src/utils/libraryForms';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'd'.repeat(32);
const OK = 'https://images.higgs.ai/';
const f = (stage, date, url = null) => ({ stage, spriteUrl: url, element: 'fogo', date });

function env() {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async key => store.get(key) ?? null,
    getWithMetadata: async key => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
}
const post = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});

describe('paridade servidor x cliente', () => {
  it('tetos iguais', () => {
    expect(SEEN_MAX).toBe(C_SEEN_MAX);
    expect(FORMS_PLAYERS_MAX).toBe(MAX_PLAYERS_FORMS);
    expect(FORMS_PER_PLAYER_MAX).toBe(MAX_FORMS_PER_PLAYER);
    expect(FORMS_PER_PLAYER_MAX).toBeLessThanOrEqual(20);
  });
  it('librarySeen: mesma saída do cliente nos casos hostis', () => {
    const casos = [['a', 'b', 'a', 7, null, '<x>', 'sim_0001'], Array.from({ length: 520 }, (_, i) => 'id' + i), [], ['x'.repeat(65)]];
    for (const c of casos) expect(sanitizeLibrarySeen(c)).toEqual(sanitizeSeenIds(c));
    expect(sanitizeLibrarySeen('x')).toBeUndefined();
    expect(sanitizeLibrarySeen({})).toBeUndefined();
  });
  it('libraryForms: mesma saída do cliente (URL boa mantida, fora da allowlist = null, ordem, teto)', () => {
    const entrada = {
      amigo: [f('mega-power', 9, OK + 'm.png'), f('rookie', 2, OK + 'r.png'), f('ultra', 11, 'https://atacante.example/u.png'), f('rookie', 7, OK + 'r.png'), { stage: '<x>' }],
      '<id ruim>': [f('rookie', 1)],
      muitos: Array.from({ length: 30 }, (_, i) => f('champion-power', i + 1, OK + i + '.png')),
      vazio: [],
    };
    expect(sanitizeLibraryForms(entrada)).toEqual(sanitizeFormsMap(entrada));
    expect(sanitizeLibraryForms([1])).toBeUndefined();
    expect(sanitizeLibraryForms('x')).toBeUndefined();
  });
});

describe('save.js — memória da Biblioteca', () => {
  it('preserva o saneado (ids, formas) e data: não vira URL', async () => {
    const e = env();
    await post(e, { librarySeen: ['a', 'b', 'a', 5, '<x>'], libraryForms: { amigo: [f('rookie', 1, OK + 'r.png'), f('mega', 2, 'data:image/png;base64,AAAA')] } });
    const s = JSON.parse(e.store.get(ID));
    expect(s.librarySeen).toEqual(['a', 'b']);
    expect(s.libraryForms.amigo).toEqual([f('rookie', 1, OK + 'r.png'), f('mega', 2, null)]);
  });
  it('descarta o campo sem forma, sem afetar o resto do save', async () => {
    const e = env();
    await post(e, { librarySeen: 'x', libraryForms: [1], defeatedElements: ['fogo'] });
    const s = JSON.parse(e.store.get(ID));
    expect(s.librarySeen).toBeUndefined();
    expect(s.libraryForms).toBeUndefined();
    expect(s.defeatedElements).toEqual(['fogo']);
  });
  it('save antigo (sem os campos) segue aceito', async () => {
    const e = env();
    await post(e, { defeatedElements: ['fogo'] });
    const s = JSON.parse(e.store.get(ID));
    expect('librarySeen' in s).toBe(false);
  });
});
