// @vitest-environment jsdom
/**
 * MASMORRA em tela cheia, com ENERGIA (04/10/2026, REGISTRO §20.10) — e o Soulmon segue se
 * defendendo SOZINHO (TORC-3, 02/10/2026: `TIMING_DODGE_ENABLED = false`). A regra mora em
 * `utils/autoDefesa.ts` e `utils/energia.ts`; aqui se trava o lado da TELA: a cena grande, as
 * barras em cima de cada lutador, o mascote da torcida e, principalmente, que **a barra de cheer
 * e a energia PERSISTEM entre os combates da run** (a masmorra é contínua).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { CHEER_TAPS_FULL, ENERGY_CHEER } from '../utils/energia';

vi.mock('../utils/sounds', () => ({ playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.3); });
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
  it('a luta é a CENA: lutadores grandes, HP e ENERGIA em cima de cada um, mascote da torcida, barra de cheer — sem texto explicativo', () => {
    vi.useFakeTimers();
    montar();
    descer();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(document.querySelector('[data-timing-bar]')).toBeNull();
    expect(document.querySelector('[data-visor-pet]')).toBeNull(); // o visor pequeno saiu da luta
    expect(screen.queryByText(/torça por ele/i)).toBeNull();
    expect(screen.queryByText(/se defende/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).not.toBeNull();
    expect(document.body.textContent).toMatch(/Camada 1\/5/);
  });

  it('a explicação do lobby mora atrás do "?" e conta as mecânicas novas (cheer, energia, anel, esquiva)', () => {
    vi.useFakeTimers();
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona a descida' }));
    const nota = document.querySelector('[data-dungeon-help-panel]')!.textContent ?? '';
    expect(nota).toMatch(/barra de cheer/i);
    expect(nota).toMatch(/anel/i);
    expect(nota).toMatch(/deslize/i);
    expect(nota).toMatch(/de um inimigo para o outro/i); // a barra persiste
  });

  it('sem barra de esquiva: o golpe sai sozinho (~1,7 s) e a defesa automática responde sem nenhum toque', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    await avancar(1000);
    expect(document.querySelector('[data-stage-dmg]')).toBeNull();
    await avancar(900);
    expect(document.querySelector('[data-stage-dmg]')).not.toBeNull();
    await avancar(1800); // o revide: ou "Defendeu!" (bloqueio perfeito) ou o dano no pet
    expect(energia('foe')).toBeGreaterThan(0);
    expect(screen.queryByText('Desviar!')).toBeNull();
    expect(document.querySelector('[data-dodge-button]')).toBeNull(); // golpe normal: sem janela de esquiva
  });

  it('a luta é mais LONGA: cada inimigo leva ~20–30 s (vida × 1,8)', async () => {
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

describe('Masmorra — a barra de cheer e a energia PERSISTEM entre os combates da run', () => {
  it('a barra de cheer enche devagar (24) e, cheia, despeja energia no pet', () => {
    vi.useFakeTimers();
    montar();
    descer();
    for (let i = 0; i < CHEER_TAPS_FULL - 1; i++) fireEvent.click(mascote());
    expect(energia('me')).toBe(0);
    fireEvent.click(mascote());
    expect(energia('me')).toBe(ENERGY_CHEER);
    expect(ratio()).toBe(0);
  });

  it('o primeiro inimigo cai e a barra continua do mesmo ponto no segundo — e a energia do pet também', async () => {
    vi.useFakeTimers();
    const onEnemyDefeated = vi.fn();
    montar({ onEnemyDefeated });
    descer();
    for (let i = 0; i < 9; i++) fireEvent.click(mascote()); // 9/24: não despeja
    const antes = ratio();
    expect(antes).toBeCloseTo(9 / CHEER_TAPS_FULL, 1);
    expect(await ateInimigoCair()).toBe(true);
    expect(onEnemyDefeated).toHaveBeenCalledTimes(1);
    // o cartão do inimigo derrotado NÃO apaga a barra: a mesma cena segue na tela
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(ratio()).toBe(antes);
    const energiaDoPet = energia('me');
    expect(energiaDoPet).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^Desafiar / }));
    // segundo combate: a barra e a energia do pet seguem; a do INIMIGO novo recomeça do zero
    expect(ratio()).toBe(antes);
    expect(energia('me')).toBe(energiaDoPet);
    expect(energia('foe')).toBe(0);
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
