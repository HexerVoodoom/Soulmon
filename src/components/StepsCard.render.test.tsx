// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { StepsCard } from './StepsCard';

const base = { steps: 1000, available: true, hasPermission: true, onRequestPermission: () => {}, onDismiss: () => {}, onChangeGoal: () => {} };

describe('StepsCard: pergunta curta, com meta, antes do diálogo do sistema', () => {
  it('EN: título, uma frase, metas 3k/5k/8k/10k, sim e não do mesmo peso', () => {
    const a = renderWithCss(<StepsCard {...base} hasPermission={false} language="en-US" goal={5000} />);
    const t = a.container.textContent ?? '';
    expect(t).toContain('Do you want to use step counting?');
    expect(t).toContain('Doing so turns on a bonus mission.');
    expect([...a.container.querySelectorAll('[data-step-goal]')].map(e => e.getAttribute('data-step-goal'))).toEqual(['3000', '5000', '8000', '10000']);
    expect(a.container.querySelector('[data-step-goal="5000"]')!.getAttribute('aria-pressed')).toBe('true');
    const buttons = [...a.container.querySelectorAll('.sm2-conta-two button')].map(b => b.textContent);
    expect(buttons).toEqual(['Yes, count them', 'Not now']);
  });
  it('PT: a mesma pergunta em português', () => {
    const a = renderWithCss(<StepsCard {...base} hasPermission={false} language="pt-BR" goal={5000} />);
    expect(a.container.textContent).toContain('Você deseja usar a contagem de passos?');
    expect(a.container.textContent).toContain('Ao fazer isso você ativa uma missão bônus.');
  });
  it('sem sensor o cartão não existe', () => {
    const a = renderWithCss(<StepsCard {...base} available={false} hasPermission={false} language="en-US" />);
    expect(a.container.textContent).toBe('');
  });
});

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
