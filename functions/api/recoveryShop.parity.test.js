// Paridade cliente x servidor do Exchanger (Recuperar energia/vida) + regras do servidor (24/11/2026).
import { describe, it, expect } from 'vitest';
import { RECOVERY_ITEMS as CLI } from '../../src/utils/recoveryShop';
import { RECOVERY_ITEMS as SRV, buyRecovery, recoveryBoughtThisWeek } from './_recoveryShop.js';

const ID = 'a'.repeat(32);
const ENT = 'ent:';
function mem(credits = 1000) {
  const m = new Map([[ENT + ID, JSON.stringify({ tier: 'paid', credits })]]);
  const env = { SOULMON_SAVES: { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); } } };
  return { env, ent: () => JSON.parse(m.get(ENT + ID)) };
}

describe('Exchanger: paridade e regras do servidor', () => {
  it('cliente e servidor têm os mesmos itens, preços, tetos e efeitos', () => {
    expect(SRV).toEqual(CLI);
    expect(CLI.energy.credits).toBe(150); expect(CLI.life.credits).toBe(150);
    expect(CLI.energy.restores).toBe(5); expect(CLI.life.restores).toBe(1);
    expect(CLI.energy.weeklyCap).toBe(1); expect(CLI.life.weeklyCap).toBe(1);
  });
  it('compra debita o preço do servidor e conta 1 na semana; a 2ª na mesma semana é recusada sem debitar', async () => {
    const t = mem(1000); const now = Date.UTC(2026, 10, 24, 12);
    const a = await buyRecovery(t.env, ID, 'energy', 'op-energy-1', { nowMs: now });
    expect(a).toMatchObject({ ok: true, kind: 'energy', restores: 5, price: 150, leftThisWeek: 0 });
    expect(t.ent().credits).toBe(850);
    const b = await buyRecovery(t.env, ID, 'energy', 'op-energy-2', { nowMs: now });
    expect(b).toMatchObject({ ok: false, status: 409, reason: 'weekly-cap' });
    expect(t.ent().credits).toBe(850);
    // vida tem o contador próprio
    expect((await buyRecovery(t.env, ID, 'life', 'op-life-001', { nowMs: now })).ok).toBe(true);
    expect(t.ent().credits).toBe(700);
  });
  it('mesmo opId = mesma resposta, cobra uma vez só', async () => {
    const t = mem(1000); const now = Date.UTC(2026, 10, 24, 12);
    await buyRecovery(t.env, ID, 'life', 'op-life-001', { nowMs: now });
    const r = await buyRecovery(t.env, ID, 'life', 'op-life-001', { nowMs: now });
    expect(r).toMatchObject({ ok: true, replay: true });
    expect(t.ent().credits).toBe(850);
  });
  it('a semana ISO vira na segunda: domingo recusa, segunda compra de novo', async () => {
    const t = mem(1000);
    const dom = Date.UTC(2026, 10, 29, 23, 0); // domingo 29/11 (semana ISO de 23/11)
    const seg = Date.UTC(2026, 10, 30, 1, 0);  // segunda 30/11 (nova semana)
    expect((await buyRecovery(t.env, ID, 'energy', 'op-a-000001', { nowMs: dom })).ok).toBe(true);
    expect((await buyRecovery(t.env, ID, 'energy', 'op-b-000001', { nowMs: dom })).reason).toBe('weekly-cap');
    expect((await buyRecovery(t.env, ID, 'energy', 'op-c-000001', { nowMs: seg })).ok).toBe(true);
    expect(recoveryBoughtThisWeek(t.ent(), 'energy', seg)).toBe(1);
  });
  it('saldo insuficiente = 402 sem debitar; item/opId inválidos = 400', async () => {
    const t = mem(100); const now = Date.UTC(2026, 10, 24, 12);
    expect(await buyRecovery(t.env, ID, 'energy', 'op-energy-1', { nowMs: now })).toMatchObject({ ok: false, status: 402, reason: 'insufficient' });
    expect(t.ent().credits).toBe(100);
    expect(await buyRecovery(t.env, ID, 'coin', 'op-energy-1', { nowMs: now })).toMatchObject({ ok: false, status: 400, reason: 'unknown-item' });
    expect(await buyRecovery(t.env, ID, 'energy', 'x', { nowMs: now })).toMatchObject({ ok: false, status: 400, reason: 'bad-op' });
  });
});
