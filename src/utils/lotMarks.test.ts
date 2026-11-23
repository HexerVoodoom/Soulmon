import { describe, it, expect } from 'vitest';
import { lotMissionMarks, lotCoins, DAILY_EVENT_BUILDING, LOT_COIN_RULES } from './lotMarks';
import { DAILY_EVENTS, dailyMissionsFor } from './dailyMissions';
import { BUILDING_GATES } from './gates';
import { playerDayIso } from './playerDay';
import { maxEnergyOf } from './hunger';

const day = '2026-11-04';
const base = { passeio: null, weekly: null, conquistas: null, dailyMissions: undefined, day, bondLevel: 5 } as const;

describe('lotMissionMarks', () => {
  it('"!" em TODO prédio com missão: Passeio, Torneio (semana), Conquistas e o Caderno', () => {
    const m = lotMissionMarks({ ...base, passeio: 'available', weekly: 'available', conquistas: 'ready', buildings: { 'forja.caderno': 'available' } });
    expect(m['exploracao.passeio']).toBe('available');
    expect(m['arena.torneio']).toBe('available');
    expect(m['mercado.conquistas']).toBe('ready');
    expect(m['forja.caderno']).toBe('available');
  });
  it('as missões do dia acendem o prédio do jogo; "?" vence "!"; paga some', () => {
    const hoje = dailyMissionsFor(day, 5).filter(x => DAILY_EVENT_BUILDING[x.event]);
    expect(hoje.length).toBeGreaterThan(0);
    const alvo = hoje[0];
    const b = DAILY_EVENT_BUILDING[alvo.event]!;
    expect(lotMissionMarks({ ...base })[b]).toBe('available');
    const pronta = { day, counts: { [alvo.event]: alvo.target }, claimed: [] as string[] };
    expect(lotMissionMarks({ ...base, dailyMissions: pronta })[b]).toBe('ready');
    const paga = { day, counts: { [alvo.event]: alvo.target }, claimed: hoje.filter(x => DAILY_EVENT_BUILDING[x.event] === b).map(x => x.id) };
    expect(lotMissionMarks({ ...base, dailyMissions: paga })[b]).toBeUndefined();
  });
  it('o mapa evento → prédio cobre todo evento e só aponta para prédios que existem', () => {
    for (const e of DAILY_EVENTS) expect(e in DAILY_EVENT_BUILDING, e).toBe(true);
    for (const b of Object.values(DAILY_EVENT_BUILDING)) if (b) expect(b in BUILDING_GATES, b).toBe(true);
  });
});

describe('lotCoins (moeda de recurso)', () => {
  const now = new Date('2026-11-04T15:00:00Z').getTime();
  const gs = (o: object) => ({ evolutionStage: 'rookie', energyPoints: 0, energyClock: { at: now, carry: 0 }, ...o }) as never;
  it('lista tipada pequena: só o Refúgio por enquanto', () => {
    expect(LOT_COIN_RULES.map(r => r.id)).toEqual(['refugio-energia']);
  });
  it('Refúgio: acende com energia abaixo do máximo e o do dia não tomado', () => {
    expect(lotCoins(gs({}), now)['forja.refugio']).toEqual(['refugio-energia']);
  });
  it('some depois de usado hoje', () => {
    expect(lotCoins(gs({ refugioEnergyDay: playerDayIso(new Date(now), undefined) }), now)['forja.refugio']).toBeUndefined();
  });
  it('some no limite (energia cheia)', () => {
    expect(lotCoins(gs({ energyPoints: maxEnergyOf({ evolutionStage: 'rookie' }) }), now)['forja.refugio']).toBeUndefined();
  });
  it('dia seguinte: volta a acender', () => {
    expect(lotCoins(gs({ refugioEnergyDay: '2026-11-03' }), now)['forja.refugio']).toEqual(['refugio-energia']);
  });
});
