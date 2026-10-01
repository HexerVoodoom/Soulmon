// @vitest-environment jsdom
/**
 * WP2.3 — o botão do check-in é um COMPROMISSO, não um "continuar".
 *
 * Transcrição A2 (guia-experiencia/08): o Duolingo trocou "Continue" por
 * "Commit To My Goal" e mediu dezenas de milhares de DAU só na palavra. Aqui
 * o texto assume a meta quando HÁ meta (`plannedEffort > 0`) e volta ao neutro
 * quando não há o que assumir — prometer "minha meta" com meta zero é copy
 * que mente.
 *
 * O evento `checkin_commit` sai do `App.tsx` (dono de `handleCheckInConfirm`),
 * não daqui: o componente é mudo por desenho, e o teste abaixo trava os dois
 * lados — o texto no componente e a fiação no App, por leitura da fonte, do
 * mesmo jeito que `playerDay.contract.test.ts` trava fiação.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { MorningCheckIn, type CheckInPlanShape } from './MorningCheckIn';
import { pendingTelemetry, resetTelemetryForTest } from '../utils/telemetry';

const plan = (plannedEffort: number): CheckInPlanShape => ({
  habitsToday: [],
  suggestedFocus: plannedEffort > 0 ? [{ id: 't1', name: 'Tarefa', effort: plannedEffort }] : [],
  carryOver: [],
  plannedEffort,
  overcommitted: false,
});

describe('MorningCheckIn — botão de compromisso (WP2.3)', () => {
  // C9 (01/10/2026): o dono trocou "Commit to today's goal" por "Set" / "Definir".
  it('com meta cadastrada, o primário é "Definir" / "Set" (PT e EN)', () => {
    const r = renderWithCss(<MorningCheckIn open plan={plan(2)} language="pt-BR" onConfirm={() => {}} onSkip={() => {}} />);
    expect(screen.getByText('Definir')).toBeTruthy();
    r.unmount();
    renderWithCss(<MorningCheckIn open plan={plan(2)} language="en-US" onConfirm={() => {}} onSkip={() => {}} />);
    expect(screen.getByText('Set')).toBeTruthy();
  });

  it('sem meta (plannedEffort 0), o texto volta ao neutro — não há o que assumir', () => {
    const r = renderWithCss(<MorningCheckIn open plan={plan(0)} language="pt-BR" onConfirm={() => {}} onSkip={() => {}} />);
    expect(screen.getByText('Começar o dia')).toBeTruthy();
    expect(screen.queryByText('Definir')).toBeNull();
    r.unmount();
    renderWithCss(<MorningCheckIn open plan={plan(0)} language="en-US" onConfirm={() => {}} onSkip={() => {}} />);
    expect(screen.getByText('Start the day')).toBeTruthy();
  });

  it('o secundário de pular continua, e o componente em si não emite evento nenhum', () => {
    resetTelemetryForTest();
    let confirmed: string[] | null = null;
    let skipped = 0;
    renderWithCss(
      <MorningCheckIn open plan={plan(1)} language="pt-BR" onConfirm={ids => { confirmed = ids; }} onSkip={() => { skipped++; }} />,
    );
    fireEvent.click(screen.getByText('Hoje não, obrigado'));
    expect(skipped).toBe(1);
    fireEvent.click(screen.getByText('Definir'));
    expect(confirmed).toEqual(['t1']); // o foco sugerido já vem marcado
    // Quem emite é o App — aqui a fila fica vazia nos dois cliques.
    expect(pendingTelemetry().filter(r => r.e === 'checkin_commit')).toHaveLength(0);
  });

  it('fiação: `checkin_commit` sai de handleCheckInConfirm e NUNCA de handleCheckInSkip', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    const confirmStart = src.indexOf('const handleCheckInConfirm = useCallback');
    const skipStart = src.indexOf('const handleCheckInSkip = useCallback');
    expect(confirmStart).toBeGreaterThan(0);
    expect(skipStart).toBeGreaterThan(confirmStart);
    const confirmBody = src.slice(confirmStart, skipStart);
    const skipBody = src.slice(skipStart, src.indexOf('}, [', skipStart));
    expect(confirmBody).toMatch(/track\('checkin_commit'/);
    expect(skipBody).not.toMatch(/checkin_commit/);
    // Fora do updater (footgun 6): o `track` não pode estar entre `setGameState(prev =>` e o `));` dele.
    const updater = confirmBody.slice(confirmBody.indexOf('setGameState(prev =>'), confirmBody.indexOf('));') + 3);
    expect(updater).not.toMatch(/track\(/);
  });
});
