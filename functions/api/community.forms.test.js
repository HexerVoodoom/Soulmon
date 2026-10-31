/**
 * Histórico de formas de um AMIGO (`action=forms`) — o servidor já guarda as formas passadas em
 * `state.spriteLibrary.sprites[<formId>]`; o endpoint só lê, só entre amigos, e só com URL de host permitido.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { onRequest } from './community.js';
import { formsFromSaveState, MAX_FORMAS } from './_formHistory.js';
import { resetRateLimits } from './_rateLimit.js';

const ME = 'a'.repeat(32);
const AMIGO = 'b'.repeat(32);
const ESTRANHO = 'c'.repeat(32);
const PID_AMIGO = 'pidamigo'.padEnd(24, '1');
const PID_ESTRANHO = 'pidestranho'.padEnd(24, '2');
const OK = 'https://images.higgs.ai/x';

const save = (sprites) => JSON.stringify({ spriteLibrary: { sprites } });
function mkEnv({ friends = [AMIGO], amigoSave, hidden = false } = {}) {
  const store = new Map([
    [`profile:${ME}`, JSON.stringify({ id: ME, name: 'Eu', friends })],
    [`profile:${AMIGO}`, JSON.stringify({ id: AMIGO, name: 'Ami', pid: PID_AMIGO, element: 'fogo', publicHidden: hidden })],
    [`profile:${ESTRANHO}`, JSON.stringify({ id: ESTRANHO, name: 'Est', pid: PID_ESTRANHO })],
    [`pid:${PID_AMIGO}`, AMIGO], [`pid:${PID_ESTRANHO}`, ESTRANHO],
    [AMIGO, amigoSave ?? save({
      mega_ignorado: { url: OK, at: 1 },
      'champion-power': { url: OK + '/c.png', at: 200 },
      rookie: { url: OK + '/r.png', at: 100 },
      'mega-power': { url: 'https://atacante.example/b.png', at: 300 },
    })],
  ]);
  return { SOULMON_SAVES: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); }, list: async () => ({ keys: [] }) } };
}
const forms = (env, friend) => onRequest({ request: new Request(`https://x.dev/api/community?action=forms&id=${ME}&friend=${friend}`), env });

describe('action=forms', () => {
  beforeEach(() => resetRateLimits());
  it('amigo: devolve as formas ordenadas, só {stage, spriteUrl, element, date}, sem host de atacante', async () => {
    const r = await forms(mkEnv(), PID_AMIGO);
    expect(r.status).toBe(200);
    const { forms: f } = await r.json();
    expect(f.map(x => x.stage)).toEqual(['rookie', 'champion']);
    expect(Object.keys(f[0]).sort()).toEqual(['date', 'element', 'spriteUrl', 'stage']);
    expect(f[0].element).toBe('fogo');
    expect(JSON.stringify(f)).not.toContain('atacante');
  });
  it('não-amigo recebe 403 (e escondido também)', async () => {
    expect((await forms(mkEnv(), PID_ESTRANHO)).status).toBe(403);
    expect((await forms(mkEnv({ friends: [] }), PID_AMIGO)).status).toBe(403);
    expect((await forms(mkEnv({ hidden: true }), PID_AMIGO)).status).toBe(403);
    expect((await forms(mkEnv(), 'nao-existe-nao-existe')).status).toBe(403);
  });
  it('save ilegível = lista vazia', async () => {
    const r = await forms(mkEnv({ amigoSave: '{lixo' }), PID_AMIGO);
    expect((await r.json()).forms).toEqual([]);
  });
});

describe('formsFromSaveState', () => {
  it('sanitiza URL (userinfo, http, host fora da lista), ignora id de forma inválido e limita a MAX_FORMAS', () => {
    const f = formsFromSaveState({ spriteLibrary: { sprites: {
      rookie: { url: 'https://images.higgs.ai@atacante.example/x.png', at: 1 },
      'champion-power': { url: 'http://images.higgs.ai/x.png', at: 1 },
      'champion-harmony': { url: OK, at: 'lixo' },
      '__proto__x': { url: OK, at: 1 },
    } } }, 'Fogo!');
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ formId: 'champion-harmony', date: 0, element: null });
    const muitos = {};
    for (const s of ['rookie', 'champion', 'ultimate', 'mega']) for (const a of ['power', 'harmony', 'benevolence']) muitos[`${s}-${a}`] = { url: OK, at: 1 };
    muitos.ultra = { url: OK, at: 1 };
    expect(formsFromSaveState({ spriteLibrary: { sprites: muitos } }, null).length).toBeLessThanOrEqual(MAX_FORMAS);
  });
});
