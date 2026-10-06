// @vitest-environment jsdom
/**
 * PESADELO — FX de status e círculo de cast pela tela (PR11, run `combate-v3-01`). O núcleo roda de VERDADE:
 * o inimigo com especial `atkBuff` conjura (a esquiva abre), o núcleo devolve o evento e a cena mostra o
 * buff DELE com turnos; os golpes dele gastam os turnos até o selo sumir. O especial do pet mostra o círculo de cast.
 *
 * ⚠️ O núcleo roda de VERDADE. O que o teste instrumenta é a ENTRADA: um envoltório de `groupFightSteps`
 * (`vi.mock`) que põe energia inicial e anota a resposta que a cena deu a cada `cast` (o ponto onde o anel e
 * a esquiva viram multiplicador) e as descargas de cheer que o núcleo recolheu.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { NightmareBattle } from './NightmareBattle';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { RING_MULT } from '../utils/energia';
import type { DungeonEnemy } from '../utils/dungeon';
import { REFERENCE_BUILDS, combatantAt } from '../utils/combate/level';
import { specialOf } from '../utils/combate/specials';
import type { FightSide } from '../utils/combate/fight';

const H = vi.hoisted(() => ({
  startEnergy: [] as (number | undefined)[],
  calls: 0,
  answers: [] as { who: number; ans: number | undefined }[],
  cheerSeen: 0,
}));

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never, opts: never) {
      const n = H.calls++;
      const o = opts as { startEnergy?: number; cheerDrain?: () => number };
      const drain = o.cheerDrain;
      const g = real.groupFightSteps(player, foes, {
        ...o, startEnergy: H.startEnergy[n] ?? o.startEnergy,
        cheerDrain: drain ? () => { const k = drain(); H.cheerSeen += k; return k; } : undefined,
      } as never);
      let r = g.next();
      while (!r.done) {
        const ans: number | undefined = yield r.value;
        if (r.value.kind === 'cast') H.answers.push({ who: r.value.who, ans });
        r = g.next(ans);
      }
      return r.value;
    },
  };
});
vi.mock('../utils/sounds', () => ({ playFeed: vi.fn() }));

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
  Object.assign(H, { startEnergy: [], calls: 0, answers: [], cheerSeen: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

/** Um inimigo do Pesadelo de força declarada (L1, espelho balanceado: `hpMul` × vida, `bonus` de dano, com ou sem especial). */
const foeDe = (o: { hpMul?: number; bonus?: number; special?: boolean } = {}): FightSide => {
  const b = combatantAt(1, REFERENCE_BUILDS.balanced);
  return { combatant: { ...b, hp: b.hp * (o.hpMul ?? 1), bonus: o.bonus ?? -0.95 }, special: o.special ? specialOf('direct') : null };
};
const inimigo = (o: Parameters<typeof foeDe>[0] = {}): DungeonEnemy => ({
  name: 'Sombra', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie, points: 1, slot: 0, floor: 1, foe: foeDe(o),
});

function montar(wave: DungeonEnemy[], cbs: { onWin?: () => void; onLose?: () => void; onClose?: () => void; language?: 'pt-BR' | 'en-US'; profissao?: string } = {}) {
  return render(
    <NightmareBattle
      open wave={wave} rarity="common" petStage="rookie" petElement="fogo" language={cbs.language ?? 'pt-BR'} profissao={cbs.profissao}
      onWin={cbs.onWin ?? (() => {})} onLose={cbs.onLose ?? (() => {})} onClose={cbs.onClose ?? (() => {})}
    />,
  );
}
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const entrar = () => fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
/** Avança de 100 em 100 ms até a condição valer (ou `maxMs`). */
async function ate(cond: () => boolean, maxMs = 60_000) {
  for (let t = 0; t < maxMs && !cond(); t += 100) await avancar(100);
  return cond();
}


describe('Pesadelo — FX de status e cast (PR11)', () => {
  it('o especial do PET (energia cheia) mostra o círculo de cast (`data-stage-cast="special"`); antes dele, e no golpe básico, não', async () => {
    vi.useFakeTimers();
    H.startEnergy = [100];
    montar([inimigo({ hpMul: 6 })]);
    entrar();
    expect(document.querySelector('[data-stage-cast]')).toBeNull();
    expect(await ate(() => document.querySelector('[data-stage-ring]') !== null, 5000)).toBe(true);
    const ring = document.querySelector('[data-stage-ring]') as HTMLElement;
    await avancar(Number(ring.getAttribute('data-ring-target')));
    fireEvent.pointerDown(document.body);
    await avancar(50);
    expect(document.querySelector('[data-stage-cast="special"]')).not.toBeNull();
  });

  it('o status vem do MOTOR: o buff do inimigo (família atkBuff) aparece com os turnos e gasta a cada golpe dele até sumir; a tela não inventa', async () => {
    vi.useFakeTimers();
    const wave = [{ ...inimigo({ hpMul: 40, bonus: -0.5 }), foe: { ...foeDe({ hpMul: 40, bonus: -0.5 }), special: specialOf('atkBuff') } }];
    montar(wave);
    entrar();
    expect(document.querySelector('[data-stage-status]')).toBeNull(); // nada antes do cast
    expect(await ate(() => document.querySelector('[data-dodge-button]') !== null, 200_000)).toBe(true);
    expect(document.querySelector('[data-stage-status]')).toBeNull(); // o cast ainda está na janela da esquiva
    fireEvent.click(screen.getByRole('button', { name: 'Esquivar para a direita' }));
    expect(await ate(() => document.querySelector('[data-stage-status="buff"]') !== null, 10_000)).toBe(true);
    const el = document.querySelector('[data-stage-status="buff"]') as HTMLElement;
    expect(el.getAttribute('aria-label')).toMatch(/^Ataque em alta, [1-3] turnos?$/);
    expect(el.getAttribute('data-stage-status-variant')).toBe('atk');
    const turnos0 = Number(el.getAttribute('data-stage-status-turns'));
    expect(turnos0).toBe(3);
    // os golpes do inimigo gastam os turnos e, no zero, o selo some
    expect(await ate(() => document.querySelector('[data-stage-status="buff"]') === null, 120_000)).toBe(true);
  });
});
