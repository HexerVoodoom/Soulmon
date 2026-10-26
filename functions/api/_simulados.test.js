import { describe, it, expect, beforeEach } from 'vitest';
import { SIMULADOS } from './_simulados.data.js';
import {
  CHUNK, OPS_BUDGET, custoEstimado, agendarSimuladosDia, ensureSimuladosDia, estadoDoDia, saveDoSimulado, scoresDoDia, stripSimulated, lockKeyDia, isSimuladoId,
} from './_simulados.js';
import { submitScore, readBoard, payablePlacements, RANKED_GAMES, isoWeekKey } from './_rankings.js';
import { closePreviousMonth, pendingKey, approveRiftPrize, _resetClosedCache } from './_riftPayout.js';
import { readEntitlement } from './_entitlements.js';
import { sanitizarNomeDeGuilda, NOME_MAX } from './_coop.js';
import { duelSide } from './_duel.js';
import { onRequest as community } from './community.js';
import { onRequest as rankings } from './rankings.js';
import { resetRateLimits } from './_rateLimit.js';
import { planejar, promptDe, parseArgs, validarUrlBase, SPRITE_URL_RE, APP_URL_PADRAO } from '../../scripts/simulados-sprites-fila.mjs';

/** KV falso com `list` ordenado, `metadata` e `getWithMetadata`; conta as escritas. */
function fakeKV() {
  const store = new Map();
  const k = {
    store, puts: 0,
    get: async key => (store.has(key) ? store.get(key).v : null),
    getWithMetadata: async key => ({ value: store.has(key) ? store.get(key).v : null, metadata: store.get(key)?.m ?? null }),
    put: async (key, v, o) => { k.puts++; store.set(key, { v, m: o?.metadata }); },
    delete: async key => { store.delete(key); },
    list: async ({ prefix = '', limit = 1000 }) => {
      const names = [...store.keys()].filter(n => n.startsWith(prefix)).sort().slice(0, limit);
      return { keys: names.map(name => ({ name, metadata: store.get(name).m })), list_complete: true };
    },
  };
  return k;
}
const mkEnv = (on = true) => ({ SOULMON_SAVES: fakeKV(), ...(on ? { SIMULADOS_ON: '1' } : {}) });
const DIA = new Date('2026-10-26T10:00:00Z');
/** Roda `ensureSimuladosDia` até o dia fechar. */
async function fecharDia(env, now = DIA) {
  let r;
  for (let i = 0; i < 150; i++) { r = await ensureSimuladosDia(env, now); if (r.status === 'done' || r.status === 'already') return r; }
  throw new Error(`dia não fechou: ${JSON.stringify(r)}`);
}
const snap = (env) => JSON.stringify([...env.SOULMON_SAVES.store.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
const pidOf = (env, i) => JSON.parse(env.SOULMON_SAVES.store.get(`profile:${SIMULADOS[i].id}`).v).pid;

describe('perfis versionados', () => {
  it('50 ids estáveis e válidos, sem colisão com saveId real (hex de 64)', () => {
    expect(SIMULADOS).toHaveLength(50);
    expect(new Set(SIMULADOS.map(p => p.id)).size).toBe(50);
    for (const p of SIMULADOS) {
      expect(p.id).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
      expect(isSimuladoId(p.id)).toBe(true);
    }
  });

  it('apelidos únicos (sem diferenciar caixa) e no formato aceito pelo jogo', () => {
    const baixos = SIMULADOS.map(p => p.nick.normalize('NFKC').trim().toLowerCase());
    expect(new Set(baixos).size).toBe(50);
    for (const p of SIMULADOS) {
      expect(sanitizarNomeDeGuilda(p.nick)).toBe(p.nick);
      expect(p.nick.length).toBeLessThanOrEqual(NOME_MAX);
      expect(sanitizarNomeDeGuilda(p.petName)).toBe(p.petName);
    }
  });

  it('distribuição realista: poucos no topo, maioria no meio/baixo; jogos e frequências válidos', () => {
    const topo = SIMULADOS.filter(p => p.skill >= 0.7).length;
    const baixo = SIMULADOS.filter(p => p.skill < 0.45).length;
    expect(topo).toBeGreaterThanOrEqual(3);
    expect(topo).toBeLessThanOrEqual(8);
    expect(baixo).toBeGreaterThan(topo * 3);
    for (const p of SIMULADOS) {
      expect(['casual', 'regular', 'assiduo']).toContain(p.frequency);
      const jogos = Object.keys(p.prefs);
      expect(jogos.length).toBeGreaterThanOrEqual(1);
      for (const g of jogos) { expect(RANKED_GAMES).toContain(g); expect(p.prefs[g]).toBeGreaterThan(0); expect(p.prefs[g]).toBeLessThanOrEqual(1); }
    }
  });

  it('Soulmon coerente: o level do save derivado bate com o estágio e a ficha de duelo existe', () => {
    for (const p of SIMULADOS) {
      for (const day of ['2026-10-25', '2027-02-01']) {
        const e = estadoDoDia(p, day);
        const side = duelSide(saveDoSimulado(p, day), { maxLevel: 999 });
        expect(side.combatant.level).toBe(e.level);
        expect(e.stage).toBe(e.evolutionStage.split('-')[0]);
      }
    }
  });
});

describe('fila de sprites: segurança do script', () => {
  it('--url só https e host da allowlist; credencial embutida e host parecido são recusados', () => {
    expect(validarUrlBase(APP_URL_PADRAO)).toBe(APP_URL_PADRAO);
    for (const u of ['http://soulmon.mateus-sprnd.workers.dev', 'https://evil.example', 'https://soulmon.mateus-sprnd.workers.dev@evil.example', 'https://soulmon.mateus-sprnd.workers.dev.evil.example', 'nao-e-url']) {
      expect(() => validarUrlBase(u), u).toThrow();
    }
  });
  it('a URL de sprite vinda do servidor é só /api/sprite-image?k=<32 hex>', () => {
    expect(SPRITE_URL_RE.test('/api/sprite-image?k=' + 'a1'.repeat(16))).toBe(true);
    for (const x of ['/api/sprite-image?k=abc', '/api/sprite-image?k=' + 'a'.repeat(32) + '; calc', 'x' + '/api/sprite-image?k=' + 'a'.repeat(32), '/api/sprite-image?k=' + 'A'.repeat(32)]) expect(SPRITE_URL_RE.test(x), x).toBe(false);
  });
});

describe('ativação e idempotência', () => {
  beforeEach(() => resetRateLimits());

  it('sem SIMULADOS_ON o motor é no-op (nenhuma escrita)', async () => {
    const env = mkEnv(false);
    expect((await ensureSimuladosDia(env, DIA)).status).toBe('off');
    expect(env.SOULMON_SAVES.puts).toBe(0);
  });

  it('um lote por chamada; trava do dia vira done; depois disso não escreve nada', async () => {
    const env = mkEnv();
    const r1 = await ensureSimuladosDia(env, DIA);
    expect(r1.status).toBe('progress'); expect(r1.next).toBeGreaterThanOrEqual(1); expect(r1.next).toBeLessThanOrEqual(CHUNK);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(lockKeyDia('2026-10-26')).v)).toMatchObject({ state: 'running', next: r1.next, owner: null });
    await fecharDia(env);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(lockKeyDia('2026-10-26')).v).state).toBe('done');
    const antes = env.SOULMON_SAVES.puts;
    expect((await ensureSimuladosDia(env, DIA)).status).toBe('already');
    expect(env.SOULMON_SAVES.puts).toBe(antes); // a trava roda UMA vez
    // mesmo sem o cache em memória (worker novo): relê a trava `done` e não trabalha
    const novoEnv = { SOULMON_SAVES: env.SOULMON_SAVES, SIMULADOS_ON: '1' };
    expect((await ensureSimuladosDia(novoEnv, DIA)).status).toBe('already');
    expect(env.SOULMON_SAVES.puts).toBe(antes);
  });

  it('falha num simulado NÃO marca o lote como feito: o mesmo simulado é tentado de novo', async () => {
    const env = mkEnv();
    const put0 = env.SOULMON_SAVES.put;
    const alvo = SIMULADOS[1].id;
    env.SOULMON_SAVES.put = async (key, v, o) => { if (key === alvo) throw new Error('kv fora'); return put0(key, v, o); };
    const r1 = await ensureSimuladosDia(env, DIA);
    expect(r1).toMatchObject({ status: 'progress', next: 1 }); // parou NO simulado que falhou
    const r2 = await ensureSimuladosDia(env, DIA);
    expect(r2.next).toBe(1);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(lockKeyDia('2026-10-26')).v).fails).toBe(2);
    const r3 = await ensureSimuladosDia(env, DIA); // 3ª falha: pula esse simulado para não travar o dia
    expect(r3.next).toBe(2);
  });

  it('trava com token: lease de outro worker barra; token trocado entre a escrita e a releitura barra', async () => {
    const env = mkEnv();
    const lockKey = lockKeyDia('2026-10-26');
    await env.SOULMON_SAVES.put(lockKey, JSON.stringify({ state: 'running', next: 5, owner: 'outro', leaseUntil: DIA.getTime() + 10_000 }));
    const antes = env.SOULMON_SAVES.puts;
    expect(await ensureSimuladosDia(env, DIA)).toMatchObject({ status: 'progress', next: 5 });
    expect(env.SOULMON_SAVES.puts).toBe(antes); // não trabalhou
    // lease vencido: assume
    const depois = new Date(DIA.getTime() + 60_000);
    expect((await ensureSimuladosDia(env, depois)).next).toBeGreaterThan(5);
    // corrida: outro worker sobrescreve a trava logo depois da minha escrita -> não processo
    const env2 = mkEnv();
    const put0 = env2.SOULMON_SAVES.put;
    env2.SOULMON_SAVES.put = async (key, v, o) => {
      await put0(key, key === lockKey ? JSON.stringify({ state: 'running', next: 0, owner: 'rival', leaseUntil: DIA.getTime() + 9000 }) : v, o);
    };
    const r = await ensureSimuladosDia(env2, DIA);
    expect(r.status).toBe('progress');
    expect(env2.SOULMON_SAVES.store.has(SIMULADOS[0].id)).toBe(false);
  });

  it('o lote cabe no orçamento: nunca passa de CHUNK simulados nem de OPS_BUDGET (exceto o 1º)', () => {
    expect(OPS_BUDGET).toBeLessThan(40);
    for (const p of SIMULADOS) expect(custoEstimado(p, '2026-10-26')).toBeLessThan(60);
  });

  it('rotas agendam via waitUntil (fora do caminho síncrono) quando existe', async () => {
    const env = mkEnv();
    const pend = [];
    await agendarSimuladosDia({ env, waitUntil: (pr) => pend.push(pr) }, DIA);
    expect(pend).toHaveLength(1);
    await Promise.all(pend);
    expect(env.SOULMON_SAVES.puts).toBeGreaterThan(0);
  });

  it('falha do KV nunca lança', async () => {
    const env = mkEnv();
    env.SOULMON_SAVES.put = async () => { throw new Error('kv fora'); };
    await expect(ensureSimuladosDia(env, DIA)).resolves.toMatchObject({ status: 'skipped' });
  });

  it('perfis ficam públicos para o diretório e com apelido reservado', async () => {
    const env = mkEnv();
    await fecharDia(env);
    const store = env.SOULMON_SAVES.store;
    for (const p of SIMULADOS) {
      const perfil = JSON.parse(store.get(`profile:${p.id}`).v);
      expect(perfil).toMatchObject({ simulated: true, pvpEnabled: true, publicHidden: false, name: p.nick });
      expect(store.get(`nick:${encodeURIComponent(p.nick.toLowerCase())}`).v).toBe(p.id);
      expect(store.has(p.id)).toBe(true); // o save (ficha de duelo)
    }
  });

  it('apelido já tomado por jogador real: o simulado ganha variante, nunca rouba', async () => {
    const env = mkEnv();
    env.SOULMON_SAVES.store.set(`nick:${encodeURIComponent('lia_moon')}`, { v: 'player-realreal' });
    await fecharDia(env);
    const perfil = JSON.parse(env.SOULMON_SAVES.store.get(`profile:${SIMULADOS[0].id}`).v);
    expect(perfil.name).toBe('Lia_Moon2');
    expect(env.SOULMON_SAVES.store.get(`nick:${encodeURIComponent('lia_moon')}`).v).toBe('player-realreal');
  });
});

