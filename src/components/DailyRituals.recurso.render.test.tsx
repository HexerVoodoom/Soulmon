// @vitest-environment jsdom
/** beta12 §J, A2: o recurso mora NA PRÓPRIA LINHA do hábito adotado (passos de hoje; "Ir ao Caderno"), nos temas claro e escuro. */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import type { Activity } from '../contexts/GameStateContext';

const noop = () => {};
const dias = [0, 1, 2, 3, 4, 5, 6];
const mk = (id: string, name: string, catalogId?: string, extra: Record<string, unknown> = {}) =>
  ({ id, name, category: 'health', emoji: 'x', steps: [], weekDays: dias, schedule: { kind: 'weekdays', days: dias }, catalogId, ...extra }) as unknown as Activity;

function mount(activities: Activity[], extra: Record<string, unknown> = {}, language: 'pt-BR' | 'en-US' = 'pt-BR') {
  return renderWithCss(
    <DailyRituals tasks={[]} activities={activities} completedTasks={[]} language={language as never} now={new Date('2026-11-15T12:00:00')}
      expanded={{}} onExpand={noop} onToggleTask={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
      onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop} ctaLabel="Add" emptyMessage="vazio" variant="home" {...extra} />,
  );
}

for (const tema of ['light', 'dark'] as const) {
  describe(`linha do hábito linkado (${tema})`, () => {
    const aplicar = () => { document.documentElement.setAttribute('data-theme', tema); };

    it('caminhar adotado mostra "N de M passos"; sem permissão/sensor não mostra nada (A3)', () => {
      aplicar();
      const { container, rerender } = mount([mk('w', 'Caminhar', 'corpo-caminhar')], { stepsInfo: { hoje: 3400, meta: 7000 } });
      const link = container.querySelector('[data-habit-link="steps"]');
      expect(link?.textContent?.replace(/\s/g, ' ')).toMatch(/^3\.?400 de 7\.?000 passos$/);
      rerender(<DailyRituals tasks={[]} activities={[mk('w', 'Caminhar', 'corpo-caminhar')]} completedTasks={[]} language="pt-BR" now={new Date('2026-11-15T12:00:00')}
        expanded={{}} onExpand={noop} onToggleTask={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
        onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop} ctaLabel="Add" emptyMessage="vazio" variant="home" stepsInfo={null} />);
      expect(container.querySelector('[data-habit-link]')).toBeNull();
    });

    it('journaling adotado mostra "Ir ao Caderno" (alvo de 44 px) e o toque leva ao prédio sem marcar a linha', () => {
      aplicar();
      const ir = vi.fn();
      const marcar = vi.fn();
      const { container } = mount([mk('j', 'Gratidão', 'mente-gratidao')], { onGoToBuilding: ir, onToggleActivity: marcar });
      const btn = container.querySelector('button[data-habit-link]') as HTMLButtonElement;
      expect(btn.textContent).toBe('Ir ao Caderno');
      expect(btn.style.minHeight).toBe('44px');
      fireEvent.click(btn);
      expect(ir).toHaveBeenCalledWith('forja.caderno');
      expect(marcar).not.toHaveBeenCalled();
    });

    it('EN: "Go to the Journal" e "of" nos passos', () => {
      aplicar();
      const { container } = mount([mk('j', 'Gratitude', 'mente-gratidao'), mk('w', 'Walk', 'corpo-caminhar')], { onGoToBuilding: noop, stepsInfo: { hoje: 100, meta: 7000 } }, 'en-US');
      expect(container.querySelector('button[data-habit-link]')?.textContent).toBe('Go to the Journal');
      expect(container.querySelector('[data-habit-link="steps"]')?.textContent).toBe('100 of 7,000 steps');
    });

    it('hábito sem catálogo, ou de catálogo sem recurso (água, sono), não ganha link (Q6, Q7)', () => {
      aplicar();
      const { container } = mount([mk('a', 'Beber água', 'corpo-beber-agua'), mk('s', 'Dormir', 'sono-horario-fixo'), mk('c', 'Custom')], { onGoToBuilding: noop, stepsInfo: { hoje: 1, meta: 7000 } });
      expect(container.querySelector('[data-habit-link]')).toBeNull();
    });

    it('hábito concluído não mostra o link (a linha fica só com o check)', () => {
      aplicar();
      const feito = mk('j', 'Gratidão', 'mente-gratidao', { completedToday: true, lastCompletedDate: new Date('2026-11-15T12:00:00').toDateString() });
      const { container } = mount([feito], { onGoToBuilding: noop });
      expect(container.querySelector('[data-habit-link]')).toBeNull();
    });
  });
}

describe('o link de ação vem NA FRENTE do nome (13/11/2026)', () => {
  it('"Ir ao Caderno" mora na mesma linha, antes do nome, e não numa segunda linha embaixo', () => {
    const { container } = mount([mk('j', 'Gratidão', 'mente-gratidao')], { onGoToBuilding: noop });
    const btn = container.querySelector('button[data-habit-link]') as HTMLButtonElement;
    const linha = btn.closest('[data-ritual-lead-row]') as HTMLElement;
    expect(linha).not.toBeNull();
    expect(btn.closest('[data-ritual-below]')).toBeNull();
    const nome = linha.querySelector('.sm2-ritual-name') as HTMLElement;
    expect(btn.compareDocumentPosition(nome) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('o contador de passos (não é ação) continua embaixo', () => {
    const { container } = mount([mk('w', 'Caminhar', 'corpo-caminhar')], { stepsInfo: { hoje: 1, meta: 7000 } });
    expect(container.querySelector('[data-ritual-below] [data-habit-link="steps"]')).not.toBeNull();
    expect(container.querySelector('[data-ritual-lead]')).toBeNull();
  });
});
