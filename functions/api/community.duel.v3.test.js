/**
 * O duelo fantasma no SERVIDOR com o núcleo v3 (combate v3, PR5; contexto §2.19).
 *
 * O que as rotas travam (nenhum dado do cliente decide o resultado):
 *  1. a SEMENTE nasce em `duelStart`, depois de a partida ser gasta; a do corpo é ignorada; a lista não traz semente;
 *  2. a ficha dos DOIS lados vem do SAVE (KV), com o teto S1, e é CONGELADA em `duelStart` — editar o save entre
 *     `duelStart` e `match` não muda a luta;
 *  3. a torcida é higienizada por balde (teto) e toque forjado não rende mais que o teto;
 *  4. o EMPATE é um resultado válido: a partida conta como jogada, ninguém ganha pontos, vitória, derrota nem Honra;
 *  5. save ausente = recusa ANTES de gastar a partida (a partida só cai no `duelStart` que respondeu 200);
 *  6. a regra antiga continua: desistir é perder, cota diária, cliente antigo.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { onRequest } from './community.js';
import { simulateDuel, DUEL_PENDING_MS, DUEL_TAPS_CAP, DUEL_CHEER_BUCKETS, DUEL_DAY_MS } from './_duel.js';

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const OPP2 = 'c'.repeat(32);
const PID = { [OPP]: 'p'.repeat(24), [OPP2]: 'q'.repeat(24) };
const TETO = Array(DUEL_CHEER_BUCKETS).fill(DUEL_TAPS_CAP);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}
const perfil = (id, stage = 'rookie') => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage, pvpEnabled: true, pid: PID[id] });
const saveDe = (over = {}) => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000, ...over });
/** Um ambiente com os 3 jogadores, perfil + save (com `f` de 90 dias atrás: o teto S1 não limita ninguém). */
const mkEnv = ({ me = {}, opp = {}, opp2 = {}, semSaveOpp = false, f = Date.now() - 90 * DUEL_DAY_MS } = {}) => {
  const kv = fakeKV({
    [`profile:${ME}`]: perfil(ME),
    [`profile:${OPP}`]: perfil(OPP), [`pid:${PID[OPP]}`]: OPP,
    [`profile:${OPP2}`]: perfil(OPP2), [`pid:${PID[OPP2]}`]: OPP2,
    [ME]: saveDe(me),
    ...(semSaveOpp ? {} : { [OPP]: saveDe(opp) }),
    [OPP2]: saveDe(opp2),
  });
  for (const k of [ME, OPP, OPP2]) kv.meta.set(k, { t: Date.now(), f });
  return { DIGIAPP_SAVES: kv };
};
const call = async (env, action, body, method = 'POST') => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, {
      method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ id: ME, ...body }) : undefined,
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};
const rankKey = (env, id) => [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(id));
const rankDe = (env, id) => { const k = rankKey(env, id); return k ? JSON.parse(env.DIGIAPP_SAVES.store.get(k)) : null; };
const rank = env => rankDe(env, ME);
const mexerNoRank = (env, fn) => { const k = rankKey(env, ME); const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k)); fn(rec); env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec)); };
const setSeed = (env, seed) => mexerNoRank(env, rec => { rec.pending.seed = seed; });

describe('AC2. a semente nunca chega antes do compromisso', () => {
  it('a lista de oponentes não traz semente nenhuma, nem a ficha inteira: só o level que cada um luta', async () => {
    const env = mkEnv();
    const r = await call(env, 'opponents', {}, 'GET');
    expect(r.status).toBe(200);
    expect(r.json.opponents.length).toBe(2);
    for (const o of r.json.opponents) {
      expect(o.duel).toEqual({ level: expect.any(Number) });
      expect(JSON.stringify(o)).not.toMatch(/seed|atk|spd|special|fx/i);
    }
    expect(r.json.me.duel.level).toBeGreaterThan(0);
  });

  it('duelStart gasta a partida do dia, devolve a semente e a ficha dos DOIS lados (derivada do save)', async () => {
    const env = mkEnv({ opp: { evolutionStage: 'champion-power', perfectDays: 2, soulmonSkills: { champion: { especial: { escolaId: 'benca' }, basica: { escolaId: 'longo_alcance' } } } } });
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(200);
    expect(typeof r.json.seed).toBe('number');
    expect(r.json.matchesLeft).toBe(4);
    expect(r.json.me.combatant.level).toBe(4); // rookie, 3 dias perfeitos
    expect(r.json.opp.combatant.level).toBe(9); // champion começa no level 7, mais 2 dias
    expect(r.json.opp.special.family).toBe('heal');
    expect(r.json.opp.fx).toEqual({ basica: 'longo_alcance', especial: 'benca', familia: 'heal' });
    expect(rank(env).matchesToday).toBe(1);
    expect(rank(env).pending.sides.opp.combatant.level).toBe(9); // congelada
  });

  it('semente enviada pelo cliente é ignorada: mesmo duelo, mesmo resultado', async () => {
    const a = mkEnv(); const b = mkEnv();
    await call(a, 'duelStart', { opponentId: PID[OPP] });
    await call(b, 'duelStart', { opponentId: PID[OPP] });
    setSeed(a, 12345); setSeed(b, 12345);
    const ra = await call(a, 'match', { opponentId: PID[OPP], taps: [4, 4, 4], seed: 1 });
    const rb = await call(b, 'match', { opponentId: PID[OPP], taps: [4, 4, 4], seed: 999 });
    expect(ra.json.duel.events).toEqual(rb.json.duel.events);
    expect(ra.json.outcome).toBe(rb.json.outcome);
  });
});

