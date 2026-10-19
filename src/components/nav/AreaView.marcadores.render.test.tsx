// @vitest-environment jsdom
/**
 * MARCADORES "!" E "?" NO PRÉDIO (D-33/D-34, K-7, REGISTRO §113).
 * "!" = missão de prédio disponível (some ao fazer); "?" = completa, não recolhida. O marcador é só um SINAL: tocar no
 * prédio abre a folha como sempre e NUNCA recolhe recompensa ali (o resgate continua só na Home). Preso ao lote (não intercepta toque, H11).
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';

vi.mock('../play/PasseioSheet', () => ({ PasseioSheet: () => <p data-stub="passeio">passeio</p> }));

const base = (over: Record<string, unknown> = {}): ComponentProps<typeof AreaView> => ({
  area: 'exploracao',
  language: 'en-US',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0,
  onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie',
  onEarnPoints: () => {},
  play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: null,
  hallContent: () => <p>hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
  ...over,
}) as unknown as ComponentProps<typeof AreaView>;

const lote = (c: HTMLElement, id: string) => c.querySelector(`[data-area-lot="${id}"]`) as HTMLElement;
const marca = (c: HTMLElement, id: string) => lote(c, id).querySelector('[data-mission-mark]') as HTMLElement | null;

describe('marcadores de missão nos prédios', () => {
  it('"!" no Caderno quando a missão está disponível; nos outros prédios, nada', () => {
    const { container } = renderWithCss(<AreaView {...base({ buildingMarks: { 'exploracao.caderno': 'available' } })} />);
    expect(marca(container, 'caderno')?.getAttribute('data-mission-mark')).toBe('available');
    expect(marca(container, 'passeio')).toBeNull();
    expect(marca(container, 'masmorra')).toBeNull();
  });

  it('"?" no Caderno quando a missão está completa e não recolhida', () => {
    const { container } = renderWithCss(<AreaView {...base({ buildingMarks: { 'exploracao.caderno': 'ready' } })} />);
    expect(marca(container, 'caderno')?.getAttribute('data-mission-mark')).toBe('ready');
  });

  it('sem marca (paga, ou prop ausente): o prédio fica limpo', () => {
    const a = renderWithCss(<AreaView {...base({ buildingMarks: {} })} />);
    expect(marca(a.container, 'caderno')).toBeNull();
    const b = renderWithCss(<AreaView {...base()} />);
    expect(marca(b.container, 'caderno')).toBeNull();
  });

  it('o marcador não intercepta o toque (H11) e tocar no prédio só abre a folha: nunca recolhe recompensa ali', async () => {
    const onVisitBuilding = vi.fn();
    const { container } = renderWithCss(<AreaView {...base({ onVisitBuilding, buildingMarks: { 'exploracao.caderno': 'ready' } })} />);
    const m = marca(container, 'caderno')!;
    expect((m.parentElement as HTMLElement).style.pointerEvents).toBe('none');
    expect(container.querySelector('[data-claim], [data-resgatar]')).toBeNull();
    await act(async () => { fireEvent.click(lote(container, 'caderno')); });
    expect(onVisitBuilding).toHaveBeenCalledWith('exploracao.caderno');
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('prédio trancado pelo Vínculo não mostra marcador', () => {
    const { container } = renderWithCss(<AreaView {...base({ bondLevel: 0, buildingMarks: { 'exploracao.caderno': 'available' } })} />);
    expect(marca(container, 'caderno')).toBeNull();
  });

  it('sem pulso: o marcador não tem animação (vale com prefers-reduced-motion)', () => {
    const { container } = renderWithCss(<AreaView {...base({ buildingMarks: { 'exploracao.caderno': 'available' } })} />);
    const m = marca(container, 'caderno')!;
    expect(m.style.animation ?? '').toBe('');
    expect((m.parentElement as HTMLElement).style.animation ?? '').toBe('');
  });
});