describe('ranking: aparecem após o ensure e são determinísticos', () => {
  it('há simulados no placar semanal de pelo menos um jogo, marcados `sim` só no metadata', async () => {
    const env = mkEnv();
    await fecharDia(env);
    let achou = 0;
    for (const game of RANKED_GAMES.filter(g => g !== 'endless-rift')) {
      const board = await readBoard(env, { game, period: 'weekly', saveId: null, top: 50, now: DIA });
      achou += board.top.length;
      const pk = `rk:${game}:${isoWeekKey(DIA)}:`;
      for (const [key, v] of env.SOULMON_SAVES.store) if (key.startsWith(pk)) expect(v.m.sim).toBe(true);
    }
    expect(achou).toBeGreaterThan(5);
    const rift = await readBoard(env, { game: 'endless-rift', period: 'monthly', saveId: null, top: 50, now: DIA });
    expect(Array.isArray(rift.top)).toBe(true);
  });

  it('mesmo dia = mesmo resultado (envs independentes); dia diferente muda', async () => {
    const a = mkEnv(); const b = mkEnv();
    await fecharDia(a); await fecharDia(b);
    expect(snap(a)).toBe(snap(b));
    const c = mkEnv();
    await fecharDia(c, new Date('2026-10-27T10:00:00Z'));
    expect(snap(c)).not.toBe(snap(a));
    // pura: scores do dia repetem
    for (const p of SIMULADOS) expect(scoresDoDia(p, '2026-10-26')).toEqual(scoresDoDia(p, '2026-10-26'));
  });

  it('progresso: o level só sobe com os dias e respeita o teto', () => {
    for (const p of SIMULADOS) {
      const l0 = estadoDoDia(p, '2026-10-25').level;
      const l1 = estadoDoDia(p, '2027-03-01').level;
      expect(l1).toBeGreaterThanOrEqual(l0);
      expect(estadoDoDia(p, '2035-01-01').level).toBeLessThanOrEqual(40);
    }
  });
});

