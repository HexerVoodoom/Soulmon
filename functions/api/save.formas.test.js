import { describe, it, expect, vi } from 'vitest';

// Formas e elemento (10/11/2026): o servidor guarda o blob do cliente e o devolve SEM perder `formaSnapshots`, `formaAltEquipada`,
// `formasAlt`, `potionElement` e as chaves `forma@elemento` de `spriteLibrary.sprites` (round-trip). Save do dono, anonimizado.
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');

const ID = 'c'.repeat(32);
function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const mk = () => ({ DIGIAPP_SAVES: fakeKV(), FIREBASE_PROJECT_ID: 'soulmon-test' });
const post = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});
const get = e => save({ request: new Request(`https://x/api/save?id=${ID}`, { method: 'GET' }), env: e });
const lido = e => JSON.parse(e.DIGIAPP_SAVES.store.get(ID));

const SABBAT = { id: 'sabbat', base: 'sombra' };
const estado = () => ({
  evolutionStage: 'ultimate-power',
  potionElement: 'fada',
  formasAlt: { 'ultimate-power': ['original', 'sabbat'], 'ultimate-harmony': ['fada'] },
  formaAltEquipada: { 'ultimate-power': 'original', 'ultimate-harmony': 'fada' },
  formaSnapshots: {
    'ultimate-harmony@fada': { pocao: 'fada', elemento: SABBAT },
    'ultimate-power@sabbat': { elemento: SABBAT },
    'ultimate-power@original': {},
  },
  spriteLibrary: {
    sprites: {
      'ultimate-power': { url: '/api/sprite-image?k=422ecb01294a4fd798e998143bb04098', formId: 'ultimate-power', provider: 'higgsfield', at: 1 },
      'ultimate-power@sabbat': { url: '/api/sprite-image?k=b77cb20da447403eae6a04173c3c8db1', formId: 'ultimate-power@sabbat', provider: 'higgsfield', at: 2 },
    },
    failures: {}, pendingTune: null, reverted: ['ultimate-power'],
  },
});

describe('save.js — formas e elemento: round-trip', () => {
  it('grava e devolve formaSnapshots, formaAltEquipada, formasAlt e potionElement sem perder nada', async () => {
    const e = mk();
    expect((await post(e, estado())).status).toBe(200);
    const g = lido(e);
    expect(g.formaSnapshots).toEqual(estado().formaSnapshots);
    expect(g.formaAltEquipada).toEqual(estado().formaAltEquipada);
    expect(g.formasAlt).toEqual(estado().formasAlt);
    expect(g.potionElement).toBe('fada');
  });

  it('as chaves forma@elemento do acervo de sprites sobrevivem (a original não é sobrescrita pela alternativa)', async () => {
    const e = mk();
    await post(e, estado());
    const sprites = lido(e).spriteLibrary?.sprites ?? {};
    expect(Object.keys(sprites)).toEqual(expect.arrayContaining(['ultimate-power', 'ultimate-power@sabbat']));
    expect(sprites['ultimate-power'].url).not.toBe(sprites['ultimate-power@sabbat'].url);
    expect(lido(e).spriteLibrary.reverted).toEqual(['ultimate-power']);
  });

  it('gravar de novo o que veio do GET não muda nada (idempotente: relogin/offline não regrava elemento)', async () => {
    const e = mk();
    await post(e, estado());
    const depois = await (await get(e)).json();
    const corpo = depois.state ?? depois;
    expect((await post(e, corpo)).status).toBe(200);
    const g = lido(e);
    expect(g.formaSnapshots).toEqual(estado().formaSnapshots);
    expect(g.formaAltEquipada).toEqual(estado().formaAltEquipada);
    expect(g.potionElement).toBe('fada');
  });

  it('conta sem poção: o save passa sem ganhar poção nem fotos', async () => {
    const e = mk();
    await post(e, { evolutionStage: 'champion-power', formasAlt: { 'champion-power': ['sombra'] }, formaAltEquipada: { 'champion-power': 'sombra' } });
    const g = lido(e);
    expect(g.potionElement).toBeUndefined();
    expect(g.formaSnapshots).toBeUndefined();
    expect(g.formaAltEquipada).toEqual({ 'champion-power': 'sombra' });
  });
});
