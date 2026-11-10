/**
 * CONTRATO (10/11/2026): o elemento EFETIVO do Soulmon é lido por UMA função (`petElementOf`). Quem decide combate, Home, Arena,
 * Laboratório, widget (moldura) e o espelho do servidor NÃO lê `potionElement` nem o registro do estágio por conta própria — só os
 * módulos donos da regra. Um leitor novo por fora recriaria o bug "troquei de forma e o elemento não mudou".
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DONOS = new Set([
  'src/App.tsx',                          // evoluir/prompt (usa `potionElement` ao evoluir e ao montar o prompt)
  'src/contexts/GameStateContext.tsx',    // leitura/higienização do save
  'src/utils/elementPotion.ts',
  'src/utils/formaSnapshot.ts',
  'src/utils/starterElements.ts',         // `petElementOf`, o leitor único
  'src/utils/elementoCombinado.ts',       // prompt (stagesComElemento)
  'src/utils/formaEquip.ts',
  'src/utils/hexsmith.ts',                // `HexCost.potionElement` é o custo de uma peça, outro conceito
]);

function varre(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { varre(p, out); continue; }
    if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) && !/\.d\.ts$/.test(n)) out.push(p);
  }
  return out;
}

describe('o elemento efetivo vem de petElementOf', () => {
  it('nenhum arquivo fora dos donos lê `.potionElement` do estado', () => {
    const fora: string[] = [];
    for (const f of varre(join(process.cwd(), 'src'))) {
      const rel = relative(process.cwd(), f).replace(/\\/g, '/');
      if (DONOS.has(rel)) continue;
      if (/\.potionElement\b/.test(readFileSync(f, 'utf8'))) fora.push(rel);
    }
    expect(fora, 'leitores de potionElement fora dos donos').toEqual([]);
  });
  it('os pontos de tela que precisam do elemento usam petElementOf (Home, Arena, combate, Laboratório, widget)', () => {
    const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
    expect((app.match(/petElementOf\(gameState\)/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect(readFileSync(join(process.cwd(), 'src/utils/widgetFrames.ts'), 'utf8')).toContain('petElementOf(');
    expect(readFileSync(join(process.cwd(), 'src/contexts/GameStateContext.tsx'), 'utf8')).toContain('petElementOf(gameState)');
  });
});
