import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onRequest } from './community.js';
import { resetRateLimits } from './_rateLimit.js';

// §351 (13/11/2026) — DECISÃO DO DONO (modal): "deixar a busca achar quem está com o PvP desligado".
// As sugestões de apelido (`names`) listavam quem está com o PvP desligado, mas a busca do "Convidar amigo"
// (`players&search=`) exigia `pvpEnabled`: tocar numa sugestão terminava em "Não achei ninguém com esse nome".
// O conserto é um MODO da busca (`lookup=friend`, autorizado pelo dono do `id`), não o afrouxamento do diretório:
// o diretório, o Torneio e o Treino seguem exigindo PvP ligado.

const ALICE = 'a'.repeat(32); // quem convida (PvP ligado)
const BRUNO = 'b'.repeat(32); // PvP DESLIGADO, visível
const CAROL = 'c'.repeat(32); // PvP ligado, visível
const DIANA = 'd'.repeat(32); // PvP desligado e ESCONDIDA (publicHidden)
const PID = { [ALICE]: 'aa'.repeat(12), [BRUNO]: 'bb'.repeat(12), [CAROL]: 'cc'.repeat(12), [DIANA]: 'dd'.repeat(12) };
const SEASON = new Date().toISOString().slice(0, 7);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix, limit }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit ?? 1000).map(name => ({ name })),
      list_complete: true,
    }),
  };
}

const perfil = (id, name, extra) => JSON.stringify({
  id, pid: PID[id], name, petName: `pet-${name}`, stage: 'rookie',
  attrs: { power: 1, harmony: 1, benevolence: 1 }, avatarId: 'av1', element: 'fire',
  friends: [], createdAt: Date.now() - 5 * 86400000, tasksDone: 9, ...extra,
});
const rank = points => JSON.stringify({ points, wins: 1, losses: 0, day: '2000-01-01', matchesToday: 0 });

function mundo() {
  const seed = {
    [`profile:${ALICE}`]: perfil(ALICE, 'Alice', { pvpEnabled: true }),
    [`profile:${BRUNO}`]: perfil(BRUNO, 'Bruno', { pvpEnabled: false }),
    [`profile:${CAROL}`]: perfil(CAROL, 'Brunela', { pvpEnabled: true }),
    [`profile:${DIANA}`]: perfil(DIANA, 'Bruna', { pvpEnabled: false, publicHidden: true }),
    'nick:alice': ALICE, 'nick:bruno': BRUNO, 'nick:brunela': CAROL, 'nick:bruna': DIANA,
    [`rank:${SEASON}:${ALICE}`]: rank(10),
    [`rank:${SEASON}:${CAROL}`]: rank(20),
  };
  for (const s of [ALICE, BRUNO, CAROL, DIANA]) {
    seed[`pid:${PID[s]}`] = s;
    seed[s] = JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3 }); // o duelo lê o save de cada lado
  }
  return { DIGIAPP_SAVES: fakeKV(seed) };
}

