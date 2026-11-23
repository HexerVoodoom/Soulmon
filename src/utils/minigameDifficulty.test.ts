import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADVANCED_BITS_FACTOR, advancedFactorLabel, bitsForLevel } from './minigameDifficulty';
import { MATCH_POINTS } from '../components/RPSGame';

// §372 (dono, 14/11/2026): o nível 2 (Avançado) dos minijogos passou de ×2 para ×1,5, com `max(1, round(x))`.
describe('Bits do modo Avançado (×1,5 desde 14/11/2026)', () => {
  it('o fator é 1,5 (era 2)', () => {
    expect(ADVANCED_BITS_FACTOR).toBe(1.5);
  });

  it('nível 2: max(1, round(base × 1,5)) — prêmio pequeno não zera', () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(b => bitsForLevel(b, 2))).toEqual([2, 3, 5, 6, 8, 9, 15]);
    expect(bitsForLevel(0.4, 2)).toBe(1);
  });

  it('nível 1 (Comum) não muda; rodada sem Bits continua 0 no Avançado', () => {
    expect([0, 1, 5, 12].map(b => bitsForLevel(b, 1))).toEqual([0, 1, 5, 12]);
    expect(bitsForLevel(0, 2)).toBe(0);
    expect(bitsForLevel(-3, 2)).toBe(-3);
  });

  it('Pedra·Papel·Tesoura Avançado paga 8 por partida vencida (era 10)', () => {
    expect(bitsForLevel(MATCH_POINTS, 2)).toBe(8);
    expect(bitsForLevel(MATCH_POINTS, 1)).toBe(MATCH_POINTS);
  });

  it('Corrida, PPT e Barragem pagam o Avançado por `bitsForLevel` (sem conta própria × fator, que zeraria/arredondaria diferente)', () => {
    for (const f of ['DinoGame.tsx', 'RPSGame.tsx', 'SoulBarrage.tsx']) {
      const src = readFileSync(resolve(__dirname, '../components', f), 'utf8');
      expect(src, f).toMatch(/bitsForLevel\(/);
      expect(src, f).not.toMatch(/\*\s*ADVANCED_BITS_FACTOR|ADVANCED_BITS_FACTOR\s*:/);
    }
  });

  it('o rótulo exibido sai da constante (PT com vírgula)', () => {
    expect(advancedFactorLabel(true)).toBe('×1,5');
    expect(advancedFactorLabel(false)).toBe('×1.5');
  });
});
