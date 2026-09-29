import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { onRequest } from './guild.js';
import { coopHitKey, coopMemKey, semanaDoDia, RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_ID } from './_coop.js';
import { PRODUCTS, STEAM_ITEMS } from './_billing.js';
import { GUILD_ITEMS, TOURNAMENT_ITEMS, SHOP_ITEMS, isGuildReward } from '../../src/utils/shop.ts';

/**
 * LV-G6 (`PLANO-GUILDA.md` §3 🎁, §13; L3-conformidade M-5): NENHUMA recompensa
 * da Guilda toca coração, Créditos, energia, perfectDays, Glitchtama ou tier,
 * e nada da Guilda é comprável com dinheiro. Emblemas só compram cosmético (o
 * catálogo do Torneio).
 *
 * Três camadas, porque cada uma pega uma regressão diferente:
 *   1. COMPORTAMENTO — um resgate de verdade: o que ele escreve no KV e o que
 *      devolve, campo por campo.
 *   2. FONTE — o ramo de recompensa de `guild.js` e o módulo `_coop.js` não
 *      citam as chaves do que é vantagem.
 *   3. CATÁLOGO — Concha/cenários fora de venda, fora dos SKUs pagos; o que os
 *      Emblemas compram é `bg`/`furniture`.
 * As mutações que este arquivo mata estão no relatório da sessão (29/09/2026).
 */
const raiz = new URL('../../', import.meta.url);
const fonte = rel => readFileSync(fileURLToPath(new URL(rel, raiz)), 'utf8');

/** Palavras do que é VANTAGEM ou DINHEIRO — nenhuma pode aparecer no ramo de recompensa. */
const VANTAGEM = [
  /\bent:/, /credits?\b/i, /cr[eé]ditos?/i, /healthPoints|\bhearts?\b|cora[cç][aã]o/i,
  /energy|energia/i, /perfectDays?/i, /glitchtama/i, /accountTier|grantTier|\btier\b/i,
  /entitlement/i, /evolutionStage|unlockedEvolutions/i,
];

