import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MEAL_RHYTHM, DEFAULT_MEAL_TIMES, POOP_AFTER_MEAL_FROM_H, POOP_AFTER_MEAL_TO_H,
  alignedFirstPoopHour, alignedSecondGapHours, markMealDone, openInvite, pickMicroAction,
  restArc, sanitizeMealRhythm, sanitizeMealRitual, serverMeals, skipMeal,
  type MealRhythmSettings, type MealRitualRecord,
} from './mealRhythm';
import { playerDayKey } from './playerDay';

const at = (h: number, m = 0) => new Date(2026, 9, 12, h, m, 0, 0);
const ON: MealRhythmSettings = { ...DEFAULT_MEAL_RHYTHM, times: { ...DEFAULT_MEAL_TIMES } };

describe('configuração', () => {
  it('o padrão: convite no app LIGADO, push DESLIGADO (opt-in)', () => {
    expect(DEFAULT_MEAL_RHYTHM.inApp).toBe(true);
    expect(DEFAULT_MEAL_RHYTHM.push).toBe(false);
  });
  it('lixo vira o padrão e nunca lança', () => {
    for (const v of [undefined, null, 'x', 7, [], { push: 'yes', times: 3 }]) {
      const s = sanitizeMealRhythm(v);
      expect(s.push).toBe(false);
      expect(s.inApp).toBe(true);
      expect(s.times).toEqual(DEFAULT_MEAL_TIMES);
    }
  });
  it('só `push === true` liga o push; só `inApp === false` desliga o cartão', () => {
    expect(sanitizeMealRhythm({ push: 1 }).push).toBe(false);
    expect(sanitizeMealRhythm({ push: true }).push).toBe(true);
    expect(sanitizeMealRhythm({ inApp: false }).inApp).toBe(false);
    expect(sanitizeMealRhythm({ inApp: 0 }).inApp).toBe(true);
  });
  it('o registro do dia: lixo some, chave desconhecida some', () => {
    expect(sanitizeMealRitual(null)).toBeUndefined();
    expect(sanitizeMealRitual({ day: 1 })).toBeUndefined();
    expect(sanitizeMealRitual({ day: 'x', done: ['lunch', 'brunch'], skipped: 'no', lastKind: 'oops' }))
      .toEqual({ day: 'x', done: ['lunch'], skipped: [] });
  });
});

describe('quando a janela está aberta', () => {
  it('abre no horário e fecha em 2 h', () => {
    expect(openInvite(at(8, 59), { settings: ON })).toBeNull();
    expect(openInvite(at(9, 0), { settings: ON })).toBe('breakfast');
    expect(openInvite(at(10, 59), { settings: ON })).toBe('breakfast');
    expect(openInvite(at(11, 0), { settings: ON })).toBeNull();
    expect(openInvite(at(13, 30), { settings: ON })).toBe('lunch');
    expect(openInvite(at(20, 0), { settings: ON })).toBe('dinner');
  });
  it('ritmo desligado no app → nada abre', () => {
    expect(openInvite(at(9, 30), { settings: { ...ON, inApp: false } })).toBeNull();
  });
  it('dormindo → nada abre', () => {
    expect(openInvite(at(9, 30), { settings: ON, isSleeping: true })).toBeNull();
  });
  it('dentro da janela de descanso → nada abre (mesmo a 20h, se o descanso começa às 19h)', () => {
    expect(openInvite(at(20, 30), { settings: ON, restWindow: { start: '19:00', end: '07:00' } })).toBeNull();
    expect(openInvite(at(20, 30), { settings: ON, restWindow: { start: '23:00', end: '07:00' } })).toBe('dinner');
  });
  it('atendida ou dispensada hoje → não reabre; amanhã reabre', () => {
    const hoje = playerDayKey(at(9, 30), undefined);
    const done: MealRitualRecord = { day: hoje, done: ['breakfast'], skipped: [] };
    expect(openInvite(at(9, 30), { settings: ON, record: done })).toBeNull();
    const skipped: MealRitualRecord = { day: hoje, done: [], skipped: ['breakfast'] };
    expect(openInvite(at(10, 0), { settings: ON, record: skipped })).toBeNull();
    // registro de OUTRO dia não vale: sem histórico, sem sequência
    const ontem: MealRitualRecord = { day: playerDayKey(new Date(2026, 9, 11, 9), undefined), done: ['breakfast'], skipped: [] };
    expect(openInvite(at(9, 30), { settings: ON, record: ontem })).toBe('breakfast');
  });
  it('uma refeição atendida não fecha as outras', () => {
    const rec: MealRitualRecord = { day: playerDayKey(at(9), undefined), done: ['breakfast'], skipped: [] };
    expect(openInvite(at(13, 45), { settings: ON, record: rec })).toBe('lunch');
  });
});

