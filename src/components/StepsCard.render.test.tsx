// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
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
