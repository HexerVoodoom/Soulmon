// @vitest-environment jsdom
/**
 * Regressão (QA, 31/10/2026): toque duplo rápido no "Usar" gastava 2 itens.
 * Contrato: dois toques dentro de `USAR_TRAVA_MS` (400 ms) chamam `onUse` UMA
 * vez; um toque depois da janela chama de novo (uso espaçado segue normal).
 * O relógio é o `Date.now` espiado — a trava lê só ele.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila, USAR_TRAVA_MS } from './Mochila';

afterEach(() => { vi.restoreAllMocks(); });

function montar() {
  const onUse = vi.fn();
  const ref = createRef<HTMLElement>() as { current: HTMLElement | null };
  ref.current = document.createElement('div');
  renderWithCss(
    <Mochila
      open
      onClose={() => {}}
      foodInventory={{ '👊': 3 }}
      language="pt-BR"
      onUse={onUse}
      petTargetRef={ref}
      onTargetChange={() => {}}
      petName="Bito"
    />,
  );
  return { onUse };
}

describe('Mochila — trava do botão "Usar"', () => {
  it('2 toques em menos de 400 ms usam 1 item; um toque depois de 400 ms usa o 2º', () => {
    let agora = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => agora);
    const { onUse } = montar();
    act(() => { screen.getByRole('button', { name: 'Chip de Poder × 3' }).focus(); });
    const usar = screen.getByRole('button', { name: 'Usar Chip de Poder' });

    fireEvent.click(usar);
    agora += USAR_TRAVA_MS - 1; // 399 ms depois: toque duplo
    fireEvent.click(usar);
    expect(onUse).toHaveBeenCalledTimes(1);

    agora += 1; // 400 ms desde o 1º uso: janela fechou
    fireEvent.click(usar);
    expect(onUse).toHaveBeenCalledTimes(2);
    expect(onUse).toHaveBeenNthCalledWith(2, '👊');
  });
});
