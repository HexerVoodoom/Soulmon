import { describe, it, expect } from 'vitest';
import { applyCook, chefsOn, playerWeekday, menuOn, type CookState } from './restaurant';
import { CHEF_VOICE, SUNDAY_LINE, restaurantNpcVoice } from './restaurantCopy';
import { weeklyMissionPool, weeklyMissionsFor, isWeeklyDone, type WeeklyMissionProgress } from './weeklyMissions';

// 2026-11-15 é DOMINGO. Os 7 dias, ao meio-dia UTC: o instante é o mesmo, o DIA DO JOGADOR vem da âncora, nunca do aparelho.
const DIAS = [
  { iso: '2026-11-15', dow: 0, chefs: ['snapjaw', 'caldo'] },
  { iso: '2026-11-16', dow: 1, chefs: ['snapjaw'] },
  { iso: '2026-11-17', dow: 2, chefs: ['caldo'] },
  { iso: '2026-11-18', dow: 3, chefs: ['snapjaw'] },
  { iso: '2026-11-19', dow: 4, chefs: ['caldo'] },
  { iso: '2026-11-20', dow: 5, chefs: ['snapjaw'] },
  { iso: '2026-11-21', dow: 6, chefs: ['caldo'] },
] as const;

describe('Restaurante: qual NPC aparece em cada dia (15/11/2026)', () => {
  it.each(DIAS)('$iso (dia $dow): $chefs', ({ iso, dow, chefs }) => {
    const anchor = { offsetMs: 0 };
    const now = new Date(`${iso}T12:00:00Z`);
    expect(playerWeekday(now, anchor)).toBe(dow);
    expect(chefsOn(playerWeekday(now, anchor))).toEqual(chefs);
  });

  it('domingo mostra os DOIS (Snapjaw e Caldo), com a fala do domingo e os dois nomes', () => {
    const v = restaurantNpcVoice(chefsOn(0), false);
    expect(v.name).toBe('Snapjaw & Broth');
    expect(v.line).toBe(SUNDAY_LINE.en);
    expect(restaurantNpcVoice(chefsOn(0), true).name).toBe('Snapjaw e Caldo');
    expect(menuOn(0).map(d => d.chef)).toEqual(expect.arrayContaining(['snapjaw', 'caldo']));
  });

  it('dia de semana mostra UM chef só, com a fala dele (nada de Snapjaw na terça)', () => {
    expect(restaurantNpcVoice(chefsOn(2), false)).toEqual({ name: CHEF_VOICE.caldo.nameEn, line: CHEF_VOICE.caldo.lineEn });
    expect(restaurantNpcVoice(chefsOn(1), true)).toEqual({ name: CHEF_VOICE.snapjaw.namePt, line: CHEF_VOICE.snapjaw.linePt });
  });

  it('o dia é o do JOGADOR: aparelho em outro fuso não troca o chef (2026-11-16 02:00Z é domingo à noite em São Paulo, segunda em Tóquio)', () => {
    const instante = new Date('2026-11-16T02:00:00Z');
    expect(playerWeekday(instante, { zone: 'America/Sao_Paulo' })).toBe(0);
    expect(playerWeekday(instante, { zone: 'Asia/Tokyo' })).toBe(1);
    expect(chefsOn(playerWeekday(instante, { zone: 'America/Sao_Paulo' }))).toEqual(['snapjaw', 'caldo']);
    expect(chefsOn(playerWeekday(instante, { zone: 'Asia/Tokyo' }))).toEqual(['snapjaw']);
  });
});

const full = (): CookState => ({
  energyPoints: 0, evolutionStage: 'rookie',
  foodInventory: { '🥗': 9, '🧃': 9, '☕': 9, '🍚': 9, '🍎': 9, '🥩': 9, '🍭': 9, '🍕': 9 },
  gamePoints: 500,
  essences: { planta: 9, agua: 9, vida: 9, eletricidade: 9, arcano: 9, luz: 9 },
  buildingQuests: { day: 'x', visited: [], claimed: [], materials: { fang: 3, moss: 3, laurel: 3, spark: 3, ore: 3, down: 3 } },
  hunger: { v: 10, at: 0 },
  playerDayTz: { offsetMs: 0 },
});
const SEGUNDA = new Date('2026-11-16T12:00:00Z').getTime();

describe('Missão semanal "cook-dish": cozinhe um prato, qualquer prato', () => {
  it('está no pool, é de cuidado (alvo 1) e paga em Emblemas na escada das outras de alvo 1', () => {
    const m = weeklyMissionPool().find(x => x.id === 'cook-dish')!;
    expect(m.target).toBe(1);
    expect(m.emblems).toBeGreaterThanOrEqual(2);
    expect(m.emblems).toBeLessThanOrEqual(4);
    expect(m.descEn).toMatch(/dish/i);
    expect(m.descPt).toMatch(/prato/i);
  });

  it('cozinhar conta UMA vez por prato cozinhado, e só quando a cozinha de fato serviu', () => {
    const a = applyCook(full(), 'cha-de-orvalho', SEGUNDA); // prato da Snapjaw numa segunda
    expect(a.refused).toBeUndefined();
    const w = (a.state.weeklyMissions as WeeklyMissionProgress).counts['cook-dish'];
    expect(w).toBe(1);
    expect(isWeeklyDone(a.state.weeklyMissions!, weeklyMissionPool().find(x => x.id === 'cook-dish')!)).toBe(true);
    const recusado = applyCook(full(), 'caldo-de-brasa', SEGUNDA); // prato de outro dia: recusa, nada conta
    expect(recusado.refused).toBe('not-today');
    expect(recusado.state.weeklyMissions).toBeUndefined();
  });

  it('replay do updater (StrictMode): o mesmo `prev` dá o mesmo resultado, sem somar 2×', () => {
    const prev = full();
    const x = applyCook(prev, 'cha-de-orvalho', SEGUNDA).state.weeklyMissions!.counts['cook-dish'];
    const y = applyCook(prev, 'cha-de-orvalho', SEGUNDA).state.weeklyMissions!.counts['cook-dish'];
    expect([x, y]).toEqual([1, 1]);
  });

  it('o sorteio: o dia do prato aparece em ~3/13 das semanas (não é garantido; ver relatório)', () => {
    let n = 0;
    const semanas = 400;
    for (let i = 0; i < semanas; i += 1) if (weeklyMissionsFor(`2026-W${i}`).some(m => m.id === 'cook-dish')) n += 1;
    expect(n / semanas).toBeGreaterThan(0.12);
    expect(n / semanas).toBeLessThan(0.36);
  });
});
