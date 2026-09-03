// @vitest-environment jsdom
/**
 * WP5.5 — "Agora não" com peso de primário (dossiê Mobbin, Character AI).
 *
 * A oferta tinha duas saídas: comprar ou o X no canto. Uma recusa que só
 * existe como fuga é uma oferta que encurrala — e o app não encurrala. O botão
 * declarado tem a MESMA largura do primário, fica logo abaixo dele, fecha o
 * modal e emite `unlock_dismiss` com o mesmo `reason` do `unlock_view`: é o
 * que torna "recusas ÷ visualizações, por convite" um número calculável.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { UnlockAccountModal } from './UnlockAccountModal';
import { pendingTelemetry, resetTelemetryForTest, TELEMETRY_UNLOCK_REASON } from '../utils/telemetry';

const only = (event: string) => pendingTelemetry().filter(r => r.e === event);

describe('UnlockAccountModal — "Agora não" (WP5.5)', () => {
  beforeEach(() => resetTelemetryForTest());

  it('os TRÊS botões existem, nesta ordem: desbloquear, agora não, restaurar', () => {
    renderWithCss(
      <UnlockAccountModal language="pt-BR" reason="task-limit" onUnlocked={() => {}} onClose={() => {}} />,
    );
    const labels = screen.getAllByRole('button').map(b => b.textContent?.trim() ?? '');
    const iUnlock = labels.findIndex(l => l.startsWith('Desbloquear'));
    const iNow = labels.indexOf('Agora não');
    const iRestore = labels.findIndex(l => l.startsWith('Já comprei'));
    expect(iUnlock).toBeGreaterThanOrEqual(0);
    expect(iNow).toBeGreaterThan(iUnlock);
    expect(iRestore).toBeGreaterThan(iNow);
  });

  it('"Agora não" tem a mesma largura do primário (100%) — peso de primário, não de fuga', () => {
    renderWithCss(
      <UnlockAccountModal language="en-US" reason="evolution" onUnlocked={() => {}} onClose={() => {}} />,
    );
    const unlock = screen.getByText(/^Unlock/).closest('button')!;
    const notNow = screen.getByText('Not now').closest('button')!;
    expect(notNow.style.width).toBe('100%');
    expect(notNow.style.width).toBe(unlock.style.width);
  });

  it('tocar em "Agora não" fecha o modal e emite unlock_dismiss UMA vez, com o motivo', () => {
    let closed = 0;
    renderWithCss(
      <UnlockAccountModal language="pt-BR" reason="evolution" onUnlocked={() => {}} onClose={() => { closed++; }} />,
    );
    fireEvent.click(screen.getByText('Agora não'));
    expect(closed).toBe(1);
    expect(only('unlock_dismiss').map(r => r.p?.reason)).toEqual([TELEMETRY_UNLOCK_REASON.evolution]);
    // E continua sem emitir unlock_view (quem emite é o App).
    expect(only('unlock_view')).toHaveLength(0);
  });

  it('o motivo task-limit também sai certo', () => {
    renderWithCss(
      <UnlockAccountModal language="en-US" reason="task-limit" onUnlocked={() => {}} onClose={() => {}} />,
    );
    fireEvent.click(screen.getByText('Not now'));
    expect(only('unlock_dismiss').map(r => r.p?.reason)).toEqual([TELEMETRY_UNLOCK_REASON.taskLimit]);
  });
});
