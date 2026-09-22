import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * FRONTEIRA: versão mostrada ↔ versão empacotada.
 *
 * Em 21/09/2026 o repositório tinha TRÊS versões ao mesmo tempo: a tela
 * dizia "Soulmon 1.0.2" (literal em `FeedbackLink.tsx`), o `package.json`
 * dizia `0.1.0` e o `android/app/build.gradle` dizia `versionName "1.1.4"`.
 * Um e-mail de feedback chegava com uma versão que não existia em loja
 * nenhuma (design-critic B1). Fonte única = `package.json` › `version`:
 * o Vite injeta em `__APP_VERSION__` (`vite.config.ts` › `define`), a UI lê
 * de lá, e este teste prende o gradle ao mesmo número — o gradle não lê o
 * `package.json`, então a única coisa que os obriga a concordar é isto.
 */

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SEMVER = /^\d+\.\d+\.\d+$/;

describe('versão única', () => {
  const pkg = JSON.parse(read('package.json')) as { version: string };
  const gradle = read('android/app/build.gradle');
  const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];

  it('package.json › version é semver e é a fonte', () => {
    expect(pkg.version).toMatch(SEMVER);
  });

  it('android/app/build.gradle › versionName == package.json › version', () => {
    expect(versionName, 'versionName não encontrado no build.gradle').toBeDefined();
    expect(versionName).toBe(pkg.version);
  });

  it('vite.config.ts injeta __APP_VERSION__ a partir do package.json (não de um literal)', () => {
    const vite = read('vite.config.ts');
    expect(vite).toMatch(/__APP_VERSION__:\s*JSON\.stringify\(APP_VERSION\)/);
    expect(vite).toMatch(/readFileSync\([^)]*package\.json/);
  });

  it('FeedbackLink.tsx lê __APP_VERSION__ e não carrega literal de versão', () => {
    const src = read('src/components/FeedbackLink.tsx');
    expect(src).toContain('__APP_VERSION__');
    // Nenhuma atribuição `APP_VERSION = '1.x.y'` — o defeito original.
    expect(src).not.toMatch(/APP_VERSION\s*=\s*['"]\d+\.\d+\.\d+['"]/);
  });

  it('em runtime (com o define aplicado pelo vitest.config), APP_VERSION == package.json › version', async () => {
    const { APP_VERSION } = await import('../components/FeedbackLink');
    expect(APP_VERSION).toBe(pkg.version);
  });
});