describe('AC3. nenhum dado do cliente decide o resultado', () => {
  it('a ficha é CONGELADA no duelStart: editar o save (level, família) depois da semente não muda a luta', async () => {
    const a = mkEnv(); const b = mkEnv();
    await call(a, 'duelStart', { opponentId: PID[OPP] });
    await call(b, 'duelStart', { opponentId: PID[OPP] });
    setSeed(a, 777); setSeed(b, 777);
    // o dono "descobre" a semente e forja o save inteiro antes do match
    b.DIGIAPP_SAVES.store.set(ME, saveDe({ evolutionStage: 'ultra-power', perfectDays: 999, soulmonSkills: { rookie: { especial: { escolaId: 'maldicao' } } } }));
    const ra = await call(a, 'match', { opponentId: PID[OPP], taps: [] });
    const rb = await call(b, 'match', { opponentId: PID[OPP], taps: [] });
    expect(rb.json.duel.events).toEqual(ra.json.duel.events);
    expect(rb.json.duel.me.combatant.level).toBe(4);
  });

  it('S1 na rota: um save de level 40 com a 1ª gravação de 3 dias atrás luta com level 4 — limitado, não recusado', async () => {
    const env = mkEnv({ opp: { evolutionStage: 'ultra-power', perfectDays: 999 }, f: Date.now() - 3 * DUEL_DAY_MS - 5000 });
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(200);
    expect(r.json.opp.combatant.level).toBe(4);
    expect(r.json.me.combatant.level).toBe(4);
    const lista = await call(env, 'opponents', {}, 'GET');
    expect(lista.json.opponents.every(o => o.duel.level <= 4)).toBe(true);
  });

  it('save válido com a 1ª gravação antiga passa intacto; save SEM f (anterior à regra) vale o teto do estágio', async () => {
    const env = mkEnv({ opp: { evolutionStage: 'mega-power', perfectDays: 12 } });
    env.DIGIAPP_SAVES.meta.set(OPP, { t: Date.now() }); // sem f
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.json.opp.combatant.level).toBe(30); // mega: 12 dias dariam o level 34, mas o teto do estágio é 30
  });

  it('toque forjado não rende mais que o teto: 999 por balde resolve IGUAL ao teto por balde', async () => {
    const a = mkEnv(); const b = mkEnv();
    await call(a, 'duelStart', { opponentId: PID[OPP] });
    await call(b, 'duelStart', { opponentId: PID[OPP] });
    setSeed(a, 4242); setSeed(b, 4242);
    const ra = await call(a, 'match', { opponentId: PID[OPP], taps: Array(60).fill(999) }); // baldes a mais também não valem
    const rb = await call(b, 'match', { opponentId: PID[OPP], taps: TETO });
    expect(ra.json.duel.events).toEqual(rb.json.duel.events);
    // lixo no corpo vira "sem torcida" e não derruba a rota
    const c = mkEnv(); const d = mkEnv();
    await call(c, 'duelStart', { opponentId: PID[OPP] });
    await call(d, 'duelStart', { opponentId: PID[OPP] });
    setSeed(c, 4242); setSeed(d, 4242);
    const rc = await call(c, 'match', { opponentId: PID[OPP], taps: 'oi' });
    const rd = await call(d, 'match', { opponentId: PID[OPP], taps: [] });
    expect(rc.status).toBe(200);
    expect(rc.json.duel.events).toEqual(rd.json.duel.events);
  });

  it('a resposta é a luta do servidor: o que `simulateDuel` calcula com a semente e a ficha congeladas', async () => {
    const env = mkEnv();
    const s = await call(env, 'duelStart', { opponentId: PID[OPP] });
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: TETO });
    const esperado = simulateDuel({ me: s.json.me, opp: s.json.opp, seed: s.json.seed, taps: TETO });
    expect(r.json.duel.events).toEqual(JSON.parse(JSON.stringify(esperado.events)));
    expect(r.json.outcome).toBe(esperado.winner === 'me' ? 'win' : esperado.winner === 'opp' ? 'loss' : 'draw');
    expect(r.json.myScore).toBe(Math.round(100 * esperado.hpMe));
    expect(r.json.oppScore).toBe(Math.round(100 * esperado.hpOpp));
  });

  it('AC4. fonte única dos stats: nem `_duel.js` nem as rotas do duelo leem `profile.attrs` ou `attrSum`', () => {
    const duel = readFileSync(resolve(__dirname, '_duel.js'), 'utf8');
    const community = readFileSync(resolve(__dirname, 'community.js'), 'utf8').replace(/\r\n/g, '\n');
    const semComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(semComentarios(duel)).not.toMatch(/attrs|attrSum|duelStats|profile\.stage/);
    const ini = community.indexOf("if (action === 'opponents'");
    const fim = community.indexOf("if ((action === 'rank'");
    expect(ini).toBeGreaterThan(0);
    expect(fim).toBeGreaterThan(ini);
    expect(semComentarios(community.slice(ini, fim))).not.toMatch(/attrs|attrSum|duelStats/);
    expect(semComentarios(community)).not.toMatch(/duelStats/);
  });
});

