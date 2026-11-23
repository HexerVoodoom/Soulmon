/**
 * CONTRATO: renomear na Hexsmith é do SERVIDOR (11/11/2026). `POST /api/save?id=&action=hexRename { kind, nome }` valida o nome,
 * debita HEX_RENAME_COST Bits GANHOS e grava o nome numa escrita só; o cliente não paga nem grava sozinho.
 */
import { describe, it, expect, vi } from 'vitest';
import { HEX_RENAME_COST } from './_hexRename.js';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'e'.repeat(32);
function env() {
  const store = new Map();
  const meta = new Map();
  return { DIGIAPP_SAVES: {
    get: async (key) => store.get(key) ?? null,
    getWithMetadata: async (key) => ({ value: store.get(key) ?? null, metadata: meta.get(key) ?? null }),
    put: async (key, value, opts) => { store.set(key, value); meta.set(key, opts?.metadata ?? null); },
  }, store };
}
const req = (e, qs, body) => save({
  request: new Request(`https://x/api/save?id=${ID}${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  env: e,
});
const rename = async (e, kind, nome, extra = {}) => { const r = await req(e, '&action=hexRename', { kind, nome, ...extra }); return { status: r.status, body: await r.json() }; };
const gravado = (e) => JSON.parse(e.store.get(ID));
const base = { gamePoints: 1000, soulmonMeta: { baseName: 'Fagulha' } };

describe('hexRename: o servidor cobra e grava o nome', () => {
  it('preço de 200 Bits (constante nomeada)', () => { expect(HEX_RENAME_COST).toBe(200); });

  it('lápis grava soulmonMeta.petName (baseName intacto) e debita; chama grava especialNome', async () => {
    const e = env();
    await req(e, '', { state: base });
    const a = await rename(e, 'pet', '  Brasa   Viva ');
    expect(a.status).toBe(200);
    expect(a.body).toMatchObject({ ok: true, already: false, revision: 2, gamePoints: 1000 - HEX_RENAME_COST });
    const b = await rename(e, 'especial', 'Raio Solar');
    expect(b.body.revision).toBe(3);
    const s = gravado(e);
    expect(s.gamePoints).toBe(1000 - 2 * HEX_RENAME_COST);
    expect(s.soulmonMeta).toEqual({ baseName: 'Fagulha', petName: 'Brasa Viva' });
    expect(s.especialNome).toBe('Raio Solar');
    expect(s.especialNomeAt).toBeGreaterThan(0);
  });

  it('mesmo nome = already, sem cobrar nem gravar', async () => {
    const e = env();
    await req(e, '', { state: base });
    await rename(e, 'pet', 'Brasa');
    const antes = e.store.get(ID);
    const r = await rename(e, 'pet', 'Brasa');
    expect(r.body).toMatchObject({ ok: true, already: true });
    expect(e.store.get(ID)).toBe(antes);
  });

  it('palavrão, contato, vazio, tipo errado: 400 e nada muda', async () => {
    const e = env();
    await req(e, '', { state: base });
    const antes = e.store.get(ID);
    for (const nome of ['Caralho', 'a@b.com', '   ', 'X'.repeat(21), 'Raio!']) expect((await rename(e, 'pet', nome)).status).toBe(400);
    expect((await rename(e, 'outro', 'Bom')).status).toBe(400);
    expect((await rename(e, 'pet', 5)).status).toBe(400);
    expect(e.store.get(ID)).toBe(antes);
  });

  it('saldo insuficiente: 402 e nada muda; §373: só Bits de Crédito PAGA', async () => {
    const e = env();
    await req(e, '', { state: { ...base, gamePoints: HEX_RENAME_COST - 1 } });
    const antes = e.store.get(ID);
    const r = await rename(e, 'pet', 'Brasa');
    expect(r.status).toBe(402);
    expect(e.store.get(ID)).toBe(antes);
    const e2 = env();
    await req(e2, '', { state: { ...base, gamePoints: 1000, bitsOrigin: { day: '2026-11-01', free: 0, fromCredits: 1000, paidLeft: 1000 } } });
    expect((await rename(e2, 'pet', 'Brasa')).status).toBe(200);
  });

  it('revisão velha = 409; sem save = 404', async () => {
    const e = env();
    expect((await rename(e, 'pet', 'Brasa')).status).toBe(404);
    await req(e, '', { state: base });
    expect((await rename(e, 'pet', 'Brasa', { baseRevision: 9 })).status).toBe(409);
  });
});
