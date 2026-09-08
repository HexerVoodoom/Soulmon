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

// DERIVAÇÃO ANTIGA do pid. Hoje ela existe aqui por um motivo só: provar que
// o servidor a RECUSA. Ver `community.playerOracle.test.js` (N-3/B3) — como o
// saveId é derivado do e-mail por algoritmo público, um pid derivado do saveId
// fechava a cadeia e-mail → conta para qualquer um, offline.
async function pidLegado(saveId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

// Um pid como o servidor passa a emitir: opaco, sem relação com o saveId.
const PID_VITIMA = 'v'.repeat(24);
const PID_ATOR = 'a1b2c3d4e5f60718293a4b5c';

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
  // Cooperativo (Fase 4.3). `coopLeave` entra aqui por ser DESTRUTIVO — sem
  // autorização, uma requisição expulsaria qualquer pessoa do grupo dela.
  { action: 'coop', method: 'GET', params: { id: VITIMA } },
  { action: 'coopCreate', method: 'POST', body: { id: VITIMA, name: 'grupo' } },
  { action: 'coopJoin', method: 'POST', body: { id: VITIMA, code: 'ABCDEFGH' } },
  { action: 'coopCheckin', method: 'POST', body: { id: VITIMA } },
  { action: 'coopLeave', method: 'POST', body: { id: VITIMA } },
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
  it('recusa desafiar a si mesmo, mesmo pelo próprio pid', async () => {
    // Sem isso, os dois getRank/putRank caem na mesma chave e a segunda
    // escrita sobrescreve a primeira, inclusive o contador de partidas do dia.
    // A checagem acontece DEPOIS de resolver o pid: o alvo é sempre público.
    const meuPid = PID_ATOR;
    const env = { DIGIAPP_SAVES: fakeKV({
      [`profile:${ATOR}`]: perfil(ATOR, { pid: meuPid }),
      [`pid:${meuPid}`]: ATOR,
    }) }; // auth desligada
    const res = await onRequest({ request: req('match', { method: 'POST', body: { id: ATOR, opponentId: meuPid } }), env });
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

// ─────────────────────────────────────────────────────────────────────────────
// O saveId É A CHAVE DO CLOUD SAVE. Publicá-lo no diretório entregava, sem
// autenticação nenhuma, a chave de leitura E ESCRITA do save de todo mundo:
// `GET /api/save?id=<saveId>` devolvia o save inteiro e `POST` o sobrescrevia.
// A identidade social passou a ser um pid derivado (caminho só de ida).
// ─────────────────────────────────────────────────────────────────────────────


describe('community — o saveId nunca sai em resposta pública', () => {
  const LEITURAS_PUBLICAS = [
    { action: 'players' },
    { action: 'opponents', params: { id: ATOR } },
    { action: 'rank' },
    { action: 'seasonResult' },
  ];

  for (const caso of LEITURAS_PUBLICAS) {
    it(`'${caso.action}' não contém nenhum saveId`, async () => {
      const env = {
        DIGIAPP_SAVES: fakeKV({
          [`profile:${VITIMA}`]: perfil(VITIMA, { pid: PID_VITIMA }),
          [`profile:${ATOR}`]: perfil(ATOR, { pid: PID_ATOR }),
          [`rank:${new Date().toISOString().slice(0, 7)}:${VITIMA}`]:
            JSON.stringify({ points: 30, wins: 3, losses: 1, day: '2026-01-01', matchesToday: 0 }),
        }),
      };
      const res = await onRequest({ request: req(caso.action, caso), env });
      const texto = await res.text();
      expect(texto).not.toContain(VITIMA);
      expect(texto).not.toContain(ATOR);
    });
  }

  it('o diretório publica um pid que NÃO é derivado do saveId', async () => {
    // Era derivado, e essa era a falha: derivável do saveId = derivável do
    // e-mail. Hoje o pid é sorteado no primeiro contato e guardado no perfil.
    const env = { DIGIAPP_SAVES: fakeKV({ [`profile:${VITIMA}`]: perfil(VITIMA) }) };
    const res = await onRequest({ request: req('players'), env });
    const { players } = await res.json();
    expect(players[0].id).not.toBe(await pidLegado(VITIMA));
    expect(players[0].id).toMatch(/^[0-9a-f]{24}$/);
    // e ficou persistido: a identidade social não pode mudar a cada leitura.
    const salvo = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${VITIMA}`));
    expect(salvo.pid).toBe(players[0].id);
    expect(env.DIGIAPP_SAVES.store.get(`pid:${players[0].id}`)).toBe(VITIMA);
  });

  it('o pid não permite voltar ao saveId sem o mapa do servidor', async () => {
    // A única forma de resolver um alvo é o índice `pid:` no KV.
    const env = { DIGIAPP_SAVES: fakeKV({ [`profile:${VITIMA}`]: perfil(VITIMA) }) };
    const res = await onRequest({ request: req('players'), env });
    const pid = (await res.json()).players[0].id;
    expect(pid).not.toContain(VITIMA);
    expect(VITIMA).not.toContain(pid);
  });

  it('um pid LEGADO indexado não resolve mais — nem para quem já o tinha', async () => {
    // Índices `pid:` derivados continuam no KV até expirar (400 dias). Se eles
    // resolvessem, o oráculo sobreviveria à correção nas contas antigas.
    const legado = await pidLegado(VITIMA);
    const env = { DIGIAPP_SAVES: fakeKV({
      [`profile:${VITIMA}`]: perfil(VITIMA, { pid: legado }),
      [`pid:${legado}`]: VITIMA,
    }) };
    const res = await onRequest({ request: req('player', { params: { id: legado } }), env });
    expect(await res.json()).toEqual({ found: false });
  });
});

describe('community — alvos são endereçados por pid, não por saveId', () => {
  it('não dá para virar amigo passando o saveId da vítima', async () => {
    // Antes, `friendId` era o saveId — que o diretório entregava de graça.
    const env = { DIGIAPP_SAVES: fakeKV({
      [`profile:${ATOR}`]: perfil(ATOR),
      [`profile:${VITIMA}`]: perfil(VITIMA),
    }) };
    const res = await onRequest({
      request: req('friends', { method: 'POST', body: { id: ATOR, friendId: VITIMA } }),
      env,
    });
    expect(res.status).toBe(404);
    const depois = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ATOR}`));
    expect(depois.friends).toEqual([]);
  });

  it('com o pid indexado, a amizade funciona — e a resposta volta em pid', async () => {
    const pidVitima = PID_VITIMA;
    const env = { DIGIAPP_SAVES: fakeKV({
      [`profile:${ATOR}`]: perfil(ATOR),
      [`profile:${VITIMA}`]: perfil(VITIMA, { pid: pidVitima }),
      [`pid:${pidVitima}`]: VITIMA,
    }) };
    const res = await onRequest({
      request: req('friends', { method: 'POST', body: { id: ATOR, friendId: pidVitima } }),
      env,
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.friends).toEqual([pidVitima]);
    // internamente continua saveId — é o que permite escrever gifts:<saveId>
    const depois = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ATOR}`));
    expect(depois.friends).toEqual([VITIMA]);
  });
});

describe('community — fechar a season é IDEMPOTENTE (WP4.18)', () => {
  // A partir do WP4.18 quem chama `closeSeason` é um cron, e cron repete:
  // retry do Cloudflare, deploy duplicado, dois triggers no dashboard. Sem a
  // trava a segunda passada empurraria o MESMO troféu de novo, e o campeão
  // ficaria com dois 🥇 da mesma season na vitrine.
  const KEY = 'chave-de-admin';
  const CAMPEAO = 'c'.repeat(32);

  function envSeason() {
    return {
      DIGIAPP_SAVES: fakeKV({
        [`profile:${CAMPEAO}`]: perfil(CAMPEAO),
        [`rank:2026-08:${CAMPEAO}`]: JSON.stringify({ points: 99, wins: 9, losses: 0 }),
      }),
      FIREBASE_PROJECT_ID: 'soulmon-test',
      SEASON_ADMIN_KEY: KEY,
    };
  }

  const fechar = env => onRequest({
    request: req('closeSeason', { method: 'POST', body: { season: '2026-08', adminKey: KEY } }),
    env,
  });

  it('duas chamadas dão UM troféu só', async () => {
    const env = envSeason();
    expect(await (await fechar(env)).json()).toMatchObject({ awarded: 1 });
    expect(await (await fechar(env)).json()).toMatchObject({ awarded: 0, already: true });
    const p = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${CAMPEAO}`));
    expect(p.pendingTrophies).toEqual([{ season: '2026-08', place: 1 }]);
  });

  it('a trava é por season — fechar agosto não fecha setembro', async () => {
    const env = envSeason();
    env.DIGIAPP_SAVES.store.set(`rank:2026-09:${CAMPEAO}`, JSON.stringify({ points: 5 }));
    await fechar(env);
    const set = await onRequest({
      request: req('closeSeason', { method: 'POST', body: { season: '2026-09', adminKey: KEY } }),
      env,
    });
    expect(await set.json()).toMatchObject({ awarded: 1 });
  });
});

