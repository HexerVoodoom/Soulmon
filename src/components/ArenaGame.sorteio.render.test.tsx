// @vitest-environment jsdom
/**
 * ARENA x TEMA E ICONE DO JOGADOR (27/10/2026).
 *
 * Bug: sem ficha no estagio, o icone do elemento do JOGADOR caia em `atributos.principal` (o `vigor` padrao, o "marronzinho"), em vez do
 * elemento do oraculo. Aqui: jogador sombra (SEM ficha, so `petElement`) -> icone `sombra`; inimigos e cenario do tema.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ArenaGame } from './ArenaGame';
import { elementIcon } from '../utils/elementIconArt';

vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playTaskComplete: vi.fn(), playFeed: vi.fn() }));
vi.mock('../utils/sprites', () => ({
  spriteUrlFacesLeft: () => false,
  getDungeonEnemySprite: () => ({ sprite: 'x.png', name: 'x', line: 'x' }),
  getSpriteForStage: () => 'pet.png',
}));

async function lutar(petElement: string) {
  renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" petElement={petElement} seed={7} onExit={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: /Entrar na Arena/i }));
  await waitFor(() => expect(document.querySelector('[data-battle-stage]')).toBeTruthy());
  return [...document.querySelectorAll('[data-stage-element]')].map(n => n.getAttribute('data-stage-element'));
}

describe('Arena: icone do jogador, inimigos gerais e cenario de arena', () => {
  it('jogador sombra sem ficha: o icone do jogador e a SOMBRA (nao o vigor padrao)', async () => {
    await lutar('sombra');
    const me = document.querySelector('[data-stage-plate="me"]')?.parentElement?.querySelector('[data-stage-element]');
    expect(me?.getAttribute('data-stage-element')).toBe('sombra');
    expect(me?.querySelector('img')?.getAttribute('src')).toBe(elementIcon('sombra'));
  });

  it('28/10: SEM tema (inimigos nao ficam presos ao elemento do jogador) e o cenario NUNCA e de dominio de elemento', async () => {
    const vistos = new Set<string>();
    for (const seed of [7, 8, 9, 10, 11]) {
      renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" petElement="sombra" seed={seed} onExit={() => {}} />);
      fireEvent.click(await screen.findByRole('button', { name: /Entrar na Arena/i }));
      await waitFor(() => expect(document.querySelector('[data-battle-stage]')).toBeTruthy());
      [...document.querySelectorAll('[data-stage-element]')].forEach(n => vistos.add(n.getAttribute('data-stage-element')!));
      expect(document.querySelector('[data-stage-scene]')?.getAttribute('data-stage-scene') ?? '').not.toMatch(/^dominio:/);
      cleanup();
    }
    expect(vistos.size).toBeGreaterThan(2);
  });
});
