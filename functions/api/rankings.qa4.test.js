// QA beta3 (lane servidor/dinheiro): lastro do Endless Rift, tetos por jogo, nome de quem se escondeu, Obstacle Run por nível,
// ranking de TEMPO (Zip/Patches) e posição premiada. Réguas de segurança/dinheiro: não afrouxar.
import { describe, it, expect, vi } from 'vitest';
import { bumpRiftLayers, readRiftLayers, readRiftLastro, riftStartLayer, RIFT_MAX_LAYERS_PER_DAY } from './_dayCounters.js';
import { readBoard, submitScore, cleanScore, scoreIsPlausible, MAX_SCORE_BY_GAME, RANKED_GAMES } from './_rankings.js';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: rank } = await import('./rankings.js');

const ID = 'c'.repeat(32);
const NOW = Date.UTC(2026, 9, 13, 15, 0, 0);
const kvx = () => {
  const m = new Map(); const md = new Map();
  return { m, md,
    get: async k => m.get(k) ?? null, put: async (k, v, o) => { m.set(k, v); md.set(k, o?.metadata); }, delete: async k => { m.delete(k); md.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).sort().map(name => ({ name, metadata: md.get(name) })), list_complete: true }) };
};
const day = (n) => ({ day: new Date(NOW + n * 86_400_000).toISOString().slice(0, 10), layers: 0 });
const dd = (n, layers) => ({ ...day(n), layers });

