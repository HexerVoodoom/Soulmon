import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { parseStage, isEvolution, pushEvent, purgeFeedOf, feedView, buildEvent, EVO_FEED_MAX, EVO_FEED_TTL_MS } from './_evoFeed.js';

// Faixa de evoluções (04/11/2026): o feed global entra pelo `profile` (subiu de estágio + aparece na lista pública) e sai por `evoFeed`.
// Privacidade: só quem JÁ está na lista pública (PvP aberto, sem `publicHidden`); esconder-se tira do feed; nada de saveId na resposta.

const ALICE = 'a'.repeat(32);
const BRUNO = 'b'.repeat(32);
const PID_A = 'aa'.repeat(12);
const PID_B = 'bb'.repeat(12);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, pid, name, extra = {}) => JSON.stringify({
  id, pid, name, petName: `Sombra${name}`, stage: 'rookie', pvpEnabled: true, attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), ...extra,
});
const mundo = () => ({
  DIGIAPP_SAVES: fakeKV({
    [`profile:${ALICE}`]: perfil(ALICE, PID_A, 'Mateus'),
    [`profile:${BRUNO}`]: perfil(BRUNO, PID_B, 'Bruno'),
    [`pid:${PID_A}`]: ALICE, [`pid:${PID_B}`]: BRUNO,
    [ALICE]: JSON.stringify({ evolutionStage: 'rookie', totalXP: 99999 }),
    [BRUNO]: JSON.stringify({ evolutionStage: 'rookie', totalXP: 99999 }),
  }),
});
const post = (env, id, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=profile&id=${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...body }) }),
  env,
});
const feed = async (env) => (await (await onRequest({ request: new Request('https://x.dev/api/community?action=evoFeed'), env })).json()).events;

describe('_evoFeed (puro)', () => {
  it('parseStage só aceita estágio e alinhamento de lista fechada', () => {
    expect(parseStage('champion-harmony')).toEqual({ tier: 'champion', branch: 'harmony', rank: 2 });
    expect(parseStage('ultra')).toEqual({ tier: 'ultra', branch: null, rank: 5 });
    expect(parseStage('champion-<script>')).toBeNull();
    expect(parseStage('dragon-power')).toBeNull();
    expect(parseStage(42)).toBeNull();
  });
  it('isEvolution: sobe de tier até o Champion ou mais; sem estágio anterior não conta', () => {
    expect(isEvolution('rookie', 'champion-power')).toBe(true);
    expect(isEvolution('champion-power', 'ultimate-power')).toBe(true);
    expect(isEvolution('champion-power', 'champion-harmony')).toBe(false);
    expect(isEvolution('ultimate-power', 'champion-power')).toBe(false);
    expect(isEvolution(undefined, 'champion-power')).toBe(false);
    expect(isEvolution('bb', 'rookie')).toBe(false);
  });
  it('pushEvent: mais novo primeiro, sem repetir (jogador, estágio), poda por idade e por tamanho', () => {
    const now = 1_000_000_000_000;
    const ev = (by, tier = 'champion', at = now) => buildEvent({ by, name: by, petName: 'P', stage: `${tier}-power`, now: at });
    let f = pushEvent([], ev('a'), now);
    f = pushEvent(f, ev('a'), now);
    expect(f).toHaveLength(1);
    f = pushEvent(f, ev('a', 'ultimate'), now);
    expect(f).toHaveLength(2);
    for (let i = 0; i < 40; i++) f = pushEvent(f, ev(`p${i}`), now);
    expect(f).toHaveLength(EVO_FEED_MAX);
    expect(pushEvent([ev('velho', 'champion', now - EVO_FEED_TTL_MS - 1)], ev('novo'), now).map(e => e.by)).toEqual(['novo']);
  });
  it('purgeFeedOf e feedView: some quem se escondeu; a vista não leva o `by`', () => {
    const now = Date.now();
    const f = [buildEvent({ by: 'x', name: 'X', petName: 'P', stage: 'champion-power', now }), buildEvent({ by: 'y', name: 'Y', petName: 'Q', stage: 'mega-harmony', now })];
    expect(purgeFeedOf(f, 'x').map(e => e.by)).toEqual(['y']);
    expect(JSON.stringify(feedView(f, now))).not.toMatch(/"by"/);
  });
});

describe('community › evoFeed', () => {
  it('quem sobe de estágio entra no feed com apelido, criatura, forma e alinhamento; a resposta não traz saveId nem pid', async () => {
    const env = mundo();
    expect(await feed(env)).toEqual([]);
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-harmony', pvpEnabled: true, publicHidden: false });
    const ev = await feed(env);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ name: 'Mateus', pet: 'Sombra', tier: 'champion', branch: 'harmony' });
    const txt = JSON.stringify(ev);
    expect(txt).not.toContain(ALICE);
    expect(txt).not.toContain(PID_A);
  });
  it('reenviar o mesmo estágio não repete o aviso', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-harmony', pvpEnabled: true });
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-harmony', pvpEnabled: true });
    expect(await feed(env)).toHaveLength(1);
  });
  it('quem está escondido da lista pública NÃO entra no feed', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true, publicHidden: true });
    expect(await feed(env)).toEqual([]);
  });
  it('quem se esconde DEPOIS sai do feed na hora', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true });
    await post(env, BRUNO, { name: 'Bruno', petName: 'Brasa', stage: 'champion-power', pvpEnabled: true });
    expect(await feed(env)).toHaveLength(2);
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true, publicHidden: true });
    const ev = await feed(env);
    expect(ev.map(e => e.name)).toEqual(['Bruno']);
  });
  it('sem PvP aberto (abaixo do gate de Vínculo) o perfil não gera aviso', async () => {
    const env = mundo();
    env.DIGIAPP_SAVES.store.set(ALICE, JSON.stringify({ evolutionStage: 'rookie', totalXP: 0 }));
    env.DIGIAPP_SAVES.store.set(`profile:${ALICE}`, perfil(ALICE, PID_A, 'Mateus', { pvpEnabled: false }));
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true });
    expect(await feed(env)).toEqual([]);
  });
  it('estágio malformado do cliente não vira aviso', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power<b>', pvpEnabled: true });
    expect(await feed(env)).toEqual([]);
  });
});
