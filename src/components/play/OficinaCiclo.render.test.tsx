// @vitest-environment jsdom
/**
 * Relato do dono (05/11/2026): "configurar duas vezes", "preenche tudo duas vezes", "completar sessão não faz nada",
 * "ao deletar uma sessão, não consegue criar outra". O ciclo inteiro, no arranjo do AreaView, com recarga da página (`unmount` + render).
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, useState } from 'react';
import { PrepararFocoSheet } from './PrepararFocoSheet';
import { OficinaSheet } from './OficinaSheet';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const DIA = '2026-11-05';
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 5, 10, 0, 0)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const language = 'en-US' as const;
function Area({ startKey = false, onPlanReward }: { startKey?: boolean; onPlanReward?: () => { accepted: boolean; items: never[]; chancePercent: number } }) {
  const [key, setKey] = useState(startKey);
  return key
    ? createElement(OficinaSheet, { language, todayKey: DIA, tasks: [], onPlanReward })
    : createElement(PrepararFocoSheet, { language, todayKey: DIA, tasks: [], keyActive: false, onPrepared: () => setKey(true) });
}
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;
const goTo = (c: HTMLElement, step: string) => { for (let i = 0; i < 10 && !q(c, `[data-oficina-step="${step}"]`); i++) fireEvent.click(q(c, '[data-oficina-next]')!); };
const name = (c: HTMLElement, v: string) => fireEvent.change(q(c, '[data-oficina-plano] input')!, { target: { value: v } });

describe('Ciclo da Oficina do Foco', () => {
  it('ambiente esquecido: a revisão pede ali mesmo, sem voltar às etapas, e um toque salva', () => {
    const { container } = render(createElement(Area));
    name(container, 'Manhã');
    goTo(container, 'revisar');
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(q(container, '[data-oficina-step="revisar"]')).not.toBeNull();
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Manhã');
    expect(q(container, '[data-oficina-plano]')).toBeNull();
  });

  it('o rascunho volta depois de recarregar, na mesma etapa, e some ao salvar', () => {
    const first = render(createElement(Area));
    name(first.container, 'Tarde');
    goTo(first.container, 'sapo');
    first.unmount();
    const { container } = render(createElement(Area));
    expect((q(container, '[data-oficina-plano] input') as HTMLInputElement).value).toBe('Tarde');
    expect(q(container, '[data-oficina-step="sapo"]')).not.toBeNull();
    goTo(container, 'revisar');
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_PLAN_DRAFT)).toBeNull();
  });

  const criar = (c: HTMLElement, nome: string) => {
    name(c, nome);
    goTo(c, 'ritmo');
    fireEvent.click(q(c, '[data-focus-environment="forest"]')!);
    goTo(c, 'revisar');
    fireEvent.click(q(c, '[data-oficina-save-session]')!);
  };

  it('criar, recarregar, concluir sem lista, criar de novo, excluir, criar de novo', () => {
    const onPlanReward = vi.fn(() => ({ accepted: true, items: [] as never[], chancePercent: 0 }));
    const first = render(createElement(Area, { onPlanReward }));
    criar(first.container, 'Uma');
    first.unmount();
    const { container } = render(createElement(Area, { startKey: true, onPlanReward }));
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Uma');
    fireEvent.click(q(container, '[data-oficina-complete-session]')!);
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Session complete');
    expect(onPlanReward).toHaveBeenCalledTimes(1);
    fireEvent.click(q(container, '[data-oficina-new-session]')!);
    criar(container, 'Duas');
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Duas');
    fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Delete session')!);
    fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Confirm delete')!);
    expect(q(container, '[data-oficina-sessao-salva]')).toBeNull();
    fireEvent.click(q(container, '[data-oficina-new-session]')!);
    criar(container, 'Três');
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Três');
  });

  it('concluir com o foco no relógio explica o que falta; na pausa, conclui e fecha o timer', () => {
    const { container } = render(createElement(Area));
    criar(container, 'Timer');
    fireEvent.click(q(container, '[data-oficina-session-pomodoro]')!);
    fireEvent.click(q(container, '[data-oficina-complete-session]')!);
    expect(q(container, '[data-oficina-complete-blocked]')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(25 * 60_000 + 2000); });
    fireEvent.click(q(container, '[data-oficina-foquei]')!);
    fireEvent.click(q(container, '[data-oficina-complete-session]')!);
    expect(q(container, '[data-oficina-sessao-salva]')!.textContent).toContain('Session complete');
    expect(q(container, '[data-oficina-start]')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_WORKSHOP_PLAN)!).completedCycles).toBe(1);
  });

  it('sessão velha de outro dia não empresta id nem dia à nova', () => {
    localStorage.setItem(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, JSON.stringify({ id: 'velha', name: 'Velha', day: '2026-11-04', status: 'ready', mode: 'p25', environment: 'forest', plan: [], completedCycles: 3 }));
    const { container } = render(createElement(Area));
    criar(container, 'Nova');
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_WORKSHOP_PLAN)!);
    expect(s.day).toBe(DIA);
    expect(s.id).not.toBe('velha');
    expect(s.completedCycles).toBe(0);
  });
});
