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

    it('journaling adotado mostra UMA seta turquesa (nome acessível "Ir ao Caderno", alvo de 44 px, sem texto) e o toque leva ao prédio sem marcar a linha', () => {
      aplicar();
      const ir = vi.fn();
      const marcar = vi.fn();
      const { container } = mount([mk('j', 'Gratidão', 'mente-gratidao')], { onGoToBuilding: ir, onToggleActivity: marcar });
      const btn = container.querySelector('button[data-ritual-action]') as HTMLButtonElement;
      expect(btn.getAttribute('aria-label')).toBe('Ir ao Caderno');
      expect(btn.textContent).toBe('chevron_right'); // só o glifo, nenhum texto visível
      expect(btn.style.minHeight).toBe('44px');
      expect(btn.style.minWidth).toBe('44px');
      expect(btn.style.color).toBe('var(--sm2-primary-ink)');
      fireEvent.click(btn);
      expect(ir).toHaveBeenCalledWith('forja.caderno');
      expect(marcar).not.toHaveBeenCalled();
    });

    it('EN: "Go to the Journal" e "of" nos passos', () => {
      aplicar();
      const { container } = mount([mk('j', 'Gratitude', 'mente-gratidao'), mk('w', 'Walk', 'corpo-caminhar')], { onGoToBuilding: noop, stepsInfo: { hoje: 100, meta: 7000 } }, 'en-US');
      expect(container.querySelector('button[data-ritual-action]')?.getAttribute('aria-label')).toBe('Go to the Journal');
      expect(container.querySelector('[data-habit-link="steps"]')?.textContent).toBe('100 of 7,000 steps');
    });

    it('hábito sem catálogo, ou de catálogo sem recurso (água, sono), não ganha link (Q6, Q7)', () => {
      aplicar();
      const { container } = mount([mk('a', 'Beber água', 'corpo-beber-agua'), mk('s', 'Dormir', 'sono-horario-fixo'), mk('c', 'Custom')], { onGoToBuilding: noop, stepsInfo: { hoje: 1, meta: 7000 } });
      expect(container.querySelector('[data-habit-link], [data-ritual-action]')).toBeNull();
    });

    it('hábito concluído não mostra o link (a linha fica só com o check)', () => {
      aplicar();
      const feito = mk('j', 'Gratidão', 'mente-gratidao', { completedToday: true, lastCompletedDate: new Date('2026-11-15T12:00:00').toDateString() });
      const { container } = mount([feito], { onGoToBuilding: noop });
      expect(container.querySelector('[data-habit-link], [data-ritual-action]')).toBeNull();
    });
  });
}

describe('§382: tocar no NOME da linha ligada a prédio abre o prédio; só o checkbox marca', () => {
  it('o nome é um botão com o destino no nome acessível; tocar nele (ou no texto) abre o prédio e não marca', () => {
    const ir = vi.fn();
    const marcar = vi.fn();
    const { container } = mount([mk('j', 'Gratidão', 'mente-gratidao')], { onGoToBuilding: ir, onToggleActivity: marcar });
    const nome = container.querySelector('button[data-ritual-name-action]') as HTMLButtonElement;
    expect(nome.getAttribute('aria-label')).toBe('Gratidão: Ir ao Caderno');
    expect(nome.textContent).toBe('Gratidão');
    fireEvent.click(nome);
    expect(ir).toHaveBeenCalledWith('forja.caderno');
    fireEvent.click(container.querySelector('[data-ritual-tap]') as HTMLElement);
    expect(ir).toHaveBeenCalledTimes(2);
    expect(marcar).not.toHaveBeenCalled();
  });
  it('o checkbox (alvo de 44 px) continua marcando e não abre o prédio', () => {
    const ir = vi.fn();
    const marcar = vi.fn();
    const { container } = mount([mk('j', 'Gratidão', 'mente-gratidao')], { onGoToBuilding: ir, onToggleActivity: marcar });
    const check = container.querySelector('button[data-ritual-check]') as HTMLButtonElement;
    expect(check.style.width).toBe('44px');
    expect(check.style.height).toBe('44px');
    fireEvent.click(check);
    expect(marcar).toHaveBeenCalledTimes(1);
    expect(ir).not.toHaveBeenCalled();
  });
  it('EN: o nome acessível diz o destino em inglês', () => {
    const { container } = mount([mk('j', 'Gratitude', 'mente-gratidao')], { onGoToBuilding: noop }, 'en-US');
    expect(container.querySelector('button[data-ritual-name-action]')?.getAttribute('aria-label')).toBe('Gratitude: Go to the Journal');
  });
  it('linha sem ação segue como antes: o nome não é botão e tocar no texto marca', () => {
    const marcar = vi.fn();
    const { container } = mount([mk('c', 'Custom')], { onGoToBuilding: noop, onToggleActivity: marcar });
    expect(container.querySelector('[data-ritual-name-action]')).toBeNull();
    fireEvent.click(container.querySelector('[data-ritual-tap]') as HTMLElement);
    expect(marcar).toHaveBeenCalledTimes(1);
  });
});

describe('a ação é UMA seta turquesa no FIM da linha (14/11/2026, §365; reverte o "link na frente" de 13/11)', () => {
  it('a seta mora no fim da linha, depois do nome, sem texto "Ir ao…" e sem link na frente', () => {
    const { container } = mount([mk('j', 'Gratidão', 'mente-gratidao')], { onGoToBuilding: noop });
    const btn = container.querySelector('button[data-ritual-action]') as HTMLButtonElement;
    const nome = container.querySelector('.sm2-ritual-name') as HTMLElement;
    expect(btn.closest('[data-ritual-below]')).toBeNull();
    expect(container.querySelector('[data-ritual-lead-row], [data-ritual-lead]')).toBeNull();
    expect(container.textContent).not.toContain('Ir ao Caderno');
    expect(nome.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('o contador de passos (não é ação) continua embaixo', () => {
    const { container } = mount([mk('w', 'Caminhar', 'corpo-caminhar')], { stepsInfo: { hoje: 1, meta: 7000 } });
    expect(container.querySelector('[data-ritual-below] [data-habit-link="steps"]')).not.toBeNull();
    expect(container.querySelector('[data-ritual-action]')).toBeNull();
  });
});
