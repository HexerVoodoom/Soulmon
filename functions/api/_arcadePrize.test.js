import { describe, it, expect, beforeEach } from 'vitest';
import { submitScore } from './_rankings.js';
import { closeArcadeMonth, prevMonth, _resetArcadeCache, ARCADE_ITEM_ID, ARCADE_MONTHLY_GAMES, ARCADE_ALT_PRIZE, arcadeMark, cartaDoPremio } from './_arcadePrize.js';
import { claimMail, deleteMail, sanitizeMail, MAIL_TTL_MS, readMail } from './_mensageiro.js';

function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => (store.has(k) ? store.get(k).v : null),
    put: async (k, v, o) => { store.set(k, { v, m: o?.metadata }); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', limit = 1000 }) => {
      const names = [...store.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit);
      return { keys: names.map(name => ({ name, metadata: store.get(name).m })), list_complete: true };
    },
  };
}
const id = (c) => `player-${c.repeat(8)}`;
const OCT = new Date('2026-10-20T12:00:00Z');
const NOV = new Date('2026-11-02T09:00:00Z');
const sub = (env, game, c, score, at = OCT) => submitScore(env, { game, period: 'monthly', saveId: id(c), score, now: at });
const caixa = async (env, c) => JSON.parse(env.SOULMON_SAVES.store.get(`mail:${id(c)}`)?.v ?? '{"q":[],"done":[]}').q;

