// @vitest-environment jsdom
/** §385: com o botão em "Limit reached / Limite atingido", a explicação aparece como TEXTO visível abaixo dele (antes só no `title`). */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CreateModal } from './CreateModal';

afterEach(cleanup);
const mk = (language: 'pt-BR' | 'en-US', extra: Record<string, unknown> = {}) => render(
  <CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language={language} activitiesCount={6} activitiesCap={6} {...extra} />,
);

describe('CreateModal: limite visível', () => {
  it('teto do estágio: texto visível ligado ao botão por aria-describedby', () => {
    mk('en-US');
    const btn = screen.getByRole('button', { name: 'Limit reached' });
    const hint = document.querySelector('[data-create-cap-hint]') as HTMLElement;
    expect(hint.textContent).toBe('At this stage, up to 6 active daily habits. Tasks (one-off or on specific days) stay unlimited.');
    expect(btn.getAttribute('aria-describedby')).toBe(hint.id);
    expect(btn.getAttribute('title')).toBeNull();
  });
  it('conta grátis: o texto do modo grátis, em PT', () => {
    mk('pt-BR', { capIsDemoBoundary: true, onUnlock: () => {} });
    expect(document.querySelector('[data-create-cap-hint]')?.textContent).toMatch(/^Modo grátis: até 6 hábitos ativos/);
  });
  it('com vaga: nenhum texto de limite', () => {
    mk('en-US', { activitiesCount: 1 });
    expect(document.querySelector('[data-create-cap-hint]')).toBeNull();
  });
});
