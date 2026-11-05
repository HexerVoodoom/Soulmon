// @vitest-environment jsdom
/**
 * "!" e MOEDA SOBRE O PRÉDIO (dono, 04/11/2026): a fileira de marcas pousa ACIMA do prédio (translateY(-100% - folga)), nunca
 * sobrepondo; "!" e moeda lado a lado no mesmo contêiner; a moeda é só indicador (não intercepta toque) e some sem o recurso.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';

vi.mock('../play/PasseioSheet', () => ({ PasseioSheet: () => <p data-stub="passeio">passeio</p> }));

const base = (over: Record<string, unknown> = {}): ComponentProps<typeof AreaView> => ({
  area: 'exploracao', language: 'en-US',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {}, play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => <p>hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false }, ...over,
}) as unknown as ComponentProps<typeof AreaView>;

const lote = (c: HTMLElement, id: string) => c.querySelector(`[data-lot-marks-box="${id}"]`) as HTMLElement;

describe('marcas acima do prédio', () => {
  it('o "!" do Passeio mora numa fileira ACIMA da arte (sobe a própria altura + folga), sem tocar', () => {
    const { container } = renderWithCss(<AreaView {...base({ buildingMarks: { 'exploracao.passeio': 'available' } })} />);
    const fileira = lote(container, 'passeio');
    expect(fileira.querySelector('[data-mission-mark="available"]')).toBeTruthy();
    expect(fileira.style.pointerEvents).toBe('none');
  });

  it('"!" e moeda ficam lado a lado na MESMA fileira; sem o recurso a moeda some', () => {
    const a = renderWithCss(<AreaView {...base({ area: 'forja', buildingMarks: { 'forja.refugio': 'available' }, buildingCoins: { 'forja.refugio': ['refugio-energia'] } })} />);
    const fileira = lote(a.container, 'refugio');
    expect(fileira.querySelector('[data-mission-mark]')).toBeTruthy();
    expect(fileira.querySelector('[data-lot-coin="energy"]')).toBeTruthy();
    expect(fileira.style.display).toBe('flex');
    expect(fileira.style.gap).toBe('4px');
    const b = renderWithCss(<AreaView {...base({ area: 'forja', buildingMarks: { 'forja.refugio': 'available' }, buildingCoins: {} })} />);
    expect(lote(b.container, 'refugio').querySelector('[data-lot-coin]')).toBeNull();
    expect(lote(b.container, 'refugio').querySelector('[data-mission-mark]')).toBeTruthy();
  });

  it('só a moeda (sem "!") também aparece, e nenhum outro prédio ganha moeda', () => {
    const { container } = renderWithCss(<AreaView {...base({ area: 'forja', buildingCoins: { 'forja.refugio': ['refugio-energia'] } })} />);
    expect(lote(container, 'refugio').querySelector('[data-lot-coin="energy"]')).toBeTruthy();
    expect(lote(container, 'refugio').querySelector('[data-mission-mark]')).toBeNull();
    expect(lote(container, 'caderno')).toBeNull();
  });
});
