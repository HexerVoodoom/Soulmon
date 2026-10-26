/** QA 25/10/2026 (lane masmorra): descida de foco acompanha o timer, run da missão, faixa da Fenda 1×, Calabouço sem re-tentativa grátis. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameState } from '../contexts/GameStateContext';
import { startFocusDescent, pauseFocusDescent, resumeFocusDescent, isFocusDescent } from './focusDescent';
import { applyDungeonAway, applyRiftLayerPaid } from './dungeonAway';
import { sanitizeDungeonAway } from './dungeonIdle';
import { hasFocusKeyOrLegacy } from './focusKey';
import { sanitizeDungeonReturnSummary } from './dungeonReturnSummary';
import { dungeonReturnReason } from '../components/DungeonReturnModal';
import { playerDayKey, playerDayIso } from './playerDay';
import { isoWeekKey } from './offerMoment';
import { riftMonthKey } from './endlessRift';
import {
  consumePending, emptyRun, resolveStep, sanitizeRogueRun, startChallenge, cancelChallenge,
} from './rogueDungeon';

const T0 = Date.UTC(2026, 9, 25, 15, 0, 0);
const MIN = 60_000;
const estado = (over: Record<string, unknown> = {}): GameState => ({
  foodInventory: {}, gamePoints: 0, energyPoints: 8, totalXP: 5_000_000, evolutionStage: 'ultimate', ...over,
} as unknown as GameState);

const runsDaSemana = (s: GameState, now: number): number => {
  const sem = isoWeekKey(playerDayKey(new Date(now), s.playerDayTz));
  const w = s.weeklyMissions;
  return sem && w && w.week === sem ? (w.counts['dungeon-runs'] ?? 0) : 0;
};

describe('descida de foco acompanha pausar/continuar/cancelar', () => {
  it('pausar congela: nada rende depois do instante da pausa, e o fim do foco não a encerra', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    const paused = pauseFocusDescent(open, T0 + 5 * MIN);
    expect(paused.dungeonAway?.pausedAt).toBe(T0 + 5 * MIN);
    expect(sanitizeDungeonAway(paused.dungeonAway)?.pausedAt).toBe(T0 + 5 * MIN);
    const cedo = applyDungeonAway(paused, T0 + 5 * MIN);
    const tarde = applyDungeonAway(paused, T0 + 6 * 60 * MIN);
    expect(tarde.report!.ended).not.toBe('retired');
    expect(tarde.report!.layers).toBe(cedo.report!.layers);
    expect(tarde.report!.elapsedMs).toBeLessThanOrEqual(5 * MIN);
  });
  it('pausar de novo (ou sem descida de foco) devolve a mesma referência', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    const p = pauseFocusDescent(open, T0 + MIN);
    expect(pauseFocusDescent(p, T0 + 2 * MIN)).toBe(p);
    const semFoco = estado();
    expect(pauseFocusDescent(semFoco, T0)).toBe(semFoco);
    expect(resumeFocusDescent(open, T0 + MIN, T0 + 30 * MIN)).toBe(open);
  });
  it('continuar: o tempo parado não conta e o novo fim vale', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    const p = pauseFocusDescent(open, T0 + 5 * MIN);
    const r = resumeFocusDescent(p, T0 + 15 * MIN, T0 + 35 * MIN);
    expect(r.dungeonAway?.pausedAt).toBeUndefined();
    expect(r.dungeonAway?.since).toBe(T0 + 10 * MIN);
    expect(r.dungeonAway?.until).toBe(T0 + 35 * MIN);
    // 5 min jogados antes da pausa == 5 min contados agora (15 min no relógio - 10 de pausa)
    const direto = applyDungeonAway(p, T0 + 5 * MIN).report!;
    const depois = applyDungeonAway(r, T0 + 15 * MIN).report!;
    expect(depois.layers).toBe(direto.layers);
    expect(depois.bits).toBe(direto.bits);
  });
  it('cancelar = retirar: o Soulmon fica livre (e só a descida de foco é "de foco")', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    expect(isFocusDescent(open)).toBe(true);
    const cancel = applyDungeonAway(open, T0 + 3 * MIN, { retire: true });
    expect(cancel.next.dungeonAway).toBeUndefined();
    expect(cancel.report?.ended).toBe('retired');
    expect(isFocusDescent(estado())).toBe(false);
  });
});

describe('missão dungeon-runs: 1 camada vale a run; 0 camadas não', () => {
  it('descida de foco que acaba pelo timer, com ao menos 1 camada, conta UMA run', () => {
    // energia farta: o que encerra a descida é SÓ o timer (o caso da ordem focusOver/contagem)
    const open = startFocusDescent(estado({ energyPoints: 500 }), T0, 7, T0 + 25 * MIN);
    const r = applyDungeonAway(open, T0 + 25 * MIN);
    expect(r.report!.ended).toBe('retired');
    expect(r.report!.layers).toBeGreaterThan(0);
    expect(runsDaSemana(r.next, T0 + 25 * MIN)).toBe(1);
  });
  it('acertos parciais com 0 camadas não contam', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    const r = applyDungeonAway(open, T0 + 1_000, { retire: true });
    expect(r.report!.layers).toBe(0);
    expect(runsDaSemana(r.next, T0 + 1_000)).toBe(0);
  });
});

describe('faixa 2 da Fenda (+100 Bits): paga 1x só, dentro do estado, respeitando o teto', () => {
  it('a mesma camada duas vezes sobre o estado novo não repaga', () => {
    const dia = playerDayKey(new Date(T0), undefined);
    // progresso NOVO do mês: descida começou na camada 1 (base 1); sem base, 1 camada no mês zerado não cruza faixa (R3)
    const novo = estado({ riftMonth: { m: riftMonthKey(T0), best: 1, claimed: 0, base: 1 } }) as GameState & { riftMonth?: undefined };
    const a = applyRiftLayerPaid(novo, 100, T0, dia);
    expect(a.bits).toBe(100);
    expect(a.fragments).toBe(20); // a faixa 1 cruza junto (camada 100 passa da 25)
    const b = applyRiftLayerPaid(a.next, 100, T0, dia);
    expect(b.bits).toBe(0);
    expect(b.next.gamePoints).toBe(a.next.gamePoints);
  });
  it('com o teto diário cheio, não paga Bits', () => {
    const dia = playerDayKey(new Date(T0), undefined);
    const cheio = estado({ minigameBits: { day: dia, earned: 150 } });
    expect(applyRiftLayerPaid(cheio as GameState & { riftMonth?: undefined }, 100, T0, dia).bits).toBe(0);
  });
});

describe('resumo da volta persistido e motivo correto', () => {
  it('leitura tolerante: lixo some, save antigo (sem o campo) segue', () => {
    expect(sanitizeDungeonReturnSummary(undefined)).toBeUndefined();
    expect(sanitizeDungeonReturnSummary('x')).toBeUndefined();
    expect(sanitizeDungeonReturnSummary({ layers: 3, bits: 10, fragments: 0, hearts: 1, glitchtama: 0, ended: 'retired' }))
      .toEqual({ layers: 3, bits: 10, fragments: 0, hearts: 1, glitchtama: 0, ended: 'retired' });
    expect(sanitizeDungeonReturnSummary({ layers: -4, bits: NaN })?.layers).toBe(0);
  });
  it('cada fim tem a sua frase, EN e PT, e "retired" não diz que a energia acabou', () => {
    for (const e of ['hp', 'energy', 'daily', 'sealed', 'deep', 'retired', null]) {
      expect(dungeonReturnReason(e, true).length).toBeGreaterThan(5);
      expect(dungeonReturnReason(e, false).length).toBeGreaterThan(5);
    }
    expect(dungeonReturnReason('retired', false)).not.toMatch(/energy/i);
    expect(dungeonReturnReason('retired', true)).not.toMatch(/energia/i);
    expect(dungeonReturnReason('deep', false)).not.toBe(dungeonReturnReason('energy', false));
    expect(dungeonReturnReason('sealed', true)).not.toBe(dungeonReturnReason('hp', true));
  });
});

describe('chave do foco: compat com sessão pronta pré-beta3', () => {
  it('sessão ready de hoje vale a chave; de outro dia, ou completed, não', () => {
    const s = estado();
    const hoje = playerDayIso(new Date(T0), undefined);
    expect(hasFocusKeyOrLegacy(s, T0, { status: 'ready', day: hoje })).toBe(true);
    expect(hasFocusKeyOrLegacy(s, T0, { status: 'ready', day: '2026-01-01' })).toBe(false);
    expect(hasFocusKeyOrLegacy(s, T0, { status: 'completed', day: hoje })).toBe(false);
    expect(hasFocusKeyOrLegacy(s, T0, null)).toBe(false);
  });
});

describe('Calabouço: o desafio em curso consome o passo ao sair', () => {
  const D = '2026-10-25';
  it('entrar grava pending; sair sem terminar gasta o passo (sem re-tentativa grátis)', () => {
    const em = startChallenge(emptyRun(D), 'puzzle');
    expect(em.pending).toBe('puzzle');
    const volta = consumePending(em);
    expect(volta.pending).toBeUndefined();
    expect(volta.step).toBe(1);
    expect(volta.won).toBe(0);
    expect(volta.bonusPending).toBe(false);
    expect(consumePending(volta)).toBe(volta);
  });
  it('terminar o desafio limpa o pending; combate nunca grava pending; falha de carga não gasta', () => {
    const em = startChallenge(emptyRun(D), 'minigame');
    const ganho = resolveStep(em, 'minigame', true);
    expect(ganho.pending).toBeUndefined();
    expect(ganho.won).toBe(1);
    expect(startChallenge(emptyRun(D), 'combat').pending).toBeUndefined();
    const c = cancelChallenge(em);
    expect(c.pending).toBeUndefined();
    expect(c.step).toBe(0);
  });
  it('save: pending sobrevive à higienização; lixo e "combat" somem; save antigo não tem', () => {
    const em = startChallenge(emptyRun(D), 'explore');
    expect(sanitizeRogueRun(JSON.parse(JSON.stringify(em)))?.pending).toBe('explore');
    expect(sanitizeRogueRun({ ...em, pending: 'combat' })?.pending).toBeUndefined();
    expect(sanitizeRogueRun({ ...em, pending: 5 })?.pending).toBeUndefined();
    expect(sanitizeRogueRun(emptyRun(D))).not.toHaveProperty('pending');
  });
  it('o bônus do Calabouço (multiplicador próprio, exceção do dono) só é lido em simulateRogueCombat', () => {
    const src = readFileSync('src/utils/rogueDungeon.ts', 'utf-8');
    const corpo = src.slice(src.indexOf('export function simulateRogueCombat'));
    const antes = src.slice(0, src.indexOf('export function simulateRogueCombat'));
    // antes da função só as DECLARAÇÕES das constantes; nenhum uso
    const usosAntes = antes.split('\n').filter(l => /POWER_STEP|VIGOR_STEP|HEAL_SHIELD/.test(l) && !/^export const/.test(l.trim()) && !/^\s*(\/\/|\*|\/\*)/.test(l));
    expect(usosAntes).toEqual([]);
    expect(corpo).toMatch(/POWER_STEP/);
    for (const f of ['src/utils/combate/curve.ts', 'src/utils/dungeonFight.ts', 'src/utils/soulXP.ts', 'src/utils/dungeonAway.ts']) {
      expect(readFileSync(f, 'utf-8')).not.toMatch(/POWER_STEP|VIGOR_STEP|HEAL_SHIELD/);
    }
  });
});
