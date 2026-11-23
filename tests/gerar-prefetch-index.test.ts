import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error módulo .mjs sem tipos
import { gerarIndice, ehEssencial } from '../scripts/gerar-prefetch-index.mjs';

describe('gerar-prefetch-index (fixture, nunca o dist commitado)', () => {
  const dist = mkdtempSync(join(tmpdir(), 'pfx-'));
  mkdirSync(join(dist, 'assets'));
  const arquivos: [string, number][] = [
    ['index-AbCd1234.js', 5], ['app-AbCd1234.css', 3], ['lote-AbCd1234.webp', 7],
    ['fx-AbCd1234.webp', 9], ['sem-hash.png', 1], ['clip-AbCd1234.mp4', 20],
  ];
  for (const [n, t] of arquivos) writeFileSync(join(dist, 'assets', n), 'x'.repeat(t));
  const idx = gerarIndice(dist, new Date(0));
  it('separa essencial (código + prefixos de UI) do resto, código primeiro', () => {
    const ess = idx.essencial.map((e: [string, number]) => e[0]);
    expect(ess).toHaveLength(3);
    expect(ess[2]).toBe('/assets/lote-AbCd1234.webp');
    expect(idx.resto).toEqual([['/assets/fx-AbCd1234.webp', 9]]);
  });
  it('ignora nome sem hash e vídeo', () => {
    const todos = [...idx.essencial, ...idx.resto].map((e: [string, number]) => e[0]);
    expect(todos.some((u: string) => u.includes('sem-hash') || u.includes('.mp4'))).toBe(false);
    expect(idx.v).toBe(1);
  });
  it('ehEssencial usa o prefixo do nome', () => {
    expect(ehEssencial('npc-12345678.webp')).toBe(true);
    expect(ehEssencial('fx-12345678.webp')).toBe(false);
  });
});
