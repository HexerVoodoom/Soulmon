// @vitest-environment jsdom
/**
 * A DESCIDA IDLE da Masmorra (08/10/2026, decisão do dono): as lutas encadeiam sozinhas, não existe botão de
 * "próximo oponente"/"próximo andar", o HP persiste no save e o lobby mostra a
 * recuperação (sem cobrança). A regra pura é de `utils/dungeonIdle.ts` (testada lá); aqui se trava a TELA.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { DUNGEON_AUTO_FIGHT_MS } from '../utils/dungeonIdle';
import { playerDayKey } from '../utils/playerDay';
import { MINIGAME_BITS_PER_DAY } from '../utils/currencies';

vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const descer = () => fireEvent.click(screen.getByRole('button', { name: /^(Descer|Go down)$/ }));
const caiu = () => !!screen.queryByText(/parou de insistir|stopped holding/);
async function ateCair(limiteMs = 120_000) {
  for (let t = 0; t < limiteMs; t += 500) { await avancar(500); if (caiu()) return true; }
  return false;
}

function montar(opts: { save?: Record<string, unknown>; language?: 'pt-BR' | 'en-US'; onEnemyDefeated?: () => void } = {}) {
  // REGISTRO §31: cada camada gasta energia da Home — o save de teste começa com energia (sobrescrevível).
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ energyPoints: 12, ...(opts.save ?? {}) }));
  return renderWithCss(
    <GameStateProvider>
      <DungeonGame
        evolutionStage="rookie" language={opts.language ?? 'en-US'} petElement="fogo"
        onEnter={() => ({ ok: true, level: 1, best: 0 })} onLose={() => {}} onHeartDrop={() => false}
        onGlitchtama={() => {}} onEnemyDefeated={opts.onEnemyDefeated ?? (() => {})} onEarnPoints={() => {}} onExit={() => {}}
      />
    </GameStateProvider>,
  );
}

describe('Masmorra idle — o laço automático', () => {
  it('depois de cada inimigo NÃO há botão de próximo: a luta seguinte começa sozinha em ~DUNGEON_AUTO_FIGHT_MS', async () => {
    vi.useFakeTimers();
    const onEnemyDefeated = vi.fn();
    montar({ onEnemyDefeated });
    descer();
    expect(await ateCair()).toBe(true);
    expect(onEnemyDefeated).toHaveBeenCalledTimes(1);
    // só o X da cena (sem Pausar, §74) — nenhum "Challenge/Desafiar/Next/Próximo"
    const botoes = screen.getAllByRole('button').map(b => b.textContent ?? '');
    expect(botoes.some(t => /challenge|desafiar|next|próxim|continue/i.test(t))).toBe(false);
    await avancar(DUNGEON_AUTO_FIGHT_MS + 100);
    expect(caiu()).toBe(false); // o painel do inimigo derrotado saiu: a luta nova começou
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
  });

  it('sem botão de Pausar (REGISTRO §75): nada com data-dungeon-pause nem texto Pause/Resume, e a luta segue sozinha', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    expect(await ateCair()).toBe(true);
    expect(document.querySelector('[data-dungeon-pause]')).toBeNull();
    expect(screen.queryByRole('button', { name: /^(Pause|Resume)$/ })).toBeNull();
    await avancar(DUNGEON_AUTO_FIGHT_MS + 100);
    expect(caiu()).toBe(false); // sem pausa manual o relógio entre lutas corre
  });

  it('a linha do andar é aria-live (polite) e a cena tem a saída (ícone do mapa) sempre presente', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    await avancar(10);
    const live = document.querySelector('[data-dungeon-floor-live]')!;
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toContain('Layer 1');
    expect(screen.getByRole('button', { name: /Go to the map/ })).toBeTruthy();
  });

  it('6 lutas = +1 andar (Layer 2) sem nenhum toque', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    let andar2 = false;
    for (let t = 0; t < 900_000 && !andar2; t += 1000) {
      await avancar(1000);
      if (document.querySelector('[data-dungeon-ended]')) break; // o HP acabou antes: este teste não cobre isso
      andar2 = (document.querySelector('[data-dungeon-floor-live]')?.textContent ?? '').includes('Layer 2');
    }
    expect(andar2).toBe(true);
  });
});

describe('Masmorra idle — HP persistente e recuperação', () => {
  it('com o HP abaixo do piso o "Go down" fica desabilitado e o lobby diz "Recovering…" com o tempo (sem cobrança)', () => {
    vi.useFakeTimers();
    montar({ save: { dungeonHp: { frac: 0, at: Date.now() } } });
    const go = screen.getByRole('button', { name: 'Go down' }) as HTMLButtonElement;
    expect(go.disabled).toBe(true);
    const nota = document.querySelector('[data-dungeon-recovering]')!;
    expect(nota.textContent).toMatch(/Recovering… ready to go down again in 1h 00m/);
    fireEvent.click(go);
    expect(document.querySelector('[data-battle-stage]')).toBeNull(); // nada começou
    expect(document.body.textContent).not.toMatch(/heart|Bits.*(lost|cost)/i);
  });

  it('em PT-BR: "Recuperando…" (a bíblia veta "descansar" sobre a criatura)', () => {
    vi.useFakeTimers();
    montar({ language: 'pt-BR', save: { dungeonHp: { frac: 0, at: Date.now() } } });
    expect(document.querySelector('[data-dungeon-recovering]')!.textContent).toMatch(/Recuperando… pode descer de novo em 1 h 00 min/);
    expect(document.body.textContent).not.toMatch(/descansando|descansar/i);
  });

  it('o HP regenera por tempo: depois de 1 h parado o botão libera (sem tick nenhum, só o relógio)', () => {
    vi.useFakeTimers();
    montar({ save: { dungeonHp: { frac: 0, at: Date.now() - 3_700_000 } } });
    expect((screen.getByRole('button', { name: 'Go down' }) as HTMLButtonElement).disabled).toBe(false);
    expect(document.querySelector('[data-dungeon-recovering]')).toBeNull();
  });

  it('save antigo sem o campo: HP cheio, pode descer', () => {
    vi.useFakeTimers();
    montar({ save: { perfectDays: 3 } });
    expect((screen.getByRole('button', { name: 'Go down' }) as HTMLButtonElement).disabled).toBe(false);
    expect(document.querySelector('[data-dungeon-recovering]')).toBeNull(); // C5: o lobby não mostra mais o HP 100%
    expect(document.body.textContent).not.toContain('100%');
  });

  it('o HP vai para o save a cada luta: terminar com o HP no zero grava frac 0, mostra "out of breath" e NÃO oferece descer de novo', async () => {
    vi.useFakeTimers();
    // exatamente no piso: o primeiro inimigo ainda é uma luta de verdade e o HP não enche por conta da entrada
    montar({ save: { dungeonHp: { frac: 0.25, at: Date.now() } } });
    descer();
    let fim = false;
    for (let t = 0; t < 900_000 && !fim; t += 1000) {
      await avancar(1000);
      fim = !!document.querySelector('[data-dungeon-ended]');
    }
    expect(fim).toBe(true);
    expect(document.body.textContent).toMatch(/out of breath/);
    expect(document.body.textContent).toMatch(/Your hearts are untouched/);
    expect(screen.queryByRole('button', { name: 'Go down again' })).toBeNull(); // HP zero: recuperar antes
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!) as { dungeonHp?: { frac: number; at: number } };
    expect(salvo.dungeonHp?.frac).toBe(0);
    expect(salvo.dungeonHp?.at).toBeGreaterThan(0);
  });
});

describe('Masmorra idle — o teto diário de Bits segue valendo, sem frustrar', () => {
  it('com o teto batido a descida CONTINUA e a tela só avisa "Daily Bits cap reached" (sem cobrança)', async () => {
    vi.useFakeTimers();
    montar({ save: { minigameBits: { day: playerDayKey(new Date(), undefined), earned: MINIGAME_BITS_PER_DAY } } });
    descer();
    expect(await ateCair()).toBe(true);
    expect(document.querySelector('[data-dungeon-bits-cap]')!.textContent).toBe('Daily Bits cap reached — the descent goes on, just without Bits.');
    await avancar(DUNGEON_AUTO_FIGHT_MS + 100);
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull(); // segue descendo
  });
});
