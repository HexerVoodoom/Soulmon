// @vitest-environment jsdom
/**
 * ARENA — FX de status e círculo de cast pela tela (PR11, run `combate-v3-01`). O núcleo roda de VERDADE:
 * o pet com especial de família `atkBuff` (escola `evocacao`) conjura, o núcleo devolve o evento, e a cena
 * mostra o buff dele com turnos e o círculo de cast. O status vem do motor; a tela não inventa.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ArenaGame } from './ArenaGame';
import { CHEER_TAPS_FULL } from '../utils/energia';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';

const H = vi.hoisted(() => ({
  startEnergy: [] as (number | undefined)[],
  foeHp: 1,
  playerHp: 1,
  forceDraw: false,
  calls: 0,
  answers: [] as { who: number; ans: number | undefined }[],
  cheerSeen: 0,
}));

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never[], opts: never) {
      const n = H.calls++;
      if (H.forceDraw) return { winner: 'draw', t: 1, hpLeft: 0, energyLeft: 0, casts: 0 };
      const p = player as { combatant: { hp: number } };
      const o = opts as { startEnergy?: number; cheerDrain?: () => number };
      const drain = o.cheerDrain;
      const g = real.groupFightSteps(
        { ...p, combatant: { ...p.combatant, hp: p.combatant.hp * H.playerHp } } as never,
        (foes as { combatant: { hp: number } }[]).map(f => ({ ...f, combatant: { ...f.combatant, hp: f.combatant.hp * H.foeHp } })) as never,
        { ...o, startEnergy: H.startEnergy[n] ?? o.startEnergy, cheerDrain: drain ? () => { const k = drain(); H.cheerSeen += k; return k; } : undefined } as never,
      );
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

const POOL = [{
  nome: 'irrelevante', elementos: ['fogo'],
  atributos: { forca: 5, inteligencia: 5, velocidade: 5, magia: 5 },
  tamanho: 'medio', hostilidade: 5,
}];
vi.mock('../utils/arena', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/arena')>();
  return { ...real, loadBestiaryPool: vi.fn(async () => POOL) };
});
vi.mock('../utils/sounds', () => ({ playTaskComplete: vi.fn(), playFeed: vi.fn() }));
vi.mock('../utils/sprites', () => ({
  getDungeonEnemySprite: () => ({ sprite: 'x.png', name: 'x', line: 'x' }),
  getSpriteForStage: () => 'pet.png',
}));

function skillsCom(escola: string): Partial<Record<string, StageSkills>> {
  const area = escola === 'conjuracao' || escola === 'longo_alcance' ? { tipo: 'circulo', raioMetros: 4 } : { tipo: 'unico' };
  const mk = (tipo: 'basica' | 'especial') => ({
    tipo, nome: { pt: tipo === 'especial' ? 'Lâmina do Crepúsculo' : 'Golpe', en: tipo === 'especial' ? 'Dusk Blade' : 'Strike' },
    descricao: { pt: 'd', en: 'd' }, elementoId: 'agua', elementoNome: { pt: 'Água', en: 'Water' },
    escolaId: escola, recursoId: 'furia', custo: tipo === 'basica' ? 'baixo' : 'alto', area,
  });
  return { rookie: { basica: mk('basica'), especial: mk('especial') } as unknown as StageSkills };
}

async function entrar(opts: { language?: 'pt-BR' | 'en-US'; escola?: string; onExit?: () => void; onEarnPoints?: (n: number) => void } = {}) {
  renderWithCss(
    <ArenaGame
      evolutionStage="rookie" language={opts.language ?? 'pt-BR'} skills={skillsCom(opts.escola ?? 'combate_fisico')}
      onExit={opts.onExit ?? (() => {})} onEarnPoints={opts.onEarnPoints}
    />,
  );
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena|Enter the Arena/i }));
  await avancar(10);
}
const camada = () => document.querySelector('[data-torcida-layer]') as HTMLElement;
const gauge = () => document.querySelector('[data-torcida-gauge]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
const mascote = () => screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });
const numeros = () => document.querySelectorAll('[data-stage-dmg]');
const noAnel = () => document.querySelector('[data-stage-ring]') as HTMLElement | null;

/** Avança de 100 em 100 ms até a condição valer (ou `maxMs`). */
async function ate(cond: () => boolean, maxMs = 30_000) {
  for (let t = 0; t < maxMs && !cond(); t += 100) await avancar(100);
  return cond();
}
/** Vence a rodada atual (foes frágeis) e abre a próxima. */
async function proximaRodada() {
  expect(await ate(() => screen.queryByRole('button', { name: 'Próxima rodada' }) !== null)).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Próxima rodada' }));
  await avancar(10);
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(H, { startEnergy: [], foeHp: 1, playerHp: 1, forceDraw: false, calls: 0, answers: [], cheerSeen: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(H, { startEnergy: [], foeHp: 1, playerHp: 1, forceDraw: false, calls: 0, answers: [], cheerSeen: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });


describe('Arena — FX de status e cast (PR11)', () => {
  for (const [escola, kind, rotulo] of [['evocacao', 'buff', /^Ataque em alta, 3 turnos$/], ['benca', 'cura', /^Cura, 1 turno$/]] as const) {
    it(`o especial da escola ${escola} mostra o círculo de cast e deixa o efeito "${kind}" no pet (turnos do orçamento)`, async () => {
      H.startEnergy = [100];
      await entrar({ escola });
      expect(noAnel()).not.toBeNull();
      expect(document.querySelector('[data-stage-cast]')).toBeNull(); // o cast só abre depois do anel
      expect(document.querySelector('[data-stage-status]')).toBeNull();
      const alvo = Number(noAnel()?.getAttribute('data-ring-target'));
      await avancar(alvo);
      fireEvent.pointerDown(document.body);
      await avancar(100);
      expect(document.querySelector('[data-stage-cast="special"]')).not.toBeNull();
      expect(await ate(() => document.querySelector(`[data-stage-status="${kind}"]`) !== null, 3000)).toBe(true);
      expect(document.querySelector(`[data-stage-status="${kind}"]`)!.getAttribute('aria-label')).toMatch(rotulo);
    });
  }

  it('o especial de dano direto (escola combate_fisico) tem o círculo de cast e NENHUM status', async () => {
    H.startEnergy = [100];
    await entrar({ escola: 'combate_fisico' });
    await avancar(Number(noAnel()?.getAttribute('data-ring-target')));
    fireEvent.pointerDown(document.body);
    await avancar(100);
    expect(document.querySelector('[data-stage-cast="special"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-status]')).toBeNull();
  });

  it('em inglês os selos saem em inglês', async () => {
    H.startEnergy = [100];
    await entrar({ escola: 'evocacao', language: 'en-US' });
    await avancar(Number(noAnel()?.getAttribute('data-ring-target')));
    fireEvent.pointerDown(document.body);
    expect(await ate(() => document.querySelector('[data-stage-status="buff"]') !== null, 3000)).toBe(true);
    expect(document.querySelector('[data-stage-status="buff"]')!.getAttribute('aria-label')).toBe('Attack up, 3 turns left');
  });
});
