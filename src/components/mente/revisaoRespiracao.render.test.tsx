// @vitest-environment jsdom
/**
 * Revisão da Malha e Respiração com o pet — a fiação que o App vai usar:
 * o cartão novo chega pelo `onReviewChange`, a sessão paga 5 Bits UMA vez por
 * dia e a Respiração não tem por onde pagar nada (e mostra a nota de crise).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { RevisaoGame } from './RevisaoGame';
import { RespiracaoGame } from '../refugio/RespiracaoGame';
import { REVIEW_EMPTY, REVIEW_SESSION_BITS, addCard, type ReviewState } from '../../utils/mente/revisao';

const HOJE = '2026-09-30';

function Harness({ initial, onChange, onEarn, lang = 'pt-BR' }: {
  initial: ReviewState; onChange: (s: ReviewState) => void; onEarn: (n: number) => void; lang?: 'pt-BR' | 'en-US';
}) {
  const [review, setReview] = useState(initial);
  return (
    <RevisaoGame
      language={lang}
      evolutionStage="rookie"
      onExit={() => {}}
      onEarnPoints={onEarn}
      todayKey={HOJE}
      review={review}
      onReviewChange={(n) => { onChange(n); setReview(n); }}
    />
  );
}

const q = <T extends Element = HTMLElement>(c: HTMLElement, sel: string) => {
  const el = c.querySelector<T & Element>(sel);
  expect(el, sel).toBeTruthy();
  return el as unknown as T;
};

describe('RevisaoGame', () => {
  it('sem cartões: mensagem neutra, sem "faltam"/"atrasado", sem botão de começar', () => {
    const { container } = renderWithCss(<Harness initial={REVIEW_EMPTY} onChange={vi.fn()} onEarn={vi.fn()} />);
    const due = q(container, '[data-revisao-due]');
    expect(due.textContent).toContain('Nada para revisar hoje');
    expect(container.textContent).not.toMatch(/faltam|atrasad/i);
    expect(container.querySelector('[data-revisao-start]')).toBeNull();
  });

  it('adicionar um cartão chama onReviewChange com ele (texto puro)', () => {
    const onChange = vi.fn();
    const { container } = renderWithCss(<Harness initial={REVIEW_EMPTY} onChange={onChange} onEarn={vi.fn()} />);
    fireEvent.click(q(container, '[data-revisao-cards]'));
    fireEvent.click(q(container, '[data-revisao-new]'));
    const front = q<HTMLTextAreaElement>(container, '[data-revisao-front]');
    expect(front.maxLength).toBe(140);
    expect(container.querySelector(`label[for="${front.id}"]`)).toBeTruthy();
    fireEvent.change(front, { target: { value: '<b>capital da França?</b>' } });
    fireEvent.change(q(container, '[data-revisao-back]'), { target: { value: 'Paris' } });
    fireEvent.click(q(container, '[data-revisao-save]'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as ReviewState;
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]).toMatchObject({ front: '<b>capital da França?</b>', back: 'Paris', box: 1, due: HOJE });
    // Renderizado como texto, nunca HTML.
    expect(container.querySelector('li b')).toBeNull();
    expect(container.textContent).toContain('<b>capital da França?</b>');
  });

  it('apagar pede confirmação', () => {
    const onChange = vi.fn();
    const initial = addCard(REVIEW_EMPTY, 'a', 'b', HOJE, 'x');
    const { container } = renderWithCss(<Harness initial={initial} onChange={onChange} onEarn={vi.fn()} />);
    fireEvent.click(q(container, '[data-revisao-cards]'));
    fireEvent.click(q(container, '[data-revisao-delete]'));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(q(container, '[data-revisao-delete-confirm]'));
    expect((onChange.mock.calls[0][0] as ReviewState).cards).toHaveLength(0);
  });

  it('a sessão paga 5 Bits na primeira do dia, e 0 na segunda', () => {
    const onEarn = vi.fn();
    const onChange = vi.fn();
    let s = addCard(REVIEW_EMPTY, 'um', '1', HOJE, 'a');
    s = addCard(s, 'dois', '2', HOJE, 'b');
    const { container } = renderWithCss(<Harness initial={s} onChange={onChange} onEarn={onEarn} />);
    expect(q(container, '[data-revisao-due]').textContent).toBe('2 cartões para hoje');
    fireEvent.click(q(container, '[data-revisao-start]'));
    expect(q(container, '[data-revisao-q]').textContent).toBe('um');
    expect(container.querySelector('[data-revisao-a]')).toBeNull();
    fireEvent.click(q(container, '[data-revisao-reveal]'));
    expect(q(container, '[data-revisao-a]').textContent).toBe('1');
    fireEvent.click(q(container, '[data-revisao-yes]'));
    fireEvent.click(q(container, '[data-revisao-reveal]'));
    fireEvent.click(q(container, '[data-revisao-no]'));
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(REVIEW_SESSION_BITS);
    const final = onChange.mock.calls.at(-1)![0] as ReviewState;
    expect(final.lastSessionDay).toBe(HOJE);
    expect(final.cards.find(c => c.id === 'a')).toMatchObject({ box: 2 });
    expect(final.cards.find(c => c.id === 'b')).toMatchObject({ box: 1, due: '2026-10-01' });
    expect(q(container, '[data-revisao-done]').textContent).toContain('+5 Bits');
  });

  it('os dois botões de resposta têm a mesma tinta', () => {
    const s = addCard(REVIEW_EMPTY, 'um', '1', HOJE, 'a');
    const { container } = renderWithCss(<Harness initial={s} onChange={vi.fn()} onEarn={vi.fn()} lang="en-US" />);
    expect(q(container, '[data-revisao-due]').textContent).toBe('1 card for today');
    fireEvent.click(q(container, '[data-revisao-start]'));
    fireEvent.click(q(container, '[data-revisao-reveal]'));
    const yes = q<HTMLButtonElement>(container, '[data-revisao-yes]');
    const no = q<HTMLButtonElement>(container, '[data-revisao-no]');
    expect(yes.style.color).toBe(no.style.color);
    expect(yes.style.backgroundColor).toBe(no.style.backgroundColor);
    expect(no.textContent).toBe('Not yet');
  });

  it('segunda sessão no mesmo dia não paga', () => {
    const onEarn = vi.fn();
    const s: ReviewState = { ...addCard(REVIEW_EMPTY, 'um', '1', HOJE, 'a'), lastSessionDay: HOJE };
    const { container } = renderWithCss(<Harness initial={s} onChange={vi.fn()} onEarn={onEarn} />);
    fireEvent.click(q(container, '[data-revisao-start]'));
    fireEvent.click(q(container, '[data-revisao-reveal]'));
    fireEvent.click(q(container, '[data-revisao-yes]'));
    expect(onEarn).not.toHaveBeenCalled();
    expect(q(container, '[data-revisao-done]').textContent).not.toContain('Bits');
  });
});

describe('RespiracaoGame', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('nota de crise em PT e EN, visível já na primeira tela', () => {
    const pt = renderWithCss(<RespiracaoGame language="pt-BR" evolutionStage="rookie" onExit={() => {}} />);
    expect(q(pt.container, '[data-respiracao-crisis]').textContent).toContain('CVV, 188');
    pt.unmount();
    const en = renderWithCss(<RespiracaoGame language="en-US" evolutionStage="rookie" onExit={() => {}} />);
    const note = q(en.container, '[data-respiracao-crisis]').textContent!;
    expect(note).toContain('988');
    expect(note).toContain('116 123');
  });

  it('roda sozinha, sem toque, até a despedida — e continua mostrando a nota', () => {
    vi.useFakeTimers();
    const { container } = renderWithCss(<RespiracaoGame language="pt-BR" evolutionStage="rookie" onExit={() => {}} />);
    fireEvent.click(q(container, '[data-respiracao-start]'));
    expect(q(container, '[data-respiracao-phase]').textContent).toBe('Inspire');
    act(() => { vi.advanceTimersByTime(5000); });
    expect(q(container, '[data-respiracao-phase]').textContent).toBe('Expire');
    expect(q(container, '[data-respiracao-crisis]')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(q(container, '[data-respiracao-done]').textContent).toBe('Tudo bem. Volte quando precisar.');
    expect(container.textContent).not.toMatch(/Bits|pontos|score/i);
  });

  it('J6: segurar o botão ENCHE da esquerda para a direita na inspiração e ESVAZIA na expiração; soltar zera', () => {
    vi.useFakeTimers();
    const { container } = renderWithCss(<RespiracaoGame language="en-US" evolutionStage="rookie" onExit={() => {}} />);
    fireEvent.click(q(container, '[data-respiracao-start]'));
    const hold = q(container, '[data-respiracao-hold]');
    const fill = () => q<HTMLElement>(container, '[data-respiracao-hold-fill]').style.width;
    expect(hold.textContent).toBe('Hold while you breathe (optional)');
    expect(fill()).toBe('0%'); // sem toque, vazio
    fireEvent.pointerDown(hold);
    act(() => { vi.advanceTimersByTime(2000); }); // calma: inspira 4 s → ~50%
    const meio = parseInt(fill(), 10);
    expect(meio).toBeGreaterThan(35); expect(meio).toBeLessThan(65);
    act(() => { vi.advanceTimersByTime(2000); }); // fim da inspiração → ~100%
    expect(parseInt(fill(), 10)).toBeGreaterThanOrEqual(95);
    act(() => { vi.advanceTimersByTime(3000); }); // meio da expiração (6 s) → ~50%
    const sai = parseInt(fill(), 10);
    expect(sai).toBeGreaterThan(35); expect(sai).toBeLessThan(65);
    fireEvent.pointerUp(hold);
    expect(fill()).toBe('0%'); // soltou: para
    act(() => { vi.advanceTimersByTime(1000); });
    expect(fill()).toBe('0%');
  });

  it('J6: o rótulo do botão em PT-BR', () => {
    vi.useFakeTimers();
    const { container } = renderWithCss(<RespiracaoGame language="pt-BR" evolutionStage="rookie" onExit={() => {}} />);
    fireEvent.click(q(container, '[data-respiracao-start]'));
    expect(q(container, '[data-respiracao-hold]').textContent).toBe('Segure enquanto respira (opcional)');
  });

  it('não expõe onEarnPoints nem importa som (guard de fonte)', () => {
    const src = readFileSync(resolve(__dirname, '../refugio/RespiracaoGame.tsx'), 'utf8');
    expect(src).not.toMatch(/onEarnPoints|EarningGameProps/);
    expect(src).not.toMatch(/utils\/sounds/);
    expect(src).not.toMatch(/terapia|therapy|tratamento|treatment|\bcura\b|\bcure\b/i);
    const rev = readFileSync(resolve(__dirname, './RevisaoGame.tsx'), 'utf8');
    expect(rev).not.toMatch(/utils\/sounds|dangerouslySetInnerHTML/);
  });
});
