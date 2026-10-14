/**
 * 4.1 (beta-2) — os três check-ins do dia (REGISTRO §40). Aceite: três momentos com benefício específico; recompensa ÚNICA por janela por
 * dia do jogador; sem recompensa duplicada ao entrar/sair; respeita dia e fuso; ausência não invalida nada; não exige o app aberto na hora;
 * sem penalidade; horários vêm das preferências do ritmo das refeições.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CHECKINS_ENABLED, __setCheckInsEnabledForTest, CHECKIN_REWARDS, CHECKIN_SLOTS, availableCheckIn, checkInDayOf, checkInWindows, claimCheckIn, claimedToday, currentSlot, sanitizeCheckIns, type CheckInState,
} from './checkIns';
import { hungerAt } from './hunger';
import { playerDayIso } from './playerDay';

/** Instante com a hora de PAREDE do aparelho (o ritmo das refeições é em hora local) — o teste roda igual em qualquer TZ. */
const local = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m, 0).getTime();
const estado = (over: Partial<CheckInState> = {}): CheckInState => ({
  energyPoints: 0, evolutionStage: 'rookie', totalXP: 0, gamePoints: 0, hunger: { v: 10, at: local(13, 0) }, energyClock: { at: local(13, 0), carry: 0 }, ...over,
});

// O interruptor de produção está DESLIGADO (14/10/2026): estes testes exercitam o MECANISMO, que segue inteiro para quando o dono
// religar — por isso ligam o override; o bloco `desligado` abaixo prova o comportamento que está no ar.
beforeAll(() => __setCheckInsEnabledForTest(true));
afterAll(() => __setCheckInsEnabledForTest(undefined));

describe('as janelas (horários do ritmo das refeições: 09:00 · 13:30 · 20:00)', () => {
  it('antes do primeiro horário não há janela; depois cada uma vale até a próxima começar (a noite vai até o fim do dia)', () => {
    expect(currentSlot(undefined, local(13, 8, 59))).toBeNull();
    expect(currentSlot(undefined, local(13, 9, 0))).toBe('morning');
    expect(currentSlot(undefined, local(13, 13, 29))).toBe('morning');
    expect(currentSlot(undefined, local(13, 13, 30))).toBe('afternoon');
    expect(currentSlot(undefined, local(13, 19, 59))).toBe('afternoon');
    expect(currentSlot(undefined, local(13, 20, 0))).toBe('night');
    expect(currentSlot(undefined, local(13, 23, 59))).toBe('night');
  });
  it('usa os horários EDITADOS pela pessoa nas Configurações', () => {
    const times = { breakfast: '07:30', lunch: '12:00', dinner: '19:00' };
    expect(currentSlot(times, local(13, 7, 30))).toBe('morning');
    expect(currentSlot(times, local(13, 12, 0))).toBe('afternoon');
    expect(currentSlot(times, local(13, 19, 0))).toBe('night');
    expect(currentSlot(times, local(13, 7, 29))).toBeNull();
  });
  it('horário de preferência corrompido cai no padrão (nunca derruba)', () => {
    expect(currentSlot({ breakfast: 'xx', lunch: '99:99', dinner: '' } as never, local(13, 9, 0))).toBe('morning');
  });
});

