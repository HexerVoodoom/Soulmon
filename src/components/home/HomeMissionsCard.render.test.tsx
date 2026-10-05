// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { HomeMissionsCard } from './HomeMissionsCard';

afterEach(cleanup);

describe('HomeMissionsCard', () => {
  it('tocar numa missão chama onOpen com ela; semanais vêm depois das diárias', () => {
    const onOpen = vi.fn();
    const passeio = { key: 'passeio', kind: 'passeio' as const, textPt: 'Fazer um passeio', textEn: 'Go on a stroll', done: false };
    const semanal = { key: 'semanal:x', kind: 'semanal' as const, textPt: 'Semanal', textEn: 'Weekly', done: false, count: 1, target: 3 };
    const { container } = render(<HomeMissionsCard language="pt-BR" daily={[passeio]} weekly={[semanal]} onOpen={onOpen} />);
    const botoes = [...container.querySelectorAll('[data-home-mission]')].map(b => b.getAttribute('data-home-mission'));
    expect(botoes).toEqual(['passeio', 'semanal']);
    expect(container.textContent).toContain('1/3');
    fireEvent.click(container.querySelector('[data-home-mission="passeio"]')!);
    expect(onOpen).toHaveBeenCalledWith(passeio);
  });
});
