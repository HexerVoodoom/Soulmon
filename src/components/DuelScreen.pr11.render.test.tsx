// @vitest-environment jsdom
/** DUELO — círculo de cast do especial pela tela (PR11, run `combate-v3-01`): o PvP não tem status (o especial sai direto), mas o cast vale igual. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { duelStats, simulateDuel, DUEL_TAPS_FULL, DUEL_TAPS_CAP, DUEL_CHEER_WINDOWS, TIMING_CHEER_ENABLED } from '../../functions/api/_duel.js';
import { DUEL_STEP_MS } from '../utils/combatFx';

afterEach(() => { cleanup(); vi.useRealTimers(); });

function montar(onDone = vi.fn(), onClose = vi.fn(), oppElement = 'agua') {
  const s = duelStats({ stage: 'rookie' });
  const r = render(<DuelScreen me={s} opp={s} seed={123} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement="fogo" oppElement={oppElement} onDone={onDone} onClose={onClose} />);
  const camada = () => r.container.querySelector('[data-torcida-layer]') as HTMLElement;
  return { onDone, onClose, camada };
}
/** Corre o relógio de 300 em 300 ms até a luta terminar; devolve o tempo gasto (ms). */
const correr = (onDone: ReturnType<typeof vi.fn>) => {
  let t = 0;
  for (let i = 0; i < 400 && !onDone.mock.calls.length; i++) { act(() => { vi.advanceTimersByTime(300); }); t += 300; }
  return t;
};
const gauge = () => document.querySelector('[data-torcida-gauge]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');


describe('DuelScreen — círculo de cast (PR11)', () => {
  it('o especial (dele e do pet) mostra o círculo de cast; o golpe básico não; e o duelo não desenha nenhum selo de status', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    let viuCast = false;
    let viuBasicoSemCast = false;
    for (let i = 0; i < 600 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(100); });
      const cast = document.querySelector('[data-stage-cast="special"]') !== null;
      const especial = document.querySelector('[data-stage-special]') !== null;
      if (cast) viuCast = true;
      expect(cast, 'o círculo só existe com o selo do especial').toBe(especial);
      if (!cast && document.querySelector('[data-stage-fx]') && !especial) viuBasicoSemCast = true;
      expect(document.querySelector('[data-stage-status]')).toBeNull();
    }
    expect(viuCast).toBe(true);
    expect(viuBasicoSemCast).toBe(true);
  });
});
