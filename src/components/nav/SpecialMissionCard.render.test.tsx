// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../../test/renderEnv';
import { SpecialMissionCard, specialMissionCopy } from './SpecialMissionCard';

const st = (kind: 'steps' | 'rest', done = false) => ({ day: 'x', kind, done });
const base = { language: 'en-US' as const, stepsToday: 2000, stepGoal: 7000, tomorrowKind: 'steps' as const };

describe('SpecialMissionCard', () => {
  it('steps aberto mostra título e progresso', () => {
    const { container } = renderWithCss(<SpecialMissionCard {...base} state={st('steps')} />);
    expect(container.textContent).toContain('Walk 7,000 steps today');
    expect(container.textContent).toContain('2000/7000');
    expect(container.querySelector('[data-special-mission="steps"]')?.getAttribute('data-status')).toBe('open');
  });
  it('feito não tem botão', () => {
    const { container } = renderWithCss(<SpecialMissionCard {...base} state={st('steps', true)} />);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[data-status="claimed"]')).not.toBeNull();
    expect(container.textContent).toContain('You walked 7,000 steps today');
  });
  it('rest em PT', () => {
    const { container } = renderWithCss(<SpecialMissionCard {...base} language="pt-BR" state={st('rest')} />);
    expect(container.textContent).toContain('Deite dentro da sua janela de descanso');
  });
  it('calmo: sem marca, Done/Feita, recompensa visível', () => {
    const a = renderWithCss(<SpecialMissionCard {...base} state={st('steps')} />);
    expect(a.container.querySelector('[data-mission-mark]')).toBeNull();
    expect(a.container.textContent).not.toContain('!');
    expect(a.container.textContent).toContain('Like 1 daily habit');
    a.unmount();
    const b = renderWithCss(<SpecialMissionCard {...base} state={st('rest', true)} />);
    expect(b.container.textContent).toContain('Done');
    expect(b.container.textContent).not.toMatch(/Claimed|Resgatada/);
    b.unmount();
    const c = renderWithCss(<SpecialMissionCard {...base} language="pt-BR" state={st('rest', true)} />);
    expect(c.container.textContent).toContain('Feita');
    expect(c.container.textContent).toContain('Vale 1 hábito diário');
  });
  it('undefined não renderiza nada', () => {
    const { container } = renderWithCss(<SpecialMissionCard {...base} state={undefined} />);
    expect(container.innerHTML).toBe('');
  });
  it('rodapé só com tomorrowKind rest', () => {
    const a = renderWithCss(<SpecialMissionCard {...base} state={st('steps')} tomorrowKind="rest" />);
    expect(a.container.querySelector('[data-special-tomorrow]')).not.toBeNull();
    a.unmount();
    const b = renderWithCss(<SpecialMissionCard {...base} state={st('steps')} />);
    expect(b.container.querySelector('[data-special-tomorrow]')).toBeNull();
  });
  it('copy sem "!" nem palavras vetadas', () => {
    for (const lang of ['en-US', 'pt-BR'] as const) for (const kind of ['steps', 'rest'] as const) for (const done of [false, true]) {
      const c = specialMissionCopy(kind, done, lang, 7000);
      const t = `${c.title} ${c.desc}`;
      expect(t).not.toContain('!');
      expect(t).not.toMatch(/perdeu|falhou|streak|sequência|lost|failed/i);
    }
  });
});
