// @vitest-environment jsdom
/**
 * A masmorra gasta a ENERGIA da Home por camada (REGISTRO §31): o lobby mostra o custo, o ponto de retorno e o
 * teto do Lv; sem energia o botão não acende e a frase é um convite; ao acabar a energia a descida para com o
 * RESUMO das recompensas, grava o recorde no save e nunca toca nos corações.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { DUNGEON_DAILY_LAYERS, dungeonDayOf } from '../utils/dungeonIdle';

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never, opts: never) {
      const fracos = (foes as unknown as Array<{ combatant: { hp: number } }>).map(f => ({ ...f, combatant: { ...f.combatant, hp: f.combatant.hp * 0.05 } }));
      const g = real.groupFightSteps(player, fracos as never, opts);
      let r = g.next();
      while (!r.done) { const ans: number | undefined = yield r.value; r = g.next(ans); }
      return r.value;
    },
  };
});
vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.3); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const salvo = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE) ?? '{}');

function montar(save: Record<string, unknown>, language: 'en-US' | 'pt-BR' = 'en-US') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  return renderWithCss(
    <GameStateProvider>
      <DungeonGame
        evolutionStage="rookie" language={language} petElement="fogo"
        onEnter={() => ({ ok: true, best: 0 })} onLose={() => {}} onHeartDrop={() => false}
        onGlitchtama={() => {}} onEnemyDefeated={() => {}} onEarnPoints={() => {}} onExit={() => {}}
      />
    </GameStateProvider>,
  );
}

describe('Masmorra — energia por camada', () => {
  it('lobby: mostra energia, custo, ponto de retorno e o teto do Lv (EN)', () => {
    montar({ energyPoints: 3, dungeonDepthRecord: 7, totalXP: 5000, perfectDays: 5 }); // Vínculo ≥ 8 (portão aberto) e Lv 6
    const plano = document.querySelector('[data-dungeon-plan]')!.textContent!;
    expect(plano).toMatch(/Starts at layer 6/);
    expect(plano).toMatch(/enough for 3 now/);
    expect(document.body.textContent).not.toMatch(/HP\s*\d+%/);
    expect(screen.getByText('Deepest')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Go down' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('sem energia: o botão não acende e a frase é convite, nunca cobrança (PT)', () => {
    montar({ energyPoints: 0 }, 'pt-BR');
    expect((screen.getByRole('button', { name: 'Descer' }) as HTMLButtonElement).disabled).toBe(true);
    const aviso = document.querySelector('[data-dungeon-no-energy]')!.textContent!;
    expect(aviso).toMatch(/conclua algo do seu dia/i);
    expect(aviso).not.toMatch(/precisa|deve|falhou|culpa/i);
  });

  it('com 1 de energia: desce UMA camada, para com o resumo, grava o recorde e gasta a energia — corações intactos', async () => {
    vi.useFakeTimers();
    montar({ energyPoints: 1, healthPoints: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Go down' }));
    for (let t = 0; t < 600_000 && !document.querySelector('[data-dungeon-ended]'); t += 1000) await avancar(1000);
    const fim = document.querySelector('[data-dungeon-ended]')!;
    expect(fim.getAttribute('data-dungeon-ended')).toBe('energy');
    const resumo = fim.querySelector('[data-dungeon-summary]')!.textContent!;
    expect(resumo).toMatch(/Layers cleared: 1/);
    expect(resumo).toMatch(/Creatures that stopped holding: 6/);
    expect(resumo).toMatch(/Deepest so far: layer 1/);
    expect(resumo).toMatch(/Energy used: 1/);
    expect(fim.textContent).toMatch(/Your hearts are untouched/);
    expect(screen.queryByRole('button', { name: 'Go down again' })).toBeNull(); // sem energia, não oferece descer de novo
    const s = salvo();
    expect(s.energyPoints).toBe(0);
    expect(s.dungeonDepthRecord).toBe(1);
    expect(s.healthPoints).toBe(2);
  }, 60_000);
});

describe('Masmorra — limite diário de camadas (beta-2 6.1, REGISTRO §40)', () => {
  const hoje = () => dungeonDayOf({}, Date.now());

  it('no limite do dia o botão NÃO acende (mesmo com energia sobrando) e a frase é calma — PT e EN', () => {
    montar({ energyPoints: 8, dungeonDaily: { day: hoje(), layers: DUNGEON_DAILY_LAYERS } }, 'pt-BR');
    expect((screen.getByRole('button', { name: 'Descer' }) as HTMLButtonElement).disabled).toBe(true);
    const frase = document.querySelector('[data-dungeon-daily-limit]')!.textContent!;
    expect(frase).toMatch(new RegExp(`até ${DUNGEON_DAILY_LAYERS} camadas por dia`));
    expect(frase).not.toMatch(/falhou|culpa|precisa|deve/i);
    expect(document.querySelector('[data-dungeon-no-energy]')).toBeNull(); // não é falta de energia
    cleanup();
    montar({ energyPoints: 8, dungeonDaily: { day: hoje(), layers: DUNGEON_DAILY_LAYERS } }, 'en-US');
    expect((screen.getByRole('button', { name: 'Go down' }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector('[data-dungeon-daily-limit]')!.textContent).toMatch(/up to 10 layers a day/);
  });

  it('o lobby mostra quantas camadas dá para fazer AGORA: o menor entre a energia e o que resta do dia', () => {
    montar({ energyPoints: 8, dungeonDaily: { day: hoje(), layers: DUNGEON_DAILY_LAYERS - 2 } });
    expect(document.querySelector('[data-dungeon-plan]')!.textContent).toMatch(/enough for 2 now/);
  });

  it('reabrir o app (remontar do localStorage) no limite continua bloqueado: o contador mora no save, não na tela', () => {
    montar({ energyPoints: 8, dungeonDaily: { day: hoje(), layers: DUNGEON_DAILY_LAYERS } });
    cleanup();
    const gravado = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!);
    expect(gravado.dungeonDaily.layers).toBe(DUNGEON_DAILY_LAYERS);
    renderWithCss(
      <GameStateProvider>
        <DungeonGame
          evolutionStage="rookie" language="en-US" petElement="fogo"
          onEnter={() => ({ ok: true, best: 0 })} onLose={() => {}} onHeartDrop={() => false}
          onGlitchtama={() => {}} onEnemyDefeated={() => {}} onEarnPoints={() => {}} onExit={() => {}}
        />
      </GameStateProvider>,
    );
    expect((screen.getByRole('button', { name: 'Go down' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('com 1 camada de folga no dia e energia de sobra: desce UMA, termina com "daily", conta a camada no save e NÃO gasta mais energia', async () => {
    vi.useFakeTimers();
    montar({ energyPoints: 5, healthPoints: 2, dungeonDaily: { day: hoje(), layers: DUNGEON_DAILY_LAYERS - 1 } });
    fireEvent.click(screen.getByRole('button', { name: 'Go down' }));
    for (let t = 0; t < 600_000 && !document.querySelector('[data-dungeon-ended]'); t += 1000) await avancar(1000);
    const fim = document.querySelector('[data-dungeon-ended]')!;
    expect(fim.getAttribute('data-dungeon-ended')).toBe('daily');
    expect(fim.textContent).toMatch(/That is enough down there for today/);
    expect(fim.textContent).toMatch(/Your hearts are untouched/);
    expect(screen.queryByRole('button', { name: 'Go down again' })).toBeNull(); // no limite não oferece descer de novo
    const s = salvo();
    expect(s.dungeonDaily).toEqual({ day: hoje(), layers: DUNGEON_DAILY_LAYERS });
    expect(s.energyPoints).toBe(4); // 5 − 1 camada; a energia que sobrou fica
    expect(s.healthPoints).toBe(2);
  }, 60_000);
});
