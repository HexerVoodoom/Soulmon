import { describe, it, expect } from 'vitest';
import {
  parseTime,
  crossesMidnight,
  isWithinWindow,
  recordNight,
  restConstancy,
  dreamRarity,
  rollDream,
  collectDream,
  dexProgress,
  sleepReminderAt,
  createRestState,
  morningKey,
  DREAM_CATALOG,
  DREAMS_BY_RARITY,
  MAX_NIGHTS,
  SLEEP_REMINDER_LEAD_MIN,
  type RestState,
  type RestWindow,
} from './restWindow';
import { REST_WINDOW_GRACE_MIN, DEFAULT_REST_WINDOW } from '../types/taskModel';

const NIGHT: RestWindow = { start: '23:00', end: '07:00' };

/** Um instante local, sem depender de fuso do CI. */
function at(y: number, m: number, d: number, h: number, min = 0): Date {
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function stateWith(nights: Array<{ date: Date; onTime: boolean }>): RestState {
  return {
    window: NIGHT,
    nights: nights.map((n) => ({ date: n.date.toDateString(), onTime: n.onTime })),
    dreams: [],
  };
}

describe('parseTime / crossesMidnight', () => {
  it('converte HH:MM em minutos desde a meia-noite', () => {
    expect(parseTime('00:00')).toBe(0);
    expect(parseTime('07:00')).toBe(420);
    expect(parseTime('23:00')).toBe(1380);
    expect(parseTime('23:59')).toBe(1439);
  });

  it('devolve NaN para entrada inválida', () => {
    expect(Number.isNaN(parseTime('24:00'))).toBe(true);
    expect(Number.isNaN(parseTime('7h'))).toBe(true);
    expect(Number.isNaN(parseTime(''))).toBe(true);
  });

  it('detecta janela que cruza a meia-noite', () => {
    expect(crossesMidnight(NIGHT)).toBe(true);
    expect(crossesMidnight({ start: '13:00', end: '15:00' })).toBe(false);
    expect(crossesMidnight(DEFAULT_REST_WINDOW)).toBe(true);
  });
});

describe('isWithinWindow — janela cruzando a meia-noite', () => {
  it('conta os dois lados da meia-noite', () => {
    expect(isWithinWindow(NIGHT, at(2026, 8, 19, 23, 30), 0)).toBe(true);
    expect(isWithinWindow(NIGHT, at(2026, 8, 20, 2, 0), 0)).toBe(true);
    expect(isWithinWindow(NIGHT, at(2026, 8, 20, 6, 59), 0)).toBe(true);
  });

  it('fica fora no meio do dia', () => {
    expect(isWithinWindow(NIGHT, at(2026, 8, 19, 14, 0), 0)).toBe(false);
    expect(isWithinWindow(NIGHT, at(2026, 8, 19, 8, 0), 0)).toBe(false);
  });

  it('janela normal (sem cruzar) também funciona', () => {
    const nap: RestWindow = { start: '13:00', end: '15:00' };
    expect(isWithinWindow(nap, at(2026, 8, 19, 14, 0), 0)).toBe(true);
    expect(isWithinWindow(nap, at(2026, 8, 19, 16, 0), 0)).toBe(false);
  });
});

describe('isWithinWindow — tolerância', () => {
  it('deitar um pouco ANTES do início ainda conta', () => {
    // 22:30 = 30 min antes de 23:00, dentro dos 45 min de tolerância padrão.
    expect(isWithinWindow(NIGHT, at(2026, 8, 19, 22, 30))).toBe(true);
    expect(isWithinWindow(NIGHT, at(2026, 8, 19, 22, 30), 0)).toBe(false);
  });

  it('deitar um pouco DEPOIS do início conta (já está na janela)', () => {
    expect(isWithinWindow(NIGHT, at(2026, 8, 19, 23, 40))).toBe(true);
  });

  it('não estende o FIM da janela — a tolerância é do início', () => {
    expect(isWithinWindow(NIGHT, at(2026, 8, 20, 7, 30))).toBe(false);
  });

  it('respeita a tolerância padrão do contrato', () => {
    const justInside = at(2026, 8, 19, 23, 0);
    justInside.setMinutes(justInside.getMinutes() - REST_WINDOW_GRACE_MIN);
    expect(isWithinWindow(NIGHT, justInside)).toBe(true);

    const justOutside = new Date(justInside.getTime() - 60_000);
    expect(isWithinWindow(NIGHT, justOutside)).toBe(false);
  });
});

describe('recordNight', () => {
  it('usa o dayKey da MANHÃ', () => {
    const s = recordNight(createRestState(NIGHT), at(2026, 8, 19, 23, 10));
    expect(s.nights[0].date).toBe(at(2026, 8, 20, 8).toDateString());
    expect(morningKey(at(2026, 8, 20, 1, 0))).toBe(at(2026, 8, 20, 8).toDateString());
  });

  it('é idempotente por manhã: dormir duas vezes não cria duas noites', () => {
    let s = createRestState(NIGHT);
    s = recordNight(s, at(2026, 8, 19, 23, 10));
    s = recordNight(s, at(2026, 8, 19, 23, 40), at(2026, 8, 20, 7, 5));
    expect(s.nights).toHaveLength(1);
    expect(s.nights[0].wokeAt).toBe(at(2026, 8, 20, 7, 5).toISOString());
  });

  it('marca onTime pela janela e nunca devolve outra coisa que um booleano', () => {
    const onTime = recordNight(createRestState(NIGHT), at(2026, 8, 19, 23, 15));
    const late = recordNight(createRestState(NIGHT), at(2026, 8, 20, 14, 0));
    expect(onTime.nights[0].onTime).toBe(true);
    expect(late.nights[0].onTime).toBe(false);
  });

  it('poda em 30 noites, mantendo as mais recentes', () => {
    let s = createRestState(NIGHT);
    for (let i = 0; i < 40; i++) s = recordNight(s, at(2026, 7, 1 + i, 23, 10));
    expect(s.nights).toHaveLength(MAX_NIGHTS);
    const last = s.nights[s.nights.length - 1].date;
    expect(last).toBe(at(2026, 7, 40 + 1, 8).toDateString());
  });

  it('não muta o estado anterior', () => {
    const before = createRestState(NIGHT);
    recordNight(before, at(2026, 8, 19, 23, 10));
    expect(before.nights).toHaveLength(0);
  });
});

describe('restConstancy — noite sem registro é NEUTRA', () => {
  const now = at(2026, 8, 20, 9, 0);

  it('conta só as noites registradas ("5 das últimas 7")', () => {
    const s = stateWith([
      { date: at(2026, 8, 20, 8), onTime: true },
      { date: at(2026, 8, 19, 8), onTime: true },
      { date: at(2026, 8, 18, 8), onTime: true },
      { date: at(2026, 8, 17, 8), onTime: true },
      { date: at(2026, 8, 16, 8), onTime: true },
      { date: at(2026, 8, 15, 8), onTime: false },
      { date: at(2026, 8, 14, 8), onTime: false },
    ]);
    expect(restConstancy(s, now)).toEqual({ onTime: 5, window: 7, ratio: 5 / 7 });
  });

  it('noite ausente SAI DO DENOMINADOR e não derruba o ratio', () => {
    const full = stateWith([
      { date: at(2026, 8, 20, 8), onTime: true },
      { date: at(2026, 8, 19, 8), onTime: true },
      { date: at(2026, 8, 18, 8), onTime: true },
    ]);
    const semRegistro = restConstancy(full, now);
    expect(semRegistro).toEqual({ onTime: 3, window: 3, ratio: 1 });

    // As outras 4 noites da semana simplesmente não existem — ratio segue 1.
    expect(semRegistro.ratio).toBe(1);
    expect(semRegistro.window).toBeLessThan(7);
  });

  it('estado vazio devolve ratio 0, nunca negativo', () => {
    const empty = restConstancy(createRestState(NIGHT), now);
    expect(empty).toEqual({ onTime: 0, window: 0, ratio: 0 });
    expect(empty.ratio).toBeGreaterThanOrEqual(0);
  });

  it('ignora noites fora da janela móvel', () => {
    const s = stateWith([
      { date: at(2026, 8, 20, 8), onTime: true },
      { date: at(2026, 7, 1, 8), onTime: false },
    ]);
    expect(restConstancy(s, now).window).toBe(1);
  });
});

describe('dreamRarity — escala com REGULARIDADE, não com duração', () => {
  const now = at(2026, 8, 20, 9, 0);

  function nightsAllOnTime(count: number, onTime: number): RestState {
    return stateWith(
      Array.from({ length: count }, (_, i) => ({
        date: at(2026, 8, 20 - i, 8),
        onTime: i < onTime,
      })),
    );
  }

  it('sobe conforme a razão da média móvel', () => {
    expect(dreamRarity(nightsAllOnTime(7, 7), now)).toBe('legendary');
    expect(dreamRarity(nightsAllOnTime(7, 4), now)).toBe('rare');
    expect(dreamRarity(nightsAllOnTime(7, 1), now)).toBe('common');
  });

  it('pouco histórico não vira raridade alta nem castigo', () => {
    expect(dreamRarity(nightsAllOnTime(2, 2), now)).toBe('common');
    expect(dreamRarity(createRestState(NIGHT), now)).toBe('common');
  });

  it('DURAÇÃO não muda nada: noites curtas e longas dão a mesma raridade', () => {
    // Mesma regularidade (sempre dentro da janela), durações opostas.
    let curto = createRestState(NIGHT);
    let longo = createRestState(NIGHT);
    for (let i = 0; i < 5; i++) {
      const dia = 15 + i;
      curto = recordNight(curto, at(2026, 8, dia, 23, 10), at(2026, 8, dia + 1, 2, 0)); // ~3h
      longo = recordNight(longo, at(2026, 8, dia, 23, 10), at(2026, 8, dia + 1, 10, 0)); // ~11h
    }
    const nowAfter = at(2026, 8, 20, 12, 0);
    expect(dreamRarity(curto, nowAfter)).toBe(dreamRarity(longo, nowAfter));
    expect(restConstancy(curto, nowAfter).ratio).toBe(restConstancy(longo, nowAfter).ratio);
  });

  it('quem deita no horário sempre supera quem deita a esmo', () => {
    const regular = nightsAllOnTime(7, 7);
    const irregular = nightsAllOnTime(7, 2);
    const ordem: Record<string, number> = { common: 0, rare: 1, legendary: 2 };
    expect(ordem[dreamRarity(regular, now)]).toBeGreaterThan(ordem[dreamRarity(irregular, now)]);
  });
});

describe('rollDream / collectDream / dexProgress', () => {
  const base = createRestState(NIGHT);

  it('é determinístico com a mesma seed', () => {
    for (const seed of [0, 1, 42, 1337, 987654]) {
      expect(rollDream(base, 'rare', seed)).toBe(rollDream(base, 'rare', seed));
    }
  });

  it('devolve sempre um id da raridade pedida', () => {
    for (const rarity of ['common', 'rare', 'legendary'] as const) {
      for (let seed = 0; seed < 30; seed++) {
        const id = rollDream(base, rarity, seed);
        expect(DREAMS_BY_RARITY[rarity].some((d) => d.id === id)).toBe(true);
      }
    }
  });

  it('seeds diferentes alcançam sonhos diferentes', () => {
    const ids = new Set(Array.from({ length: 40 }, (_, i) => rollDream(base, 'common', i)));
    expect(ids.size).toBeGreaterThan(1);
  });

  it('prefere sonho ainda não coletado', () => {
    const first = rollDream(base, 'legendary', 7);
    const after = rollDream(collectDream(base, first), 'legendary', 7);
    expect(after).not.toBe(first);
  });

  it('collectDream é idempotente', () => {
    const id = DREAM_CATALOG[0].id;
    const once = collectDream(base, id);
    const twice = collectDream(once, id);
    expect(twice.dreams).toEqual([id]);
    expect(twice.dreams).toHaveLength(1);
  });

  it('collectDream ignora id desconhecido e não perde nada', () => {
    const once = collectDream(base, DREAM_CATALOG[1].id);
    expect(collectDream(once, 'nao-existe').dreams).toEqual(once.dreams);
  });

  it('dexProgress conta coletados sobre o total', () => {
    expect(dexProgress(base)).toEqual({ collected: 0, total: DREAM_CATALOG.length });
    const s = collectDream(collectDream(base, DREAM_CATALOG[0].id), DREAM_CATALOG[1].id);
    expect(dexProgress(s)).toEqual({ collected: 2, total: DREAM_CATALOG.length });
  });

  it('o catálogo tem os dois idiomas e ids únicos', () => {
    expect(DREAM_CATALOG.length).toBeGreaterThanOrEqual(18);
    const ids = new Set(DREAM_CATALOG.map((d) => d.id));
    expect(ids.size).toBe(DREAM_CATALOG.length);
    for (const d of DREAM_CATALOG) {
      expect(d.labelEn.trim().length).toBeGreaterThan(0);
      expect(d.labelPt.trim().length).toBeGreaterThan(0);
      expect(d.labelEn).not.toBe(d.labelPt);
      expect(d.emoji.length).toBeGreaterThan(0);
    }
    for (const r of ['common', 'rare', 'legendary'] as const) {
      expect(DREAMS_BY_RARITY[r].length).toBeGreaterThan(0);
    }
  });
});

describe('sleepReminderAt — só lembrete de DEITAR', () => {
  it('avisa antes do início da janela', () => {
    const now = at(2026, 8, 19, 18, 0);
    const r = sleepReminderAt(NIGHT, now)!;
    expect(r.getHours()).toBe(22);
    expect(r.getMinutes()).toBe(60 - SLEEP_REMINDER_LEAD_MIN);
    expect(r.getDate()).toBe(19);
  });

  it('passado o horário, agenda para o dia seguinte', () => {
    const r = sleepReminderAt(NIGHT, at(2026, 8, 19, 23, 30))!;
    expect(r.getDate()).toBe(20);
    expect(r.getHours()).toBe(22);
  });

  it('nunca cai DENTRO da noite (não existe push noturno de desempenho)', () => {
    for (let h = 0; h < 24; h++) {
      const r = sleepReminderAt(NIGHT, at(2026, 8, 19, h, 0))!;
      expect(r.getTime()).toBeGreaterThan(at(2026, 8, 19, h, 0).getTime());
      // O único lembrete possível é o de deitar: sempre no mesmo horário do dia.
      expect(`${r.getHours()}:${r.getMinutes()}`).toBe('22:30');
    }
  });

  it('devolve null para janela inválida', () => {
    expect(sleepReminderAt({ start: 'meia-noite', end: '07:00' }, at(2026, 8, 19, 12))).toBeNull();
  });
});

describe('NENHUMA função devolve penalidade ou perda', () => {
  const now = at(2026, 8, 20, 9, 0);

  it('a pior noite possível não tira nada do estado', () => {
    let s = createRestState(NIGHT);
    s = collectDream(s, DREAM_CATALOG[0].id);
    s = recordNight(s, at(2026, 8, 18, 23, 10)); // boa
    const antes = { dreams: [...s.dreams], nights: s.nights.length };

    // Sequência de noites totalmente fora da janela.
    let pior = s;
    for (let i = 0; i < 5; i++) pior = recordNight(pior, at(2026, 8, 19 + i, 15, 0));

    expect(pior.dreams).toEqual(antes.dreams); // Dex nunca encolhe
    expect(pior.nights.length).toBeGreaterThanOrEqual(antes.nights);
    expect(dexProgress(pior).collected).toBeGreaterThanOrEqual(dexProgress(s).collected);
  });

  it('constância nunca é negativa e nunca passa de 1', () => {
    const casos: RestState[] = [
      createRestState(NIGHT),
      stateWith([{ date: at(2026, 8, 20, 8), onTime: false }]),
      stateWith([
        { date: at(2026, 8, 20, 8), onTime: false },
        { date: at(2026, 8, 19, 8), onTime: false },
        { date: at(2026, 8, 18, 8), onTime: true },
      ]),
    ];
    for (const s of casos) {
      const c = restConstancy(s, now);
      expect(c.ratio).toBeGreaterThanOrEqual(0);
      expect(c.ratio).toBeLessThanOrEqual(1);
      expect(c.onTime).toBeGreaterThanOrEqual(0);
      expect(c.window).toBeGreaterThanOrEqual(0);
      expect(c.onTime).toBeLessThanOrEqual(c.window);
    }
  });

  it('raridade tem piso em common — não existe faixa de castigo', () => {
    const todasFora = stateWith(
      Array.from({ length: 7 }, (_, i) => ({ date: at(2026, 8, 20 - i, 8), onTime: false })),
    );
    expect(dreamRarity(todasFora, now)).toBe('common');
    expect(DREAM_CATALOG.every((d) => ['common', 'rare', 'legendary'].includes(d.rarity))).toBe(true);
  });

  it('hideMetrics esconde números mas PRESERVA as recompensas', () => {
    const nights = Array.from({ length: 7 }, (_, i) => ({ date: at(2026, 8, 20 - i, 8), onTime: true }));
    const visivel = stateWith(nights);
    const escondido: RestState = { ...stateWith(nights), hideMetrics: true };

    expect(restConstancy(escondido, now)).toEqual(restConstancy(visivel, now));
    expect(dreamRarity(escondido, now)).toBe(dreamRarity(visivel, now));
    expect(rollDream(escondido, 'legendary', 99)).toBe(rollDream(visivel, 'legendary', 99));
    expect(dexProgress(escondido)).toEqual(dexProgress(visivel));
  });
});