const get = (env, action, params = {}, headers = {}) => onRequest({
  request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action, ...params })}`, { headers }),
  env,
});
const lookup = (env, search, id = ALICE) => get(env, 'players', { search, lookup: 'friend', id });
const nomes = async res => (await res.json()).players.map(p => p.name);

beforeEach(() => {
  resetRateLimits();
  vi.stubGlobal('caches', undefined);
});

describe('§351 a busca do "Convidar amigo" acha quem está com o PvP desligado (decisão do dono)', () => {
  it('jogador VISÍVEL com PvP desligado é achado pelo apelido', async () => {
    const res = await lookup(mundo(), 'bruno');
    expect(res.status).toBe(200);
    const { players } = await res.json();
    expect(players).toEqual([{ id: PID[BRUNO], name: 'Bruno', stage: 'rookie' }]);
  });

  it('sai SÓ a vista mínima: nenhum campo novo (nem petName, element, avatar, daysPlaying, pvpEnabled, saveId)', async () => {
    const { players } = await (await lookup(mundo(), 'bru')).json();
    expect(players.length).toBeGreaterThan(0);
    for (const p of players) {
      for (const k of Object.keys(p)) expect(['id', 'name', 'stage', 'spriteUrl']).toContain(k);
    }
    const txt = JSON.stringify(players);
    for (const s of [ALICE, BRUNO, CAROL, DIANA]) expect(txt).not.toContain(s);
  });

  it('jogador ESCONDIDO não é achado — e a resposta é igual à de um apelido que não existe', async () => {
    const env = mundo();
    const escondido = await (await lookup(env, 'bruna')).json();
    const inexistente = await (await lookup(env, 'zzzzz')).json();
    expect(escondido.players.map(p => p.name)).not.toContain('Bruna');
    expect(JSON.stringify(await (await lookup(env, 'bruna')).json())).not.toContain('"Bruna"');
    expect(inexistente).toEqual({ players: [] });
    // "bruna" não está contido em "brunela": nada mais casa, então escondido e inexistente têm de dar o MESMO corpo.
    expect(escondido).toEqual(inexistente);
  });

  it('a própria conta não volta', async () => {
    expect(await nomes(await lookup(mundo(), 'alice'))).toEqual([]);
  });

  it('a busca de convite sem termo é 400 (este modo nunca lista todo mundo)', async () => {
    expect((await lookup(mundo(), '')).status).toBe(400);
  });

  it('com autenticação ligada, sem token é 401 (só o dono do id pergunta)', async () => {
    const env = { ...mundo(), FIREBASE_PROJECT_ID: 'soulmon-test' };
    expect((await lookup(env, 'bruno')).status).toBe(401);
  });

  it('não emite identidade para quem está com o PvP desligado (leitura sem escrita)', async () => {
    const env = mundo();
    const antes = new Map(env.DIGIAPP_SAVES.store);
    await lookup(env, 'bruno');
    expect(env.DIGIAPP_SAVES.store).toEqual(antes);
  });

  it('as sugestões (`names`) e a busca do convite concordam: toda sugestão é achada', async () => {
    const env = mundo();
    const { names } = await (await get(env, 'names', { prefix: 'br' })).json();
    expect(names).toEqual(['Brunela', 'Bruno']); // Bruna (escondida) não é sugerida
    for (const n of names) {
      const achados = await nomes(await lookup(env, n));
      expect(achados).toContain(n);
    }
  });
});

describe('§351 o resto NÃO afrouxa: diretório, Torneio e Treino seguem exigindo PvP ligado', () => {
  it('diretório sem busca: só PvP ligado', async () => {
    expect(await nomes(await get(mundo(), 'players'))).toEqual(['Alice', 'Brunela']);
  });

  it('diretório COM busca (sem `lookup=friend`): PvP desligado continua fora', async () => {
    expect(await nomes(await get(mundo(), 'players', { search: 'bru' }))).toEqual(['Brunela']);
  });

  it('`lookup` com outro valor não abre nada', async () => {
    expect(await nomes(await get(mundo(), 'players', { search: 'bru', lookup: 'x', id: ALICE }))).toEqual(['Brunela']);
  });

  it('oponentes do Torneio: PvP desligado não aparece', async () => {
    const { opponents } = await (await get(mundo(), 'opponents', { id: ALICE })).json();
    const ns = opponents.map(o => o.name);
    expect(ns).not.toContain('Bruno');
    expect(ns).not.toContain('Bruna');
  });

  it('oponentes do Treino (`sparOpponents`): PvP desligado não aparece', async () => {
    const res = await get(mundo(), 'sparOpponents', { id: ALICE });
    expect(res.status).toBe(200);
    const { opponents } = await res.json();
    const ns = opponents.map(o => o.name);
    expect(ns).not.toContain('Bruno');
    expect(ns).not.toContain('Bruna');
  });
});
