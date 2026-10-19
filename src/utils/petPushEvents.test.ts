import { describe, it, expect } from 'vitest';
import {
  ledgerWithPlan, localDayKey, localDayStart, planDayPushes, progressSlotMinute, rollLedger, sanitizeLedger,
  serverSkipPayload,
} from './petPushEvents';
import type { PetPushInput } from './petPushEvents';
import { HUNGER_FULL_TO_EMPTY_HOURS, HUNGER_MAX, msToFullEnergy } from './hunger';
import { DEFAULT_MEAL_RHYTHM } from './mealRhythm';
import { PUSH_DAILY_CAP } from '../../functions/api/_mealRhythm.js';
import { PUSH_KINDS_BY_PRIORITY, capPushes } from '../../functions/api/_pushBudget.js';
import {
  energyFullCopy, hungerInviteCopy, poopPushCopy, progressCopy,
} from '../../functions/api/_pushCopy.js';
import { initialNotificationsEnabled } from './notificationDefault';

const H = 3600_000;
const DAY = new Date(2026, 9, 12, 0, 0, 0, 0).getTime(); // 12/10/2026 00:00 local
const at = (h: number, m = 0) => DAY + h * H + m * 60_000;
const DECAY = HUNGER_MAX / (HUNGER_FULL_TO_EMPTY_HOURS * H);
/** Registro de fome que cruza 60 em `crossAt`. */
const hungerCrossing = (crossAt: number) => ({ v: 100, at: Math.round(crossAt - 40 / DECAY) });

const REST = { start: '23:00', end: '07:00' };

function base(over: Partial<PetPushInput> = {}): PetPushInput {
  return {
    nowMs: at(8),
    petName: 'Bito',
    language: 'en-US',
    enabled: true,
    isSleeping: false,
    ageDays: 5,
    restWindow: REST,
    mealRhythm: { ...DEFAULT_MEAL_RHYTHM },
    sleepReminderOn: true,
    state: {
      hunger: undefined, // fome cheia e sem queda projetada (os testes de fome põem o registro)
      energyPoints: 8, // rookie: máximo 8 — já cheia
      energyClock: { at: at(7), carry: 0 },
      evolutionStage: 'rookie',
      poopEventsScheduled: [],
      poopEventsShown: [],
      foodCount: 3,
    },
    ...over,
  };
}

const ids = (l: Array<{ id: string }>) => l.map(p => p.id);

describe('D-01 — notificações vêm por padrão', () => {
  it('save novo: o interruptor liga sozinho com a permissão do SO e o push das refeições nasce ligado', () => {
    expect(initialNotificationsEnabled('absent', 'granted')).toBe(true);
    expect(DEFAULT_MEAL_RHYTHM.push).toBe(true);
  });
});

describe('D-02 — fome: convite quando cruza a faixa mediana (60)', () => {
  it('agenda UM push na hora em que a fome cruza 60, com comida na pastinha', () => {
    const t = at(12);
    const p = planDayPushes(base({ state: { ...base().state, hunger: hungerCrossing(t) } }));
    const h = p.kept.find(x => x.id === 'hunger');
    expect(h).toBeDefined();
    expect(Math.abs(h!.at - t)).toBeLessThan(2000);
    expect(h!.tag).toBe('pet-pantry');
  });
  it('sem comida na pastinha NÃO manda (o texto seria mentira)', () => {
    const p = planDayPushes(base({ state: { ...base().state, hunger: hungerCrossing(at(12)), foodCount: 0 } }));
    expect(ids(p.kept)).not.toContain('hunger');
  });
  it('fome que JÁ está abaixo de 60 não dispara de novo (só o cruzar)', () => {
    const p = planDayPushes(base({ state: { ...base().state, hunger: { v: 40, at: at(7) } } }));
    expect(ids(p.kept)).not.toContain('hunger');
  });
  it('não repete no mesmo dia (ledger) e nunca cai na janela de descanso', () => {
    const led = { day: localDayKey(at(8)), fired: ['hunger'], pending: [], skipped: [] };
    const st = { ...base().state, hunger: hungerCrossing(at(12)) };
    expect(ids(planDayPushes(base({ state: st, ledger: led })).kept)).not.toContain('hunger');
    const tarde = planDayPushes(base({ nowMs: at(20), state: { ...st, hunger: hungerCrossing(at(23, 30)) } }));
    expect(ids(tarde.kept)).not.toContain('hunger');
  });
});