function fakeKV() {
  const store = new Map();
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { puts.push(k); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const M = ['aa', 'bb', 'cc'].map(sid);
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
afterEach(() => { vi.useRealTimers(); });

async function roda() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
  const e = { DIGIAPP_SAVES: fakeKV() };
  for (const m of M) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: 'N', pid: `P${m[0]}${'q'.repeat(22)}`, stage: 'rookie' }));
  // Um save e um entitlement do titular: o resgate não pode tocá-los.
  e.DIGIAPP_SAVES.store.set(`save:${M[0]}`, JSON.stringify({ healthPoints: 1, energyPoints: 0, perfectDays: 0, emblems: 0 }));
  e.DIGIAPP_SAVES.store.set(`ent:${M[0]}`, JSON.stringify({ tier: 'demo', credits: 0 }));
  const g = (await (await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' })).json()).guild;
  for (const m of M.slice(1)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  return { e, gid: g.id };
}

describe('1. comportamento — o resgate só escreve chaves da Guilda e só devolve Emblemas/Concha', () => {
  it('dissipada e recuada: escritas só em coop*, payload fechado, quantias da tabela', async () => {
    const { e, gid } = await roda();
    const salvo = e.DIGIAPP_SAVES.store.get(`save:${M[0]}`);
    const ent = e.DIGIAPP_SAVES.store.get(`ent:${M[0]}`);
    // Três Conchas já contadas: a 4ª dissipada dá troféu (o caminho mais rico).
    e.DIGIAPP_SAVES.store.set(`coopShell:${M[0]}`, JSON.stringify({ ids: ['2026-W34', '2026-W35', '2026-W36'] }));
    e.DIGIAPP_SAVES.store.set(coopHitKey(gid, '2026-W37', M[0]), JSON.stringify({ week: '2026-W37', days: ['2026-09-09'], dmg: 999 }));
    e.DIGIAPP_SAVES.store.set(coopHitKey(gid, '2026-W36', M[0]), JSON.stringify({ week: '2026-W36', days: ['2026-09-02'], dmg: 1 }));
    e.DIGIAPP_SAVES.store.delete(coopMemKey(gid, M[0]));
    e.DIGIAPP_SAVES.puts.length = 0;

    const pend = (await (await chamar(e, 'guildRewards', { id: M[0] }, 'GET')).json()).rewards;
    expect(Object.keys(pend).sort()).toEqual(['pending', 'scenes', 'trophyId', 'trophyOwned']);
    const resg = [];
    for (const p of pend.pending) resg.push((await (await chamar(e, 'guildClaim', { id: M[0], week: p.week })).json()).claimed);
    expect(resg.map(c => c.outcome).sort()).toEqual(['dissipada', 'recuou']);

    for (const c of resg) {
      expect(Object.keys(c).sort()).toEqual(['emblems', 'outcome', 'receipt', 'trophy', 'trophyId', 'week']);
      expect([RAID_EMBLEMS, RAID_EMBLEMS_FLOOR]).toContain(c.emblems);
      expect(c.trophyId === null || c.trophyId === RAID_TROPHY_ID).toBe(true);
    }
    expect(resg.find(c => c.outcome === 'dissipada')).toMatchObject({ emblems: 4, trophy: true, trophyId: RAID_TROPHY_ID });
    expect(resg.find(c => c.outcome === 'recuou')).toMatchObject({ emblems: 2, trophy: false, trophyId: null });
    expect(JSON.stringify(resg)).not.toMatch(/credit|heart|energy|perfect|glitch|tier|hp"/i);

    // Toda escrita do caminho de recompensa é uma chave da Guilda.
    expect(e.DIGIAPP_SAVES.puts.length).toBeGreaterThan(0);
    for (const k of e.DIGIAPP_SAVES.puts) expect(k, k).toMatch(/^coop(Claim|Shell|Scenes|RaidOk|Part|Key|Of|Code|Fio|Mem|:)/);
    expect(e.DIGIAPP_SAVES.store.get(`save:${M[0]}`)).toBe(salvo);
    expect(e.DIGIAPP_SAVES.store.get(`ent:${M[0]}`)).toBe(ent);
  });

  it('as quantias são as constantes do plano (G9): 4 dissipada, 2 recuou', () => {
    expect(RAID_EMBLEMS).toBe(4);
    expect(RAID_EMBLEMS_FLOOR).toBe(2);
    expect(RAID_TROPHY_ID).toBe('trophy-concha-mare');
  });
});

describe('2. fonte — o ramo de recompensa não cita vantagem nem dinheiro', () => {
  const guild = fonte('functions/api/guild.js');
  const ramo = guild.slice(guild.indexOf("if (action === 'guildRewards' || action === 'guildClaim')"), guild.indexOf("if (action === 'guildLeave')"));
  const semComentario = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('o ramo existe e é o que a rota executa', () => {
    expect(ramo.length).toBeGreaterThan(500);
    expect(ramo).toContain('RAID_EMBLEMS');
  });

  it('nenhuma palavra de vantagem/dinheiro no código do ramo (comentários não contam)', () => {
    const cod = semComentario(ramo);
    for (const re of VANTAGEM) expect(cod, String(re)).not.toMatch(re);
  });

  it('guild.js e _coop.js não importam dinheiro nem conta (entitlements/billing)', () => {
    for (const arq of ['functions/api/guild.js', 'functions/api/_coop.js']) {
      const imports = fonte(arq).match(/^import .*$/gm) ?? [];
      for (const i of imports) {
        // Única exceção: `VALID_ID` (a regex de id de save) vem de `_entitlements.js`.
        if (/^import \{ VALID_ID \} from '\.\/_entitlements\.js';$/.test(i)) continue;
        expect(i, arq).not.toMatch(/_entitlements|_billing|billing|monetization/);
      }
    }
    // `_coop.js` usa `VALID_ID` de `_entitlements.js` (só a regex de id).
    expect(fonte('functions/api/_coop.js')).toMatch(/import \{ VALID_ID \} from '\.\/_entitlements\.js'/);
  });
});

describe('3. catálogo — Concha e cenários fora de venda; Emblemas só cosmético', () => {
  it('a Concha é item de conquista: preço 0, trancada, fora da loja e do Torneio', () => {
    expect(GUILD_ITEMS.map(i => i.id)).toEqual([RAID_TROPHY_ID]);
    for (const i of GUILD_ITEMS) {
      expect(i.price).toBe(0);
      expect(i.unlock).toBeTruthy();
      expect(['bg', 'furniture']).toContain(i.kind);
      expect(isGuildReward(i)).toBe(true);
    }
    for (const i of [...SHOP_ITEMS, ...TOURNAMENT_ITEMS]) {
      expect(isGuildReward(i), i.id).toBe(false);
      expect(i.id.startsWith('bg-guild-'), i.id).toBe(false);
    }
  });

  it('Emblemas só compram cosmético (o catálogo do Torneio é bg/furniture)', () => {
    expect(TOURNAMENT_ITEMS.length).toBeGreaterThan(0);
    for (const i of TOURNAMENT_ITEMS) {
      expect(i.currency, i.id).toBe('emblems');
      expect(['bg', 'furniture'], i.id).toContain(i.kind);
    }
    // Nenhum item pago em Emblemas fora da aba do Torneio.
    for (const i of SHOP_ITEMS) expect(i.currency, i.id).not.toBe('emblems');
  });

  it('cenários bg-guild-* fora do sorteio/vitrine da masmorra (SHOP_BG_ACCENTS)', () => {
    const cenas = fonte('src/utils/dungeonScenes.ts');
    const i = cenas.indexOf('const SHOP_BG_ACCENTS');
    const bloco = cenas.slice(i, cenas.indexOf('};', i));
    expect(i).toBeGreaterThan(0);
    expect(bloco).not.toContain('bg-guild-');
  });

  it('nenhum SKU de dinheiro real concede algo da Guilda', () => {
    const txt = JSON.stringify({ PRODUCTS, STEAM_ITEMS });
    expect(txt).not.toMatch(/guild|guilda|emblem|concha|trophy|bg-guild/i);
    for (const p of Object.values(PRODUCTS)) expect(Object.keys(p).sort()).toEqual(['consumable', 'grantCredits', 'grantTier']);
  });
});
