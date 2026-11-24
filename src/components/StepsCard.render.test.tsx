// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { StepsCard } from './StepsCard';

const base = { steps: 1000, available: true, hasPermission: true, onRequestPermission: () => {}, onDismiss: () => {}, onChangeGoal: () => {} };

describe('StepsCard meta travada', () => {
  it('mostra a frase só quando a meta de hoje difere', () => {
    const a = renderWithCss(<StepsCard {...base} language="en-US" goal={3000} todayGoal={7000} />);
    expect(a.container.textContent).toContain('starts tomorrow');
    expect(a.container.textContent).toContain('stays at 7,000');
    expect(a.container.textContent).toContain('of 7,000 steps');
    const b = renderWithCss(<StepsCard {...base} language="pt-BR" goal={3000} todayGoal={7000} />);
    expect(b.container.textContent).toContain('a partir de amanhã');
    const c = renderWithCss(<StepsCard {...base} language="en-US" goal={7000} todayGoal={7000} />);
    expect(c.container.textContent).not.toContain('starts tomorrow');
    const d = renderWithCss(<StepsCard {...base} language="en-US" goal={7000} />);
    expect(d.container.textContent).not.toContain('starts tomorrow');
  });
});

describe('StepsCard como porta do menu para quem recusou o convite', () => {
  for (const w of [360, 375, 412]) {
    it(`${w}px: sem permissão mostra o consentimento ANTES de pedir; Ativar só chama o fluxo existente ao toque`, () => {
      (window as any).innerWidth = w;
      const onRequestPermission = vi.fn();
      const r = renderWithCss(<StepsCard {...base} hasPermission={false} onRequestPermission={onRequestPermission} language="pt-BR" />);
      expect(onRequestPermission).not.toHaveBeenCalled();
      const botoes = r.container.querySelectorAll('button');
      expect(botoes.length).toBe(2);
      fireEvent.click(botoes[1]);
      expect(onRequestPermission).toHaveBeenCalledTimes(1);
    });
  }
});