describe('D-03 — energia cheia: uma vez, ao atingir o máximo', () => {
  const regen = () => ({ ...base().state, energyPoints: 7, energyClock: { at: at(8), carry: 0 } });
  it('agenda o push na hora projetada em que enche', () => {
    const ms = msToFullEnergy(regen(), at(8))!;
    expect(ms).toBeGreaterThan(0);
    const p = planDayPushes(base({ state: regen() }));
    const e = p.kept.find(x => x.id === 'energyFull');
    expect(e?.at).toBe(at(8) + ms);
  });
  it('já cheia (ou já avisou hoje) → nada', () => {
    expect(ids(planDayPushes(base()).kept)).not.toContain('energyFull');
    const led = { day: localDayKey(at(8)), fired: ['energyFull'], pending: [], skipped: [] };
    expect(ids(planDayPushes(base({ state: regen(), ledger: led })).kept)).not.toContain('energyFull');
  });
});

describe('D-04 — cocô: a hora vem da agenda do save, nunca dormindo', () => {
  it('agenda os cocôs que ainda não apareceram, com a tag do aviso dentro do app', () => {
    const p = planDayPushes(base({ state: { ...base().state, poopEventsScheduled: [at(10), at(18)] } }));
    expect(ids(p.kept.filter(x => x.kind === 'poop'))).toEqual(['poop-0', 'poop-1']);
    expect(p.kept.find(x => x.id === 'poop-1')!.tag).toBe('poop-event-1');
  });
  it('cocô na janela de descanso, no passado ou já na tela → nenhum push', () => {
    const st = { ...base().state, poopEventsScheduled: [at(7), at(23, 30), at(9)], poopEventsShown: [2] };
    const p = planDayPushes(base({ nowMs: at(8), state: st }));
    expect(p.kept.filter(x => x.kind === 'poop')).toEqual([]);
  });
});

