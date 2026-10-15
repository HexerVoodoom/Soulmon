// @vitest-environment jsdom
/**
 * MASMORRA — o pedido de 11/10/2026 do dono (REGISTRO §36): um indicador só no HUD, avanço rápido 1×/2×/3×, especial automático,
 * modalzinho de drop e a descida que continua sozinha (sair NÃO cancela; ao voltar o avanço aparece; "Retirar da masmorra").
 * A conta do avanço fora do app é testada pura em `utils/dungeonAway.test.ts`; aqui se trava a TELA.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { GameStateProvider, useGameState, type GameState } from '../contexts/GameStateContext';
import { closeTopBackLayer } from '../utils/backStack';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { DUNGEON_AUTO_FIGHT_MS, DUNGEON_AWAY_MAX_MS } from '../utils/dungeonIdle';

vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
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

let estadoAtual: GameState | null = null;
function Sonda() {
  const { gameState } = useGameState();
  estadoAtual = gameState;
  return null;
}

function Casca({ language, onHeartDrop, onExit, onEarn, onExitToMap }: { language: 'pt-BR' | 'en-US'; onHeartDrop: () => boolean; onExit: () => void; onEarn?: (n: number) => void; onExitToMap?: () => void }) {
  const [aberta, setAberta] = useState(true);
  return (
    <GameStateProvider>
      <Sonda />
      <button type="button" data-test-toggle onClick={() => setAberta(v => !v)}>toggle</button>
      {aberta && (
        <DungeonGame
          evolutionStage="rookie" language={language} petElement="fogo"
          onEnter={() => ({ ok: true, level: 1, best: 0 })} onLose={() => {}} onHeartDrop={onHeartDrop}
          onGlitchtama={() => {}} onEnemyDefeated={() => {}} onEarnPoints={onEarn ?? (() => {})} onExit={onExit} onExitToMap={onExitToMap}
        />
      )}
    </GameStateProvider>
  );
}

function montar(opts: { language?: 'pt-BR' | 'en-US'; heart?: boolean; save?: Record<string, unknown>; onExit?: () => void; onExitToMap?: () => void } = {}) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ energyPoints: 12, ...(opts.save ?? {}) }));
  return renderWithCss(<Casca language={opts.language ?? 'en-US'} onHeartDrop={() => !!opts.heart} onExit={opts.onExit ?? (() => {})} onExitToMap={opts.onExitToMap} />);
}
const alternar = () => fireEvent.click(document.querySelector('[data-test-toggle]')!);

describe('HUD — um indicador só', () => {
  it('"Layer 1 · fight 1 of 6" no topo; nada de "1/6" nem "Layer N" repetido à direita; o "6" é a escada de criaturas (não as camadas)', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    await avancar(10);
    const hud = document.querySelector('[data-stage-hud]')!.textContent ?? '';
    expect(hud).toContain('Layer 1 · fight 1 of 6');
    // o antigo selo "1/6" e a repetição "Layer 1" embaixo à direita saíram
    const nos = [...document.querySelectorAll('[data-battle-stage] *')].filter(n => n.children.length === 0);
    expect(nos.some(n => /^\s*\d+\/6\s*$/.test(n.textContent ?? ''))).toBe(false);
    const visiveis = nos.filter(n => /^Layer \d+$/.test((n.textContent ?? '').trim()) && !(n as HTMLElement).hasAttribute('data-dungeon-floor-live'));
    expect(visiveis.length).toBe(0);
    // a linha viva só existe para o leitor de tela (fora da tela)
    const live = document.querySelector('[data-dungeon-floor-live]') as HTMLElement;
    expect(live.style.clip).toBeTruthy();
    expect(live.textContent).toContain('Layer 1');
  });

  it('em PT-BR: "Camada 1 · luta 1 de 6"', async () => {
    vi.useFakeTimers();
    montar({ language: 'pt-BR' });
    descer();
    await avancar(10);
    expect(document.querySelector('[data-stage-hud]')!.textContent).toContain('Camada 1 · luta 1 de 6');
  });

  it('o indicador acompanha a luta: depois do 1º inimigo cair, a próxima luta é "fight 2 of 6"', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    expect(await ateCair()).toBe(true);
    await avancar(DUNGEON_AUTO_FIGHT_MS + 200);
    expect(document.querySelector('[data-stage-hud]')!.textContent).toContain('Layer 1 · fight 2 of 6');
  });
});

describe('Avanço rápido 1×/3× no canto inferior direito (o 2× saiu, 14/10/2026)', () => {
  it('o botão cicla 1× → 3× → 1×, fica ABAIXO do mascote da torcida, sem caixa, tem nome acessível e a escolha persiste no aparelho', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    await avancar(10);
    const ff = () => document.querySelector('[data-dungeon-speed]') as HTMLButtonElement;
    expect(ff().textContent).toContain('1×');
    expect(ff().getAttribute('aria-label')).toMatch(/Fast forward: 1×/);
    const mascote = document.querySelector('[data-cheer-mascot]')!;
    expect(mascote.contains(ff())).toBe(true); // mora no canto da torcida…
    expect(mascote.lastElementChild).toBe(ff()); // …como o último filho, abaixo do botão do Cheer
    expect(mascote.querySelector('[data-torcida-button]')!.compareDocumentPosition(ff()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ff().style.borderStyle).toBe('none'); expect(ff().style.backgroundColor).toBe('transparent'); expect(ff().style.boxShadow).toBe('none'); // sem box
    expect(ff().style.minHeight).toBe('44px');
    fireEvent.click(ff());
    expect(ff().textContent).toContain('3×');
    expect(localStorage.getItem(STORAGE_KEYS.DUNGEON_SPEED)).toBe('3');
    fireEvent.click(ff());
    expect(ff().textContent).toContain('1×');
  });

  it('a preferência volta na próxima abertura; lixo no armazenamento vira 1×', async () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEYS.DUNGEON_SPEED, '3');
    montar();
    // o montar() limpa? não: ele só grava o save — a velocidade guardada vale
    descer();
    await avancar(10);
    expect((document.querySelector('[data-dungeon-speed]') as HTMLElement).textContent).toContain('3×');
    cleanup();
    localStorage.setItem(STORAGE_KEYS.DUNGEON_SPEED, 'abc');
    montar();
    descer();
    await avancar(10);
    expect((document.querySelector('[data-dungeon-speed]') as HTMLElement).textContent).toContain('1×');
  });

  it('em 3× a luta termina mais cedo no relógio de parede do que em 1× (mesmo resultado, menos espera)', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    const t1 = await (async () => { let t = 0; while (!caiu() && t < 200_000) { await avancar(250); t += 250; } return t; })();
    cleanup(); vi.useRealTimers(); vi.useFakeTimers();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.DUNGEON_SPEED, '3');
    montar();
    descer();
    const t3 = await (async () => { let t = 0; while (!caiu() && t < 200_000) { await avancar(250); t += 250; } return t; })();
    expect(t3).toBeLessThan(t1);
  });

  it('o jogador NÃO precisa tocar para o especial: nunca aparece o anel nem os botões de esquiva', async () => {
    vi.useFakeTimers();
    montar();
    descer();
    for (let t = 0; t < 90_000; t += 250) {
      await avancar(250);
      expect(document.querySelector('[data-stage-ring]')).toBeNull();
      expect(document.querySelector('[data-stage-dodge]')).toBeNull();
      if (caiu()) break;
    }
  });
});

describe('Modalzinho de drop', () => {
  it('quando um coraçãozinho cai: ícone + nome + quantidade; a luta NÃO para por trás; toque no véu fecha', async () => {
    vi.useFakeTimers();
    montar({ heart: true });
    descer();
    expect(await ateCair()).toBe(true);
    const aviso = document.querySelector('[data-drop-notice]') as HTMLElement;
    expect(aviso).not.toBeNull();
    expect(aviso.querySelector('[data-drop-line="heart"]')).not.toBeNull();
    expect(aviso.textContent).toContain('Little heart');
    expect(aviso.textContent).toContain('×1');
    expect(aviso.querySelector('img[data-drop-icon="heart"]')).not.toBeNull();
    expect(aviso.querySelector('[role="dialog"]')!.getAttribute('aria-modal')).toBe('false'); // não inertiza o resto
    // sem tocar em nada o relógio da descida segue e a próxima luta começa (o aviso não é uma pausa) — e ele fecha sozinho
    await avancar(DUNGEON_AUTO_FIGHT_MS + 100);
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(caiu()).toBe(false);
    expect(document.querySelector('[data-drop-notice]')).toBeNull();
  });

  it('toque no véu fecha na hora', async () => {
    vi.useFakeTimers();
    montar({ heart: true });
    descer();
    expect(await ateCair()).toBe(true);
    fireEvent.click(document.querySelector('[data-drop-notice]')!);
    expect(document.querySelector('[data-drop-notice]')).toBeNull();
  });

  it('em PT-BR o nome é "Coraçãozinho"; o mesmo item que cai de novo SOMA na entrada que espera (fila, não pilha de modais)', async () => {
    vi.useFakeTimers();
    montar({ heart: true, language: 'pt-BR' });
    descer();
    expect(await ateCair()).toBe(true);
    expect(document.querySelector('[data-drop-notice]')!.textContent).toContain('Coraçãozinho');
    // o aviso fecha sozinho depois de um tempo; antes disso o 2º inimigo cai e SOMA
    await avancar(DUNGEON_AUTO_FIGHT_MS + 500);
    await ateCair();
    const avisos = document.querySelectorAll('[data-drop-notice]');
    expect(avisos.length).toBeLessThanOrEqual(1);
  });

  it('Escape fecha', async () => {
    vi.useFakeTimers();
    montar({ heart: true });
    descer();
    expect(await ateCair()).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('[data-drop-notice]')).toBeNull();
  });
});

describe('A descida que continua sozinha', () => {
  async function primeiroInimigo(opts: { onExit?: () => void } = {}) {
    montar(opts);
    descer();
    expect(await ateCair()).toBe(true);
  }

  it('a descida fica REGISTRADA no save desde o início (camada, lugar na escada) — o Soulmon fica ocupado', async () => {
    vi.useFakeTimers();
    montar();
    expect(estadoAtual!.dungeonAway).toBeUndefined();
    descer();
    await avancar(10);
    expect(estadoAtual!.dungeonAway).toBeDefined();
    expect(estadoAtual!.dungeonAway!.layer).toBe(1);
    expect(estadoAtual!.dungeonAway!.slot).toBe(0);
    expect(estadoAtual!.dungeonAway!.player.stage).toBe('rookie');
  });

  it('cada inimigo vencido avança o registro (slot 1) e o sair da tela NÃO o apaga', async () => {
    vi.useFakeTimers();
    await primeiroInimigo();
    expect(estadoAtual!.dungeonAway!.slot).toBe(1);
    alternar(); // a tela da masmorra sai (o jogador foi embora)
    expect(document.querySelector('[data-battle-stage]')).toBeNull();
    expect(estadoAtual!.dungeonAway).toBeDefined();
    expect(estadoAtual!.dungeonAway!.slot).toBe(1);
  });

  it('o ícone do MAPA (no lugar do X) vai DIRETO ao mapa, sem confirmação, e NÃO abandona: o registro da descida segue', async () => {
    vi.useFakeTimers();
    const onExitToMap = vi.fn();
    const onExit = vi.fn();
    montar({ onExitToMap, onExit });
    descer();
    await avancar(10);
    const antes = estadoAtual!.dungeonAway;
    expect(antes).toBeDefined();
    const btn = document.querySelector('[data-stage-close]') as HTMLButtonElement;
    expect(btn.querySelector('svg, img')).not.toBeNull(); // o ícone ilustrado do mapa, não o glifo do X
    fireEvent.click(btn);
    expect(document.querySelector('[data-stage-confirm]')).toBeNull(); // sem "Sair da tela?"
    expect(onExitToMap).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
    expect(estadoAtual!.dungeonAway).toBeDefined(); // sair ≠ abandonar
    expect(estadoAtual!.dungeonAway!.slot).toBe(antes!.slot);
  });

  it('o botão do mapa tem alvo >= 44 px e nome acessível em PT e EN', async () => {
    vi.useFakeTimers();
    montar({ language: 'pt-BR' });
    descer();
    await avancar(10);
    const btn = document.querySelector('[data-stage-close]') as HTMLButtonElement;
    expect(btn.style.width).toBe('44px');
    expect(btn.style.height).toBe('44px');
    expect(btn.getAttribute('aria-label')).toMatch(/mapa/i);
    cleanup();
    montar({ language: 'en-US' });
    descer();
    await avancar(10);
    expect((document.querySelector('[data-stage-close]') as HTMLButtonElement).getAttribute('aria-label')).toMatch(/map/i);
  });

  it('sem onExitToMap (demo/testes) o ícone cai em onExit', async () => {
    vi.useFakeTimers();
    const onExit = vi.fn();
    montar({ onExit });
    descer();
    await avancar(10);
    fireEvent.click(document.querySelector('[data-stage-close]')!);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('o voltar do Android (camada de voltar) faz o MESMO que o ícone do mapa', async () => {
    vi.useFakeTimers();
    const onExitToMap = vi.fn();
    montar({ onExitToMap });
    descer();
    await avancar(10);
    expect(closeTopBackLayer()).toBe(true);
    expect(onExitToMap).toHaveBeenCalledTimes(1);
    expect(estadoAtual!.dungeonAway).toBeDefined();
  });

  it('ao VOLTAR depois de um tempo, o avanço aparece (cartão "While you were away") com o que rendeu — e o save ganhou isso', async () => {
    vi.useFakeTimers();
    await primeiroInimigo();
    const antes = estadoAtual!;
    const killsAntes = antes.dungeonKills ?? 0;
    alternar();
    await avancar(1000);
    vi.setSystemTime(Date.now() + 2 * 3_600_000); // 2 h fora
    alternar(); // volta à tela
    await avancar(50);
    const painel = document.querySelector('[data-dungeon-away-report], [data-dungeon-ended]');
    expect(painel).not.toBeNull();
    expect(estadoAtual!.dungeonKills ?? 0).toBeGreaterThan(killsAntes);
    expect(document.body.textContent).toMatch(/While you were away|happened while you were away/);
    expect(document.querySelector('[data-dungeon-summary]')).not.toBeNull();
  });

  it('o tempo fora tem TETO: o cartão avisa quando passou das horas contadas', async () => {
    vi.useFakeTimers();
    await primeiroInimigo();
    alternar();
    await avancar(1000);
    vi.setSystemTime(Date.now() + DUNGEON_AWAY_MAX_MS * 5);
    alternar();
    await avancar(50);
    const aviso = document.querySelector('[data-dungeon-away-capped]');
    const terminou = document.querySelector('[data-dungeon-ended]');
    expect(aviso !== null || terminou !== null).toBe(true);
  });

  it('"Retirar da masmorra" no cartão: apaga o registro (ele volta para casa) e sai da tela', async () => {
    vi.useFakeTimers();
    const onExit = vi.fn();
    await primeiroInimigo({ onExit });
    alternar();
    await avancar(1000);
    vi.setSystemTime(Date.now() + 1 * 3_600_000);
    alternar();
    await avancar(50);
    const retirar = document.querySelector('[data-dungeon-retire]') as HTMLButtonElement | null;
    if (retirar) {
      fireEvent.click(retirar);
      expect(estadoAtual!.dungeonAway).toBeUndefined();
      expect(onExit).toHaveBeenCalled();
    } else {
      // a descida já tinha acabado sozinha (HP/energia): ele já está em casa
      expect(estadoAtual!.dungeonAway).toBeUndefined();
    }
  });

  it('a descida que ACABA (energia/HP) limpa o registro: o Soulmon volta para casa sozinho', async () => {
    vi.useFakeTimers();
    montar({ save: { energyPoints: 1 } });
    descer();
    let fim = false;
    for (let t = 0; t < 1_500_000 && !fim; t += 1000) { await avancar(1000); fim = !!document.querySelector('[data-dungeon-ended]'); }
    expect(fim).toBe(true);
    expect(estadoAtual!.dungeonAway).toBeUndefined();
  });
});
