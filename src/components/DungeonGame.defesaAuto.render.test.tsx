// @vitest-environment jsdom
/**
 * MASMORRA em tela cheia, no núcleo v3 (PR4, contexto §2.18) — e o Soulmon segue se defendendo SOZINHO
 * (TORC-3, 02/10/2026: `TIMING_DODGE_ENABLED = false`). A regra mora em `utils/dungeonFight.ts`, `utils/dungeon.ts` e
 * `utils/energia.ts`; aqui se trava o lado da TELA: a cena grande, as barras, o mascote da torcida e,
 * principalmente, que **a barra de cheer, a energia e o HP PERSISTEM entre os combates da run** (a masmorra é contínua).
 *
 * ⚠️ O núcleo roda de VERDADE; o envoltório de `groupFightSteps` só anota a entrada (descargas de cheer
 * recolhidas e o HP e a energia com que cada luta começou).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { CHEER_TAPS_FULL } from '../utils/energia';

const H = vi.hoisted(() => ({ calls: 0, cheerSeen: 0, hpStart: [] as number[], enStart: [] as number[] }));

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
      const g = real.groupFightSteps(player, foes, { ...o, cheerDrain: drain ? () => { const k = drain(); H.cheerSeen += k; return k; } : undefined } as never);
      let r = g.next();
      while (!r.done) {
        const ans: number | undefined = yield r.value;
        r = g.next(ans);
      }
      return r.value;
    },
  };
});
vi.mock('../utils/sounds', () => ({ playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
  Object.assign(H, { calls: 0, cheerSeen: 0, hpStart: [], enStart: [] });
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
const ratio = () => parseFloat(document.querySelector('[data-torcida-gauge]')!.getAttribute('data-torcida-ratio') ?? 'NaN');
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
const mascote = () => screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });
/** Corre o relógio até aparecer o cartão do inimigo derrotado (ou estourar o limite). */
async function ateInimigoCair(limiteMs = 120_000) {
  for (let t = 0; t < limiteMs; t += 500) {
    await avancar(500);
    if (screen.queryByText(/parou de insistir|stopped holding/)) return true;
  }
  return false;
}

describe('Masmorra — a cena em tela cheia', () => {
  it('a luta é a CENA: lutadores grandes, HP e ENERGIA do pet, mascote da torcida, barra de cheer — sem texto explicativo', () => {
    vi.useFakeTimers();
    montar();
    descer();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    // o 1º inimigo da escada (baby-i) não tem especial: só o mega mostra a barra de energia
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(document.querySelector('[data-timing-bar]')).toBeNull();
    expect(document.querySelector('[data-visor-pet]')).toBeNull(); // o visor pequeno saiu da luta
    expect(screen.queryByText(/torça por ele/i)).toBeNull();
    expect(screen.queryByText(/se defende/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).toBeNull(); // A7: nenhum "?" dentro da luta
    expect(document.body.textContent).toMatch(/Camada 1\/5/);
  });

  it('a explicação do lobby mora atrás do "?" e conta as mecânicas (cheer, energia, anel, esquiva)', () => {
    vi.useFakeTimers();
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona a descida' }));
    const nota = document.querySelector('[data-dungeon-help-panel]')!.textContent ?? '';
    expect(nota).toMatch(/barra de cheer/i);
    expect(nota).toMatch(/anel/i);
    expect(nota).toMatch(/deslize/i);
    expect(nota).toMatch(/de um inimigo para o outro/i); // a barra persiste
  });

  it('sem barra de esquiva: o golpe sai sozinho e a defesa automática responde sem nenhum toque; o número só chega no IMPACTO', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    expect(document.querySelector('[data-stage-dmg]')).toBeNull();
    let visto = false;
    for (let t = 0; t < 8000 && !visto; t += 100) { await avancar(100); visto = document.querySelector('[data-stage-dmg]') !== null; }
    expect(visto, 'o primeiro golpe chega em até 8 s').toBe(true);
    expect(energia('me')).toBeGreaterThan(0);
    expect(screen.queryByText('Desviar!')).toBeNull();
    expect(document.querySelector('[data-dodge-button]')).toBeNull(); // golpe normal: sem janela de esquiva
  });

  it('a luta é mais LONGA: cada inimigo leva ~20–30 s', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    const t0 = Date.now();
    expect(await ateInimigoCair()).toBe(true);
    const seg = (Date.now() - t0) / 1000;
    expect(seg).toBeGreaterThan(12); // o 1º inimigo (baby) é o mais curto da escada
    expect(seg).toBeLessThan(40);
  });
});

describe('Masmorra — a barra de cheer, a energia e o HP PERSISTEM entre os combates da run', () => {
  it('a barra de cheer enche devagar (24) e, cheia, despeja UMA descarga no núcleo e zera', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    await avancar(10);
    for (let i = 0; i < 12; i++) fireEvent.click(mascote()); // 12 por janela de 3 s: abaixo do teto de 16
    await avancar(3100);
    for (let i = 0; i < CHEER_TAPS_FULL - 12 - 1; i++) fireEvent.click(mascote());
    expect(H.cheerSeen).toBe(0);
    fireEvent.click(mascote());
    expect(ratio()).toBe(0);
    await avancar(3000);
    expect(H.cheerSeen).toBe(1);
  });

  it('o primeiro inimigo cai e a barra, a energia e o HP continuam do mesmo ponto no segundo', async () => {
    vi.useFakeTimers();
    const onEnemyDefeated = vi.fn();
    montar({ onEnemyDefeated });
    descer();
    await avancar(10);
    for (let i = 0; i < 9; i++) fireEvent.click(mascote()); // 9/24: não despeja
    const antes = ratio();
    expect(antes).toBeCloseTo(9 / CHEER_TAPS_FULL, 1);
    expect(await ateInimigoCair()).toBe(true);
    expect(onEnemyDefeated).toHaveBeenCalledTimes(1);
    // o cartão do inimigo derrotado NÃO apaga a barra: a mesma cena segue na tela
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(ratio()).toBe(antes);
    expect(energia('me')).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^Desafiar / }));
    await avancar(10);
    // segundo combate: o núcleo recebeu o HP e a energia do primeiro (`startHp`/`startEnergy`)
    expect(H.calls).toBe(2);
    expect(H.hpStart[0]).toBe(1);
    expect(H.hpStart[1]).toBeLessThanOrEqual(1);
    expect(H.enStart[0]).toBe(0);
    expect(H.enStart[1]).toBeGreaterThan(0);
    expect(ratio()).toBe(antes);
    for (let i = 0; i < 3; i++) fireEvent.click(mascote());
    expect(ratio()).toBeCloseTo((9 + 3) / CHEER_TAPS_FULL, 1); // soma por cima do que já tinha
  });
});

describe('Masmorra — em inglês', () => {
  it('nada de português na luta', () => {
    vi.useFakeTimers();
    montar({ language: 'en-US' });
    fireEvent.click(screen.getByRole('button', { name: 'Go down' }));
    expect(screen.getByRole('button', { name: 'Cheer for your Soulmon' })).toBeTruthy();
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Camada', 'Você', 'Torcer', 'Sair']) expect(texto.includes(palavra), palavra).toBe(false);
    expect(texto).toMatch(/Layer 1\/5/);
  });
});