describe('community — a FAIXA do Torneio nunca rebaixa (WP4.13 / achado E5)', () => {
  // A faixa existe para medir o jogador contra ele mesmo, e a regra escrita é
  // "acumular pontos nunca rebaixa". Ela lia `rank.points` da season, que cai
  // por três caminhos: derrota própria (−8), ser sorteado como oponente e
  // perder (−4, SEM jogar) e a virada de mês, que zera. Dois deles nem
  // dependem de o jogador ter feito algo.
  const A = 'a'.repeat(32);
  const B = 'b'.repeat(32);
  const PID_B = 'b'.repeat(24);

  function envPvp() {
    return {
      DIGIAPP_SAVES: fakeKV({
        [`profile:${A}`]: perfil(A, { pvpEnabled: true, stage: 'mega' }),
        [`profile:${B}`]: perfil(B, { pvpEnabled: true, stage: 'rookie', pid: PID_B }),
        [`pid:${PID_B}`]: A === B ? '' : B,
      }),
      FIREBASE_PROJECT_ID: undefined, // sem auth: `denyUnlessOwner` não bloqueia
    };
  }

  async function lifetimeDe(env, saveId) {
    const p = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${saveId}`));
    return p.lifetimePoints ?? 0;
  }

  it('a partida ACONTECE — senão os testes abaixo mediriam o nada', async () => {
    // Guarda contra o modo de falha clássico deste arquivo: um pid que não
    // resolve devolve 404, os contadores ficam parados, e um assert de
    // "não diminuiu" passa sem que nada tenha rodado.
    const env = envPvp();
    const res = await onRequest({ request: req('match', { method: 'POST', body: { id: A, opponentId: PID_B } }), env });
    expect(res.status).toBe(200);
    const r = await res.json();
    expect(typeof r.won).toBe('boolean');
    // Ganhou alguém: um dos dois lifetime tem de ter subido.
    const soma = (await lifetimeDe(env, A)) + (await lifetimeDe(env, B));
    expect(soma).toBeGreaterThan(0);
  });

  it('perder NÃO reduz o contador que a faixa lê', async () => {
    const env = envPvp();
    // Mesmo que a partida seja perdida, `lifetimePoints` só pode ficar igual
    // ou crescer — jamais diminuir.
    const antes = await lifetimeDe(env, A);
    await onRequest({ request: req('match', { method: 'POST', body: { id: A, opponentId: PID_B } }), env });
    expect(await lifetimeDe(env, A)).toBeGreaterThanOrEqual(antes);
  });

  it('o oponente sorteado também nunca perde faixa por ter sido escolhido', async () => {
    const env = envPvp();
    const antes = await lifetimeDe(env, B);
    await onRequest({ request: req('match', { method: 'POST', body: { id: A, opponentId: PID_B } }), env });
    expect(await lifetimeDe(env, B)).toBeGreaterThanOrEqual(antes);
  });

  it('o rank publica `lifetime` — é dele que a faixa sai, não de `points`', async () => {
    const env = envPvp();
    await onRequest({ request: req('match', { method: 'POST', body: { id: A, opponentId: PID_B } }), env });
    const res = await onRequest({ request: req('rank'), env });
    const { rank } = await res.json();
    expect(rank.length).toBeGreaterThan(0);
    for (const linha of rank) expect(linha).toHaveProperty('lifetime');
  });
});
