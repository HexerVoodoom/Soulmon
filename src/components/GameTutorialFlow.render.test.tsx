// @vitest-environment jsdom
/**
 * O tutorial pelo canvas Onboarding-funil (DECISÕES §23 — `TutorialConceito`,
 * `TutorialTarefa`, `TutorialSugestoes`, `TutorialErro`): o aparelho em vetor,
 * a criatura no vidro, o objetivo pré-preenchido, "Suggest tasks with AI" vivo,
 * sugestão além do teto inerte por forma, teto em `role=status`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { GameTutorialFlow } from './GameTutorialFlow';

let sugestoes: Array<{ name: string; category: 'Study'; emoji: string }> = [];
/** E1: `null` = a IA respondeu (com `sugestoes`); string = falhou com esse motivo. */
let falha: 'offline' | 'error' | null = null;
vi.mock('../utils/taskSuggestions', () => ({
  suggestTasks: async () => (falha ? [] : sugestoes),
  suggestTasksResult: async () => (falha ? { ok: false, reason: falha } : { ok: true, items: sugestoes }),
}));

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
const variante = (b: HTMLElement) => b.style.getPropertyValue('--sm2-btn');

function montar(props: Partial<Parameters<typeof GameTutorialFlow>[0]> = {}) {
  const onComplete = vi.fn();
  renderWithCss(
    <GameTutorialFlow
      language="en-US"
      maxActivities={2}
      onComplete={onComplete}
      soulGoal="get back to studying without beating myself up"
      spriteUrl="/x.png"
      petName="Pyraka"
      demoTint={0}
      {...props}
    />,
  );
  return onComplete;
}

describe('GameTutorialFlow — identidade do canvas', () => {
  beforeEach(() => { sugestoes = []; });

  it('Conceito: a criatura num vidro 192² `role=img`, pontinhos com progressbar, sem glifo `pets` 48, sem `.sm-*`', () => {
    montar();
    const hero = screen.getByRole('img', { name: 'Pyraka, in tint 1' });
    const vidro = hero.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(vidro.style.width).toBe('192px');
    expect((vidro.querySelector('img[data-hero]') as HTMLImageElement).style.width).toBe('128px');
    expect(screen.getByRole('progressbar', { name: 'Step 1 of 3' })).toBeTruthy();
    expect(document.querySelectorAll('[data-dot="on"]').length).toBe(1);
    expect(document.querySelectorAll('[data-dot]').length).toBe(3);
    expect(document.querySelector('.sm-card, .sm-btn, .sm-px-field, .sm-px-choice, .sm2-kit-chip')).toBeNull();
    expect(variante(btn("Let's start"))).toBe('primary');
  });

  // 21/10/2026 (dono, 6b2162aeb): "Let's start" já pede as sugestões (com o soulGoal do onboarding) e pula direto para
  // a escolha tarefa/hábito — o passo do objetivo/áreas (GOAL_STEP) deixou de ser alcançável, então não há mais campo,
  // chips nem botão "Suggest tasks with AI" neste fluxo.
  it('Começar pede as sugestões e cai direto na escolha tarefa/hábito (3ª etapa), com a 1ª sugestão pré-selecionada como tarefa', async () => {
    sugestoes = [
      { name: 'Read 5 pages of the textbook', category: 'Study', emoji: '📚' },
      { name: 'Set up the desk for tomorrow', category: 'Study', emoji: '📚' },
    ];
    montar({ soulGoal: 'study for the exam' });
    await act(async () => { fireEvent.click(btn("Let's start")); });
    expect(screen.queryByLabelText("What's your goal?")).toBeNull();
    expect(screen.queryByRole('button', { name: 'Suggest tasks with AI' })).toBeNull();
    expect(screen.getByRole('progressbar', { name: 'Step 3 of 3' })).toBeTruthy();
    expect(screen.getByText('Read 5 pages of the textbook')).toBeTruthy();
    expect(btn('One-time task').getAttribute('aria-pressed')).toBe('true');
    expect(btn('Recurring habit').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn('Recurring habit'));
    expect(btn('Recurring habit').getAttribute('aria-pressed')).toBe('true');
  });

  it('E1: IA offline/com erro ou vazia não trava o fluxo — a sugestão local entra e dá para começar', async () => {
    for (const modo of ['offline', 'error', null] as const) {
      falha = modo;
      sugestoes = [];
      try {
        cleanup();
        const onComplete = montar({ soulGoal: 'be healthier' });
        await act(async () => { fireEvent.click(btn("Let's start")); });
        expect(document.querySelector('[data-selected-activity]')?.textContent, String(modo)).toBeTruthy();
        fireEvent.click(btn('Start'));
        expect(onComplete, String(modo)).toHaveBeenCalledWith(expect.objectContaining({ kind: 'task' }));
      } finally { falha = null; }
    }
  });
});
