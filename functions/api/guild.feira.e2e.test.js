import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import { feiraEvtKey, feiraHitKey } from './_coop.js';
import { creditFeiraOnce } from '../../src/utils/feiraCredit.ts';
import { resetClaimMemoryForTests } from '../../src/utils/guildClaimLocal.ts';

vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false, tombstone: { deleted: false, reopened: false } }),
}));

/**
 * PONTA A PONTA da Feira do Chefe (cliente + servidor), com `FEIRA_CHEFE_DESDE` no PASSADO (o valor de produção segue em
 * 2099-12-31): volta da Missão (`guildRaidHit`) -> mistério (`evento`) -> ataque -> abate -> resgate -> crédito no aparelho UMA vez.
 */
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
const sid = r => r.padEnd(32, '0');
const M = 'abcd'.split('').map(c => sid(c + c));
const chamar = (e, action, body) => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  env: e,
});
const J = r => r.json();
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); resetClaimMemoryForTests(); });
/** `localStorage` de verdade (o do Node 25 em teste não persiste): a memória de recibos do aparelho precisa lembrar. */
const stubStorage = () => { const m = new Map(); vi.stubGlobal('localStorage', { getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, clear: () => m.clear() }); };

describe('Feira do Chefe: ponta a ponta', () => {
  it('volta da Missão -> mistério -> ataque -> abate -> resgate -> crédito 1x (o 409 devolve o MESMO recibo e não credita de novo)', async () => {
    stubStorage();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const e = { DIGIAPP_SAVES: fakeKV(), FEIRA_CHEFE_DESDE: '2000-01-01' };
    const kv = e.DIGIAPP_SAVES;
    for (const m of M) kv.store.set(`profile:${m}`, JSON.stringify({ name: `N${m[0]}`, pid: `P${m[0]}${'q'.repeat(22)}`, stage: 'champion' }));
    const g = (await J(await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' }))).guild;
    for (const m of M.slice(1)) await chamar(e, 'guildJoin', { id: m, code: g.code });

    // 1. a volta da Missão: o golpe registra a rodada e a resposta traz o mistério (chefe vivo, 100%)
    const volta = await J(await chamar(e, 'guildRaidHit', { id: M[0] }));
    expect(volta.landed).toBe(true);
    expect(volta.evento).toMatchObject({ k: 0, kind: 'boss', bossHpPct: 100, canAttack: true });
    const foto = JSON.parse(kv.store.get(feiraEvtKey(g.id)));

    // 2. ataque: os 4 membros batem uma vez cada (M[2] só semeia dano alto, o que também zera o chefe)
    expect((await chamar(e, 'guildFeiraAttack', { id: M[0] })).status).toBe(200);
    expect((await chamar(e, 'guildFeiraAttack', { id: M[1] })).status).toBe(200);
    kv.store.set(feiraHitKey(g.id, 0, M[2]), JSON.stringify({ k: 0, days: ['2026-11-10'], dmg: foto.hp0 }));
    const ult = await J(await chamar(e, 'guildFeiraAttack', { id: M[3] }));
    expect(ult.evento?.bossHpPct ?? 0).toBe(0); // 3. abate

    // 4. resgate (só quem golpeou) -> 200 com recibo
    const r1 = await chamar(e, 'guildFeiraClaim', { id: M[0] });
    expect(r1.status).toBe(200);
    const c1 = (await J(r1)).claimed;
    expect(c1.reward.emblems).toBeGreaterThan(0);

    // 5. crédito no aparelho: 1ª vez credita, a repetição (mesma resposta) não
    let creditos = 0;
    const credit = c => ({ receipt: c.receipt, emblems: c.reward.emblems, bits: c.reward.bits, trophyId: c.reward.trophyId });
    expect(creditFeiraOnce(credit(c1), () => { creditos++; })).toBe(true);
    const r2 = await chamar(e, 'guildFeiraClaim', { id: M[0] });
    expect(r2.status).toBe(409);
    const j2 = await J(r2);
    expect(j2.receipt).toBe(c1.receipt);
    expect(creditFeiraOnce(credit(j2.claimed), () => { creditos++; })).toBe(false);
    expect(creditos).toBe(1);
  });
});
