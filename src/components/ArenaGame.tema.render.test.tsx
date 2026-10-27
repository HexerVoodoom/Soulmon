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

describe('Arena: icone do jogador e tema', () => {
  it('jogador sombra sem ficha: o icone do jogador e a SOMBRA (nao o vigor padrao); inimigos e cenario da sombra', async () => {
    const els = await lutar('sombra');
    expect(els.length).toBeGreaterThanOrEqual(2);
    expect(els.every(e => e === 'sombra')).toBe(true);
    expect(document.querySelector('[data-stage-scene]')?.getAttribute('data-stage-scene')).toBe('dominio:sombra');
    const me = document.querySelector('[data-stage-plate="me"]')?.parentElement?.querySelector('[data-stage-element]');
    expect(me?.getAttribute('data-stage-element')).toBe('sombra');
    expect(me?.querySelector('img')?.getAttribute('src')).toBe(elementIcon('sombra'));
  });

  it('jogador fada: inimigos de fada; jogador industrial: cenario do dominio industrial', async () => {
    const fada = await lutar('fada');
    expect(fada.every(e => e === 'fada')).toBe(true);
    cleanup();
    await lutar('industrial');
    expect(document.querySelector('[data-stage-scene]')?.getAttribute('data-stage-scene')).toBe('dominio:industrial');
  });
});