describe('nunca levam prêmio', () => {
  const real = (c) => `player-${c.repeat(8)}`;

  it('payablePlacements pula `simulated`, `sim` e o id sim_NNNN', () => {
    const e = [{ saveId: 'sim_0001', score: 9 }, { saveId: 'x1', sim: true }, { saveId: 'x2', simulated: true }, { saveId: 'r1' }, { saveId: 'r2' }];
    expect(payablePlacements(e, 3).map(x => x.saveId)).toEqual(['r1', 'r2']);
  });

  it('Endless Rift: simulados no topo do mês, Créditos só para os reais', async () => {
    const env = mkEnv();
    _resetClosedCache();
    // outubro inteiro dos simulados + três jogadores reais com score MENOR que o topo simulado
    for (let d = 1; d <= 28; d++) await fecharDia(env, new Date(Date.UTC(2026, 9, d, 10)));
    const topoSim = (await readBoard(env, { game: 'endless-rift', period: 'monthly', saveId: null, top: 1, now: new Date('2026-10-28T10:00:00Z') })).top[0];
    expect(topoSim).toBeTruthy();
    const at = new Date('2026-10-20T12:00:00Z');
    await submitScore(env, { game: 'endless-rift', period: 'monthly', saveId: real('a'), score: Math.max(1, topoSim.score - 1), now: at });
    await submitScore(env, { game: 'endless-rift', period: 'monthly', saveId: real('b'), score: 2, now: at });
    const r = await closePreviousMonth(env, new Date('2026-11-02T09:00:00Z'));
    expect(r.status).toBe('closed');
    expect(r.pending.every(p => !p.saveId.startsWith('sim_'))).toBe(true);
    expect(r.pending.map(p => p.saveId)).toEqual([real('a'), real('b')]);
    // o fechamento só grava PENDENTE (decisão do dono 1): o Crédito sai na aprovação do GM
    await approveRiftPrize(env, '2026-10', real('a'));
    await approveRiftPrize(env, '2026-10', real('b'));
    expect((await readEntitlement(env, real('a'))).credits).toBe(50);
    expect((await readEntitlement(env, real('b'))).credits).toBe(25);
    for (const p of SIMULADOS) {
      expect(env.SOULMON_SAVES.store.has(pendingKey('2026-10', p.id))).toBe(false);
      expect((await readEntitlement(env, p.id)).credits).toBe(0);
    }
  });

  it('Rift: simulado sem o `sim` no metadata ainda não é pago (rede pelo id)', async () => {
    const env = { SOULMON_SAVES: fakeKV() };
    _resetClosedCache();
    env.SOULMON_SAVES.store.set('rk:endless-rift:2026-10:0999999900:sim_0001', { v: '', m: { s: 100, n: 'Lia_Moon', t: 1 } });
    await submitScore(env, { game: 'endless-rift', period: 'monthly', saveId: real('c'), score: 5, now: new Date('2026-10-20T12:00:00Z') });
    const r = await closePreviousMonth(env, new Date('2026-11-02T09:00:00Z'));
    expect(r.pending.map(p => p.saveId)).toEqual([real('c')]);
  });

  it('closeSeason não dá troféu a simulado (desce para o real)', async () => {
    const env = mkEnv();
    env.SOULMON_ADMIN_KEY = undefined;
    env.SEASON_ADMIN_KEY = 'k-test';
    await fecharDia(env);
    const season = new Date().toISOString().slice(0, 7);
    const meu = real('d');
    env.SOULMON_SAVES.store.set(`profile:${meu}`, { v: JSON.stringify({ id: meu, name: 'Real', pvpEnabled: true }) });
    env.SOULMON_SAVES.store.set(`rank:${season}:${meu}`, { v: JSON.stringify({ points: 1, wins: 0, losses: 0 }) });
    // os simulados do dia podem estar em outra season (relógio real): garante que há rank deles NA season corrente
    for (const p of SIMULADOS.slice(0, 5)) env.SOULMON_SAVES.store.set(`rank:${season}:${p.id}`, { v: JSON.stringify({ points: 500, wins: 9, losses: 1 }) });
    const res = await community({
      request: new Request('https://x.dev/api/community?action=closeSeason', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ season, adminKey: 'k-test' }) }), env,
    });
    expect((await res.json()).awarded).toBe(1);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(`profile:${meu}`).v).pendingTrophies).toEqual([{ season, place: 1 }]);
    for (const p of SIMULADOS) expect(JSON.parse(env.SOULMON_SAVES.store.get(`profile:${p.id}`).v).pendingTrophies).toBeUndefined();
  });

  it('presente para simulado: aceito sem efeito (nada na fila dele, ninguém debitado)', async () => {
    const env = mkEnv();
    await fecharDia(env);
    const eu = real('e');
    const sim = SIMULADOS[0];
    const pidSim = pidOf(env, 0);
    env.SOULMON_SAVES.store.set(`profile:${eu}`, { v: JSON.stringify({ id: eu, name: 'Eu', pvpEnabled: true, friends: [sim.id], pid: 'ee'.repeat(12) }) });
    const res = await community({
      request: new Request(`https://x.dev/api/community?action=gift&id=${eu}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: eu, friendId: pidSim }) }), env,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(env.SOULMON_SAVES.store.has(`gifts:${sim.id}`)).toBe(false);
  });
});

describe('o cliente nunca vê `simulated`', () => {
  const real = 'player-' + 'f'.repeat(8);
  beforeEach(() => resetRateLimits());

  it('stripSimulated remove os campos internos em qualquer profundidade e preserva o resto', () => {
    const o = { a: 1, simulated: true, x: [{ sim: true, n: 2, simSig: 's' }], y: { z: { simulated: false, k: 3 } } };
    expect(stripSimulated(o)).toEqual({ a: 1, x: [{ n: 2 }], y: { z: { k: 3 } } });
    const limpo = { a: [1, 2] };
    expect(stripSimulated(limpo)).toBe(limpo);
  });

  it('diretório, perfil, oponentes, ranking e placar por jogo: nenhuma resposta leva o campo', async () => {
    const env = mkEnv();
    await fecharDia(env, new Date());
    env.SOULMON_SAVES.store.set(`profile:${real}`, { v: JSON.stringify({ id: real, name: 'RealOne', pvpEnabled: true, lifetimePoints: 50, pid: 'ff'.repeat(12), friends: [] }) });
    env.SOULMON_SAVES.store.set(real, { v: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 2 }), m: { f: Date.now() - 5 * 86400000 } });
    const get = (action, params = {}) => community({ request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action, ...params })}`), env });
    const textos = [];
    const players = await (await get('players')).text(); textos.push(players);
    const lista = JSON.parse(players).players;
    expect(lista.length).toBeGreaterThanOrEqual(40); // a sala não está vazia
    textos.push(await (await get('player', { id: lista[0].id })).text());
    textos.push(await (await get('opponents', { id: real })).text());
    textos.push(await (await get('rank')).text());
    textos.push(await (await get('seasonResult')).text());
    for (const game of RANKED_GAMES) {
      const r = await rankings({ request: new Request(`https://x.dev/api/rankings?game=${game}&id=${real}&top=50`), env });
      expect(r.status).toBe(200);
      textos.push(await r.text());
    }
    for (const t of textos) {
      expect(t).not.toMatch(/"simulated"/);
      expect(t).not.toMatch(/"sim"/);
      expect(t).not.toMatch(/"simSig"/);
      expect(t).not.toMatch(/sim_\d{4}/); // nem o id interno
    }
    // e eles aparecem como gente: apelido plausível no diretório
    expect(lista.some(p => SIMULADOS.some(s => s.nick === p.name))).toBe(true);
  });

  it('oponentes do ranqueado incluem simulados com ficha de duelo (level), sem revelar nada', async () => {
    const env = mkEnv();
    await fecharDia(env, new Date());
    env.SOULMON_SAVES.store.set(`profile:${real}`, { v: JSON.stringify({ id: real, name: 'RealOne', pvpEnabled: true, pid: 'ff'.repeat(12), friends: [] }) });
    env.SOULMON_SAVES.store.set(real, { v: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 2 }), m: { f: Date.now() - 5 * 86400000 } });
    const res = await community({ request: new Request(`https://x.dev/api/community?action=opponents&id=${real}`), env });
    const j = await res.json();
    expect(j.opponents).toHaveLength(3);
    for (const o of j.opponents) {
      expect(o.duel?.level).toBeGreaterThanOrEqual(1);
      expect(o).not.toHaveProperty('simulated');
    }
  });
});

describe('fila de sprites (script manual)', () => {
  it('dry-run por padrão e plano de 50 itens', () => {
    expect(parseArgs([]).run).toBe(false);
    expect(parseArgs(['--run', '--only', 'sim_0001,sim_0002'])).toMatchObject({ run: true, only: ['sim_0001', 'sim_0002'] });
    const plano = planejar();
    expect(plano).toHaveLength(50);
    expect(plano[0].kvKey).toBe('sim:sprite:sim_0001');
    expect(promptDe(SIMULADOS[0])).toContain('#00FF00');
    expect(planejar(['sim_0003'])).toHaveLength(1);
  });
});