describe('AC5. o empate é um resultado válido, sem pontos para ninguém', () => {
  it('com a semente de um espelho que empata, a rota devolve draw:true e NINGUÉM mexe em pontos, vitórias, derrotas ou lifetimePoints', async () => {
    const env = mkEnv();
    const s = await call(env, 'duelStart', { opponentId: PID[OPP] });
    // espelho: o mesmo save dos dois lados → a mesma ficha
    expect(s.json.me).toEqual(s.json.opp);
    let achou = null;
    for (let seed = 0; seed < 30000 && achou === null; seed++) {
      if (simulateDuel({ me: s.json.me, opp: s.json.opp, seed, taps: [] }).winner === 'draw') achou = seed;
    }
    expect(achou).not.toBeNull();
    setSeed(env, achou);
    const antesMe = JSON.parse(JSON.stringify(rank(env)));
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: [] });
    expect(r.status).toBe(200);
    expect(r.json.draw).toBe(true);
    expect(r.json.won).toBe(false);
    expect(r.json.outcome).toBe('draw');
    expect(r.json.myScore).toBe(0);
    expect(r.json.oppScore).toBe(0);
    const depois = rank(env);
    expect(depois.points).toBe(antesMe.points);
    expect(depois.wins).toBe(antesMe.wins);
    expect(depois.losses).toBe(antesMe.losses);
    expect(depois.matchesToday).toBe(1);   // a partida conta como jogada
    expect(depois.pending).toBeNull();
    expect(rankDe(env, OPP)).toBeNull();   // o oponente não foi tocado
    const meProf = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ME}`));
    const oppProf = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${OPP}`));
    expect(meProf.lifetimePoints ?? 0).toBe(0);
    expect(oppProf.lifetimePoints ?? 0).toBe(0);
  });

  it('a vitória e a derrota seguem pagando como antes (+20/−8, o oponente −4/+10)', async () => {
    const env = mkEnv({ me: { evolutionStage: 'mega-power', perfectDays: 9 } }); // level 31+ contra um rookie: vitória certa
    env.DIGIAPP_SAVES.meta.set(ME, { t: Date.now(), f: Date.now() - 400 * DUEL_DAY_MS });
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: [] });
    expect(r.json.outcome).toBe('win');
    expect(r.json.draw).toBe(false);
    expect(rank(env).points).toBe(20);
    expect(rank(env).wins).toBe(1);
    expect(rankDe(env, OPP).losses).toBe(1);
    const env2 = mkEnv({ opp: { evolutionStage: 'mega-power', perfectDays: 9 } });
    env2.DIGIAPP_SAVES.meta.set(OPP, { t: Date.now(), f: Date.now() - 400 * DUEL_DAY_MS });
    await call(env2, 'duelStart', { opponentId: PID[OPP] });
    const r2 = await call(env2, 'match', { opponentId: PID[OPP], taps: [] });
    expect(r2.json.outcome).toBe('loss');
    expect(rank(env2).losses).toBe(1);
    expect(rankDe(env2, OPP).wins).toBe(1);
    expect(rankDe(env2, OPP).points).toBe(10);
  });
});

