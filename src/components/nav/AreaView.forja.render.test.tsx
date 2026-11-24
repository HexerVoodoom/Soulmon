// @vitest-environment jsdom
/**
 * O lote Soulsmith (`forja.ferreiro`) abre a AreaSheet COM a Vitra (retrato + fala, como a Hexsmith) e a Forja de Alma (ForgeCard, lista de upar)
 * DENTRO da folha, rolável; um ✕ só (o da folha); sem a folha intermediária antiga nem tela cheia (23/11/2026, pedido do dono).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ComponentProps } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithCss, installDomGlobals } from '../../test/renderEnv';
import { GameStateProvider } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { AreaView } from './AreaView';

vi.mock('../../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }), cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x', adoptCloudSave: async () => false,
}));
vi.mock('../../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

const base = (): ComponentProps<typeof AreaView> => ({
  area: 'forja', language: 'pt-BR',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {}, play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => <p>hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
  initialSheet: 'ferreiro', onInitialSheetConsumed: vi.fn(),
}) as unknown as ComponentProps<typeof AreaView>;

beforeEach(() => { installDomGlobals(); localStorage.clear(); localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], totalXP: 100000 })); });
afterEach(cleanup);

for (const largura of [360, 375, 412]) {
  describe(`Soulsmith em ${largura}px`, () => {
    beforeEach(() => { Object.defineProperty(window, 'innerWidth', { configurable: true, value: largura }); window.dispatchEvent(new Event('resize')); });
    it('folha com a Vitra e a Forja dentro, sem rolagem interna, um ✕ só, sem tela cheia nem folha antiga', async () => {
      const { container } = renderWithCss(<GameStateProvider><AreaView {...base()} /></GameStateProvider>);
      await waitFor(() => expect(container.querySelector('[data-forge-card]')).not.toBeNull());
      const folha = container.querySelector('[data-area-sheet]')!;
      expect(folha).not.toBeNull();
      expect(container.querySelector('[data-area-sheet-npc]')).not.toBeNull(); // o retrato da Vitra
      expect(container.querySelector('[data-area-sheet-npc-line]')?.textContent ?? '').not.toBe(''); // a fala
      const corpo = container.querySelector<HTMLElement>('[data-area-sheet-body]')!;
      expect(corpo.contains(container.querySelector('[data-forge-card]'))).toBe(true);
      // a ForgeCard ORIGINAL (mapa de chakras com a figura humanoide), embutida no corpo: sem tela cheia, sem moldura de tela, sem barra própria
      expect(container.querySelector('[data-forge-view="map"]')).not.toBeNull();
      expect(corpo.querySelector('[data-vitra-map][data-vitra-inline]')).not.toBeNull();
      expect(container.querySelectorAll('[data-vitra-chakra]')).toHaveLength(3);
      expect(container.querySelector('[data-vitra-bar][hidden]')).not.toBeNull();
      expect(container.querySelector('.sm2-moldura-tela')).toBeNull();
      expect(container.querySelectorAll('[data-area-sheet-close]')).toHaveLength(1);
      // sem scroll: o corpo corta e o palco "contain" ancorado na base mostra a cabeça inteira
      expect(getComputedStyle(corpo).overflowY).toBe('hidden');
      const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
      const regra = css.match(/\.sm2-vit-map\[data-vitra-inline\] \.sm2-vit-stage \{[^}]*\}/)![0];
      expect(regra).toMatch(/inset-block: auto 0/); // ancorado na BASE
      expect(regra).not.toMatch(/translate\([^)]*%,\s*-?\d/); // sem puxar o palco para cima (cortava a cabeça)
      expect(regra).not.toMatch(/(^|[\s{;])top:\s*0/); // nunca ancorado no topo
      expect(regra).not.toMatch(/(^|[\s{;])width:\s*\d+px/);
      expect(regra).toMatch(/100cqh \/ \.95/); // corta só ~5% de vazio do topo
      expect(css).not.toMatch(/\.sm2-vit-map\[data-vitra-inline\][^{]*\{[^}]*prefers-reduced-motion/);
      expect(css).toMatch(/\.sm2-vit-pop\[data-horizontal\] \{[^}]*inline-size: calc\(100cqw - 16px\)/);
      // balão do chakra: horizontal, filho do palco (largura relativa), não solto na viewport
      fireEvent.click(container.querySelector('[data-vitra-chakra="nucleo"]')!);
      const pop = container.querySelector('[data-vitra-pop="nucleo"]')!;
      expect(pop.getAttribute('data-horizontal')).not.toBeNull();
      expect(pop.getAttribute('data-side')).toBe('below');
      expect(container.querySelector('[data-vitra-stage]')!.contains(pop)).toBe(true);
      expect(screen.queryByText(/Ir para a Forja de Alma|Go to the Soul Forge|gear takes shape/i)).toBeNull();
    });
  });
}
