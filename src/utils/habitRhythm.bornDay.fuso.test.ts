/**
 * QA r4 (item 9): `bornDay` (`habitRhythm.ts`) usava a meia-noite do APARELHO e `bornTodayIds` (`dayPlan.ts`) o dia do JOGADOR.
 * Com o aparelho num fuso e o dia do jogador ancorado em outro, os dois discordavam de QUAL dia o hábito nasceu: a linha era
 * "nascida hoje" para o plano e "não devida hoje" para a série "a cada N dias". Agora os dois usam a mesma âncora.
 * O fuso do aparelho é fixado por `process.env.TZ` (o Node relê a variável), então roda igual em qualquer máquina e no CI.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { habitCountsOn } from './habitRhythm';
import { bornTodayIds, dayPlanCandidates } from './dayPlan';
import { playerDayIso } from './playerDay';

const TZ_ORIGINAL = process.env.TZ;
afterAll(() => { if (TZ_ORIGINAL === undefined) delete process.env.TZ; else process.env.TZ = TZ_ORIGINAL; });

// Aparelho em São Paulo (UTC−3); dia do jogador ancorado em Los Angeles (UTC−8 em novembro).
const LA = { zone: 'America/Los_Angeles' };
// Nasce às 23:30 de 13/11 no aparelho (18:30 de 13/11 em LA); "agora" é 00:30 de 14/11 no aparelho (19:30 de 13/11 em LA).
const NASCEU = '2026-11-14T02:30:00.000Z';
const AGORA = new Date('2026-11-14T03:30:00.000Z');
const habito = { id: 'h', name: 'A cada 2 dias', schedule: { kind: 'everyNDays' as const, n: 2, from: 'schedule' as const }, createdAt: NASCEU };

describe('bornDay ancorado no dia do jogador (fuso do aparelho ≠ fuso do jogador)', () => {
  it('a premissa: aparelho já está em 14/11, o jogador ainda em 13/11, e o plano diz "nasceu hoje"', () => {
    process.env.TZ = 'America/Sao_Paulo';
    expect(AGORA.getDate()).toBe(14);
    const hoje = playerDayIso(AGORA, LA);
    expect(hoje).toBe('2026-11-13');
    expect(bornTodayIds([habito], hoje, LA).has('h')).toBe(true);
  });
  it('com a âncora, a série nasce no MESMO dia do plano: devido hoje, não amanhã, de novo depois de amanhã', () => {
    process.env.TZ = 'America/Sao_Paulo';
    expect(habitCountsOn(habito, undefined, AGORA, LA)).toBe(true);
    expect(habitCountsOn(habito, undefined, new Date(AGORA.getTime() + 24 * 3600_000), LA)).toBe(false);
    expect(habitCountsOn(habito, undefined, new Date(AGORA.getTime() + 48 * 3600_000), LA)).toBe(true);
  });
  it('o "Hoje" (dayPlanCandidates) oferece o hábito nascido hoje quando recebe a âncora', () => {
    process.env.TZ = 'America/Sao_Paulo';
    const st = { activities: [habito], tasks: [] };
    expect(dayPlanCandidates(st, AGORA, LA).map(c => c.id)).toEqual(['h']);
  });
  it('compatível: sem âncora (desktop, widget, saves sem fuso), o dia do aparelho, como antes', () => {
    process.env.TZ = 'America/Sao_Paulo';
    // aparelho: nasceu 13/11, hoje 14/11 → offset 1 → não devido (o comportamento antigo, intacto sem âncora)
    expect(habitCountsOn(habito, undefined, AGORA)).toBe(false);
    expect(habitCountsOn(habito, undefined, new Date('2026-11-14T02:45:00.000Z'))).toBe(true);
  });
});