describe('lastro do Endless Rift ancorado no ponto de retomada (R1 CRÍTICO / R2 ALTO)', () => {
  it('FORJAR dungeonDaily.layers=999 não vira lastro 999: a taxa por dia limita', async () => {
    const k = kvx();
    await bumpRiftLayers(k, ID, undefined, dd(0, 999), NOW);
    expect(await readRiftLayers(k, ID, NOW)).toBe(RIFT_MAX_LAYERS_PER_DAY); // base 1 + 60 - 1
    // mais saves no MESMO dia do servidor não passam do teto diário
    await bumpRiftLayers(k, ID, dd(0, 999), dd(0, 999), NOW);
    await bumpRiftLayers(k, ID, dd(0, 10), dd(0, 999), NOW);
    expect(await readRiftLayers(k, ID, NOW)).toBe(RIFT_MAX_LAYERS_PER_DAY);
  });

  it('o dia do SERVIDOR é quem conta: relógio do aparelho +1 dia não abre um segundo teto no mesmo dia real', async () => {
    const k = kvx();
    await bumpRiftLayers(k, ID, undefined, dd(0, 60), NOW);
    await bumpRiftLayers(k, ID, dd(0, 60), dd(1, 60), NOW); // aparelho "virou o dia": contador novo de 60, mas o servidor ainda está no mesmo dia
    const l = await readRiftLastro(k, ID, NOW);
    expect(l.n).toBe(RIFT_MAX_LAYERS_PER_DAY);
  });

  it('dias seguintes somam, cada um com a sua taxa', async () => {
    const k = kvx();
    await bumpRiftLayers(k, ID, undefined, dd(0, 20), NOW);
    await bumpRiftLayers(k, ID, dd(0, 20), dd(0, 25), NOW);
    await bumpRiftLayers(k, ID, dd(0, 25), dd(1, 30), NOW + 86_400_000);
    expect((await readRiftLastro(k, ID, NOW)).n).toBe(25 + 30);
  });

  it('quem retoma perto do recorde pontua pelo progresso novo (base = ponto de retomada, sem 409)', async () => {
    const k = kvx();
    // recorde 262 no save: a descida do mês começa na camada 261 (marco de 5 em 5)
    expect(riftStartLayer(262)).toBe(261);
    await bumpRiftLayers(k, ID, undefined, dd(0, 8), NOW, { recordAntes: 262, recordDepois: 268 });
    const l = await readRiftLastro(k, ID, NOW);
    expect(l).toMatchObject({ base: 261, n: 8, rec: 268 });
    expect(await readRiftLayers(k, ID, NOW)).toBe(261 + 8 - 1); // aceita até a camada 268
  });

  it('forjar o recorde do save na gravação seguinte NÃO eleva a âncora: o recorde do servidor só sobe o que as camadas provam', async () => {
    const k = kvx();
    await bumpRiftLayers(k, ID, undefined, dd(0, 5), NOW, { recordAntes: 0, recordDepois: 5 });
    await bumpRiftLayers(k, ID, dd(0, 5), dd(0, 7), NOW, { recordAntes: 5, recordDepois: 999 }); // recorde forjado
    const l = await readRiftLastro(k, ID, NOW);
    expect(l.rec).toBe(5 + 2); // só +2 camadas aceitas
    // mês seguinte: a âncora parte do recorde do SERVIDOR (7), não do 999 forjado do save
    const NOV = Date.UTC(2026, 10, 3, 12);
    await bumpRiftLayers(k, ID, dd(0, 7), { day: '2026-11-03', layers: 3 }, NOV, { recordAntes: 999, recordDepois: 999 });
    expect((await readRiftLastro(k, ID, NOV)).base).toBe(riftStartLayer(7));
  });

  it('valor legado (só um número) segue lido, com base 1', async () => {
    const k = kvx();
    await k.put('riftlayers:2026-10:' + ID, '15');
    expect(await readRiftLayers(k, ID, NOW)).toBe(15);
  });

  it('o ranking recusa score acima do lastro (409) e aceita até base+n-1; guarda só o validado', async () => {
    const k = kvx();
    const E = { DIGIAPP_SAVES: k };
    await bumpRiftLayers(k, ID, undefined, dd(0, 10), Date.now(), { recordAntes: 262, recordDepois: 262 });
    const sub = score => rank({ request: new Request('https://x/api/rankings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, game: 'endless-rift', score }) }), env: E });
    expect((await sub(271)).status).toBe(409); // 261 + 10 - 1 = 270
    expect((await sub(270)).status).toBe(200);
    expect((await readBoard(E, { game: 'endless-rift', period: 'monthly', saveId: ID })).top.map(r => r.score)).toEqual([270]);
  });
});

describe('tetos de score por jogo (R1 MÉDIO) e jogos novos', () => {
  it('cada jogo de pontos tem teto próprio bem abaixo de 1e9', () => {
    for (const g of ['dino', 'dino-1', 'dino-2', 'ppt', 'match3', 'eco', 'soul-barrage', 'endless-rift', 'rogue-dungeon']) {
      expect(MAX_SCORE_BY_GAME[g], g).toBeLessThan(1_000_000);
      expect(cleanScore(MAX_SCORE_BY_GAME[g] + 1, g), g).toBeNull();
      expect(cleanScore(MAX_SCORE_BY_GAME[g], g), g).toBe(MAX_SCORE_BY_GAME[g]);
    }
  });
  it('Obstacle Run por nível; o id sem nível continua aceito (cliente antigo e recorde antigo)', () => {
    expect(RANKED_GAMES).toEqual(expect.arrayContaining(['dino', 'dino-1', 'dino-2', 'zip', 'patches']));
  });
  it('tempo: faixa plausível [2 s, 30 min]', () => {
    expect(scoreIsPlausible('zip', 1999)).toBe(false);
    expect(scoreIsPlausible('zip', 2000)).toBe(true);
    expect(scoreIsPlausible('patches', 1_800_001)).toBe(false);
    expect(cleanScore(5_000_000, 'zip')).toBeNull();
  });

  const post = (E, game, score, id = ID) => rank({ request: new Request('https://x/api/rankings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, game, score }) }), env: E });
  it('a rota recusa score absurdo por jogo', async () => {
    const E = { DIGIAPP_SAVES: kvx() };
    expect((await post(E, 'ppt', 1e9)).status).toBe(400);
    expect((await post(E, 'dino-2', 100_001)).status).toBe(400);
    expect((await post(E, 'zip', 100)).status).toBe(400);
    expect((await post(E, 'zip', 9_000)).status).toBe(200);
  });
  it('Obstacle Run: níveis têm placares separados', async () => {
    const E = { DIGIAPP_SAVES: kvx() };
    await post(E, 'dino-1', 500); await post(E, 'dino-2', 900, 'd'.repeat(32));
    const b1 = await readBoard(E, { game: 'dino-1', period: 'weekly', saveId: ID });
    const b2 = await readBoard(E, { game: 'dino-2', period: 'weekly', saveId: ID });
    expect(b1.top.map(r => r.score)).toEqual([500]);
    expect(b2.top.map(r => r.score)).toEqual([900]);
  });
  it('Zip/Patches: MENOR tempo vence e só melhora com tempo menor', async () => {
    const E = { DIGIAPP_SAVES: kvx() };
    const A = 'a'.repeat(32); const B = 'b'.repeat(32);
    await post(E, 'zip', 30_000, A); await post(E, 'zip', 20_000, B);
    const r1 = await post(E, 'zip', 40_000, A); // pior: não muda
    expect((await r1.json()).improved).toBe(false);
    const r2 = await post(E, 'zip', 25_000, A); // melhor que 30 s
    expect((await r2.json()).improved).toBe(true);
    const b = await readBoard(E, { game: 'zip', period: 'weekly', saveId: A });
    expect(b.top.map(r => r.score)).toEqual([20_000, 25_000]);
    expect(b.me).toMatchObject({ score: 25_000, tier: null, rank: 2 });
  });
});

describe('nome de quem se escondeu da lista pública (R1 MÉDIO)', () => {
  it('publicHidden: o placar não grava nem expõe o nome', async () => {
    const k = kvx();
    await k.put(`profile:${ID}`, JSON.stringify({ name: 'Segredo', publicHidden: true }));
    await k.put(`profile:${'e'.repeat(32)}`, JSON.stringify({ name: 'Visivel' }));
    const E = { DIGIAPP_SAVES: k };
    await submitScore(E, { game: 'dino-1', period: 'weekly', saveId: ID, score: 300 });
    await submitScore(E, { game: 'dino-1', period: 'weekly', saveId: 'e'.repeat(32), score: 100 });
    const chaves = [...k.md.values()].filter(Boolean);
    expect(JSON.stringify(chaves)).not.toContain('Segredo');
    const b = await readBoard(E, { game: 'dino-1', period: 'weekly', saveId: null });
    expect(b.top.map(r => r.name)).toEqual(['Anônimo', 'Visivel']);
  });
  it('registro antigo com nome + marca h: a leitura mascara', async () => {
    const k = kvx();
    await k.put('rk:dino-1:2026-W43:0999999700:' + ID, '');
    k.md.set('rk:dino-1:2026-W43:0999999700:' + ID, { s: 300, n: 'Nome', h: true });
    const b = await readBoard({ DIGIAPP_SAVES: k }, { game: 'dino-1', period: 'weekly', saveId: null, now: new Date('2026-10-20T00:00:00Z') });
    expect(b.top[0].name).toBe('Anônimo');
  });
});

describe('posição exibida × premiada (R10 BAIXO)', () => {
  it('o prêmio vai para as 3 primeiras linhas REAIS: simulados não ocupam o rótulo', async () => {
    const k = kvx();
    const E = { DIGIAPP_SAVES: k };
    const mes = new Date('2026-10-20T12:00:00Z');
    await k.put('profile:sim_0001', JSON.stringify({ name: 'Bot', simulated: true }));
    await submitScore(E, { game: 'endless-rift', period: 'monthly', saveId: 'sim_0001', score: 900, now: mes });
    for (const [c, s] of [['a', 300], ['b', 200], ['c', 100], ['d', 50]]) await submitScore(E, { game: 'endless-rift', period: 'monthly', saveId: c.repeat(32), score: s, now: mes });
    const b = await readBoard(E, { game: 'endless-rift', period: 'monthly', saveId: null, now: mes });
    expect(b.top.map(r => r.prizePlace ?? null)).toEqual([null, 1, 2, 3, null]);
  });
});
