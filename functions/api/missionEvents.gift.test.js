import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { isoWeekOf } from './_missionEvents.js';

// REGISTRO §309: o presente ACEITO pelo servidor e o evento confirmado da semanal gift-sent e da diaria d-presente.
const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const PA = 'pida0000000000000000000a';
const PB = 'pidb0000000000000000000b';
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }) };
}
const perfil = (id, pid, extra = {}) => JSON.stringify({ id, pid, name: `Nome${pid.slice(3, 4)}`, petName: 'pet', stage: 'rookie', pvpEnabled: true,
  attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), ...extra });
const mundo = () => ({ DIGIAPP_SAVES: fakeKV({
  [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { friends: [A] }),
  [`pid:${PA}`]: A, [`pid:${PB}`]: B, [`gmir:${A}`]: '1',
}) });
const gift = async (env, friendId) => {
  const r = await onRequest({ request: new Request('https://x.dev/api/community?action=gift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: A, friendId }) }), env });
  return r.status;
};

describe('presente aceito -> razao das missoes', () => {
  it('um presente aceito grava 1 no dia do remetente; o 2o (429) nao soma; amigo invalido nao grava', async () => {
    const env = mundo();
    const dia = new Date().toISOString().slice(0, 10);
    const chave = `mval:${A}:${isoWeekOf(dia)}:g`;
    expect(await gift(env, 'pidc0000000000000000000c')).toBe(403);
    expect(env.DIGIAPP_SAVES.store.has(chave)).toBe(false);
    expect(await gift(env, PB)).toBe(200);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(chave))).toEqual({ [dia]: 1 });
    expect(await gift(env, PB)).toBe(429);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(chave))).toEqual({ [dia]: 1 });
  });
});
