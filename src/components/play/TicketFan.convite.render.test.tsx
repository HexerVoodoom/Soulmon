// @vitest-environment jsdom
/** O leque de CONVITES de Duelo é o mesmo `TicketFan` dos tickets (16/11/2026): uma peça por convite, teto 7, arte em pé; o leque de ticket segue igual. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TicketFan } from './TicketFan';
import { conviteDueloFan } from '../arena/conviteDueloArt';

afterEach(cleanup);

describe('TicketFan com a arte do convite', () => {
  it('desenha um convite por unidade, gira a arte vertical e nomeia em PT', () => {
    const art = conviteDueloFan('pt-BR', 7)!;
    expect(art).toBeTruthy();
    const { container } = render(<TicketFan count={5} language="pt-BR" art={art} />);
    const fan = container.querySelector('[data-convite-fan]') as HTMLElement;
    expect(fan.getAttribute('data-convite-fan')).toBe('5');
    expect(fan.getAttribute('aria-label')).toBe('5 convites');
    expect(fan.querySelectorAll('[data-ticket-in-fan]')).toHaveLength(5);
    expect((fan.querySelector('img') as HTMLElement).style.transform).toContain('rotate(90deg)');
  });
  it('o teto é o do estoque (7) e zero não desenha nada', () => {
    const art = conviteDueloFan('en-US', 7)!;
    const { container, rerender } = render(<TicketFan count={9} language="en-US" art={art} />);
    expect(container.querySelectorAll('[data-ticket-in-fan]')).toHaveLength(7);
    rerender(<TicketFan count={0} language="en-US" art={art} />);
    expect(container.querySelector('[data-convite-fan]')).toBeNull();
  });
  it('sem `art`, segue o leque de tickets (teto 6)', () => {
    const { container } = render(<TicketFan count={9} language="en-US" />);
    expect(container.querySelector('[data-ticket-fan="6"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-ticket-in-fan]')).toHaveLength(6);
  });
});
