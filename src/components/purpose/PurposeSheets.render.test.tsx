// @vitest-environment jsdom
/**
 * AS FOLHAS DO OBJETIVO (E3, E4, E6, E7-E9): renderizam, validam e entregam o que a pessoa escolheu.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { installFakeStorage } from '../../test/renderEnv';
import { GoalReviewSheet, MeuObjetivoSheet, PathSwitchSheet, PurposeInviteModal, TaskSuggestionsSheet, WeeklyPriorities } from './PurposeSheets';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';
import { emptyPurpose, setGoal, setMotive } from '../../utils/purpose';
import { reviewOffer } from '../../utils/purposeReview';

const ACTIVITY_CATALOG_ITEMS = ACTIVITY_CATALOG;
const acts = [
  { id: 'a1', name: 'Caminhar', emoji: '🚶' }, { id: 'a2', name: 'Ler', emoji: '📖' },
  { id: 'a3', name: 'Alongar', emoji: '🧘' }, { id: 'a4', name: 'Beber água', emoji: '💧' },
];
const comObjetivo = () => {
  let p = setGoal(emptyPurpose(), { text: 'Correr 5 km', areas: ['corpo'] }, new Date(2026, 0, 15));
  p = setMotive(p, { key: 'health', phrase: 'respira e segue' });
  return { ...p, priorities: ['a1'], monthlyAgg: { '2026-01': { a1: { done: 18, due: 22 }, a2: { done: 3, due: 10 } } } };
};

beforeEach(() => { installFakeStorage(); });

describe('MeuObjetivoSheet (E4)', () => {
  it('mostra objetivo, motivo, frase e prioridades; editar guarda o histórico', async () => {
    const onSave = vi.fn();
    render(<MeuObjetivoSheet open onClose={() => {}} language="en-US" purpose={comObjetivo()} activities={acts} onSave={onSave} />);
    expect(screen.getByText('Correr 5 km')).toBeTruthy();
    expect(screen.getByText('Taking care of my health')).toBeTruthy();
    expect(screen.getByText('respira e segue')).toBeTruthy();
    expect(screen.getByText(/Caminhar/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const campo = (await screen.findByLabelText('A year from now, where do you want to be?')) as HTMLInputElement;
    expect(campo.value).toBe('Correr 5 km');
    fireEvent.change(campo, { target: { value: 'Correr 10 km' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const salvo = onSave.mock.calls[0][0];
    expect(salvo.goal.text).toBe('Correr 10 km');
    expect(salvo.history[0].text).toBe('Correr 5 km');
    expect(salvo.firstCreatedAt).toBe('2026-01-15');
    expect(salvo.priorities).toEqual(['a1']);
  });

  it('sem objetivo: texto vazio e convite para escrever', () => {
    render(<MeuObjetivoSheet open onClose={() => {}} language="pt-BR" purpose={undefined} activities={acts} onSave={() => {}} startEditing={false} />);
    // sem objetivo a folha já abre no formulário (nada a "ver")
    expect(document.querySelector('[data-meu-objetivo-edit]')).toBeTruthy();
  });

  it('o interruptor das falas liga e desliga', () => {
    const onSave = vi.fn();
    render(<MeuObjetivoSheet open onClose={() => {}} language="en-US" purpose={comObjetivo()} activities={acts} onSave={onSave} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onSave.mock.calls[0][0].prefs.voiceReminder).toBe(false);
  });
});

describe('PurposeInviteModal (E3)', () => {
  it('"Agora não" fecha sem gravar nada', () => {
    const onSave = vi.fn(); const onNotNow = vi.fn();
    render(<PurposeInviteModal language="en-US" areas={['corpo']} activities={acts} onSave={onSave} onNotNow={onNotNow} />);
    fireEvent.click(document.querySelector('[data-purpose-notnow]')!);
    expect(onNotNow).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('guardar exige o destino; escolhe até 3 prioridades e a 4ª é recusada', async () => {
    const onSave = vi.fn();
    render(<PurposeInviteModal language="en-US" areas={['corpo']} activities={acts} onSave={onSave} onNotNow={() => {}} />);
    const guardar = document.querySelector('[data-purpose-save]') as HTMLElement;
    expect(guardar.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(guardar);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(await screen.findByLabelText('A year from now, where do you want to be?'), { target: { value: 'Dormir bem' } });
    const estrelas = () => Array.from(document.querySelectorAll('[data-priority-star]')) as HTMLElement[];
    for (let i = 0; i < 4; i++) fireEvent.click(estrelas()[i]);
    expect(estrelas().filter(e => e.getAttribute('aria-pressed') === 'true')).toHaveLength(3);
    fireEvent.click(document.querySelector('[data-purpose-save]')!);
    const p = onSave.mock.calls[0][0];
    expect(p.goal.text).toBe('Dormir bem');
    expect(p.priorities).toEqual(['a1', 'a2', 'a3']);
    expect(p.promptedExisting).toBe(true);
  });
});

describe('WeeklyPriorities (E6)', () => {
  it('mostra "X of Y" e a pergunta é opcional (1 toque)', () => {
    const onAnswer = vi.fn();
    render(<WeeklyPriorities language="en-US" rows={[{ id: 'a1', done: 5, due: 7 }]} names={new Map(acts.map(a => [a.id, a]))} answered={false} onAnswer={onAnswer} />);
    expect(screen.getByText('5 of 7')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Low energy' }));
    expect(onAnswer).toHaveBeenCalledWith(['energy']);
    expect(screen.getByRole('status').textContent).toBe('Noted.');
  });
  it('sem prioridades não desenha nada', () => {
    const { container } = render(<WeeklyPriorities language="en-US" rows={[]} names={new Map()} answered={false} onAnswer={() => {}} />);
    expect(container.textContent).toBe('');
  });
});

describe('GoalReviewSheet (E7-E9)', () => {
  const passos = async () => { for (const _ of [0, 1, 2, 3]) { const b = document.querySelector('[data-review-next]') as HTMLElement; fireEvent.click(b); } };

  it('mensal: evidência "feitas de", 5 passos e grava o que foi escolhido', async () => {
    const p = comObjetivo();
    const offer = reviewOffer(p, new Date(2026, 1, 2))!;
    const onComplete = vi.fn();
    render(<GoalReviewSheet open onClose={() => {}} language="en-US" purpose={p} offer={offer} names={new Map(acts.map(a => [a.id, a]))} onComplete={onComplete} />);
    expect(document.querySelector('[data-review-step="evidence"]')!.textContent).toContain('18 of 22');
    expect(document.querySelector('[data-review-step="evidence"]')!.textContent).toContain('On the others, what happened?');
    fireEvent.click(document.querySelector('[data-review-next]')!);
    fireEvent.click(screen.getByRole('button', { name: 'Yes, closer' }));
    fireEvent.click(document.querySelector('[data-review-next]')!);
    fireEvent.click(screen.getByRole('button', { name: 'Low energy' }));
    fireEvent.click(document.querySelector('[data-review-next]')!);
    fireEvent.click(screen.getByRole('button', { name: 'Keep it as it is' }));
    fireEvent.click(document.querySelector('[data-review-next]')!);
    expect(document.querySelector('[data-review-step="next"]')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Next month goal (optional)'), { target: { value: 'Correr 3x' } });
    fireEvent.click(document.querySelector('[data-review-next]')!); // Finish
    const input = onComplete.mock.calls[0][0];
    expect(input).toMatchObject({ perceived: 'closer', obstacles: ['energy'], decision: 'keep', nextMilestone: 'Correr 3x' });
  });

  it('mensal sem registro diz isso com calma, e dá para concluir sem responder nada', async () => {
    const p = { ...comObjetivo(), monthlyAgg: {} };
    const offer = reviewOffer(p, new Date(2026, 1, 2))!;
    const onComplete = vi.fn();
    render(<GoalReviewSheet open onClose={() => {}} language="pt-BR" purpose={p} offer={offer} names={new Map()} onComplete={onComplete} />);
    expect(document.body.textContent).toContain('Não há registro deste mês.');
    await passos();
    fireEvent.click(document.querySelector('[data-review-next]')!);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('semestral tem o passo "o que mudou em você?" e avisa do presente; anual oferece arquivar', async () => {
    const p = comObjetivo();
    const sem = reviewOffer(p, new Date(2026, 6, 2))!;
    expect(sem.kind).toBe('semester');
    const { unmount } = render(<GoalReviewSheet open onClose={() => {}} language="en-US" purpose={p} offer={sem} names={new Map()} onComplete={() => {}} />);
    for (let i = 0; i < 3; i++) fireEvent.click(document.querySelector('[data-review-next]')!);
    expect(document.querySelector('[data-review-step="note"]')).toBeTruthy();
    for (let i = 0; i < 2; i++) fireEvent.click(document.querySelector('[data-review-next]')!);
    expect(document.body.textContent).toContain('A gift for your Soulmon');
    unmount();
    const ano = reviewOffer(p, new Date(2027, 0, 2))!;
    expect(ano.kind).toBe('year');
    render(<GoalReviewSheet open onClose={() => {}} language="en-US" purpose={p} offer={ano} names={new Map()} onComplete={() => {}} />);
    for (let i = 0; i < 4; i++) fireEvent.click(document.querySelector('[data-review-next]')!);
    expect(screen.getByRole('button', { name: 'Keep this goal and start another' })).toBeTruthy();
  });
});

describe('as 3 cartas depois do onboarding (PLANO §2b)', () => {
  it('"Meu objetivo" tem a troca de carta livre', () => {
    const onSwitchCard = vi.fn();
    render(<MeuObjetivoSheet open onClose={() => {}} language="en-US" purpose={{ ...comObjetivo(), path: 'ambicao' }} activities={acts} onSave={() => {}} onSwitchCard={onSwitchCard} />);
    fireEvent.click(document.querySelector('[data-switch-card]')!);
    expect(onSwitchCard).toHaveBeenCalledTimes(1);
  });

  it('PathSwitchSheet: mostra a carta atual e a escolha devolve o caminho', () => {
    const onChoose = vi.fn();
    render(<PathSwitchSheet open onClose={() => {}} language="en-US" current="satisfacao" onChoose={onChoose} />);
    expect(document.body.textContent).toContain('Your card: Contentment');
    fireEvent.click(document.querySelector('[data-path-card="ressurgimento"]')!);
    fireEvent.click(document.querySelector('[data-path-choose]')!);
    expect(onChoose).toHaveBeenCalledWith('ressurgimento');
  });

  it('TaskSuggestionsSheet: tudo vem marcado, desmarcar tira, "Adicionar" entrega só o mantido; sem itens diz que não há nada', () => {
    const onAdd = vi.fn();
    const items = ACTIVITY_CATALOG_ITEMS.slice(0, 3);
    const { unmount } = render(<TaskSuggestionsSheet open onClose={() => {}} language="en-US" items={items} title="Let us go slowly" onAdd={onAdd} />);
    const chips = Array.from(document.querySelectorAll('[data-suggest-list] button')) as HTMLElement[];
    expect(chips).toHaveLength(3);
    fireEvent.click(chips[0]);
    fireEvent.click(document.querySelector('[data-suggest-add]')!);
    expect(onAdd.mock.calls[0][0].map((i: { id: string }) => i.id)).toEqual(items.slice(1).map(i => i.id));
    unmount();
    render(<TaskSuggestionsSheet open onClose={() => {}} language="en-US" items={[]} title="x" onAdd={onAdd} />);
    expect(document.body.textContent).toContain('Nothing new to suggest right now.');
  });

  it('revisão: o passo "Você quer rever suas tarefas?" aparece (askTasks) e só a Ambição tem "meus planos mudaram"', () => {
    const run = (path: 'ambicao' | 'satisfacao') => {
      const p = { ...comObjetivo(), path };
      const offer = reviewOffer(p, new Date(2026, 1, 2))!;
      const onComplete = vi.fn();
      const { unmount } = render(<GoalReviewSheet open onClose={() => {}} language="en-US" purpose={p} offer={offer} names={new Map()} onComplete={onComplete} askTasks />);
      for (let i = 0; i < 4; i++) fireEvent.click(document.querySelector('[data-review-next]')!);
      expect(document.querySelector('[data-review-step="tasks"]')).toBeTruthy();
      expect(document.body.textContent).toContain('Do you want to look over your tasks?');
      const mudou = screen.queryByRole('button', { name: 'My plans have changed' });
      if (path === 'ambicao') {
        fireEvent.click(mudou!);
        fireEvent.click(document.querySelector('[data-review-next]')!);
      } else {
        expect(mudou).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Yes, let us look' }));
        fireEvent.click(document.querySelector('[data-review-next]')!);
      }
      fireEvent.click(document.querySelector('[data-review-next]')!);
      const input = onComplete.mock.calls[0][0];
      unmount();
      return input;
    };
    expect(run('ambicao')).toMatchObject({ reviewTasks: false, plansChanged: true });
    expect(run('satisfacao')).toMatchObject({ reviewTasks: true });
    expect(run('satisfacao').plansChanged).toBeUndefined();
  });

  it('sem askTasks o passo não existe', () => {
    const p = comObjetivo();
    const offer = reviewOffer(p, new Date(2026, 1, 2))!;
    render(<GoalReviewSheet open onClose={() => {}} language="en-US" purpose={p} offer={offer} names={new Map()} onComplete={() => {}} />);
    for (let i = 0; i < 4; i++) fireEvent.click(document.querySelector('[data-review-next]')!);
    expect(document.querySelector('[data-review-step="tasks"]')).toBeNull();
    expect(document.querySelector('[data-review-step="next"]')).toBeTruthy();
  });
});
