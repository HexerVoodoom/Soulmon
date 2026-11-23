import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onRequest as community } from './community.js';
import { resetRateLimits } from './_rateLimit.js';

// §346 (13/11/2026): "Couldn't add that friend right now. Try again." aparecia COM FREQUÊNCIA ao convidar um amigo pelo apelido.
// Causa: o teto da varredura (`HEAVY_LIMIT`, 20/min) era medido no MESMO balde por IP que as ações leves. Abrir a aba Amigos já
// dispara ~10-20 chamadas leves (estado social, perfil e formas de cada amigo, convites); depois disso a busca por nome
// (`players&search=`) que o "Convidar" faz respondia 429, o cliente lançava e a tela mostrava a mensagem genérica.
// E a sugestão de nomes (`names`, 1 list de 8 chaves) contava como varredura a cada tecla.

const IP = { 'CF-Connecting-IP': '203.0.113.77' };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix, limit }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit ?? 1000).map(name => ({ name })),
      list_complete: true,
    }),
  };
}

const SAVE_LIA = 'lia-save-0000000000000000000000001';
const perfilLia = { id: SAVE_LIA, pid: 'pidlia000000000000000001', name: 'Lia', petName: 'pet', stage: 'rookie', pvpEnabled: true, friends: [], createdAt: Date.now() };
const get = qs => new Request(`https://soulmon.test/api/community?${qs}`, { headers: IP });

beforeEach(() => {
  resetRateLimits();
  vi.stubGlobal('caches', undefined);
});

describe('§346 convidar amigo pelo apelido depois de abrir a aba Amigos', () => {
  const env = () => ({
    DIGIAPP_SAVES: fakeKV({
      [`profile:${SAVE_LIA}`]: JSON.stringify(perfilLia),
      [`pid:${perfilLia.pid}`]: SAVE_LIA,
      'nick:lia': SAVE_LIA,
    }),
  });

  it('25 chamadas leves no minuto NÃO esgotam a busca por nome (balde separado)', async () => {
    const e = env();
    for (let i = 0; i < 25; i++) {
      const r = await community({ request: get(`action=player&id=${perfilLia.pid}`), env: e });
      expect(r.status).toBe(200);
    }
    const busca = await community({ request: get('action=players&search=lia'), env: e });
    expect(busca.status).toBe(200);
    const corpo = await busca.json();
    expect(corpo.players.map(p => p.name)).toEqual(['Lia']);
  });

  it('digitar o apelido (sugestões a cada tecla) não gasta o teto da varredura', async () => {
    const e = env();
    for (let i = 0; i < 25; i++) {
      const r = await community({ request: get('action=names&prefix=li'), env: e });
      expect(r.status).toBe(200);
    }
    const busca = await community({ request: get('action=players&search=lia'), env: e });
    expect(busca.status).toBe(200);
  });

  it('o teto da varredura continua valendo: a 21ª busca no minuto é 429', async () => {
    const e = env();
    for (let i = 0; i < 20; i++) expect((await community({ request: get('action=players&search=lia'), env: e })).status).toBe(200);
    const barrada = await community({ request: get('action=players&search=lia'), env: e });
    expect(barrada.status).toBe(429);
    expect((await barrada.json()).error).toBe('rate limited');
  });

  it('o teto geral por IP continua valendo (121ª leve no minuto é 429)', async () => {
    const e = env();
    for (let i = 0; i < 120; i++) await community({ request: get(`action=player&id=${perfilLia.pid}`), env: e });
    expect((await community({ request: get(`action=player&id=${perfilLia.pid}`), env: e })).status).toBe(429);
  });
});
