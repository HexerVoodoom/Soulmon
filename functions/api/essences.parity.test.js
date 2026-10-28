import { describe, it, expect, vi } from 'vitest';
import * as server from './_essences.js';
import { enforceEssenceAway, sanitizeEssenceAway } from './_dayCounters.js';
import { sanitizeEssences, sanitizeEssenceAway as cEssenceAway, ESSENCE_MAX_PER_ELEMENT, ESSENCE_MAX_KEYS, essenceQtyOfBoss } from '../../src/utils/essences';
import { essenceDoChefe } from './_feira.js';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'd'.repeat(32);
const env = () => { const store = new Map(); return { DIGIAPP_SAVES: { get: async k => store.get(k) ?? null, getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }), put: async (k, v) => store.set(k, v) }, store }; };
const post = (e, state) => save({ request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }), env: e });

describe('essências: servidor e app', () => {
  it('mesmos tetos e mesma saneação', () => {
    expect(server.ESSENCE_MAX_PER_ELEMENT).toBe(ESSENCE_MAX_PER_ELEMENT);
    expect(server.ESSENCE_MAX_KEYS).toBe(ESSENCE_MAX_KEYS);
    const cases = [{}, { fogo: 2 }, { fogo: 2.9, X: 3, a: 1, lava: -1, agua: 'x', ok_id: 5e9 }, { fogo: NaN }, Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`e${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`, i + 1]))];
    for (const c of cases) expect(server.sanitizeEssences(c), JSON.stringify(c).slice(0, 60)).toEqual(sanitizeEssences(c));
    for (const v of [null, 5, 'x', []]) { expect(server.sanitizeEssences(v)).toBeUndefined(); expect(sanitizeEssences(v)).toEqual({}); }
  });
  it('essenceAway: mesma saneação e monotônico no dia', () => {
    for (const c of [{ day: '2026-10-28', count: 12.7 }, { day: 'x', count: 1 }, { day: '2026-10-28', count: 5000 }, null]) expect(sanitizeEssenceAway(c)).toEqual(cEssenceAway(c));
    const d = '2026-10-28'; const now = Date.parse('2026-10-28T12:00:00Z');
    expect(enforceEssenceAway({ day: d, count: 1 }, { day: d, count: 9 }, now)).toEqual({ day: d, count: 9 });
  });
  it('quantidade do chefe bate nos dois lados', () => { for (let l = 1; l <= 20; l++) expect(essenceDoChefe(l)).toBe(essenceQtyOfBoss(l)); });
  it('enforceEssences é monotônico por elemento', () => {
    expect(server.enforceEssences({ fogo: 1, agua: 5 }, { fogo: 4, terra: 2 })).toEqual({ fogo: 4, agua: 5, terra: 2 });
    expect(server.enforceEssences(undefined, { fogo: 4 })).toEqual({ fogo: 4 });
  });
  it('save.js: sanea, não deixa baixar nem apagar, e descarta lixo', async () => {
    const e = env();
    await post(e, { essences: { fogo: 5, LIXO: 3, agua: 2 } });
    expect(JSON.parse(e.store.get(ID)).essences).toEqual({ fogo: 5, agua: 2 });
    await post(e, { essences: { fogo: 1 } });
    expect(JSON.parse(e.store.get(ID)).essences).toEqual({ fogo: 5, agua: 2 });
    await post(e, { gamePoints: 1 });
    expect(JSON.parse(e.store.get(ID)).essences).toEqual({ fogo: 5, agua: 2 });
    await post(e, { essences: { fogo: 7 }, essenceAway: { day: '2026-10-28', count: 12 } });
    expect(JSON.parse(e.store.get(ID)).essences.fogo).toBe(7);
    expect(JSON.parse(e.store.get(ID)).essenceAway).toEqual({ day: '2026-10-28', count: 12 });
  });
});
