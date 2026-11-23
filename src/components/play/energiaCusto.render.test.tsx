// @vitest-environment jsdom
/** Tudo que gasta energia mostra o ícone da energia no botão/cartão (dono, 04/11/2026). */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MasmorraSheet } from './PlaySheets';
import { EnergyCost } from '../ui/EnergyCost';
import { PlayCard } from '../PlayCard';

afterEach(cleanup);

describe('ícone de custo de energia', () => {
  it('EnergyCost é decorativo (aria-hidden) com o número', () => {
    const { container } = render(<EnergyCost amount={2} />);
    const e = container.querySelector('[data-energy-cost="2"]')!;
    expect(e.getAttribute('aria-hidden')).toBe('true');
    expect(e.textContent).toBe('2');
    expect(e.querySelector('img')).toBeTruthy();
  });

  it('Masmorra: "Descer à Fenda" mostra o custo da camada', () => {
    const { container } = render(<MasmorraSheet language="pt-BR" onStart={() => {}} />);
    expect(container.querySelector('[data-masmorra-start] [data-energy-cost="1"]')).toBeTruthy();
  });

  it('Brincar (cartão do Soulmon) mostra o custo no botão; sem energia o botão nem existe', () => {
    const a = render(<PlayCard canPlay playedToday={false} buff={null} language="pt-BR" onPlay={() => {}} />);
    expect(a.container.querySelector('button [data-energy-cost="1"]')).toBeTruthy();
    cleanup();
    const b = render(<PlayCard canPlay={false} playedToday={false} buff={null} language="pt-BR" onPlay={() => {}} />);
    expect(b.container.querySelector('[data-energy-cost]')).toBeNull();
  });
});
