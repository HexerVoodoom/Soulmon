import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import * as srv from './_spriteRegen.js';
import { SPRITE_REGEN_COST_CREDITS, sanitizeRegenUsed, regenMonthOf } from '../../src/utils/spriteRegen';
import { normalizeSpriteLibrary } from '../../src/utils/spriteLibrary';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'd'.repeat(32);
function env() {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async key => store.get(key) ?? null,
    getWithMetadata: async key => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
}
const post = (e, spriteLibrary) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { spriteLibrary } }) }),
  env: e,
});

describe('save.js: o espelho spriteLibrary.regenUsed é saneado no servidor e nunca recusa o save', () => {
  it('formas e meses válidos passam; o resto some', async () => {
    const e = env();
    const r = await post(e, { sprites: {}, regenUsed: { rookie: '2026-10', hacker: '2026-10', ultra: '2026-13', 'mega-power': 7 } });
    expect(r.status).toBe(200);
    expect(JSON.parse(e.store.get(ID)).spriteLibrary.regenUsed).toEqual({ rookie: '2026-10' });
  });
  it('lixo inteiro vira ausente (campo removido, resto do acervo intacto)', async () => {
    const e = env();
    const r = await post(e, { sprites: { rookie: { url: 'https://images.higgs.ai/a.png', formId: 'rookie', at: 1 } }, regenUsed: 'x' });
    expect(r.status).toBe(200);
    const salvo = JSON.parse(e.store.get(ID)).spriteLibrary;
    expect('regenUsed' in salvo).toBe(false);
    expect(salvo.sprites.rookie.formId).toBe('rookie');
  });
  it('save antigo (sem o campo) segue como estava', async () => {
    const e = env();
    expect((await post(e, { sprites: {} })).status).toBe(200);
    expect('regenUsed' in JSON.parse(e.store.get(ID)).spriteLibrary).toBe(false);
  });
});

describe('"Gerar de novo": servidor e app concordam', () => {
  it('o mesmo preço', () => {
    expect(srv.SPRITE_REGEN.costCredits).toBe(SPRITE_REGEN_COST_CREDITS);
  });

  it('o mesmo mês (UTC, AAAA-MM)', () => {
    for (const ms of [0, Date.parse('2026-01-31T23:59:59Z'), Date.parse('2026-12-31T23:59:59Z'), Date.parse('2027-03-01T00:00:00Z')]) {
      expect(srv.regenMonthOf(ms)).toBe(regenMonthOf(ms));
    }
  });

  const casos = [
    null, undefined, 3, 'x', [], {}, { rookie: '2026-10' }, { rookie: '2026-13' }, { rookie: '2026-00' }, { rookie: '26-10' }, { rookie: 20261 },
    { ultra: '2026-10', 'mega-power': '2025-02' }, { 'champion-power': '2026-10', hacker: '2026-10', __proto__: { rookie: '2026-10' } },
    { 'mega-nothing': '2026-10' }, { ROOKIE: '2026-10' }, { rookie: null }, { rookie: {} }, { rookie: ['2026-10'] },
  ];
  it('a saneação de regenUsed bate em entradas boas e hostis', () => {
    for (const c of casos) expect(srv.sanitizeRegenUsed(c), JSON.stringify(c)).toEqual(sanitizeRegenUsed(c));
  });

  it('a leitura tolerante do save (normalizeSpriteLibrary) usa a mesma saneação', () => {
    for (const c of casos) {
      const lib = normalizeSpriteLibrary({ sprites: {}, regenUsed: c });
      expect(lib.regenUsed, JSON.stringify(c)).toEqual(sanitizeRegenUsed(c));
    }
  });

  it('save antigo (sem o campo) segue válido e não ganha o campo', () => {
    expect('regenUsed' in normalizeSpriteLibrary({ sprites: {} })).toBe(false);
    expect('regenUsed' in normalizeSpriteLibrary(null)).toBe(false);
  });

  it('o servidor sanea o campo no POST do save (save.js liga o sanitizador)', () => {
    const fonte = readFileSync('functions/api/save.js', 'utf8');
    expect(fonte).toContain("import { sanitizeRegenUsed } from './_spriteRegen.js';");
    expect(fonte).toMatch(/sanitizeRegenUsed\(acervoSprites\.regenUsed\)/);
  });
});
