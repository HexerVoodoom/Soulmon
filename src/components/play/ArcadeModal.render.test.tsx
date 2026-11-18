// @vitest-environment jsdom
/**
 * O Fliperama de Canto abre SÓ o modal de minigames sobre a Home (REGISTRO §485): o corpo do Salão (cartas dos jogos), sem o NPC Pipo e sem mapa.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ArcadeModal } from './ArcadeModal';
import { CompanionHUD } from '../CompanionHUD';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { decorFitsSetting } from '../../utils/petStage';
import { ALL_SHOP_ITEMS } from '../../utils/shop';
import { renderWithCss } from '../../test/renderEnv';

describe('ArcadeModal', () => {
  it('fechado não renderiza nada', () => {
    const { container } = render(<ArcadeModal open={false} onClose={() => {}} language="pt-BR" onStart={() => {}} />);
    expect(container.querySelector('[data-arcade-modal]')).toBeNull();
  });

  it('aberto mostra as cartas dos minigames do Salão; jogar chama onStart com o jogo', async () => {
    const onStart = vi.fn();
    render(<ArcadeModal open onClose={() => {}} language="pt-BR" onStart={onStart} />);
    await import('./PlaySheets');
    const dino = await screen.findByText('Corrida com obstáculos', {}, { timeout: 8000 });
    expect(document.querySelector('[data-salao]')).not.toBeNull();
    expect(document.querySelector('[data-npc], [data-area-npc], [data-area-scene]')).toBeNull(); // sem o Pipo nem a cena do prédio
    fireEvent.click(dino.closest('button, [role="button"], [data-game-card]') ?? dino);
    expect(onStart).toHaveBeenCalledWith('dino');
  });
});

describe('o toque no fliperama da Home abre ESTE modal (e não leva ao prédio)', () => {
  const base = {
    companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
    healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10, useAI: false,
    language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 8,
  };
  it('com onOpenArcade: chama ele e NÃO o atalho do prédio', () => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === 'furn-arcade-cab')!;
    const bgId = Object.keys(PET_BACKGROUNDS).find(k => decorFitsSetting(item.fits ?? 'any', PET_BACKGROUNDS[k].setting) && PET_BACKGROUNDS[k].slots.includes('floor-left'))!;
    const abrir = vi.fn(); const go = vi.fn();
    const { container } = renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ 'floor-left': 'furn-arcade-cab' }} onOpenArcade={abrir} onGoToBuilding={go} />);
    fireEvent.click(container.querySelector('[data-decor-arcade]') as HTMLElement);
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(go).not.toHaveBeenCalled();
  });
});
