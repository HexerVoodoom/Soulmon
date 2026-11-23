/**
 * Conjunto Fundador no servidor (23/11/2026): `fundadorPremios` em UNIÃO (nunca descarta), `fundadorDias` nunca diminui,
 * `fundadorUltimoDia` nunca anda para trás; concedente dev `?action=fundadorGrant` = 403 para quem não é o dono, 200 e idempotente para ele.
 */
import { describe, it, expect, vi } from 'vitest';

const adminState = vi.hoisted(() => ({ admin: false }));
vi.mock('./_admin.js', async (importOriginal) => {
  const orig = /** @type {any} */ (await importOriginal());
  return { ...orig, verifiedAdmin: vi.fn(async () => ({ admin: adminState.admin })) };
});
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'f'.repeat(32);
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
const post = (e, state) => req(e, '', { state });
const gravado = (e) => JSON.parse(e.store.get(ID));
const TODOS = ['founder-fundo', 'founder-moldura', 'founder-retrato', 'furn-cristal-fundador'];

describe('save — campos do Fundador', () => {
  it('sanea forma e corta ids desconhecidos', async () => {
    const e = env();
    await post(e, { fundadorDias: 2.9, fundadorUltimoDia: 'ontem', fundadorPremios: ['founder-fundo', 'lixo', 7] });
    const s = gravado(e);
    expect(s.fundadorDias).toBe(2);
    expect(s.fundadorUltimoDia).toBeUndefined();
    expect(s.fundadorPremios).toEqual(['founder-fundo']);
  });
  it('UNIÃO dos prêmios, dias nunca diminuem, último dia nunca recua', async () => {
    const e = env();
    await post(e, { fundadorDias: 3, fundadorUltimoDia: '2026-11-10', fundadorPremios: ['founder-fundo', 'founder-moldura'] });
    await post(e, { fundadorDias: 1, fundadorUltimoDia: '2026-11-05', fundadorPremios: ['founder-retrato'] });
    const s = gravado(e);
    expect(s.fundadorDias).toBe(3);
    expect(s.fundadorUltimoDia).toBe('2026-11-10');
    expect(s.fundadorPremios).toEqual(['founder-fundo', 'founder-moldura', 'founder-retrato']);
  });
  it('cliente ANTIGO que regrava sem os campos não apaga o que já está gravado', async () => {
    const e = env();
    await post(e, { fundadorDias: 5, fundadorUltimoDia: '2026-11-10', fundadorPremios: TODOS });
    await post(e, { gamePoints: 3 });
    const s = gravado(e);
    expect(s.fundadorPremios).toEqual(TODOS);
    expect(s.fundadorDias).toBe(5);
  });
  it('save sem nenhum campo do Fundador continua sem eles (conta existente: o cliente concede na carga)', async () => {
    const e = env();
    await post(e, { gamePoints: 3 });
    expect(gravado(e)).not.toHaveProperty('fundadorPremios');
  });
  it('retrato e moldura sobrevivem à sanitização do save', async () => {
    const e = env();
    await post(e, { avatarId: 'founder-retrato', equippedFrame: 'founder-moldura', ownedFrames: ['founder-moldura'] });
    const s = gravado(e);
    expect(s.avatarId).toBe('founder-retrato');
    expect(s.equippedFrame).toBe('founder-moldura');
    expect(s.ownedFrames).toEqual(['founder-moldura']);
  });
});

describe('concedente dev — POST ?action=fundadorGrant', () => {
  it('403 para quem não é o dono (e nada é gravado)', async () => {
    adminState.admin = false;
    const e = env();
    await post(e, { gamePoints: 1 });
    const antes = e.store.get(ID);
    const r = await req(e, '&action=fundadorGrant', {});
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: 'forbidden' });
    expect(e.store.get(ID)).toBe(antes);
  });
  it('200 para o dono: concede os 4 + posse, revisão +1; repetir = already, sem gravar', async () => {
    adminState.admin = true;
    const e = env();
    await post(e, { gamePoints: 1, ownedFrames: ['basico'] });
    const r = await req(e, '&action=fundadorGrant', {});
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b).toMatchObject({ ok: true, already: false, revision: 2 });
    const s = gravado(e);
    expect(s.fundadorPremios).toEqual(TODOS);
    expect(s.ownedBackgrounds).toContain('founder-fundo');
    expect(s.ownedFrames).toEqual(['basico', 'founder-moldura']);
    expect(s.ownedFurniture).toContain('furn-cristal-fundador');
    const depois = e.store.get(ID);
    const r2 = await req(e, '&action=fundadorGrant', {});
    expect((await r2.json())).toMatchObject({ ok: true, already: true, revision: 2 });
    expect(e.store.get(ID)).toBe(depois);
    adminState.admin = false;
  });
  it('não loga e-mail nem saveId completo', async () => {
    adminState.admin = true;
    const e = env();
    await post(e, { gamePoints: 1 });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await req(e, '&action=fundadorGrant', {});
    const texto = log.mock.calls.flat().join(' ');
    expect(texto).toContain('fundador_grant_dev');
    expect(texto).not.toContain(ID);
    expect(texto).not.toContain('@');
    log.mockRestore();
    adminState.admin = false;
  });
});