describe('a recompensa de cada janela é específica e única', () => {
  it('manhã: enche a FOME (não a energia) · tarde: Bits · noite: XP de Vínculo', () => {
    const m = claimCheckIn(estado(), local(13, 9, 5));
    expect(m.slot).toBe('morning');
    expect(hungerAt(m.state.hunger, local(13, 9, 5))).toBeGreaterThan(10);
    expect(m.state.energyPoints).toBe(0);
    expect(m.state.gamePoints).toBe(0);
    expect(m.state.totalXP).toBe(0);

    const t = claimCheckIn(estado(), local(13, 14, 0));
    expect(t.slot).toBe('afternoon');
    expect(t.state.gamePoints).toBe(CHECKIN_REWARDS.afternoon.bits);
    expect(t.state.bitsOrigin?.free).toBe(CHECKIN_REWARDS.afternoon.bits); // Bits GRÁTIS (nunca de Crédito)
    expect(t.state.totalXP).toBe(0);
    expect(hungerAt(t.state.hunger, local(13, 14, 0))).toBeLessThanOrEqual(10);

    const n = claimCheckIn(estado(), local(13, 21, 0));
    expect(n.slot).toBe('night');
    expect(n.state.totalXP).toBe(CHECKIN_REWARDS.night.xp);
    expect(n.state.gamePoints).toBe(0);
  });
  it('UMA vez por janela por dia: o 2º resgate (tap duplo no mesmo lote, reabrir o app, entrar/sair) devolve a MESMA referência', () => {
    const a = claimCheckIn(estado(), local(13, 9, 5)).state;
    const again = claimCheckIn(a, local(13, 9, 6));
    expect(again.slot).toBeUndefined();
    expect(again.state).toBe(a);
    let s = a;
    for (let i = 0; i < 30; i++) s = claimCheckIn(s, local(13, 9, 10 + i)).state;
    expect(s).toBe(a);
  });
  it('no máximo 3 por dia, uma de cada; a 4ª tentativa em qualquer horário não paga', () => {
    let s = estado();
    for (const [h, m] of [[9, 0], [13, 30], [20, 0]] as const) s = claimCheckIn(s, local(13, h, m)).state;
    expect(claimedToday(s, local(13, 21))).toEqual([...CHECKIN_SLOTS]);
    for (const [h, m] of [[9, 5], [13, 40], [21, 0], [23, 59]] as const) expect(claimCheckIn(s, local(13, h, m)).state).toBe(s);
    expect(s.gamePoints).toBe(CHECKIN_REWARDS.afternoon.bits);
    expect(s.totalXP).toBe(CHECKIN_REWARDS.night.xp);
  });
  it('o app NÃO precisa estar aberto na hora marcada: chegar tarde dentro do intervalo ainda vale', () => {
    expect(availableCheckIn(estado(), local(13, 13, 29))).toBe('morning'); // 4 h 29 min depois do horário
    expect(availableCheckIn(estado(), local(13, 19, 59))).toBe('afternoon');
    expect(availableCheckIn(estado(), local(13, 23, 59))).toBe('night');
  });
});

describe('ausência não invalida nada e não deixa rastro', () => {
  it('perder a manhã e a tarde não muda a noite (nem cria contador, sequência ou dívida)', () => {
    const r = claimCheckIn(estado(), local(13, 21, 0)).state;
    expect(r.checkIns).toEqual({ day: playerDayIso(new Date(local(13, 21, 0)), undefined), claimed: ['night'] });
    expect(Object.keys(r.checkIns!).sort()).toEqual(['claimed', 'day']);
  });
  it('um dia inteiro sem abrir: o dia seguinte começa com as três janelas livres (nada acumulou, nada foi cobrado)', () => {
    let s = claimCheckIn(estado(), local(13, 9, 0)).state;
    s = { ...s, hunger: s.hunger };
    expect(availableCheckIn(s, local(15, 9, 0))).toBe('morning');
    expect(claimedToday(s, local(15, 9, 0))).toEqual([]);
  });
  it('a disponibilidade e a recompensa NÃO leem desempenho: mesmo resultado com o dia fechado ou com nada feito', () => {
    const fechado = { ...estado(), healthPoints: 3, perfectDays: 99, tasks: [] } as unknown as CheckInState;
    const vazio = { ...estado(), healthPoints: 0, perfectDays: 0 } as unknown as CheckInState;
    for (const t of [local(13, 9, 0), local(13, 14, 0), local(13, 21, 0)]) {
      expect(availableCheckIn(fechado, t)).toBe(availableCheckIn(vazio, t));
      expect(claimCheckIn(fechado, t).state.gamePoints).toBe(claimCheckIn(vazio, t).state.gamePoints);
    }
  });
  it('o módulo não importa nada de desempenho (meta, HP, constância, tarefas) — linha vermelha do ritmo', () => {
    const src = readFileSync(resolve(__dirname, 'checkIns.ts'), 'utf8');
    expect(src).not.toMatch(/from '\.\/(dailyReset|taskTriage|habitRhythm|taskModel|careRules)'/);
  });
});

