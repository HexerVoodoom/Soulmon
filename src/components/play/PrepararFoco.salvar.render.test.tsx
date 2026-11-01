// @vitest-environment jsdom
/**
 * "Quando eu clico em Save session, não tá salvando" (dono, 01/11/2026). Percorre o planejamento como o dono:
 * do começo à lista, clicando Save session, no MESMO arranjo do AreaView (Preparar → chave → Oficina).
 * Também cobre os hábitos de hoje entrando na escolha (dois minutos, sapo, matriz e lista final).
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, useState } from 'react';
import { PrepararFocoSheet } from './PrepararFocoSheet';
import { OficinaSheet } from './OficinaSheet';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const DIA = '2026-11-01';
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 1, 10, 0, 0)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

type T = { id: string; name: string; completed: boolean; kind?: 'habit' };
/** O arranjo do AreaView: sem chave → Preparar; salvar dá a chave → Oficina (planInPrepare). */
function Area({ tasks }: { tasks: T[] }) {
  const [key, setKey] = useState(false);
  return key
    ? createElement(OficinaSheet, { language: 'en-US' as const, todayKey: DIA, tasks, planInPrepare: true })
    : createElement(PrepararFocoSheet, { language: 'en-US' as const, todayKey: DIA, tasks, keyActive: false, onPrepared: () => setKey(true) });
}
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;
const next = (c: HTMLElement) => fireEvent.click(q(c, '[data-oficina-next]')!);
const goTo = (c: HTMLElement, step: string) => { for (let i = 0; i < 10 && !q(c, `[data-oficina-step="${step}"]`); i++) next(c); };

describe('Save session (Preparar o foco)', () => {
  it('o dono percorre tudo sem escolher o ambiente: o toque em Save session explica o que falta e leva até lá', () => {
    const { container } = render(createElement(Area, { tasks: [{ id: 't1', name: 'Write report', completed: false }] }));
    fireEvent.change(q(container, '[data-oficina-plano] input')!, { target: { value: 'Morning' } });
    goTo(container, 'revisar');
    const save = q(container, '[data-oficina-save-session]')!;
    expect(save.hasAttribute('disabled')).toBe(false);
    fireEvent.click(save);
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_WORKSHOP_PLAN)).toBeNull();
    expect(q(container, '[data-oficina-save-missing]')!.textContent).toMatch(/environment/i);
    expect(q(container, '[data-oficina-step="ritmo"]')).not.toBeNull();
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    goTo(container, 'revisar');
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_WORKSHOP_PLAN)).not.toBeNull();
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Morning');
  });

  it('sem nome: o toque explica e foca o campo do nome; com nome, salva e a sessão aparece', () => {
    const { container } = render(createElement(Area, { tasks: [] }));
    next(container);
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    goTo(container, 'revisar');
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(q(container, '[data-oficina-save-missing]')!.textContent).toMatch(/name/i);
    expect(document.activeElement).toBe(q(container, '[data-oficina-plano] input'));
    fireEvent.change(q(container, '[data-oficina-plano] input')!, { target: { value: 'Quick one' } });
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Quick one');
  });

  it('hábitos de hoje entram em todas as etapas, com etiqueta de hábito, e chegam à lista salva', () => {
    const tasks: T[] = [{ id: 't1', name: 'Write report', completed: false }, { id: 'habit:h1', name: 'Read 10 pages', completed: false, kind: 'habit' }];
    const { container } = render(createElement(Area, { tasks }));
    fireEvent.change(q(container, '[data-oficina-plano] input')!, { target: { value: 'Mix' } });
    next(container);
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    goTo(container, 'dois-minutos');
    expect(q(container, '[data-oficina-pick="habit:h1"] [data-oficina-tag="habit"]')).not.toBeNull();
    fireEvent.click(q(container, '[data-oficina-pick="habit:h1"]')!);
    goTo(container, 'eisenhower');
    expect(q(container, '[data-oficina-quadrant="habit:h1"]')).not.toBeNull();
    fireEvent.change(q(container, '[data-oficina-quadrant="t1"]')!, { target: { value: 'do' } });
    goTo(container, 'sapo');
    expect(q(container, '[data-oficina-frog] [data-oficina-pick="habit:h1"]')).not.toBeNull();
    goTo(container, 'revisar');
    expect(q(container, '[data-oficina-review-item="habit:h1"] [data-oficina-tag="habit"]')).not.toBeNull();
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(q(container, '[data-oficina-session-task="habit:h1"]')).not.toBeNull();
    expect(q(container, '[data-oficina-session-task="t1"]')).not.toBeNull();
  });
});

describe('Brain dump', () => {
  it('sem relógio duplicado; a contagem aparece dentro do botão enquanto roda; o fim tem mensagem', () => {
    const { container } = render(createElement(PrepararFocoSheet, { language: 'en-US' as const, todayKey: DIA }));
    goTo(container, 'esvaziar');
    expect(q(container, '[data-oficina-dump-clock]')).toBeNull();
    const btn = () => q(container, '[data-oficina-dump-start]')!;
    expect(btn().textContent).toBe('Start 5 minutes');
    expect(q(container, '[data-oficina-dump]')!.getAttribute('placeholder')).toBeTruthy();
    fireEvent.click(btn());
    expect(btn().textContent).toBe('Restart · 05:00');
    act(() => { vi.advanceTimersByTime(19_000); });
    fireEvent.click(q(container, '[data-oficina-dump]')!);
    expect(btn().textContent).toMatch(/^Restart · 04:4\d$/);
    act(() => { vi.advanceTimersByTime(5 * 60_000); });
    expect(q(container, '[data-oficina-dump-fim]')!.textContent).toMatch(/Time's up/);
    expect(btn().textContent).toBe('Restart · 00:00');
  });
});
