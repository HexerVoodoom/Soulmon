// @vitest-environment jsdom
/**
 * O tutorial pelo canvas Onboarding-funil (DECISÕES §23 — `TutorialConceito`,
 * `TutorialTarefa`, `TutorialSugestoes`, `TutorialErro`): o aparelho em vetor,
 * a criatura no vidro, o objetivo pré-preenchido, "Suggest tasks with AI" vivo,
 * sugestão além do teto inerte por forma, teto em `role=status`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
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

  it('Tarefa: campo pré-preenchido com o soulGoal, chips vetor 44, "Suggest tasks with AI" VIVO, aviso da IA', () => {
    montar({ soulGoal: 'study for the exam' });
    fireEvent.click(btn("Let's start"));
    const area = screen.getByLabelText("What's your goal?") as HTMLTextAreaElement;
    expect(area.value).toBe('study for the exam');
    const grupo = screen.getByRole('group', { name: 'Life areas (optional)' });
    const chips = grupo.querySelectorAll('button.sm2-form-chip');
    expect(chips.length).toBe(8);
    expect((chips[0] as HTMLElement).style.minHeight).toBe('44px');
    // Study primeiro: o objetivo fala em estudar (WP1.4).
    expect(chips[0].textContent).toBe('Study');
    const ia = btn('Suggest tasks with AI');
    expect(ia.disabled).toBe(false);
    expect(variante(ia)).toBe('primary');
    expect(screen.getByText('This text goes to the AI provider if you ask for suggestions.')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Step 2 of 3' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Select at least 1 task' })).toBeNull();
  });

  it('Tarefa sem objetivo e sem área: só aí a IA desliga; a área liga de volta', () => {
    montar({ soulGoal: '' });
    fireEvent.click(btn("Let's start"));
    expect(btn('Suggest tasks with AI').disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    expect(btn('Suggest tasks with AI').disabled).toBe(false);
  });

  it('Sugestões viram a terceira etapa; primeira sugestão pré-selecionada é tarefa avulsa, hábito é escolha explícita', async () => {
    sugestoes = [
      { name: 'Read 5 pages of the textbook', category: 'Study', emoji: '📚' },
      { name: 'Set up the desk for tomorrow', category: 'Study', emoji: '📚' },
      { name: 'Review yesterday’s notes for 10 minutes', category: 'Study', emoji: '📚' },
    ];
    montar();
    fireEvent.click(btn("Let's start"));
    await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
    // Já respondeu: o botão vira outline.
    expect(variante(btn('Suggest tasks with AI'))).toBe('outline');
    const cards = document.querySelectorAll('button[data-suggestion]');
    expect(cards.length).toBe(3);
    expect(cards[0].getAttribute('data-suggestion')).toBe('on');
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(btn('Choose a suggestion'));
    expect(screen.getByRole('progressbar', { name: 'Step 3 of 3' })).toBeTruthy();
    expect(screen.getByText('Read 5 pages of the textbook')).toBeTruthy();
    expect(btn('One-time task').getAttribute('aria-pressed')).toBe('true');
    expect(btn('Recurring habit').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn('Recurring habit'));
    expect(btn('Recurring habit').getAttribute('aria-pressed')).toBe('true');
  });

  it('E1 (QA rodada 2): OFFLINE tem texto próprio, diferente de "não veio sugestão" — e as locais vêm mesmo assim', async () => {
    falha = 'offline';
    try {
      montar({ soulGoal: '' });
      fireEvent.click(btn("Let's start"));
      fireEvent.click(screen.getByRole('button', { name: 'Health' }));
      await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
      const aviso = document.querySelector('[data-ai-failure="offline"]')!;
      expect(aviso).toBeTruthy();
      expect(aviso.textContent).toMatch(/No connection right now/);
      expect(aviso.getAttribute('role')).toBe('status');
      expect(screen.queryByText(/No AI suggestions came back/)).toBeNull();
      expect(document.querySelectorAll('button[data-suggestion]').length).toBe(1); // a local
    } finally { falha = null; }
  });

  it('E1: erro do provedor (com rede) é outro texto; vazio legítimo não mostra falha nenhuma', async () => {
    falha = 'error';
    try {
      montar({ soulGoal: '' });
      fireEvent.click(btn("Let's start"));
      fireEvent.click(screen.getByRole('button', { name: 'Health' }));
      await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
      expect(document.querySelector('[data-ai-failure="error"]')!.textContent).toMatch(/The AI did not answer/);
    } finally { falha = null; }
  });

  it('E1: vazio legítimo (IA respondeu sem itens) não mostra falha nenhuma', async () => {
    sugestoes = [];
    montar({ soulGoal: '' });
    fireEvent.click(btn("Let's start"));
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
    expect(document.querySelector('[data-ai-failure]')).toBeNull();
  });

  it('A10: o aviso da IA continua DEPOIS da 1ª busca, enquanto o botão está vivo', async () => {
    montar({ soulGoal: 'study for the exam' });
    fireEvent.click(btn("Let's start"));
    await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
    expect(btn('Suggest tasks with AI').disabled).toBe(false);
    expect(screen.getByText('This text goes to the AI provider if you ask for suggestions.')).toBeTruthy();
  });

  it('Erro: fallback local sugere uma tarefa avulsa e mantém hábito como alternativa explícita', async () => {
    const onComplete = montar({ soulGoal: '' });
    fireEvent.click(btn("Let's start"));
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
    expect(document.querySelectorAll('button[data-suggestion]')).toHaveLength(1);
    expect(document.querySelectorAll('button[data-suggestion="on"]')).toHaveLength(1);
    fireEvent.click(btn('Choose a suggestion'));
    fireEvent.click(btn('Start'));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ name: 'Drink a glass of water', category: 'Health', kind: 'task' }));
  });
});
