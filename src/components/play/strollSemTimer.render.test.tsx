// @vitest-environment jsdom
/**
 * O PASSEIO SEM TIMER (REGISTRO §413, pedido do dono, 16/11/2026): o "Concluir" abre assim que a missão é escolhida (a espera saiu), e
 * escolher avisa quem abriu a folha (`onPicked`, que fecha o modal e mostra "Tarefa criada"). Concluir passa pelo `onDone` do App
 * (cena + recompensas na hora); sem ele, só grava o "Fiz".
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { PasseioSheet } from './PasseioSheet';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import { dailyOffer, markDone, pickMission } from '../../utils/travessias';

const DAY = '2026-10-07';
const T0 = Date.UTC(2026, 9, 7, 12, 0, 0);
const pegada = (): CrossingsState => {
  const m = dailyOffer(DAY, 'seed')[0];
  return pickMission(CROSSINGS_EMPTY, DAY, 'seed', m.region.id, m.challenge.id, T0);
};

afterEach(cleanup);

describe('markDone sem espera', () => {
  it('conclui no mesmo instante da escolha, uma vez só por dia', () => {
    const c = pegada();
    const feito = markDone(c, DAY, T0);
    expect(feito.doneDay).toBe(DAY);
    expect(feito.score).toBe(1);
    expect(markDone(feito, DAY, T0 + 1)).toBe(feito);
  });
});

describe('PasseioSheet sem contagem', () => {
  it('o botão "Concluir" nasce aberto, sem MM:SS, e chama o onDone do App', () => {
    const onDone = vi.fn();
    const onChange = vi.fn();
    const { container } = render(<PasseioSheet language="pt-BR" crossings={pegada()} onChange={onChange} onDone={onDone} todayKey={DAY} seed="seed" now={T0} />);
    const btn = container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('Concluir');
    fireEvent.click(btn);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sem onDone, cai no "Fiz" puro (onChange)', () => {
    const onChange = vi.fn();
    const { container } = render(<PasseioSheet language="en-US" crossings={pegada()} onChange={onChange} todayKey={DAY} seed="seed" now={T0} />);
    fireEvent.click(container.querySelector('[data-travessia-fiz]') as HTMLButtonElement);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('escolher a missão avisa o onPicked (fecha a folha e sobe "Tarefa criada")', () => {
    const onPicked = vi.fn();
    const onChange = vi.fn();
    const m = dailyOffer(DAY, 'seed')[0];
    const { container } = render(<PasseioSheet language="en-US" crossings={CROSSINGS_EMPTY} onChange={onChange} onPicked={onPicked} todayKey={DAY} seed="seed" now={T0} />);
    fireEvent.click(container.querySelector(`[data-travessia-abrir="${m.challenge.id}"]`) as HTMLButtonElement);
    fireEvent.click(container.querySelector(`[data-travessia-escolher="${m.challenge.id}"]`) as HTMLButtonElement);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onPicked).toHaveBeenCalledTimes(1);
  });

  it('o card concluído mostra "Done today" e trava; regiões guardadas seguem listadas', () => {
    const feito = markDone(pegada(), DAY, T0);
    const { container } = render(<PasseioSheet language="en-US" crossings={{ ...feito, pending: ['floresta'] }} onChange={() => {}} todayKey={DAY} seed="seed" now={T0} />);
    const btn = container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn.textContent).toBe('Done today');
    expect(btn.disabled).toBe(true);
    expect(container.querySelector('[data-travessia-pendente]')).not.toBeNull();
  });
});
