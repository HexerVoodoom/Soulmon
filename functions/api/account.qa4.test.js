// QA beta3 (lane servidor/dinheiro): a exclusão de conta apaga ranking, lastro, apelido, prêmios do Rift; o e-mail do sprite entra no
// export; e o prêmio não ressuscita um ent de conta apagada.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const authVerdict = { value: null };
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => authVerdict.value,
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest } = await import('./account.js');
const { approveRiftPrize, pendingKey } = await import('./_riftPayout.js');
const { readEntitlement } = await import('./_entitlements.js');
const { rkKeyFor } = await import('./_rankings.js');

const ID = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);
const OWNER = { ok: true, email: 'quem@exemplo.com' };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const post = (qs, body) => new Request(`https://x/api/account?${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const get = (qs) => new Request(`https://x/api/account?${qs}`);

const mes = new Date().toISOString().slice(0, 7);
const seed = () => ({
  [ID]: JSON.stringify({ petName: 'Bolha' }),
  [`profile:${ID}`]: JSON.stringify({ id: ID, name: 'Ana' }),
  [`ent:${ID}`]: JSON.stringify({ tier: 'demo', credits: 0 }),
  // ranking: melhor score por jogo/período e a linha do placar
  [`rkme:dino-1:2026-W43:${ID}`]: '300',
  [rkKeyFor('dino-1', '2026-W43', 300, ID)]: '',
  [`rkme:endless-rift:${mes}:${ID}`]: '270',
  [rkKeyFor('endless-rift', mes, 270, ID)]: '',
  [`rkme:dino-1:2026-W43:${OTHER}`]: '900',
  [rkKeyFor('dino-1', '2026-W43', 900, OTHER)]: '',
  [`riftlayers:${mes}:${ID}`]: JSON.stringify({ n: 10, base: 261, rec: 262, d: '2026-10-20', dn: 3 }),
  [`rift-pending:2026-09:${ID}`]: JSON.stringify({ status: 'pending', credits: 50, place: 1, score: 270, at: 1 }),
  [`rift-paid:2026-08:${ID}`]: JSON.stringify({ credits: 25 }),
  [`rift-pending:2026-09:${OTHER}`]: JSON.stringify({ status: 'pending', credits: 25, place: 2, score: 200, at: 1 }),
  'nick:ana': ID,
  [`nickof:${ID}`]: 'nick:ana',
  [`sprite:img:${ID}:mega-power`]: JSON.stringify({ image: 'https://x/y.png', provider: 'gemini', at: 5, email: 'quem@exemplo.com' }),
});
const env = (s) => ({ DIGIAPP_SAVES: fakeKV(s), FIREBASE_PROJECT_ID: 'soulmon-test' });

async function apagar(e) {
  const req = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
  return (await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken: req.confirmToken }), env: e })).json();
}

beforeEach(() => { authVerdict.value = OWNER; });

describe('exclusão apaga ranking, lastro, apelido e prêmios do Rift', () => {
  it('apaga tudo que é do titular e NADA do outro jogador', async () => {
    const e = env(seed());
    const out = await apagar(e);
    expect(out.ok).toBe(true);
    expect(out.executado.falhou).toEqual([]);
    const k = [...e.DIGIAPP_SAVES.store.keys()];
    for (const gone of [
      `rkme:dino-1:2026-W43:${ID}`, rkKeyFor('dino-1', '2026-W43', 300, ID), `rkme:endless-rift:${mes}:${ID}`, rkKeyFor('endless-rift', mes, 270, ID),
      `riftlayers:${mes}:${ID}`, `rift-pending:2026-09:${ID}`, `rift-paid:2026-08:${ID}`, 'nick:ana', `nickof:${ID}`, `sprite:img:${ID}:mega-power`,
    ]) expect(k, gone).not.toContain(gone);
    // o outro jogador fica intacto
    for (const kept of [`rkme:dino-1:2026-W43:${OTHER}`, rkKeyFor('dino-1', '2026-W43', 900, OTHER), `rift-pending:2026-09:${OTHER}`]) expect(k, kept).toContain(kept);
  });

  it('não apaga um apelido que já passou para OUTRA conta', async () => {
    const s = seed(); s['nick:ana'] = OTHER;
    const e = env(s);
    await apagar(e);
    expect(e.DIGIAPP_SAVES.store.get('nick:ana')).toBe(OTHER);
    expect(e.DIGIAPP_SAVES.store.has(`nickof:${ID}`)).toBe(false);
  });

  it('o inventário (delete-request) já lista ranking, lastro, apelido e prêmio', async () => {
    const e = env(seed());
    const j = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    for (const k of [`rkme:dino-1:2026-W43:${ID}`, `riftlayers:${mes}:${ID}`, `rift-pending:2026-09:${ID}`, 'nick:ana', `nickof:${ID}`]) expect(j.plano.apaga, k).toContain(k);
  });

  it('prêmio pendente de conta apagada NÃO ressuscita o ent', async () => {
    const e = env(seed());
    // o prêmio foi ganho antes da exclusão: o pendente existe quando o titular apaga; depois dela nenhum crédito entra
    await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e }); // só para ter o token; a exclusão real vem abaixo
    await apagar(e);
    e.DIGIAPP_SAVES.store.set(pendingKey('2026-09', ID), JSON.stringify({ status: 'pending', credits: 50, place: 1, score: 270, at: 1 })); // pendente reaparece (ex.: fechamento atrasado)
    const r = await approveRiftPrize(e, '2026-09', ID, Date.now());
    expect(r.status).toBe('refused');
    expect((await readEntitlement(e, ID)).credits).toBe(0);
  });
});

describe('e-mail guardado no sprite (decisão do dono 4)', () => {
  it('a exportação mostra o e-mail do titular guardado nos registros de sprite', async () => {
    const e = env(seed());
    const body = await (await onRequest({ request: get(`action=export&id=${ID}`), env: e })).json();
    expect(body.data.spriteEmails).toEqual([{ key: `sprite:img:${ID}:mega-power`, email: 'quem@exemplo.com' }]);
    expect(body.data.ranking).toEqual(expect.arrayContaining([{ game: 'dino-1', period: '2026-W43', best: 300 }]));
  });
  it('conta sem e-mail em sprite exporta lista vazia', async () => {
    const e = env({ [ID]: '{}' });
    const body = await (await onRequest({ request: get(`action=export&id=${ID}`), env: e })).json();
    expect(body.data.spriteEmails).toEqual([]);
  });
});
