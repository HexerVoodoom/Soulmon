// @vitest-environment jsdom
/**
 * O PASSEIO LEVA UM TEMPO (07/10/2026, pedido do dono): depois de PEGAR a missão,
 * o "Concluir" só abre passados `STROLL_MIN_MINUTES`. O instante de partida é o
 * `pickAt` do save (já sincroniza com a nuvem). Relógio falso: nada de espera real.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { PasseioSheet, formatEspera } from './PasseioSheet';
import { CROSSINGS_EMPTY, STROLL_MIN_MINUTES, STROLL_MIN_MS, type CrossingsState } from '../../types/travessias';
import { dailyOffer, markDone, pickMission, strollWaitMs } from '../../utils/travessias';

const DAY = '2026-10-07';
const T0 = Date.UTC(2026, 9, 7, 12, 0, 0);

function pegada(): CrossingsState {
  const m = dailyOffer(DAY, 'seed')[0];
  return pickMission(CROSSINGS_EMPTY, DAY, 'seed', m.region.id, m.challenge.id, T0);
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('strollWaitMs / markDone', () => {
  it('a constante mora num lugar só: 30 min', () => {
    expect(STROLL_MIN_MINUTES).toBe(30);
    expect(STROLL_MIN_MS).toBe(30 * 60 * 1000);
  });
  it('antes dos 30 min: recusa e devolve o MESMO estado; depois: conclui', () => {
    const c = pegada();
    expect(c.pickAt).toBe(T0);
    expect(strollWaitMs(c, T0)).toBe(STROLL_MIN_MS);
    expect(strollWaitMs(c, T0 + STROLL_MIN_MS - 1)).toBe(1);
    expect(markDone(c, DAY, T0 + STROLL_MIN_MS - 1)).toBe(c);
    const feito = markDone(c, DAY, T0 + STROLL_MIN_MS);
    expect(feito.doneDay).toBe(DAY);
    expect(feito.score).toBe(1);
  });
  it('save antigo (sem pickAt) não espera nada', () => {
    const c = { ...pegada(), pickAt: null };
    expect(strollWaitMs(c, T0)).toBe(0);
    expect(markDone(c, DAY, T0).doneDay).toBe(DAY);
  });
});

describe('PasseioSheet — contagem no botão', () => {
  it('formato MM:SS', () => {
    expect(formatEspera(28 * 60_000 + 40_000)).toBe('28:40');
    expect(formatEspera(1)).toBe('00:01');
  });

  it('o botão "Done · mm:ss" fica desabilitado enquanto o relógio corre e abre aos 30 min (relógio falso)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0 + 80_000); // 1:20 depois de pegar → faltam 28:40
    const onChange = vi.fn();
    const { container } = render(
      <PasseioSheet language="en-US" crossings={pegada()} onChange={onChange} todayKey={DAY} seed="seed" />,
    );
    const btn = container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('Done · 28:40');
    fireEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
    // sem cobrança: nenhuma palavra de pressa
    expect(container.querySelector('[data-travessia-tempo]')!.textContent).not.toMatch(/hurry|late|behind|must|only/i);

    act(() => { vi.advanceTimersByTime(28 * 60_000 + 40_000); });
    const aberto = container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(aberto.textContent).toBe('Done');
    expect(aberto.disabled).toBe(false);
    fireEvent.click(aberto);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('PT-BR: "Concluir · mm:ss" antes; "Concluir" depois', () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0 + 60_000);
    const { container } = render(
      <PasseioSheet language="pt-BR" crossings={pegada()} onChange={() => {}} todayKey={DAY} seed="seed" />,
    );
    const btn = () => container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn().textContent).toBe('Concluir · 29:00');
    expect(btn().disabled).toBe(true);
    act(() => { vi.advanceTimersByTime(30 * 60_000); });
    expect(btn().textContent).toBe('Concluir');
  });

  it('o card concluído mostra "Done today" e o botão trava', () => {
    const feito = markDone(pegada(), DAY, T0 + STROLL_MIN_MS);
    const { container } = render(<PasseioSheet language="en-US" crossings={feito} onChange={() => {}} todayKey={DAY} seed="seed" now={T0 + STROLL_MIN_MS} />);
    const btn = container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn.textContent).toBe('Done today');
    expect(btn.disabled).toBe(true);
  });

  it('o lote traz de volta a linha "abre amanhã" das regiões guardadas e o registro', () => {
    const c = { ...CROSSINGS_EMPTY, pending: ['floresta' as const] };
    const { container } = render(<PasseioSheet language="en-US" crossings={c} onChange={() => {}} todayKey={DAY} seed="seed" now={T0} />);
    expect(container.textContent).toMatch(/opens tomorrow/i);
    expect(container.querySelector('[data-travessia-pendente]')).not.toBeNull();
  });
});