describe('dia e fuso do jogador (relógio, reabrir, troca de aparelho)', () => {
  it('relógio que VOLTA não reabre as janelas já resgatadas (vale o maior entre o dia do relógio e o do registro)', () => {
    const amanha = claimCheckIn(estado(), local(14, 9, 0)).state; // resgatou "amanhã"
    expect(checkInDayOf(amanha, local(13, 10))).toBe(checkInDayOf(amanha, local(14, 10)));
    expect(claimCheckIn(amanha, local(13, 9, 30)).state).toBe(amanha);
  });
  it('a virada de dia é a do fuso FIXO do save, não a do aparelho', () => {
    const tz = { zone: 'Pacific/Kiritimati', offsetMs: 14 * 3_600_000 };
    const s = claimCheckIn(estado({ playerDayTz: tz }), local(13, 9, 0)).state;
    const d1 = playerDayIso(new Date(local(13, 9, 0)), tz);
    expect(s.checkIns!.day).toBe(d1);
    // do outro lado da virada naquele fuso, o registro é de "ontem" e as janelas reabrem
    const depois = Date.parse(`${d1}T00:00:00Z`) + 86_400_000 - 14 * 3_600_000 + 60_000;
    expect(playerDayIso(new Date(depois), tz) > d1).toBe(true);
    expect(claimedToday(s, depois)).toEqual([]);
  });
  it('reabrir o app (JSON + sanitize) preserva o resgatado: a recompensa não repaga', () => {
    const a = claimCheckIn(estado(), local(13, 9, 0)).state;
    const salvo = JSON.parse(JSON.stringify(a)) as CheckInState;
    const reaberto = { ...salvo, checkIns: sanitizeCheckIns(salvo.checkIns) };
    expect(claimCheckIn(reaberto, local(13, 11, 0)).state).toBe(reaberto);
  });
  it('lixo no registro vira "nada resgatado hoje" (nunca lança, nunca trava o jogador fora)', () => {
    for (const lixo of [null, 3, 'x', [], {}, { day: 5 }, { day: 'hoje', claimed: ['morning'] }, { claimed: ['morning'] }]) {
      expect(sanitizeCheckIns(lixo)).toBeUndefined();
    }
    expect(sanitizeCheckIns({ day: '2026-10-13', claimed: ['night', 'x', 'night', 'morning'] })).toEqual({ day: '2026-10-13', claimed: ['morning', 'night'] });
  });
});

describe('nada de vantagem paga nem de energia direta', () => {
  it('nenhuma janela concede energia, HP, Emblema ou Crédito', () => {
    for (const slot of CHECKIN_SLOTS) expect(Object.keys(CHECKIN_REWARDS[slot]).sort()).toEqual(['bits', 'hunger', 'xp']);
    for (const t of [local(13, 9, 0), local(13, 14, 0), local(13, 21, 0)]) {
      const antes = estado();
      const depois = claimCheckIn(antes, t).state;
      expect(depois.energyPoints).toBe(antes.energyPoints);
    }
  });
});

describe('checkInWindows (a folha dos check-ins: horário e estado de cada janela)', () => {
  it('antes do primeiro horário: as três por vir; manhã em curso: manhã aberta e as outras por vir', () => {
    expect(checkInWindows(estado(), local(13, 7)).map(w => w.status)).toEqual(['upcoming', 'upcoming', 'upcoming']);
    expect(checkInWindows(estado(), local(13, 10)).map(w => w.status)).toEqual(['open', 'upcoming', 'upcoming']);
  });
  it('mostra os horários (padrão 09:00 · 13:30 · 20:00; a noite não tem fim)', () => {
    expect(checkInWindows(estado(), local(13, 10)).map(w => [w.from, w.to])).toEqual([['09:00', '13:30'], ['13:30', '20:00'], ['20:00', null]]);
  });
  it('janela que passou sem resgate = missed (neutro); resgatada = claimed; funciona com o ritmo das refeições nunca configurado', () => {
    const r = claimCheckIn(estado(), local(13, 10)).state;
    expect(checkInWindows(r, local(13, 21)).map(w => w.status)).toEqual(['claimed', 'missed', 'open']);
    expect(r.mealRhythm).toBeUndefined();
  });
  it('usa os horários editados', () => {
    const e = estado({ mealRhythm: { times: { breakfast: '07:00', lunch: '12:00', dinner: '19:00' } } });
    expect(checkInWindows(e, local(13, 8)).map(w => w.from)).toEqual(['07:00', '12:00', '19:00']);
  });
  it('dia novo reabre as três (nada acumula)', () => {
    const r = claimCheckIn(estado(), local(13, 10)).state;
    expect(checkInWindows(r, local(14, 10))[0]!.status).toBe('open');
  });
});

describe('desligado (CHECKINS_ENABLED = false — o que está no ar)', () => {
  it('a constante de produção é false e nenhuma janela fica disponível nem paga', () => {
    expect(CHECKINS_ENABLED).toBe(false);
    __setCheckInsEnabledForTest(false);
    try {
      for (const h of [9, 14, 21]) {
        const e = estado();
        expect(availableCheckIn(e, local(13, h))).toBeNull();
        expect(claimCheckIn(e, local(13, h)).state).toBe(e); // mesma referência: nada gravado, nada pago
      }
      const e = estado();
      expect(claimCheckIn(e, local(13, 21)).slot).toBeUndefined();
      expect(e.checkIns).toBeUndefined();
    } finally { __setCheckInsEnabledForTest(true); }
  });
  it('um registro já gravado no save continua legível (nenhum save é tocado)', () => {
    expect(sanitizeCheckIns({ day: '2026-10-13', claimed: ['morning'] })).toEqual({ day: '2026-10-13', claimed: ['morning'] });
  });
});
