// @vitest-environment jsdom
/**
 * R1 (L2 de 29/09/2026) — o topo sobre a cena (`AreaTopBar overScene`, z-2) ficava POR CIMA da
 * Masmorra, do Dino, do PPT e do Duelo (a cena é `fixed` z-0 e os jogos moram DENTRO dela).
 * Regra: enquanto QUALQUER camada de tela cheia estiver aberta (folha, jogo, duelo) o topo some
 * (`visibility:hidden` — fora do foco e da árvore de acessibilidade); com o mapa, aparece.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, act, screen } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaTopBar } from './AreaTopBar';
import { AreaView, type AreaViewProps } from './AreaView';

const APP = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
const AREA_VIEW = readFileSync(resolve(__dirname, './AreaView.tsx'), 'utf8');

describe('AreaTopBar covered', () => {
  const topo = (covered: boolean) => renderWithCss(
    <AreaTopBar title="Exploração" backLabel="Voltar ao mapa" onBack={() => {}} overScene icon="map" covered={covered} />,
  ).container.querySelector('[data-area-topbar]') as HTMLElement;

  it('sem camada aberta: visível', () => {
    expect(topo(false).style.visibility).toBe('');
  });
  it('com camada aberta: escondido (sem foco, sem árvore de acessibilidade)', () => {
    const el = topo(true);
    expect(el.style.visibility).toBe('hidden');
    expect(el.hasAttribute('data-covered')).toBe(true);
  });
});

describe('AreaView avisa a camada aberta', () => {
  it('folha aberta = true; fechada = false; desmontar = false', async () => {
    const onLayerChange = vi.fn();
    const props = {
      area: 'mercado', language: 'pt-BR', onLayerChange,
      ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
      actions: {}, points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
      tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {}, play: {}, labTab: 'evolution', onLabTab: () => {},
      labContent: null, hallContent: () => null, guild: { saveId: 's', metaDoDiaCumprida: false },
    } as unknown as AreaViewProps;
    const { container, unmount } = renderWithCss(<AreaView {...props} />);
    expect(onLayerChange).toHaveBeenLastCalledWith(false);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot]')!); });
    expect(onLayerChange).toHaveBeenLastCalledWith(true);
    await act(async () => { fireEvent.click(screen.getByLabelText('Fechar')); });
    expect(onLayerChange).toHaveBeenLastCalledWith(false);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot]')!); });
    unmount();
    expect(onLayerChange).toHaveBeenLastCalledWith(false);
  });
});

describe('fiação (fonte)', () => {
  it('jogo e duelo contam como camada; o App esconde o topo com isso', () => {
    expect(AREA_VIEW).toContain('const layerOpen = sheet !== null || duelOpen || game !== null');
    expect(APP).toContain('onLayerChange={setAreaLayerOpen}');
    expect(APP).toContain('covered={!!area && areaLayerOpen}');
  });
});
