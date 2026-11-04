// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet } from './MercadoSheets';

const base = {
  language: 'en-US' as const, points: 900, emblems: 12,
  ownedBackgrounds: ['bg-room'] as string[], equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[], equippedDecor: {} as Record<string, string>,
  missionProgress: {} as Record<string, number>,
  onBuy: () => true, onExchangeCredits: async () => true, onEquip: () => {}, onEquipFurniture: () => {},
};

describe('chip de redução: selo menos 2', () => {
  it('o CSS usa o sinal de menos real (U+2212), sem caractere de controle', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const m = css.match(/\.sm3-item-arte\[data-reduce\]::after\s*\{[^}]*content:\s*'([^']*)'/)!;
    expect(m[1]).toBe(String.raw`\2212 2`);
    expect(/[\u0080-\u009f]/.test(css)).toBe(false);
  });
  it('prateleira e folha mostram o selo no redutor e nao no chip comum', () => {
    renderWithCss(<MercadoStallSheet {...base} stall="itens" />);
    const red = document.querySelector('[data-shop-item="chip-reduce-power"]') as HTMLElement;
    const com = document.querySelector('[data-shop-item="chip-power"]') as HTMLElement;
    expect(red.querySelector('[data-reduce]')).not.toBeNull();
    expect(com.querySelector('[data-reduce]')).toBeNull();
    fireEvent.click(red);
    const folha = document.querySelector('[data-item-sheet="chip-reduce-power"]') as HTMLElement;
    expect(folha.querySelector('[data-reduce]')).not.toBeNull();
  });
});
