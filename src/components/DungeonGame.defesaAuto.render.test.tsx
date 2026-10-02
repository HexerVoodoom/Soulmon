// @vitest-environment jsdom
/**
 * MASMORRA — o Soulmon se defende SOZINHO (TORC-3, dono, 02/10/2026): a esquiva
 * por `TimingBar` saiu (`TIMING_DODGE_ENABLED = false`), o dono só torce. A
 * regra mora em `utils/autoDefesa.ts`; aqui se trava o lado da TELA.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';

afterEach(() => { cleanup(); vi.useRealTimers(); });

function montar() {
  return renderWithCss(
    <DungeonGame
      evolutionStage="rookie"
      language="pt-BR"
      onEnter={() => ({ ok: true, level: 1, best: 0 })}
      onLose={() => {}}
      onHeartDrop={() => false}
      onGlitchtama={() => {}}
      onEnemyDefeated={() => {}}
      onEarnPoints={() => {}}
      onExit={() => {}}
    />,
  );
}

describe('Masmorra — defesa automática', () => {
  it('sem barra de esquiva: o revide se resolve sozinho e a vez volta para o golpe do Soulmon', () => {
    vi.useFakeTimers();
    const { container } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Descer' }));
    act(() => { vi.advanceTimersByTime(1400); }); // o golpe sai sozinho
    act(() => { vi.advanceTimersByTime(1500); }); // o popup passa e abre a defesa
    expect(container.querySelector('[data-timing-bar]')).toBeNull();
    expect(container.querySelector('[data-auto-defense]')).not.toBeNull();
    expect(screen.queryByText('Desviar!')).toBeNull();
    act(() => { vi.advanceTimersByTime(1000); }); // a defesa automática resolve
    expect(screen.getByText(/Defendeu|Levou o golpe/)).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1500); });
    expect(container.querySelector('[data-auto-defense]')).toBeNull();
    expect(screen.getByText(/torça por ele/i)).toBeTruthy();
  });
});
