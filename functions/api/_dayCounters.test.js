import { describe, it, expect, vi } from 'vitest';
import { enforceDungeonDaily, enforceCheckIns, sanitizeDungeonDaily, sanitizeCheckIns, maxAcceptableDay, isoDayUtc } from './_dayCounters.js';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');

const NOW = Date.UTC(2026, 9, 13, 15, 0, 0); // 2026-10-13 UTC
const ID = 'c'.repeat(32);
const env = () => {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async key => store.get(key) ?? null,
    getWithMetadata: async key => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
};
const post = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});
const hoje = isoDayUtc(Date.now());
const amanha = isoDayUtc(Date.now() + 86_400_000);
const ontem = isoDayUtc(Date.now() - 86_400_000);
const semanaQueVem = isoDayUtc(Date.now() + 7 * 86_400_000);

describe('contadores diários monotônicos — a regra pura', () => {
  it('o servidor aceita no máximo o dia dele + 1', () => {
    expect(maxAcceptableDay(NOW)).toBe('2026-10-14');
  });
  it('mesmo dia: camadas = máximo (voltar o contador não devolve camada)', () => {
    expect(enforceDungeonDaily({ day: '2026-10-13', layers: 0 }, { day: '2026-10-13', layers: 7 }, NOW)).toEqual({ day: '2026-10-13', layers: 7 });
    expect(enforceDungeonDaily({ day: '2026-10-13', layers: 9 }, { day: '2026-10-13', layers: 7 }, NOW)).toEqual({ day: '2026-10-13', layers: 9 });
  });
  it('dia anterior ao gravado: mantém o gravado (relógio que voltou não reabre o dia)', () => {
    expect(enforceDungeonDaily({ day: '2026-10-12', layers: 0 }, { day: '2026-10-13', layers: 10 }, NOW)).toEqual({ day: '2026-10-13', layers: 10 });
  });
  it('dia seguinte do jogador: aceita o contador novo (virada legítima, também em fuso à frente do servidor)', () => {
    expect(enforceDungeonDaily({ day: '2026-10-14', layers: 1 }, { day: '2026-10-13', layers: 10 }, NOW)).toEqual({ day: '2026-10-14', layers: 1 });
  });
  it('dia mais de 1 à frente do servidor: recusado, vale o gravado (adiantar o relógio por semanas não rende)', () => {
    expect(enforceDungeonDaily({ day: '2026-10-20', layers: 0 }, { day: '2026-10-13', layers: 10 }, NOW)).toEqual({ day: '2026-10-13', layers: 10 });
    expect(enforceDungeonDaily({ day: '2026-10-20', layers: 0 }, undefined, NOW)).toBeUndefined();
  });
  it('campo ausente ou lixo no que chegou mantém o gravado (omitir não zera)', () => {
    for (const lixo of [undefined, null, 5, 'x', [], {}, { day: 'ontem', layers: 1 }, { day: '2026-10-13', layers: NaN }]) {
      expect(enforceDungeonDaily(lixo, { day: '2026-10-13', layers: 6 }, NOW)).toEqual({ day: '2026-10-13', layers: 6 });
    }
  });
  it('sem gravado: aceita o que chegou (conta nova) e prende camadas em 0..999', () => {
    expect(enforceDungeonDaily({ day: '2026-10-13', layers: 4 }, undefined, NOW)).toEqual({ day: '2026-10-13', layers: 4 });
    expect(enforceDungeonDaily({ day: '2026-10-13', layers: 1e9 }, undefined, NOW)).toEqual({ day: '2026-10-13', layers: 999 });
  });
  it('check-ins: mesmo dia = união das janelas (apagar o save local não devolve janela); dia novo = o que chegou; futuro demais = gravado', () => {
    expect(enforceCheckIns({ day: '2026-10-13', claimed: [] }, { day: '2026-10-13', claimed: ['morning', 'night'] }, NOW)).toEqual({ day: '2026-10-13', claimed: ['morning', 'night'] });
    expect(enforceCheckIns({ day: '2026-10-13', claimed: ['afternoon'] }, { day: '2026-10-13', claimed: ['morning'] }, NOW)).toEqual({ day: '2026-10-13', claimed: ['morning', 'afternoon'] });
    expect(enforceCheckIns({ day: '2026-10-14', claimed: ['morning'] }, { day: '2026-10-13', claimed: ['night'] }, NOW)).toEqual({ day: '2026-10-14', claimed: ['morning'] });
    expect(enforceCheckIns({ day: '2026-12-01', claimed: [] }, { day: '2026-10-13', claimed: ['night'] }, NOW)).toEqual({ day: '2026-10-13', claimed: ['night'] });
  });
  it('a forma: janelas desconhecidas e repetidas somem; ordem canônica', () => {
    expect(sanitizeCheckIns({ day: '2026-10-13', claimed: ['night', 'x', 'morning', 'night'] })).toEqual({ day: '2026-10-13', claimed: ['morning', 'night'] });
    expect(sanitizeDungeonDaily({ day: '2026-10-13', layers: 2.9 })).toEqual({ day: '2026-10-13', layers: 2 });
  });
});

describe('save.js — o POST do save aplica a regra (contra o que o servidor JÁ gravou)', () => {
  it('apagar/voltar o contador no aparelho e subir o save NÃO devolve camada nem janela', async () => {
    const e = env();
    await post(e, { dungeonDaily: { day: hoje, layers: 10 }, checkIns: { day: hoje, claimed: ['morning', 'afternoon'] } });
    await post(e, { dungeonDaily: { day: hoje, layers: 0 }, checkIns: { day: hoje, claimed: [] } });
    const s = JSON.parse(e.store.get(ID));
    expect(s.dungeonDaily).toEqual({ day: hoje, layers: 10 });
    expect(s.checkIns).toEqual({ day: hoje, claimed: ['morning', 'afternoon'] });
  });
  it('um save "limpo" que omite os campos também não os apaga', async () => {
    const e = env();
    await post(e, { dungeonDaily: { day: hoje, layers: 6 }, checkIns: { day: hoje, claimed: ['night'] } });
    await post(e, { gamePoints: 5 });
    const s = JSON.parse(e.store.get(ID));
    expect(s.dungeonDaily).toEqual({ day: hoje, layers: 6 });
    expect(s.checkIns).toEqual({ day: hoje, claimed: ['night'] });
    expect(s.gamePoints).toBe(5);
  });
  it('relógio adiantado em semanas é ignorado; em 1 dia, aceito (virada de fuso); voltar depois não reabre', async () => {
    const e = env();
    await post(e, { dungeonDaily: { day: hoje, layers: 10 } });
    await post(e, { dungeonDaily: { day: semanaQueVem, layers: 0 } });
    expect(JSON.parse(e.store.get(ID)).dungeonDaily).toEqual({ day: hoje, layers: 10 });
    await post(e, { dungeonDaily: { day: amanha, layers: 1 } });
    expect(JSON.parse(e.store.get(ID)).dungeonDaily).toEqual({ day: amanha, layers: 1 });
    await post(e, { dungeonDaily: { day: ontem, layers: 0 } });
    expect(JSON.parse(e.store.get(ID)).dungeonDaily).toEqual({ day: amanha, layers: 1 });
  });
  it('conta nova sem os campos continua sem eles (compatível com cliente antigo)', async () => {
    const e = env();
    await post(e, { gamePoints: 1 });
    const s = JSON.parse(e.store.get(ID));
    expect('dungeonDaily' in s).toBe(false);
    expect('checkIns' in s).toBe(false);
  });
});
