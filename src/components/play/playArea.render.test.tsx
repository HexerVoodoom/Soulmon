// @vitest-environment jsdom
/**
 * AS ÁREAS DE JOGAR (minimal-ui F5) — Exploração (Masmorra + Corrida do Dino)
 * e Jogos (Pedra, papel e tesoura), dentro do molde `AreaScene`/`AreaSheet`.
 *
 * Substitui a cobertura que a antiga `ActivitiesPage` (hub de cartões) dava
 * de graça: cada minijogo tem porta, a porta abre o jogo de sempre e os
 * handlers do `App` chegam INTACTOS ao jogo. Os três jogos são trocados por
 * dublês que só registram as props — o que se testa aqui é a fiação, não a
 * jogabilidade (que tem teste próprio).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const recebidas: Record<string, Record<string, unknown>> = {};
vi.mock('../DungeonGame', async (orig) => {
  const real = await orig<typeof import('../DungeonGame')>();
  return {
    ...real,
    DungeonGame: (p: Record<string, unknown>) => { recebidas.dungeon = p; return <div data-jogo="dungeon" />; },
  };
});
vi.mock('../DinoGame', () => ({
  DinoGame: (p: Record<string, unknown>) => { recebidas.dino = p; return <div data-jogo="dino" />; },
}));
vi.mock('../RPSGame', async (orig) => {
  const real = await orig<typeof import('../RPSGame')>();
  return {
    ...real,
    RPSGame: (p: Record<string, unknown>) => { recebidas.rps = p; return <div data-jogo="rps" />; },
  };
});

import { PlayAreaView, type PlayAreaViewProps } from './PlayAreaView';

function props(over: Partial<PlayAreaViewProps> = {}): PlayAreaViewProps {
  return {
    area: 'exploracao',
    language: 'pt-BR',
    evolutionStage: 'rookie',
    totalPoints: 0,
    onDungeonEnter: vi.fn(() => ({ ok: true as const, level: 1, best: 0 })),
    onDungeonLose: vi.fn(),
    onDungeonHeartDrop: vi.fn(() => false),
    onGlitchtama: vi.fn(),
    onFloorCleared: vi.fn(),
    onDungeonEnemyDefeated: vi.fn(),
    onDinoScore: vi.fn(),
    onEarnPoints: vi.fn(),
    onSpendBits: vi.fn(() => true),
    ...over,
  };
}

beforeEach(() => {
  for (const k of Object.keys(recebidas)) delete recebidas[k];
  localStorage.clear();
});

describe('Exploração — Brisa, Masmorra e Corrida do Dino', () => {
  it('a cena tem a Brisa e os dois lotes, com arte', () => {
    const { container } = renderWithCss(<PlayAreaView {...props()} />);
    expect(container.querySelector('[data-area-npc]')!.textContent).toContain('Brisa');
    expect(container.querySelector('[data-area-lot="masmorra"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="dino"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="ppt"]')).toBeNull();
  });

  it('Masmorra: folha mostra dificuldade e placar lidos das chaves do jogo, e diz que perder não custa coração', () => {
    localStorage.setItem(STORAGE_KEYS.DUNGEON_BEST, '321');
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props()} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    const folha = getByRole('dialog', { name: 'Masmorra' });
    expect(folha.textContent).toContain('321');
    expect(folha.textContent).toContain('Nível 1');
    expect(folha.textContent).toMatch(/nunca os seus corações/);
    expect(folha.textContent).toContain('10→30');
    expect(folha.querySelectorAll('ol li')).toHaveLength(5);
  });

  it('Masmorra: SEM gate de entrada — o CTA nunca fica desabilitado, nem com 0 Bits', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ totalPoints: 0 })} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    const cta = container.querySelector<HTMLButtonElement>('[data-masmorra-start]')!;
    expect(cta.disabled).toBe(false);
    expect(cta.getAttribute('aria-disabled')).toBeNull();
  });

  it('Masmorra: o CTA fecha a folha e abre a DungeonGame com os handlers do App INTACTOS', () => {
    const p = props({ totalPoints: 77 });
    const { container } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    fireEvent.click(container.querySelector('[data-masmorra-start]')!);
    expect(container.querySelector('[data-area-sheet]')).toBeNull();
    expect(container.querySelector('[data-jogo="dungeon"]')).toBeTruthy();
    const d = recebidas.dungeon;
    expect(d.onEnter).toBe(p.onDungeonEnter);
    expect(d.onLose).toBe(p.onDungeonLose);
    expect(d.onHeartDrop).toBe(p.onDungeonHeartDrop);
    expect(d.onGlitchtama).toBe(p.onGlitchtama);
    expect(d.onFloorCleared).toBe(p.onFloorCleared);
    expect(d.onEnemyDefeated).toBe(p.onDungeonEnemyDefeated);
    expect(d.onEarnPoints).toBe(p.onEarnPoints);
    expect(d.onSpendBits).toBe(p.onSpendBits);
    expect(d.bits).toBe(77);
  });

  it('sair do jogo volta à cena da área', () => {
    const { container } = renderWithCss(<PlayAreaView {...props()} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    fireEvent.click(container.querySelector('[data-masmorra-start]')!);
    // O dublê não tem botão: chama-se o `onExit` que o jogo chamaria.
    act(() => { (recebidas.dungeon.onExit as () => void)(); });
    expect(container.querySelector('[data-jogo="dungeon"]')).toBeNull();
    expect(container.querySelector('[data-area-scene="exploracao"]')).toBeTruthy();
  });

  it('Corrida do Dino: recorde da chave DINO_BEST, 1 Bit a cada 100, e o CTA abre a DinoGame', () => {
    localStorage.setItem(STORAGE_KEYS.DINO_BEST, '1240');
    const p = props();
    const { container, getByRole } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="dino"]')!);
    const folha = getByRole('dialog', { name: 'Corrida do Dino' });
    expect(folha.textContent).toContain('1240');
    expect(folha.textContent).toContain('12 Bits');
    fireEvent.click(container.querySelector('[data-dino-start]')!);
    expect(recebidas.dino.onScore).toBe(p.onDinoScore);
    expect(recebidas.dino.onEarnPoints).toBe(p.onEarnPoints);
  });

  it('EN: rótulos e folha em inglês', () => {
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props({ language: 'en-US' })} />);
    expect(container.querySelector('[data-area-lot="masmorra"]')!.textContent).toContain('Dungeon');
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    expect(getByRole('dialog', { name: 'Dungeon' }).textContent).toMatch(/never your hearts/);
  });
});

describe('Jogos — Pipo e Pedra, papel e tesoura', () => {
  it('a cena tem o Pipo e só o lote do PPT', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    expect(container.querySelector('[data-area-npc]')!.textContent).toContain('Pipo');
    expect(container.querySelectorAll('[data-area-lot]')).toHaveLength(1);
    expect(container.querySelector('[data-area-lot="ppt"] [data-area-lot-art]')).toBeTruthy();
  });

  it('a folha mostra 5 Bits por vitória e o CTA abre o RPSGame com o onEarnPoints do App', () => {
    const p = props({ area: 'jogos' });
    const { container, getByRole } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="ppt"]')!);
    expect(getByRole('dialog', { name: 'Pedra, papel e tesoura' }).textContent).toContain('5 Bits');
    fireEvent.click(container.querySelector('[data-ppt-start]')!);
    expect(container.querySelector('[data-jogo="rps"]')).toBeTruthy();
    expect(recebidas.rps.onEarnPoints).toBe(p.onEarnPoints);
  });
});

describe('fiação no App (guard de fonte)', () => {
  const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
  it('as duas áreas montam o PlayAreaView com os handlers da masmorra de sempre', () => {
    const i = app.indexOf('<PlayAreaView');
    expect(i, 'o App não monta mais o PlayAreaView').toBeGreaterThan(0);
    const bloco = app.slice(i, app.indexOf('/>', app.indexOf('onSpendBits', i)));
    for (const h of ['handleDungeonEnter', 'handleDungeonLose', 'handleDungeonHeartDrop', 'handleGlitchtama',
      'handleDungeonFloorCleared', 'handleDungeonEnemyDefeated', 'handleDinoScore', 'handleEarnGamePoints']) {
      expect(bloco, `${h} sumiu da fiação das áreas de jogar`).toContain(h);
    }
  });
});
