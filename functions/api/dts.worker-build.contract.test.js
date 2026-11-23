import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// O build do Worker (esbuild, via wrangler) compila os `.d.ts` de `functions/api` como código:
// `export const X: number;` sem `declare` derruba o deploy da web e o APK (#558, 04/11/2026).
describe('.d.ts de functions/api', () => {
  const dir = fileURLToPath(new URL('.', import.meta.url));
  for (const nome of readdirSync(dir).filter(f => f.endsWith('.d.ts'))) {
    it(`${nome} só declara constantes com \`declare\``, () => {
      expect(readFileSync(dir + nome, 'utf8')).not.toMatch(/^export (const|let|var) /m);
    });
  }
});