describe('atender a janela é só registro — não concede nada', () => {
  const base = {
    healthPoints: 2, energyPoints: 1, gamePoints: 50, emblems: 3, totalXP: 100, perfectDays: 4,
    foodInventory: { '🍎': 2 }, mealRhythm: ON,
    mealRitual: undefined as MealRitualRecord | undefined,
  };
  it('muda UM campo (mealRitual) e mais nada: nem HP, nem energia, nem Bits, nem Emblemas, nem XP', () => {
    const next = markMealDone(base, at(9, 30), 'pet');
    expect(next).not.toBe(base);
    const { mealRitual, ...resto } = next;
    expect(resto).toEqual({ ...base, mealRitual: undefined });
    expect(mealRitual).toMatchObject({ done: ['breakfast'], lastKind: 'pet' });
  });
  it('é IDEMPOTENTE: a 2ª chamada na mesma janela devolve a MESMA referência (entra em updater, footgun 6)', () => {
    const um = markMealDone(base, at(9, 30), 'pet');
    expect(markMealDone(um, at(9, 40), 'snack')).toBe(um);
  });
  it('fora de janela, dormindo ou sem ritmo → mesma referência (nada registrado)', () => {
    expect(markMealDone(base, at(16, 0), 'pet')).toBe(base);
    expect(markMealDone(base, at(9, 30), 'pet', true)).toBe(base);
    const semRitmo = { ...base, mealRhythm: { ...ON, inApp: false } };
    expect(markMealDone(semRitmo, at(9, 30), 'pet')).toBe(semRitmo);
  });
  it('respeita a janela de descanso do próprio estado', () => {
    const s = { ...base, rest: { window: { start: '19:00', end: '07:00' } } };
    expect(markMealDone(s, at(20, 30), 'pet')).toBe(s);
  });
  it('"agora não" dispensa a janela inteira e é idempotente', () => {
    const a = skipMeal(base, 'breakfast', at(9, 30));
    expect(a.mealRitual?.skipped).toEqual(['breakfast']);
    expect(skipMeal(a, 'breakfast', at(9, 35))).toBe(a);
  });
});

describe('a micro-ação: UMA coisa, que existe de verdade', () => {
  it('cocô na tela vence — é a única necessidade real do bicho', () => {
    expect(pickMicroAction({ poopPending: true, canFeed: true }, 'x')).toBe('poop');
  });
  it('NUNCA convida a comer se comer não serviria (pastinha vazia / janela cheia / energia cheia)', () => {
    for (let i = 0; i < 200; i++) {
      expect(pickMicroAction({ poopPending: false, canFeed: false }, `s${i}`)).not.toBe('snack');
    }
  });
  it('NUNCA inventa cocô', () => {
    for (let i = 0; i < 200; i++) {
      expect(pickMicroAction({ poopPending: false, canFeed: true }, `s${i}`)).not.toBe('poop');
    }
  });
  it('sempre há um convite honesto (o piso "dizer oi" não gasta nada)', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) vistos.add(pickMicroAction({ poopPending: false, canFeed: false }, `s${i}`));
    expect([...vistos].sort()).toEqual(['pet', 'tenSeconds']);
  });
  it('varia entre refeições/dias (não é o mesmo cartão três vezes) e é estável para a mesma semente', () => {
    const k = (s: string) => pickMicroAction({ poopPending: false, canFeed: true }, s);
    expect(k('2026-10-12|lunch')).toBe(k('2026-10-12|lunch'));
    expect(new Set(Array.from({ length: 60 }, (_, i) => k(`d${i}|lunch`))).size).toBeGreaterThan(1);
  });
});

