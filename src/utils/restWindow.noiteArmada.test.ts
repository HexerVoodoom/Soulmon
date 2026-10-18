import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createRestState, recordNight, isInArmPeriod, decideArmedNight, shouldWakeOnOpen, nightWakeAt,
  nightEnergyGain, stampNightBonus, NIGHT_ENERGY_BONUS, SLEEP_REMINDER_LEAD_MIN,
  type RestWindow,
} from './restWindow';
import { hasPendingNightmare, createNightmareState } from './nightmares';
import { getMaxEnergyForStage } from '../types/progression';
import { REST_WINDOW_GRACE_MIN } from '../types/taskModel';

const W: RestWindow = { start: '23:00', end: '07:00' };
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m, 20);

afterEach(() => vi.useRealTimers());

describe('D-23 — a noite armada pelo lembrete', () => {
  it('o período do lembrete cobre o lembrete e termina no início da janela', () => {
    expect(REST_WINDOW_GRACE_MIN).toBeGreaterThanOrEqual(SLEEP_REMINDER_LEAD_MIN);
    expect(isInArmPeriod(W, at(10, 22, 30))).toBe(true);
    expect(isInArmPeriod(W, at(10, 22, 15))).toBe(true);
    expect(isInArmPeriod(W, at(10, 21, 0))).toBe(false);
    expect(isInArmPeriod(W, at(10, 23, 0))).toBe(false); // dentro da janela o sono automático já age
    expect(isInArmPeriod(W, at(10, 23, 30))).toBe(false);
  });

  it('antes do fim da janela espera; depois do fim manda gravar com o início nominal (onTime)', () => {
    const rest = createRestState(W);
    const armed = at(10, 22, 30).toISOString();
    expect(decideArmedNight(rest, armed, at(10, 23, 30)).kind).toBe('none');
    expect(decideArmedNight(rest, armed, at(11, 6, 0)).kind).toBe('none');
    const d = decideArmedNight(rest, armed, at(11, 7, 30));
    expect(d.kind).toBe('record');
    if (d.kind !== 'record') return;
    expect(d.sleptAt.getHours()).toBe(23);
    expect(d.sleptAt.getMinutes()).toBe(0);
    expect(d.wokeAt.getHours()).toBe(7);
    expect(recordNight(rest, d.sleptAt, d.wokeAt).nights[0].onTime).toBe(true);
  });

  it('idempotente: noite já registrada (real) nunca é sobrescrita; marca velha ou inválida só é limpa', () => {
    let rest = createRestState(W);
    const armed = at(10, 22, 30).toISOString();
    rest = recordNight(rest, at(10, 23, 50), at(11, 7, 10)); // registro real (onTime pela tolerância)
    expect(decideArmedNight(rest, armed, at(11, 8, 0)).kind).toBe('clear');
    expect(decideArmedNight(createRestState(W), 'lixo', at(11, 8, 0)).kind).toBe('clear');
    expect(decideArmedNight(createRestState(W), armed, at(14, 8, 0)).kind).toBe('clear'); // 3 dias depois
    expect(decideArmedNight(createRestState(W), null, at(11, 8, 0)).kind).toBe('none');
    // marca feita DENTRO da janela (não no período do lembrete) não vale
    expect(decideArmedNight(createRestState(W), at(11, 1, 0).toISOString(), at(11, 9, 0)).kind).toBe('clear');
  });

  it('CENÁRIO COMPLETO com relógio falso: abre pela notificação às 22:30, fecha, abre às 7:30 → noite gravada → pesadelo pendente', () => {
    vi.useFakeTimers();
    let rest = createRestState(W);
    // 22:30 — o lembrete dispara, o app abre fora da janela (auto-sleep não age) e ARMA a noite
    vi.setSystemTime(at(10, 22, 30));
    expect(isInArmPeriod(rest.window, new Date())).toBe(true);
    const armed = new Date().toISOString();
    // o app é fechado; nenhuma noite foi gravada
    expect(rest.nights).toHaveLength(0);
    // 07:30 — abre de manhã
    vi.setSystemTime(at(11, 7, 30));
    const now = new Date();
    expect(hasPendingNightmare(createNightmareState(), rest, now)).toBe(false); // o bug de antes
    const d = decideArmedNight(rest, armed, now);
    expect(d.kind).toBe('record');
    if (d.kind === 'record') rest = recordNight(rest, d.sleptAt, d.wokeAt);
    expect(hasPendingNightmare(createNightmareState(), rest, now)).toBe(true);
    // segunda chamada na mesma manhã: não duplica
    expect(decideArmedNight(rest, armed, now).kind).toBe('clear');
    expect(rest.nights).toHaveLength(1);
  });
});

describe('D-23 hipótese 2 — pet dormindo salvo, app aberto fora da janela', () => {
  it('acorda se o sono começou na janela; sesta manual fora dela não é desfeita', () => {
    const noite = at(10, 23, 10).toISOString();
    expect(shouldWakeOnOpen(W, noite, at(11, 9, 0))).toBe(true);
    expect(shouldWakeOnOpen(W, noite, at(11, 3, 0))).toBe(false); // ainda dentro da janela
    expect(shouldWakeOnOpen(W, at(10, 15, 0).toISOString(), at(10, 16, 0))).toBe(false); // sesta
    expect(shouldWakeOnOpen(W, null, at(11, 9, 0))).toBe(false);
  });

  it('o despertar gravado nunca passa do fim da janela', () => {
    const dormiu = at(10, 23, 10);
    expect(nightWakeAt(W, dormiu, at(11, 15, 0)).getHours()).toBe(7);
    expect(nightWakeAt(W, dormiu, at(11, 2, 0)).getHours()).toBe(2);
  });
});