describe('D-06 — progresso: no máximo 1×/dia, no fechamento, só se sobrar vaga', () => {
  it('o slot é 2 h antes do sono, até as 21h', () => {
    expect(progressSlotMinute(REST)).toBe(21 * 60);
    expect(progressSlotMinute({ start: '21:30', end: '06:00' })).toBe(19 * 60 + 30);
    expect(progressSlotMinute({ start: '18:00', end: '06:00' })).toBeNull();
  });
  it('dia calmo (sem evento): sai UM progresso', () => {
    const p = planDayPushes(base({ mealRhythm: { ...DEFAULT_MEAL_RHYTHM, push: false }, sleepReminderOn: false }));
    expect(p.kept.filter(x => x.kind === 'progress')).toHaveLength(1);
  });
  it('dia cheio (4 eventos): o progresso é o primeiro a sair', () => {
    const st = { ...base().state, energyPoints: 7, energyClock: { at: at(8), carry: 0 }, hunger: hungerCrossing(at(12)), poopEventsScheduled: [at(9, 30), at(18)] };
    const p = planDayPushes(base({ state: st }));
    expect(ids(p.dropped)).toContain('progress');
    expect(ids(p.kept)).not.toContain('progress');
  });
  it('a copy do progresso não cita número, sequência nem cobrança', () => {
    for (const l of ['en-US', 'pt-BR']) {
      const c = progressCopy('Bito', l);
      expect(`${c.title} ${c.body}`).not.toMatch(/\d|streak|sequência|ainda não|you haven'?t/i);
    }
  });
});

describe('TETO — PUSH_DAILY_CAP = 4, com prioridade cocô > fome > energia > lembrete de deitar > refeição > progresso (S-7)', () => {
  const cheio = () => ({
    ...base().state, energyPoints: 7, energyClock: { at: at(8), carry: 0 },
    hunger: hungerCrossing(at(12)), poopEventsScheduled: [at(9, 30), at(18)],
  });
  it('a ordem declarada', () => {
    expect(PUSH_KINDS_BY_PRIORITY.indexOf('poop')).toBeLessThan(PUSH_KINDS_BY_PRIORITY.indexOf('hunger'));
    expect(PUSH_KINDS_BY_PRIORITY.indexOf('hunger')).toBeLessThan(PUSH_KINDS_BY_PRIORITY.indexOf('energyFull'));
    expect(PUSH_KINDS_BY_PRIORITY.indexOf('energyFull')).toBeLessThan(PUSH_KINDS_BY_PRIORITY.indexOf('sleep'));
    expect(PUSH_KINDS_BY_PRIORITY.indexOf('sleep')).toBeLessThan(PUSH_KINDS_BY_PRIORITY.indexOf('meal'));
    expect(PUSH_KINDS_BY_PRIORITY).not.toContain('letter');
    expect(PUSH_KINDS_BY_PRIORITY.indexOf('meal')).toBeLessThan(PUSH_KINDS_BY_PRIORITY.indexOf('progress'));
  });
  it('estoura → eventos ficam, refeição e lembrete saem, e o servidor é avisado (`x`)', () => {
    const p = planDayPushes(base({ state: cheio() }));
    expect(p.kept).toHaveLength(PUSH_DAILY_CAP);
    expect(p.kept.map(x => x.kind).sort()).toEqual(['energyFull', 'hunger', 'poop', 'poop']);
    expect(p.serverSkip.sort()).toEqual(['breakfast', 'dinner', 'lunch', 'sleep']);
    expect(serverSkipPayload(p)).toEqual({ d: localDayKey(at(8)), k: expect.arrayContaining(['sleep', 'lunch']) });
  });
  it('2 cocôs/dia (D-05) deixam vaga: entra o lembrete de deitar e a 1ª refeição', () => {
    const p = planDayPushes(base({ state: { ...base().state, poopEventsScheduled: [at(9, 30), at(18)] } }));
    expect(p.kept).toHaveLength(PUSH_DAILY_CAP);
    expect(ids(p.kept)).toEqual(expect.arrayContaining(['poop-0', 'poop-1', 'sleep', 'meal-breakfast']));
    expect(p.serverSkip.sort()).toEqual(['dinner', 'lunch']);
  });
  it('o que já saiu hoje CONTA: com 3 já enviados só cabe 1', () => {
    const led = { day: localDayKey(at(8)), fired: ['poop-0', 'hunger', 'energyFull'], pending: [], skipped: [] };
    const p = planDayPushes(base({ nowMs: at(8), ledger: led, state: { ...base().state, poopEventsScheduled: [at(9), at(18)], poopEventsShown: [0] } }));
    expect(ids(p.kept)).toEqual(['poop-1']); // 3 já foram + 1 = teto; refeições e lembrete saem
    expect(p.serverSkip.sort()).toEqual(['breakfast', 'dinner', 'lunch', 'sleep']);
  });
  it('capPushes: progresso nunca passa de 1 e committed nunca é cortado', () => {
    const r = capPushes([
      { id: 'a', kind: 'progress', at: 1 }, { id: 'b', kind: 'progress', at: 2 },
      { id: 'c', kind: 'meal', at: 3, committed: true },
    ], 4);
    expect(ids(r.kept).sort()).toEqual(['a', 'c']);
    expect(ids(r.dropped)).toEqual(['b']);
  });
});

describe('travas gerais', () => {
  it('D0, notificações desligadas → plano vazio', () => {
    const st = { ...base().state, poopEventsScheduled: [at(10)] };
    expect(planDayPushes(base({ ageDays: 0, state: st })).kept).toEqual([]);
    expect(planDayPushes(base({ enabled: false, state: st })).kept).toEqual([]);
  });
  it('o ledger vira o dia e promove o agendado que já passou', () => {
    const l = rollLedger({ day: localDayKey(at(8)), fired: [], pending: [{ id: 'hunger', at: at(9) }, { id: 'x', at: at(20) }], skipped: [] }, at(10));
    expect(l.fired).toEqual(['hunger']);
    expect(l.pending).toEqual([{ id: 'x', at: at(20) }]);
    expect(rollLedger(l, DAY + 26 * H).fired).toEqual([]); // dia seguinte
    const plan = planDayPushes(base({ state: { ...base().state, poopEventsScheduled: [at(18)] } }));
    expect(ledgerWithPlan(l, plan, at(8)).pending.map(p => p.id)).toContain('poop-0');
    expect(sanitizeLedger('lixo')).toBeUndefined();
    expect(sanitizeLedger({ day: 'x', fired: [1, 'a'], pending: [{ id: 'a', at: 'z' }] })).toEqual({ day: 'x', fired: ['a'], pending: [], skipped: [] });
  });
  it('localDayStart é a meia-noite local', () => {
    expect(localDayStart(at(15, 30))).toBe(DAY);
  });
});

describe('a copy dos pushes de evento: só convite, nunca culpa nem medo (REGISTRO linha "presença fora do app")', () => {
  // As listas do repo: petVoice.test / dayWake.test (PT e EN) + o veto de refeição.
  const PROIBIDAS_PT = ['deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu', 'finalmente', 'até que enfim',
    'preguiç', 'desculpa', 'culpa', 'perdeu', 'medo', 'cobr', 'pena', 'urgente'];
  const PROIBIDAS_EN = [/should/, /late/, /failed/, /failure/, /you forgot/, /finally/, /at last/, /lazy/, /excuse/, /guilt/,
    /lost/, /fear/, /afraid/, /penalt/, /punish/, /urgent/, /hurry/];
  const VETADO = /você perdeu|you missed|you lost|faltou|sentiu falta|miss(es|ed) you|esperand|waiting for you|sozinho|lonely|abandon|fome|hungry|starv|morrendo|dying|última chance|last chance|não perca|don'?t miss|corra|streak|sequência|dívida|debt|ainda não|you haven'?t|precisa|needs/i;
  const todas = () => ['en-US', 'pt-BR'].flatMap(l => [
    hungerInviteCopy('Bito', l), energyFullCopy('Bito', l), poopPushCopy('Bito', l, 1), progressCopy('Bito', l),
  ].map(c => ({ l, c })));
  it('passa nas listas de palavras proibidas (EN + PT) e no veto de culpa/necessidade', () => {
    for (const { l, c } of todas()) {
      const t = `${c.title} ${c.body}`.toLowerCase();
      if (l === 'pt-BR') for (const p of PROIBIDAS_PT) expect(t, `${l}: ${t}`).not.toContain(p);
      else for (const p of PROIBIDAS_EN) expect(t, `${l}: ${t}`).not.toMatch(p);
      expect(t).not.toMatch(VETADO);
    }
  });
  it('EN e PT diferentes, com o nome e sem número', () => {
    const l = todas();
    for (const { c } of l) {
      expect(c.title).toContain('Bito');
      expect(c.title + c.body).not.toMatch(/\d/);
      expect(c.tag.length).toBeGreaterThan(3);
    }
    expect(hungerInviteCopy('B', 'pt-BR').body).not.toBe(hungerInviteCopy('B', 'en-US').body);
  });
  it('a fome é CONVITE à pastinha — não cita fome, coração nem dreno', () => {
    for (const l of ['en-US', 'pt-BR']) {
      const c = hungerInviteCopy('Bito', l);
      expect(`${c.title} ${c.body}`).toMatch(/pastinha|pantry/i);
      expect(`${c.title} ${c.body}`).not.toMatch(/fome|hungry|coraç|heart|drain|dreno/i);
    }
  });
});