describe('AC10. erro: nada é cobrado se a luta não pode acontecer', () => {
  it('o save do OPONENTE sumiu: duelStart responde 404 e NENHUMA partida foi gasta', async () => {
    const env = mkEnv({ semSaveOpp: true });
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(404);
    expect(rankKey(env, ME)).toBeUndefined(); // nem o registro de rank nasceu
  });
  it('o save do PRÓPRIO jogador sumiu: 409 e nada gasto', async () => {
    const env = mkEnv();
    env.DIGIAPP_SAVES.store.delete(ME);
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(409);
    expect(rankKey(env, ME)).toBeUndefined();
  });
  it('o `match` sem duelo aberto (cliente antigo) também recusa ANTES de gastar a partida', async () => {
    const env = mkEnv({ semSaveOpp: true });
    const r = await call(env, 'match', { opponentId: PID[OPP] });
    expect(r.status).toBe(404);
    expect(rankKey(env, ME)).toBeUndefined();
  });
  it('save ilegível (JSON quebrado) conta como ausente', async () => {
    const env = mkEnv();
    env.DIGIAPP_SAVES.store.set(OPP, '{nao-e-json');
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(404);
  });
});

describe('duelo — desistir é perder (a regra antiga, no motor novo)', () => {
  it('forfeit conta derrota, paga o oponente e NÃO deixa a partida de graça', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    const r = await call(env, 'match', { opponentId: PID[OPP], forfeit: true });
    expect(r.json.won).toBe(false);
    expect(r.json.draw).toBe(false);
    expect(r.json.forfeit).toBe(true);
    expect(r.json.matchesLeft).toBe(4);
    expect(rank(env).losses).toBe(1);
    expect(rankDe(env, OPP).wins).toBe(1);
    expect(rank(env).pending).toBeNull();
  });

  it('fechar o app (duelo aberto) vira derrota na próxima abertura', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    await call(env, 'duelStart', { opponentId: PID[OPP2] });
    const r = rank(env);
    expect(r.losses).toBe(1);
    expect(r.matchesToday).toBe(2);
    expect(r.pending.opp).toBe(PID[OPP2]);
  });

  it('duelo aberto contra outro oponente também é fechado como derrota no match', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    await call(env, 'match', { opponentId: PID[OPP2], taps: [] });
    const r = rank(env);
    expect(r.losses + r.wins).toBeGreaterThanOrEqual(1);
    expect(r.matchesToday).toBe(2);
  });

  it('passou do prazo do duelo: o match vira desistência, mesmo com torcida perfeita', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    mexerNoRank(env, rec => { rec.pending.at = Date.now() - DUEL_PENDING_MS - 1000; });
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: TETO });
    expect(r.json.forfeit).toBe(true);
    expect(r.json.won).toBe(false);
  });

  it('não dá para desistir de um duelo que não está aberto', async () => {
    const env = mkEnv();
    const r = await call(env, 'match', { opponentId: PID[OPP], forfeit: true });
    expect(r.status).toBe(409);
    expect(rankDe(env, ME)).toBeNull();
  });
});

describe('duelo — resolver usa a semente do servidor e gasta uma partida só', () => {
  it('duelStart + match = UMA partida gasta, e o pending some', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: TETO });
    expect(r.status).toBe(200);
    expect(r.json.forfeit).toBeUndefined();
    expect(rank(env).matchesToday).toBe(1);
    expect(rank(env).pending).toBeNull();
    expect(r.json.duel.events.length).toBeGreaterThan(0);
  });

  it('a cota diária vale para o duelo: a 6ª abertura é recusada', async () => {
    const env = mkEnv();
    for (let i = 0; i < 5; i++) {
      await call(env, 'duelStart', { opponentId: PID[OPP] });
      await call(env, 'match', { opponentId: PID[OPP], taps: [] });
    }
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(429);
  });

  it('cliente antigo (sem duelStart) ainda joga: abre e fecha numa chamada só, com a ficha lida do save', async () => {
    const env = mkEnv();
    const r = await call(env, 'match', { opponentId: PID[OPP] });
    expect(r.status).toBe(200);
    expect(rank(env).matchesToday).toBe(1);
    expect(r.json.duel.me.combatant.level).toBe(4);
  });

  it('duelo aberto ANTES do v3 (pending sem ficha guardada) fecha com a ficha lida agora e a semente dele', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    mexerNoRank(env, rec => { delete rec.pending.sides; rec.pending.seed = 99; });
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: [] });
    expect(r.status).toBe(200);
    expect(rank(env).matchesToday).toBe(1);
    expect(r.json.duel.me.combatant.level).toBe(4);
  });
});
