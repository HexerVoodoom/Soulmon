// @vitest-environment jsdom
/**
 * O tour do corvo: o fluxo inteiro (Next até o fim), Skip em qualquer passo,
 * Esc, a11y do diálogo, conteúdo sem cobrança e sem número escrito à mão.
 * A fiação no App (flag gravada uma vez, replay sem marca) é guard de fonte em
 * `filaDeAvisos.contract.test.ts` e foi conferida no navegador.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { WelcomeTour } from './WelcomeTour';
import {
  TOUR_STEPS, TOUR_GUIDE_NAME, TOUR_STARTING_GOAL, needsWelcomeTour, tourText,
} from '../utils/welcomeTour';
import { FORM_REQUIREMENTS } from '../types/progression';
import { AREAS, areaLabel } from '../navigation';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const stepId = (c: HTMLElement) => c.querySelector('[data-welcome-tour]')!.getAttribute('data-step');

describe('WelcomeTour — fluxo', () => {
  it('Next percorre os oito passos na ordem e o último ("Let\'s go") termina como finished', () => {
    const onDone = vi.fn();
    const { container } = render(<WelcomeTour language="en-US" onDone={onDone} />);
    const ids: string[] = [];
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      ids.push(stepId(container)!);
      const next = container.querySelector('[data-wt-next]') as HTMLElement;
      expect(next.textContent).toBe(i === TOUR_STEPS.length - 1 ? "Let's go" : 'Next');
      expect(onDone).not.toHaveBeenCalled();
      fireEvent.click(next);
    }
    expect(ids).toEqual(TOUR_STEPS.map(s => s.id));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith('finished');
  });

  it('Back volta um passo; no primeiro não existe', () => {
    const { container } = render(<WelcomeTour language="en-US" onDone={() => {}} />);
    expect(container.querySelector('[data-wt-back]')).toBeNull();
    fireEvent.click(container.querySelector('[data-wt-next]')!);
    expect(stepId(container)).toBe('tasks');
    fireEvent.click(container.querySelector('[data-wt-back]')!);
    expect(stepId(container)).toBe('hello');
  });

  it('Skip está visível em TODO passo e pula (skipped) sem repetir', () => {
    for (let k = 0; k < TOUR_STEPS.length; k++) {
      const onDone = vi.fn();
      const { container, unmount } = render(<WelcomeTour language="en-US" onDone={onDone} />);
      for (let j = 0; j < k; j++) fireEvent.click(container.querySelector('[data-wt-next]')!);
      const skip = container.querySelector('[data-wt-skip]') as HTMLElement;
      expect(skip).not.toBeNull();
      fireEvent.click(skip);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith('skipped');
      unmount();
    }
  });

  it('Esc pula', () => {
    const onDone = vi.fn();
    render(<WelcomeTour language="en-US" onDone={onDone} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledWith('skipped');
  });

  it('é um diálogo modal nomeado pelo título do passo, com o corvo decorativo', () => {
    const { container } = render(<WelcomeTour language="en-US" onDone={() => {}} />);
    const dlg = screen.getByRole('dialog');
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    const labelId = dlg.getAttribute('aria-labelledby')!;
    expect(container.ownerDocument.getElementById(labelId)!.textContent).toBe('Welcome');
    const raven = container.querySelector('[data-wt-raven]')!;
    expect(raven.getAttribute('alt')).toBe('');
    expect(container.textContent).toContain(TOUR_GUIDE_NAME);
  });

  it('os passos do mapa listam as SEIS áreas, na ordem do mapa e com o nome real', () => {
    const rows = TOUR_STEPS.flatMap(s => s.areas ?? []).map(a => a.name.en);
    expect(rows).toEqual(['laboratorio', 'mercado', 'arena', 'jogos', 'exploracao', 'hall'].map(id => areaLabel(id as typeof AREAS[number], false)));
    expect(new Set(rows).size).toBe(AREAS.length);
  });
});

describe('WelcomeTour — conteúdo', () => {
  const todos = TOUR_STEPS.flatMap(s => [s.title.en, s.speech.en, ...(s.areas ?? []).flatMap(a => [a.name.en, a.line.en])]);

  it('sem vocabulário vetado nem verbo de cobrança', () => {
    const vetado = /tamer|domador|treinador|digievolu|digital world|mundo digital|virus|vaccine|vacina|streak|deserve|good job|well done|you must|you should|you failed|penalt|punish|debt/i;
    for (const t of todos) expect(t).not.toMatch(vetado);
  });

  it('é inglês: nenhuma string só-português, e o pt-BR cai no inglês por enquanto', () => {
    for (const s of TOUR_STEPS) {
      expect(s.speech.pt).toBeUndefined();
      expect(tourText(s.speech, 'pt-BR')).toBe(s.speech.en);
      expect(tourText(s.speech, 'en-US')).toBe(s.speech.en);
    }
    expect(tourText({ en: 'a', pt: 'b' }, 'pt-BR')).toBe('b');
  });

  it('o número da meta vem da constante, não de texto à mão', () => {
    expect(TOUR_STARTING_GOAL).toBe(FORM_REQUIREMENTS.rookie.required);
    expect(TOUR_STEPS.find(s => s.id === 'why')!.speech.en).toContain(`about ${FORM_REQUIREMENTS.rookie.required} tasks`);
    const fonte = readFileSync('src/utils/welcomeTour.ts', 'utf8');
    expect(fonte).toContain('FORM_REQUIREMENTS.rookie.required');
  });

  it('explica tarefas, evolução manual, Missões e Mochila', () => {
    const txt = todos.join(' ');
    expect(txt).toMatch(/tasks/i);
    expect(txt).toMatch(/evolution/i);
    expect(txt).toMatch(/you pick the moment/i);
    expect(txt).toMatch(/Missions/);
    expect(txt).toMatch(/Bag/);
    expect(txt).toMatch(/Replay|replay/);
  });

  it('a superfície é muda e sem recompensa (R-NOVA)', () => {
    const src = readFileSync('src/components/WelcomeTour.tsx', 'utf8');
    expect(src).not.toMatch(/utils\/sounds|audioBus|trilha|gamePoints|totalXP|setGameState/);
  });
});

describe('needsWelcomeTour', () => {
  it('só quando nunca visto E sem conclusão no save', () => {
    expect(needsWelcomeTour({ shown: false, jaConcluiuAlgo: false })).toBe(true);
    expect(needsWelcomeTour({ shown: true, jaConcluiuAlgo: false })).toBe(false);
    expect(needsWelcomeTour({ shown: false, jaConcluiuAlgo: true })).toBe(false);
  });
});
