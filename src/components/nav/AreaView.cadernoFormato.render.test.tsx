// @vitest-environment jsdom
/** O link do hábito ("Ir ao Caderno") abre a folha JÁ no formato do hábito (bug do dono, 23/11/2026): gratidão não cai em escrita livre. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ComponentProps } from 'react';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';
import { cadernoFormatoOfCatalogId } from '../../data/catalogResources';

afterEach(cleanup);

const base = (over: Record<string, unknown> = {}): ComponentProps<typeof AreaView> => ({
  area: 'forja', language: 'pt-BR',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {}, play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => <p>hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
  caderno: { entries: [], onChange: () => {} },
  onInitialSheetConsumed: vi.fn(),
  ...over,
}) as unknown as ComponentProps<typeof AreaView>;

describe('Ir ao Caderno abre no formato do hábito', () => {
  it('cada hábito linkado aponta para o seu formato', () => {
    expect(cadernoFormatoOfCatalogId('mente-gratidao')).toBe('gratidao');
    expect(cadernoFormatoOfCatalogId('criatividade-escrita-livre')).toBe('livre');
    expect(cadernoFormatoOfCatalogId('proposito-refletir-valores')).toBe('importa');
    expect(cadernoFormatoOfCatalogId('corpo-caminhar')).toBeUndefined();
    expect(cadernoFormatoOfCatalogId(undefined)).toBeUndefined();
  });

  for (const [formato, rotulo] of [['gratidao', 'Gratidão'], ['livre', 'Escrita livre'], ['importa', 'O que importa hoje']] as const) {
    it(`initialSection "${formato}" abre a folha com "${rotulo}" selecionado`, async () => {
      renderWithCss(<AreaView {...base({ initialSheet: 'caderno', initialSection: formato })} />);
      const radio = await waitFor(() => screen.getByRole('radio', { name: rotulo }));
      expect(radio.getAttribute('aria-checked')).toBe('true');
    });
  }

  it('abrir o Caderno sem formato do link mantém o sugerido do dia (nada selecionado à força)', async () => {
    renderWithCss(<AreaView {...base({ initialSheet: 'caderno' })} />);
    await waitFor(() => expect(screen.getAllByRole('radio').length).toBeGreaterThan(0));
    expect(screen.getAllByRole('radio').filter(r => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
  });
});
