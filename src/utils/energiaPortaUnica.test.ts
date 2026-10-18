/**
 * A PORTA ÚNICA da energia (beta-2 3.4/3.5, REGISTRO §40): todo caminho que gasta ou ganha energia fora da regeneração passa por
 * `setEnergy` (acerta a regeneração até agora e reposiciona o relógio) — assim o relógio nunca conta em dobro nem se perde. Aqui:
 * cada caminho conhecido, mais um GUARD de fonte que reprova escrita direta de `energyPoints` fora dos donos.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { computeDailyReset } from './dailyReset';
import { applyLevelUpCelebrated } from './levelUp';
import { play } from './petNeeds';
import { settleEnergy, energyStatus, UNIT_POINTS, ENERGY_REGEN_MINUTES, type HungerState } from './hunger';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = new Date(2026, 9, 13, 10, 0, 0).getTime();

/** Um save veterano mínimo para a virada (como o `baseState` de `useDailyReset.test.ts`). */
const baseReset = {
  activities: [], tasks: [], completedTasks: [], healthPoints: 3, maxHealthPoints: 3, perfectDays: 0, totalPerfectDays: 0, evolutionPoints: 0, totalXP: 0,
  powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'harmony' as const,
  maxActivityCap: 6, lastDayReport: { date: new Date(2026, 9, 11).toDateString(), saveDay: 90 }, restDaysLeft: 0,
};

describe('virada do dia: NÃO zera a energia (B7, 18/10/2026), nem o relógio, nem a fome', () => {
  it('computeDailyReset MANTÉM energyPoints, o progresso até a próxima unidade e a fome', () => {
    const ontem = new Date(2026, 9, 12, 12, 0, 0);
    const hoje = new Date(2026, 9, 13, 8, 0, 0);
    const prev: Record<string, unknown> = {
      ...baseReset, lastResetDate: ontem.toDateString(),
      energyPoints: 5,
      hunger: { v: 70, at: ontem.getTime() },
      // 30 min de progresso já contados pelo relógio, parados em `at`
      energyClock: { at: ontem.getTime(), carry: UNIT_POINTS / 4 },
    };
    const next = computeDailyReset(prev, { now: hoje }) as Record<string, any>;
    expect(next.energyPoints).toBe(5);
    expect(next.hunger).toEqual(prev.hunger); // a fome NÃO é diária
    // o progresso (carry) passou intacto ou maior: nunca zerou — o timer não reinicia na virada
    expect(next.energyClock.carry).toBeGreaterThanOrEqual((prev.energyClock as { carry: number }).carry);
    expect(next.energyClock.at).toBe((prev.energyClock as { at: number }).at); // o relógio não é tocado
  });
  it('a energia que a pessoa tinha ATRAVESSA a virada', () => {
    const hoje = new Date(2026, 9, 13, 8, 0, 0);
    const prev: Record<string, unknown> = {
      ...baseReset, lastResetDate: new Date(2026, 9, 12).toDateString(),
      energyPoints: 7,
      hunger: { v: 100, at: hoje.getTime() - HOUR }, energyClock: { at: hoje.getTime() - HOUR, carry: 0 },
    };
    const next = computeDailyReset(prev, { now: hoje }) as unknown as HungerState;
    expect(next.energyPoints).toBe(7);
  });
});

describe('Level Up enche pela porta única e deixa o relógio parado', () => {
  it('enche até o máximo do estágio, nunca acima, e a energia cheia tem o timer parado', () => {
    const s = applyLevelUpCelebrated(
      { lastCelebratedLevel: 3, energyPoints: 1, evolutionStage: 'rookie', hunger: { v: 100, at: T0 }, energyClock: { at: T0, carry: 123 } },
      4, T0 + 5 * MIN,
    );
    expect(s.energyPoints).toBe(8);
    expect(energyStatus(s, T0 + 6 * HOUR).mode).toBe('full');
    expect(s.energyClock).toEqual({ at: T0 + 5 * MIN, carry: 0 });
  });
  it('idempotente: a 2ª celebração do mesmo nível devolve a MESMA referência', () => {
    const a = applyLevelUpCelebrated({ lastCelebratedLevel: 3, energyPoints: 1, evolutionStage: 'rookie' }, 4, T0);
    expect(applyLevelUpCelebrated(a, 4, T0 + 1)).toBe(a);
  });
});

describe('brincar gasta pela porta única', () => {
  it('o gasto usa a energia de AGORA (a regeneração já ganha paga) e não reinicia o progresso', () => {
    const base = {
      energyPoints: 0, foodInventory: {}, evolutionStage: 'rookie', hunger: { v: 100, at: T0 }, energyClock: { at: T0, carry: 0 },
    };
    const agora = new Date(T0 + ENERGY_REGEN_MINUTES * MIN + 10 * MIN);
    const r = play(base, '2026-10-13', agora);
    expect(r.refused).toBeUndefined(); // 0 no save, mas 1 unidade já regenerada
    expect(r.state.energyPoints).toBe(0);
    // os 10 min a mais de progresso seguem no relógio
    expect(energyStatus(r.state, agora.getTime()).msToNext).toBeLessThan(ENERGY_REGEN_MINUTES * MIN);
    // sem a regeneração, recusa
    const cedo = play(base, '2026-10-13', new Date(T0 + 30 * MIN));
    expect(cedo.refused).toBe('no-energy');
  });
});

describe('GUARD de fonte: ninguém escreve energyPoints de gasto/ganho fora dos donos', () => {
  const SRC = resolve(__dirname, '..');
  const ok = new Set(['utils/hunger.ts']); // o dono
  const lista = (d: string): string[] => readdirSync(d).flatMap(n => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) return n === 'node_modules' ? [] : lista(p);
    return /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
  it('nenhum módulo soma/subtrai energyPoints à mão (`energyPoints: ... + n`/`- n`) — usa `setEnergy`/`eat`', () => {
    const suspeitos: string[] = [];
    for (const f of lista(SRC)) {
      const rel = relative(SRC, f).replace(/\\/g, '/');
      if (ok.has(rel)) continue;
      const src = readFileSync(f, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of src.matchAll(/energyPoints:\s*[^,}\n]*[+\-]\s*\w/g)) {
        // `energyPoints: Math.max(0, x)`/`min` sem soma ao próprio campo é cópia/clamp; o que se procura é aritmética sobre o valor
        if (/energyPoints\s*[?]{0,2}\s*[+\-]|[+\-]\s*(DUNGEON|PLAY|PREMIUM|rewards)/.test(m[0]) || /energyPoints:\s*[^,}\n]*\(?\w*\.?energyPoints[^,}\n]*[+\-]/.test(m[0])) suspeitos.push(`${rel}: ${m[0].trim()}`);
      }
    }
    expect(suspeitos).toEqual([]);
  });
});