describe('o que vai ao servidor (só com opt-in)', () => {
  it('push desligado → NADA vai (nem horário, nem fuso)', () => {
    expect(serverMeals(ON, null, at(9))).toBeNull();
    expect(serverMeals(undefined, null, at(9))).toBeNull();
  });
  it('push ligado → minutos, fuso e janela de descanso', () => {
    const s = serverMeals({ ...ON, push: true }, { start: '23:00', end: '07:00' }, at(9));
    expect(s?.t).toEqual([540, 810, 1200]);
    expect(s?.tz).toBe(-at(9).getTimezoneOffset());
    expect(s?.rest).toEqual([1380, 420]);
  });
  it('sem janela de descanso o campo `rest` não existe', () => {
    expect(serverMeals({ ...ON, push: true }, null, at(9))).not.toHaveProperty('rest');
    expect(restArc({ start: '10:00', end: '10:00' })).toBeNull();
  });
});

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

describe('cocô: a distribuição se alinha ao pós-refeição, a REGRA não muda', () => {
  const T = DEFAULT_MEAL_TIMES;
  it('o 1º cocô fica SEMPRE em [07h, 15h) — 5000 sorteios', () => {
    const r = rng(1);
    for (let i = 0; i < 5000; i++) {
      const h = alignedFirstPoopHour(r, 7, 15, T);
      expect(h).toBeGreaterThanOrEqual(7);
      expect(h).toBeLessThan(15);
    }
  });
  it('Madrugador (10h): nunca antes de 10h, mesmo com café às 9h', () => {
    const r = rng(2);
    for (let i = 0; i < 5000; i++) expect(alignedFirstPoopHour(r, 10, 15, T)).toBeGreaterThanOrEqual(10);
  });
  it('cai na janela pós-café ou pós-almoço (de 15 min a 1h45 depois)', () => {
    const r = rng(3);
    const dentro = (h: number) =>
      (h >= 9 + POOP_AFTER_MEAL_FROM_H && h <= 9 + POOP_AFTER_MEAL_TO_H) ||
      (h >= 13.5 + POOP_AFTER_MEAL_FROM_H && h <= 15);
    for (let i = 0; i < 2000; i++) expect(dentro(alignedFirstPoopHour(r, 7, 15, T))).toBe(true);
  });
  it('as duas janelas aparecem (não degenera numa só)', () => {
    const r = rng(4);
    const hs = Array.from({ length: 1000 }, () => alignedFirstPoopHour(r, 7, 15, T));
    expect(hs.some(h => h < 12)).toBe(true);
    expect(hs.some(h => h > 13)).toBe(true);
  });
  it('sem interseção possível, cai no sorteio uniforme de sempre (nunca falha)', () => {
    const r = rng(5);
    const h = alignedFirstPoopHour(r, 14.9, 15, { breakfast: '06:00', lunch: '11:30', dinner: '17:00' });
    expect(h).toBeGreaterThanOrEqual(14.9);
    expect(h).toBeLessThan(15);
  });
  it('o 2º cocô: SEMPRE de 8 a 10 h depois do 1º aparecer — para qualquer hora do 1º', () => {
    for (let h = 7; h <= 15; h += 0.25) {
      const first = new Date(2026, 9, 12, Math.floor(h), Math.round((h % 1) * 60)).getTime();
      const r = rng(Math.floor(h * 100));
      for (let i = 0; i < 200; i++) {
        const gap = alignedSecondGapHours(r, first, T);
        expect(gap).toBeGreaterThanOrEqual(8);
        expect(gap).toBeLessThanOrEqual(10);
      }
    }
  });
  it('o 2º cai no pós-jantar quando o 1º permite (1º às 11h → janela do jantar é alcançável)', () => {
    const first = new Date(2026, 9, 12, 11, 0).getTime();
    const r = rng(6);
    for (let i = 0; i < 300; i++) {
      const at2 = new Date(first + alignedSecondGapHours(r, first, T) * 3600000);
      const h = at2.getHours() + at2.getMinutes() / 60;
      expect(h).toBeGreaterThanOrEqual(20 + POOP_AFTER_MEAL_FROM_H - 1e-9);
      expect(h).toBeLessThanOrEqual(20 + POOP_AFTER_MEAL_TO_H + 1e-9);
    }
  });
});