describe('Fliperama de Canto: carta do Papus com o item anexo para o 1º lugar do ranking mensal', () => {
  let env;
  beforeEach(() => { env = { SOULMON_SAVES: fakeKV() }; _resetArcadeCache(); });

  it('só os rankings mensais dos prédios de minigame premiam (não o Rift, não os semanais)', () => {
    expect([...ARCADE_MONTHLY_GAMES]).toEqual(['match3', 'match3-pvp']);
    expect(prevMonth(NOV)).toBe('2026-10');
  });

  it('o 1º de cada jogo mensal recebe UMA carta com o item anexo; o 2º não recebe nada', async () => {
    await sub(env, 'match3', 'a', 300); await sub(env, 'match3', 'b', 200); await sub(env, 'match3-pvp', 'c', 90);
    const r = await closeArcadeMonth(env, NOV);
    expect(r.status).toBe('closed');
    expect(r.results.map(x => x.status)).toEqual(['item', 'item']);
    const a = await caixa(env, 'a');
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ mid: arcadeMark('2026-10', 'match3'), item: ARCADE_ITEM_ID, titlePt: 'Parabéns pelo 1º lugar!', claimedAt: 0 });
    expect(a[0].bodyPt).toContain('outubro de 2026');
    expect(a[0].bodyEn).toContain('October 2026');
    expect(await caixa(env, 'b')).toEqual([]);
    expect(await caixa(env, 'c')).toHaveLength(1);
  });

  it('a carta não revela segredo de outros itens e tem PT e EN', () => {
    const c = cartaDoPremio('2026-10', 'match3', true, null);
    expect(`${c.bodyPt} ${c.bodyEn}`).not.toMatch(/cogumelo|mushroom|bioluminesc/i);
    expect(c.bodyPt.length).toBeGreaterThan(20); expect(c.bodyEn.length).toBeGreaterThan(20);
  });

  it('idempotente: fechar de novo (cache limpo, trava, auditoria) não manda segunda carta', async () => {
    await sub(env, 'match3', 'a', 300);
    await closeArcadeMonth(env, NOV);
    _resetArcadeCache();
    expect((await closeArcadeMonth(env, NOV)).status).toBe('already');
    expect(await caixa(env, 'a')).toHaveLength(1);
    // mesmo sem trava nem auditoria, o `mid` da carta barra a segunda
    env.SOULMON_SAVES.store.delete('arcade-prize:lock:2026-10'); env.SOULMON_SAVES.store.delete('arcade-prize:2026-10:match3');
    _resetArcadeCache();
    const r = await closeArcadeMonth(env, NOV);
    expect(r.results.map(x => x.status)).toEqual(['already']);
    expect(await caixa(env, 'a')).toHaveLength(1);
  });

  it('resgatar entrega o anexo uma vez; carta com anexo pendente não expira nem some sem force', async () => {
    await sub(env, 'match3', 'a', 300);
    await closeArcadeMonth(env, NOV);
    const meses = NOV.getTime() + 40 * 86400_000; // muito além do prazo de 3 dias
    expect(MAIL_TTL_MS).toBeLessThan(40 * 86400_000);
    const lida = await readMail(env, env.SOULMON_SAVES, id('a'), meses);
    expect(lida.some(m => m.mid === arcadeMark('2026-10', 'match3'))).toBe(true);
    const bloqueio = await deleteMail(env.SOULMON_SAVES, id('a'), [arcadeMark('2026-10', 'match3')]);
    expect(bloqueio.blocked).toContain(arcadeMark('2026-10', 'match3'));
    const g = await claimMail(env.SOULMON_SAVES, id('a'), [arcadeMark('2026-10', 'match3')], meses);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ item: ARCADE_ITEM_ID, bits: 0, emblems: 0 });
    expect(await claimMail(env.SOULMON_SAVES, id('a'), [arcadeMark('2026-10', 'match3')], meses)).toEqual([]);
  });

  it('item único: o mesmo jogador vencendo dois jogos recebe UM anexo; a 2ª carta é só o aplauso (alternativo desligado)', async () => {
    await sub(env, 'match3', 'a', 300); await sub(env, 'match3-pvp', 'a', 500);
    const r = await closeArcadeMonth(env, NOV);
    expect(r.results.map(x => x.status)).toEqual(['item', 'owned']);
    const q = await caixa(env, 'a');
    expect(q.filter(m => m.item === ARCADE_ITEM_ID)).toHaveLength(1);
    expect(q).toHaveLength(2);
    expect(ARCADE_ALT_PRIZE.enabled).toBe(false);
    const aplauso = q.find(m => !m.item);
    expect(aplauso.bodyPt).toContain('só o nosso aplauso');
    expect(aplauso.bits).toBe(0);
  });

  it('quem já tem o item no save gravado recebe a carta sem anexo', async () => {
    env.SOULMON_SAVES.store.set(id('a'), { v: JSON.stringify({ ownedFurniture: [ARCADE_ITEM_ID] }) });
    await sub(env, 'match3', 'a', 300);
    const r = await closeArcadeMonth(env, NOV);
    expect(r.results[0].status).toBe('owned');
    expect((await caixa(env, 'a'))[0].item).toBeUndefined();
  });

  it('com o alternativo LIGADO (config), a carta de quem já tem leva Bits/Honra de anexo', () => {
    const c = cartaDoPremio('2026-10', 'match3', false, { enabled: true, bits: 50, emblems: 5 });
    expect(c).toMatchObject({ bits: 50, emblems: 5 });
    expect(c.item).toBeUndefined();
  });

  it('o anexo só aceita a lista fechada de itens', () => {
    expect(sanitizeMail({ mid: 'x', bodyPt: 'a', bodyEn: 'b', item: 'furn-arcade-cab' }).item).toBe('furn-arcade-cab');
    expect(sanitizeMail({ mid: 'x', bodyPt: 'a', bodyEn: 'b', item: 'furn-sofa' }).item).toBeUndefined();
  });

  it('simulado nunca ganha: o prêmio desce para o próximo jogador real', async () => {
    await submitScore(env, { game: 'match3', period: 'monthly', saveId: 'sim_0001', score: 999, now: OCT });
    await sub(env, 'match3', 'b', 10);
    await closeArcadeMonth(env, NOV);
    expect(await caixa(env, 'b')).toHaveLength(1);
  });

  it('sem ninguém no ranking fecha sem erro', async () => {
    expect(await closeArcadeMonth(env, NOV)).toMatchObject({ status: 'closed', results: [] });
  });
});
