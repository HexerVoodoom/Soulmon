import { describe, it, expect, vi } from 'vitest';

// O Caderno (04/10/2026) vive em `state.caderno`, no save na nuvem do titular. Aqui: o servidor só
// aceita a lista no formato do cliente com os MESMOS tetos (120 x 2000), um save cheio cabe nos 5 MB,
// a exportação da conta devolve o Caderno e a exclusão o apaga junto com o save.
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const { onRequest: account } = await import('./account.js');

const ID = 'a'.repeat(32);
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
const entry = (i, text = 'a') => ({ id: `e${i}`, day: '2026-10-04', formato: 'livre', text, at: i });
const postSave = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});

describe('save.js — Caderno no save', () => {
  it('120 entradas de 2000 caracteres (o pior caso) cabem no teto e voltam inteiras', async () => {
    const e = mk();
    const cheio = Array.from({ length: 120 }, (_, i) => entry(i, 'ã'.repeat(2000)));
    const res = await postSave(e, { petName: 'Bolha', caderno: cheio });
    expect(res.status).toBe(200);
    const salvo = JSON.parse(e.DIGIAPP_SAVES.store.get(ID));
    expect(salvo.caderno.length).toBe(120);
    expect(salvo.caderno[0].text.length).toBe(2000);
  });

  it('clampa: excesso de entradas e de texto cai; lixo e formato inválido são descartados', async () => {
    const e = mk();
    const muitas = Array.from({ length: 150 }, (_, i) => entry(i, 'x'.repeat(2500)));
    muitas.push(null, { id: 'B C', day: 'x', formato: 'livre', text: 'a', at: 1 }, { ...entry(999), formato: 'outro' });
    await postSave(e, { caderno: muitas });
    const salvo = JSON.parse(e.DIGIAPP_SAVES.store.get(ID));
    expect(salvo.caderno.length).toBe(120);
    expect(salvo.caderno.every(x => x.text.length === 2000)).toBe(true);
  });

  it('caderno que não é lista vira lista vazia; save sem o campo não ganha o campo', async () => {
    const e = mk();
    await postSave(e, { caderno: { a: 1 } });
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).caderno).toEqual([]);
    const e2 = mk();
    await postSave(e2, { petName: 'x' });
    expect('caderno' in JSON.parse(e2.DIGIAPP_SAVES.store.get(ID))).toBe(false);
  });
});

describe('conta — exportar inclui o Caderno; excluir apaga', () => {
  it('a exportação devolve as anotações e a exclusão confirmada remove o save que as guarda', async () => {
    const e = mk();
    await postSave(e, { petName: 'Bolha', caderno: [entry(1, 'meu segredo')] });
    const exp = await (await account({ request: new Request(`https://x/api/account?action=export&id=${ID}`), env: e })).json();
    expect(exp.data[`${ID} (save)`].caderno[0].text).toBe('meu segredo');

    const post = (qs, body) => new Request(`https://x/api/account?${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    const { confirmToken } = await (await account({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    const res = await account({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    expect(res.status).toBe(200);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(false);
    expect([...e.DIGIAPP_SAVES.store.values()].join('')).not.toContain('meu segredo');
  });
});
