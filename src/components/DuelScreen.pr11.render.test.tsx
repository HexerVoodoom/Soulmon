// @vitest-environment jsdom
/**
 * DUELO — círculo de cast e status pela tela (PR11, run `combate-v3-01`). O núcleo (PR5) roda de VERDADE com a ficha do
 * servidor: o círculo de cast só existe com o especial; o status (família não-direta) é a dobra dos eventos já chegados.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { simulatePvp, DUEL_CHEER_BUCKETS, type DuelSide } from '../utils/combate/duel';
import { PVP_HP_SCALE } from '../utils/combate/fight';
import { CHEER, specialOf } from '../utils/combate/specials';
import { duelSide } from '../../functions/api/_duel.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const SEED = 123;
const lado = (perfectDays = 3, evolutionStage = 'rookie'): DuelSide => duelSide({ evolutionStage, perfectDays }) as unknown as DuelSide;

/** A 1ª semente em que OS DOIS soltam o especial antes do 1º nocaute (para ver a forma do especial de cada um). */
function sementeComEspecialDosDois(): number {
  for (let s = 1; s < 2000; s++) {
    const ev = simulatePvp({ me: lado(), opp: lado(), seed: s, taps: [] }).events;
    const ko = ev.findIndex(e => e.kind === 'ko');
    const ate = ev.slice(0, ko);
    if (ate.some(e => e.kind === 'cast' && e.side === 0) && ate.some(e => e.kind === 'cast' && e.side === 1)) return s;
  }
  throw new Error('nenhuma semente com o especial dos dois');
}

function montar(onDone = vi.fn(), onClose = vi.fn(), oppElement = 'agua', me: DuelSide = lado(), opp: DuelSide = lado(), seed = SEED) {
  const r = render(<DuelScreen me={me} opp={opp} seed={seed} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement="fogo" oppElement={oppElement} onDone={onDone} onClose={onClose} />);
  const camada = () => r.container.querySelector('[data-torcida-layer]') as HTMLElement;
  return { onDone, onClose, camada };
}
/** Corre o relógio de 300 em 300 ms até a luta terminar; devolve o tempo gasto (ms). */
const correr = (onDone: ReturnType<typeof vi.fn>) => {
  let t = 0;
  for (let i = 0; i < 600 && !onDone.mock.calls.length; i++) { act(() => { vi.advanceTimersByTime(300); }); t += 300; }
  return t;
};
const gauge = () => document.querySelector('[data-cheer-mascot]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');


const status = () => [...document.querySelectorAll('[data-stage-status]')].map(e => e.getAttribute('aria-label'));
/** Corre o relógio de 100 em 100 ms e coleta o que `ver` leu a cada passo, até a luta terminar. */
function observar(onDone: ReturnType<typeof vi.fn>, ver: () => void) {
  for (let i = 0; i < 1200 && !onDone.mock.calls.length; i++) { act(() => { vi.advanceTimersByTime(100); }); ver(); }
}

describe('DuelScreen — círculo de cast e status (PR11)', () => {
  it('o especial (dele e do pet) mostra o círculo de cast só junto do selo do especial; o golpe básico não; dano direto não deixa status', () => {
    vi.useFakeTimers();
    const { onDone } = montar(vi.fn(), vi.fn(), 'agua', lado(), lado(), sementeComEspecialDosDois());
    let viuCast = false;
    let viuBasicoSemCast = false;
    observar(onDone, () => {
      const cast = document.querySelector('[data-stage-cast="special"]') !== null;
      const especial = document.querySelector('[data-stage-special]') !== null;
      if (cast) viuCast = true;
      expect(cast, 'o círculo só existe com o selo do especial').toBe(especial);
      if (!cast && document.querySelector('[data-stage-fx]')) viuBasicoSemCast = true;
      expect(document.querySelector('[data-stage-status]')).toBeNull();
    });
    expect(viuCast).toBe(true);
    expect(viuBasicoSemCast).toBe(true);
  });

  it('o status vem dos eventos: a família atkBuff do pet deixa o selo "Ataque em alta" depois do cast, e ele gasta até sumir', () => {
    vi.useFakeTimers();
    const me = { ...lado(), special: specialOf('atkBuff') } as DuelSide;
    const opp = lado();
    const seed = (() => { for (let s = 1; s < 2000; s++) { if (simulatePvp({ me, opp, seed: s, taps: [] }).events.some(e => e.kind === 'cast' && e.side === 0)) return s; } throw new Error('sem cast'); })();
    const { onDone } = montar(vi.fn(), vi.fn(), 'agua', me, opp, seed);
    const vistos = new Set<string>();
    observar(onDone, () => { for (const l of status()) vistos.add(l ?? ''); });
    expect([...vistos].some(l => /^Ataque em alta, 3 turnos$/.test(l))).toBe(true);
    expect(status()).toEqual([]); // no fim da luta (o pet ou o rival caiu): nenhum selo
  });
});
