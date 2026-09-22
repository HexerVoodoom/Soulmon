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
    expect(screen.getByRole('progressbar', { name: 'Step 1 of 2' })).toBeTruthy();
    expect(document.querySelectorAll('[data-dot="on"]').length).toBe(1);
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
    expect(btn('Select at least 1 task').disabled).toBe(true);
  });

  it('Tarefa sem objetivo e sem área: só aí a IA desliga; a área liga de volta', () => {
    montar({ soulGoal: '' });
    fireEvent.click(btn("Let's start"));
    expect(btn('Suggest tasks with AI').disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    expect(btn('Suggest tasks with AI').disabled).toBe(false);
  });

  it('Sugestões: cards com check_circle/radio, a além do teto INERTE POR FORMA (tracejado, sem opacity), teto em role=status', async () => {
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
    // O objetivo é a 1ª linha, já selecionada (customKey) — 1 de 2.
    const cards = document.querySelectorAll('button[data-suggestion]');
    expect(cards.length).toBe(4);
    expect(cards[0].getAttribute('data-suggestion')).toBe('on');
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    // Seleciona a 2ª → teto de 2 atingido.
    fireEvent.click(cards[1]);
    const inertes = document.querySelectorAll('button[data-suggestion="inert"]');
    expect(inertes.length).toBe(2);
    for (const i of inertes) {
      const el = i as HTMLElement;
      expect(el.getAttribute('aria-disabled')).toBe('true');
      expect(el.getAttribute('style')).toContain('1px dashed var(--sm2-muted)');
      expect(el.style.opacity).toBe('');
      expect(el.style.color).toBe('var(--sm2-muted)');
    }
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Stage limit of 2 activities reached');
    expect(status.style.color).toBe('var(--sm2-gold-ink)');
    expect(status.style.border).toBe('');
    // Tocar na inerte não seleciona.
    fireEvent.click(inertes[0]);
    expect(document.querySelectorAll('button[data-suggestion="on"]').length).toBe(2);
    expect(btn('Add 2 and start').disabled).toBe(false);
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

  it('Erro: a IA devolve vazio → 4 tarefas locais de dois minutos, nenhuma selecionada sem objetivo, primário inerte até ≥1', async () => {
    const onComplete = montar({ soulGoal: '' });
    fireEvent.click(btn("Let's start"));
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    await act(async () => { fireEvent.click(btn('Suggest tasks with AI')); });
    const cards = document.querySelectorAll('button[data-suggestion]');
    expect(cards.length).toBe(1);
    expect(document.querySelectorAll('button[data-suggestion="on"]').length).toBe(0);
    expect(btn('Select at least 1 task').disabled).toBe(true);
    fireEvent.click(cards[0]);
    fireEvent.click(btn('Add 1 and start'));
    expect(onComplete).toHaveBeenCalledWith([expect.objectContaining({ name: 'Drink a glass of water', category: 'Health' })]);
  });
});
