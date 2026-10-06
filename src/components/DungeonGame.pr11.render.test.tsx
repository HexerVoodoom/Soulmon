// @vitest-environment jsdom
/**
 * MASMORRA — círculo de cast do especial pela tela (PR11, run `combate-v3-01`). O núcleo roda de VERDADE;
 * o envoltório só põe a energia cheia no começo da luta para o especial sair já.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';

const H = vi.hoisted(() => ({ startEnergy: [] as (number | undefined)[], calls: 0, cheerSeen: 0, hpStart: [] as number[], enStart: [] as number[] }));

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never, opts: never) {
      H.calls++;
      const o = opts as { startHp?: number; startEnergy?: number; cheerDrain?: () => number };
      H.hpStart.push(o.startHp ?? -1);
      H.enStart.push(o.startEnergy ?? -1);
      const drain = o.cheerDrain;
      const g = real.groupFightSteps(player, foes, { ...o, startEnergy: H.startEnergy[H.calls - 1] ?? o.startEnergy, cheerDrain: drain ? () => { const k = drain(); H.cheerSeen += k; return k; } : undefined } as never);
      let r = g.next();
      while (!r.done) {
        const ans: number | undefined = yield r.value;
        r = g.next(ans);
      }
      return r.value;
    },
  };
});
vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
  Object.assign(H, { startEnergy: [], calls: 0, cheerSeen: 0, hpStart: [], enStart: [] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

function montar(extra: { onLose?: () => void; onEnemyDefeated?: () => void; language?: 'pt-BR' | 'en-US' } = {}) {
  return renderWithCss(
    <DungeonGame
      evolutionStage="rookie"
      language={extra.language ?? 'pt-BR'}
      petElement="fogo"
      onEnter={() => ({ ok: true, level: 1, best: 0 })}
      onLose={extra.onLose ?? (() => {})}
      onHeartDrop={() => false}
      onGlitchtama={() => {}}
      onEnemyDefeated={extra.onEnemyDefeated ?? (() => {})}
      onEarnPoints={() => {}}
      onExit={() => {}}
    />,
  );
}
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const descer = () => fireEvent.click(screen.getByRole('button', { name: 'Descer' }));
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
/** Corre o relógio até aparecer o cartão do inimigo derrotado (ou estourar o limite). */
async function ateInimigoCair(limiteMs = 120_000) {
  for (let t = 0; t < limiteMs; t += 500) {
    await avancar(500);
    if (screen.queryByText(/parou de insistir|stopped holding/)) return true;
  }
  return false;
}


describe('Masmorra — círculo de cast (PR11)', () => {
  it('o especial do pet (energia cheia) mostra o círculo de cast depois do anel; o golpe básico não tem', async () => {
    vi.useFakeTimers();
    H.startEnergy = [100];
    montar();
    descer();
    await avancar(10);
    expect(document.querySelector('[data-stage-cast]')).toBeNull();
    for (let t = 0; t < 5000 && !document.querySelector('[data-stage-ring]'); t += 100) await avancar(100);
    const ring = document.querySelector('[data-stage-ring]') as HTMLElement;
    expect(ring).not.toBeNull();
    await avancar(Number(ring.getAttribute('data-ring-target')));
    fireEvent.pointerDown(document.body);
    await avancar(50);
    expect(document.querySelector('[data-stage-cast="special"]')).not.toBeNull();
  });
});
