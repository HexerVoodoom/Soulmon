import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

// A comunidade tinha 11 ações e SÓ `profile` verificava autorização. As outras
// pegavam o ator do corpo da requisição, o que permitia: emitir presente em
// nome de outro jogador, reescrever a lista de amigos dele, forjar o torneio
// creditando os dois lados, e APAGAR troféus e presentes alheios (o `claim=1`
// é destrutivo e não tem reemissão). Nada disso fechava ao ligar o
// FIREBASE_PROJECT_ID, porque essas ações não consultavam autenticação.
//
// Este arquivo não existia. É por isso que passou.

const ATOR = 'a'.repeat(32);
const VITIMA = 'b'.repeat(32);

/** KV de mentira, com o mínimo que o community.js usa. */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}

const perfil = (id, extra = {}) => JSON.stringify({
  id, name: `n-${id.slice(0, 4)}`, petName: 'pet', stage: 'rookie',
  pvpEnabled: true, attrs: { virus: 1, data: 1, vaccine: 1 },
  friends: [], createdAt: Date.now(), ...extra,
});

/** Ambiente COM autenticação ligada — o estado que vale depois do lançamento. */
function envAutenticado(seed) {
  return { DIGIAPP_SAVES: fakeKV(seed), FIREBASE_PROJECT_ID: 'soulmon-test' };
}

function req(action, { method = 'GET', body, params = {}, token } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/community?${qs}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}

// Toda ação que age EM NOME de `id`. Se alguém adicionar uma nova ação de ator
// sem autorização, ela não vai estar nesta lista — por isso o teste final
// confere a lista contra o arquivo.
const ACOES_COM_ATOR = [
  { action: 'profile', method: 'POST', body: { id: VITIMA, name: 'hackeado' } },
  { action: 'match', method: 'POST', body: { id: VITIMA, opponentId: ATOR } },
  { action: 'friends', method: 'POST', body: { id: VITIMA, friendId: ATOR } },
  { action: 'gift', method: 'POST', body: { id: VITIMA, friendId: ATOR } },
  { action: 'trophies', method: 'GET', params: { id: VITIMA, claim: '1' } },
  { action: 'gifts', method: 'GET', params: { id: VITIMA, claim: '1' } },
];

describe('community — nenhuma ação age em nome de outro sem autorização', () => {
  for (const caso of ACOES_COM_ATOR) {
    it(`'${caso.action}' recusa sem token`, async () => {
      const env = envAutenticado({
        [`profile:${VITIMA}`]: perfil(VITIMA, { friends: [ATOR], pendingTrophies: [{ season: '2026-07', place: 1 }] }),
        [`profile:${ATOR}`]: perfil(ATOR),
        [`gifts:${VITIMA}`]: JSON.stringify([{ from: 'Ana', bits: 20, at: Date.now() }]),
      });
      const antes = new Map(env.DIGIAPP_SAVES.store);

      const res = await onRequest({ request: req(caso.action, caso), env });

      expect([401, 403], `${caso.action} devolveu ${res.status}`).toContain(res.status);
      // E, o que mais importa nas ações destrutivas: o KV não foi tocado.
      expect(env.DIGIAPP_SAVES.store).toEqual(antes);
    });

    it(`'${caso.action}' recusa com token inválido`, async () => {
      const env = envAutenticado({
        [`profile:${VITIMA}`]: perfil(VITIMA, { friends: [ATOR] }),
        [`profile:${ATOR}`]: perfil(ATOR),
      });
      const res = await onRequest({ request: req(caso.action, { ...caso, token: 'nao.e.um.jwt' }), env });
      expect([401, 403]).toContain(res.status);
    });
  }
});

describe('community — as ações destrutivas não destroem nada ao recusar', () => {
  it('trophies?claim=1 sem token NÃO apaga o troféu da vítima', async () => {
    // Era o pior dos achados: uma requisição apagava a conquista de season de
    // outra pessoa para sempre, e ainda entregava o conteúdo a quem pediu.
    const env = envAutenticado({
      [`profile:${VITIMA}`]: perfil(VITIMA, { pendingTrophies: [{ season: '2026-07', place: 1 }] }),
    });
    await onRequest({ request: req('trophies', { params: { id: VITIMA, claim: '1' } }), env });
    const depois = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${VITIMA}`));
    expect(depois.pendingTrophies).toHaveLength(1);
  });

  it('gifts?claim=1 sem token NÃO esvazia a fila da vítima', async () => {
    const env = envAutenticado({
      [`gifts:${VITIMA}`]: JSON.stringify([{ from: 'Ana', bits: 20, at: 1 }]),
    });
    await onRequest({ request: req('gifts', { params: { id: VITIMA, claim: '1' } }), env });
    expect(env.DIGIAPP_SAVES.store.has(`gifts:${VITIMA}`)).toBe(true);
  });

  it('match sem token NÃO mexe no rank de ninguém', async () => {
    const env = envAutenticado({
      [`profile:${VITIMA}`]: perfil(VITIMA),
      [`profile:${ATOR}`]: perfil(ATOR, { stage: 'ultra' }),
    });
    await onRequest({ request: req('match', { method: 'POST', body: { id: VITIMA, opponentId: ATOR } }), env });
    const rankKeys = [...env.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('rank:'));
    expect(rankKeys).toEqual([]);
  });

  it('friends sem token NÃO reescreve o perfil da vítima', async () => {
    const env = envAutenticado({
      [`profile:${VITIMA}`]: perfil(VITIMA, { friends: ['amigo-de-verdade-1234'] }),
      [`profile:${ATOR}`]: perfil(ATOR),
    });
    await onRequest({ request: req('friends', { method: 'POST', body: { id: VITIMA, friendId: ATOR } }), env });
    const depois = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${VITIMA}`));
    expect(depois.friends).toEqual(['amigo-de-verdade-1234']);
  });
});

describe('community — o torneio não aceita partida contra si mesmo', () => {
  it('recusa id === opponentId', async () => {
    // Sem isso, os dois getRank/putRank caem na mesma chave e a segunda
    // escrita sobrescreve a primeira, inclusive o contador de partidas do dia.
    const env = { DIGIAPP_SAVES: fakeKV({ [`profile:${ATOR}`]: perfil(ATOR) }) }; // auth desligada
    const res = await onRequest({ request: req('match', { method: 'POST', body: { id: ATOR, opponentId: ATOR } }), env });
    expect(res.status).toBe(400);
  });
});

describe('community — a lista de ações com ator está completa', () => {
  it('toda ação que lê `id` como ator passa por denyUnlessOwner', async () => {
    // Guarda contra o modo de falha original: alguém acrescenta uma ação nova,
    // esquece a autorização, e nenhum teste percebe. Se este teste cair,
    // acrescente a ação em ACOES_COM_ATOR **e** a chamada de autorização —
    // nunca só uma das duas.
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('./community.js', import.meta.url), 'utf8');

    const declaradas = new Set(ACOES_COM_ATOR.map(a => a.action));
    // Ações públicas de leitura: não agem em nome de ninguém.
    const publicas = new Set(['players', 'player', 'opponents', 'rank', 'seasonResult']);
    // Protegida por chave de admin, não por dono.
    const admin = new Set(['closeSeason']);

    const todas = [...src.matchAll(/action === '([a-zA-Z]+)'/g)].map(m => m[1]);
    for (const a of new Set(todas)) {
      if (publicas.has(a) || admin.has(a)) continue;
      expect(declaradas.has(a), `ação '${a}' não está coberta pelo teste de autorização`).toBe(true);
    }
  });
});
