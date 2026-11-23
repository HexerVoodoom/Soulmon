import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const raiz = resolve(__dirname, '..', '..');
const ler = (p: string) => readFileSync(resolve(raiz, p), 'utf8');

describe('pré-download do onboarding: contrato de build e SW', () => {
  it('o build gera o índice e ele é servido no-store', () => {
    expect(ler('package.json')).toMatch(/node scripts\/gerar-prefetch-index\.mjs/);
    expect(ler('public/_headers')).toMatch(/\/prefetch-index\.json\s+Cache-Control: no-cache, no-store/);
  });
  it('o SW segue guardando /assets/ com hash no acervo e recusando HTML no lugar de asset', () => {
    const sw = ler('public/sw.js');
    expect(sw).toMatch(/cacheDoAsset\(url\.pathname\)/);
    expect(sw).toMatch(/semHtmlFalso/);
    expect(sw).toMatch(/ASSET_CACHE_MAX/);
  });
  it('o onboarding inicia o módulo e o módulo não escreve cache por conta própria', () => {
    expect(ler('src/components/SoulmonOnboarding.tsx')).toMatch(/iniciarPrefetchOnboarding/);
    expect(ler('src/utils/prefetchOnboarding.ts')).not.toMatch(/caches\.open|cache\.put|addAll/);
  });
});