describe('D-37 — bônus de energia da manhã', () => {
  const maxE = getMaxEnergyForStage('rookie');
  const comNoite = () => recordNight(createRestState(W), at(10, 23, 5), at(11, 7, 0));
  const manha = at(11, 8, 0);

  it('noite onTime de hoje paga NIGHT_ENERGY_BONUS, 1x por dia', () => {
    const rest = comNoite();
    expect(nightEnergyGain(rest, manha, 0, maxE)).toBe(NIGHT_ENERGY_BONUS);
    const pago = stampNightBonus(rest, manha);
    expect(nightEnergyGain(pago, at(11, 20, 0), 0, maxE)).toBe(0);
    expect(nightEnergyGain(pago, at(12, 8, 0), 0, maxE)).toBe(0); // sem noite nova, nada
  });

  it('nunca passa do teto do estágio', () => {
    expect(nightEnergyGain(comNoite(), manha, maxE, maxE)).toBe(0);
    expect(nightEnergyGain(comNoite(), manha, maxE - 1, maxE)).toBe(1);
  });

  it('sem noite, noite fora do horário ou noite de outra manhã: zero — e nunca negativo', () => {
    expect(nightEnergyGain(createRestState(W), manha, 0, maxE)).toBe(0);
    expect(nightEnergyGain(undefined, manha, 0, maxE)).toBe(0);
    const tarde = recordNight(createRestState(W), at(11, 15, 0), at(11, 16, 0)); // deitou às 15h, fora da janela
    expect(tarde.nights[0].onTime).toBe(false);
    expect(nightEnergyGain(tarde, manha, 0, maxE)).toBe(0);
    expect(nightEnergyGain(comNoite(), at(13, 8, 0), 0, maxE)).toBe(0);
    expect(nightEnergyGain(comNoite(), manha, NaN, maxE)).toBeGreaterThanOrEqual(0);
  });
});

import { armMark, parseArmedMark, reconcileSleepHours } from './restWindow';
import { hydrateRest } from '../contexts/GameStateContext';

describe('gate do skeptic — correções', () => {
  it('1) chave local ausente semeia a partir do save e NÃO sobrescreve o horário confirmado', () => {
    const salvo = { start: '22:00', end: '06:30' };
    expect(reconcileSleepHours(null, null, salvo)).toEqual({ window: salvo, seed: true });
    expect(reconcileSleepHours('22:00', undefined, salvo).seed).toBe(true);
    expect(reconcileSleepHours('lixo', '06:30', salvo).seed).toBe(true);
    expect(reconcileSleepHours('21:00', '05:00', salvo)).toEqual({ window: { start: '21:00', end: '05:00' }, seed: false });
  });

  it('2) editar a janela entre armar e gravar não perde nem fabrica noite; marca ISO antiga ainda vale', () => {
    const armed = armMark(at(10, 22, 30), W);
    expect(parseArmedMark(armed)?.window).toEqual(W);
    // janela editada depois para 01:00-09:00: a marca manda
    const editada = createRestState({ start: '01:00', end: '09:00' });
    const d = decideArmedNight(editada, armed, at(11, 7, 30));
    expect(d.kind).toBe('record');
    if (d.kind !== 'record') return;
    expect(d.window).toEqual(W);
    expect(recordNight({ ...editada, window: d.window }, d.sleptAt, d.wokeAt).nights[0].onTime).toBe(true);
    // marca feita no período do lembrete da janela ANTIGA não vira noite fabricada na nova ao armar em outro horário
    const fora = armMark(at(10, 12, 0), W);
    expect(decideArmedNight(createRestState(W), fora, at(11, 8, 0)).kind).toBe('clear');
    // formato antigo (só ISO) usa a janela do estado
    expect(decideArmedNight(createRestState(W), at(10, 22, 30).toISOString(), at(11, 7, 30)).kind).toBe('record');
    expect(parseArmedMark('{quebrado')).toBeNull();
  });

  it('3) deitar depois da meia-noite (sem wokeAt) não paga o bônus na hora; com wokeAt ou já fora da janela paga', () => {
    const maxE = getMaxEnergyForStage('rookie');
    const rest = recordNight(createRestState(W), at(11, 1, 0)); // sem wokeAt
    expect(rest.nights[0].onTime).toBe(true);
    expect(nightEnergyGain(rest, at(11, 1, 5), 0, maxE)).toBe(0);
    expect(nightEnergyGain(rest, at(11, 3, 0), 0, maxE)).toBe(0);
    expect(nightEnergyGain(rest, at(11, 7, 30), 0, maxE)).toBe(NIGHT_ENERGY_BONUS);
    expect(nightEnergyGain(recordNight(createRestState(W), at(11, 1, 0), at(11, 7, 0)), at(11, 7, 5), 0, maxE)).toBe(NIGHT_ENERGY_BONUS);
  });

  it('4) hidratação preserva windowConfirmed:true e nightBonusDay; save antigo vira false', () => {
    const r = hydrateRest({ window: W, nights: [], dreams: [], windowConfirmed: true, nightBonusDay: 'Sun Oct 11 2026' });
    expect(r.windowConfirmed).toBe(true);
    expect(r.nightBonusDay).toBe('Sun Oct 11 2026');
    expect(hydrateRest({ window: W, nights: [], dreams: [] }).windowConfirmed).toBe(false);
    expect(hydrateRest({ window: W, windowConfirmed: 'sim' }).windowConfirmed).toBe(false);
  });
});
