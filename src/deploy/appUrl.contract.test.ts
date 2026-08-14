import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * FRONTEIRA: casca nativa ↔ deploy.
 *
 * O APK e o overlay Electron **não embarcam o app** — carregam uma URL remota.
 * Nome, ícone e `appId` vêm de `android/`, então uma casca apontando para o
 * lugar errado parece perfeita e abre outro produto.
 *
 * Foi o que aconteceu: o primeiro APK gerado pelo CI abriu o **DigiApp**, com
 * o nome e o ícone do Soulmon. `capacitor.config.json` apontava para
 * `digiapp-a5e.pages.dev` (projeto Pages do repositório antigo), e o mesmo
 * endereço estava em DOIS arquivos do desktop — o overlay lia o save do outro
 * projeto. Quatro arquivos, uma verdade, nada que os obrigasse a concordar.
 *
 * Nenhum teste do repositório olhava para configuração de deploy: os 653 casos
 * cobriam o app rodando, não onde a casca vai buscá-lo. É a mesma assinatura
 * dos outros defeitos desta rodada — um lado supondo algo do outro, sem
 * ninguém no meio (ver docs/STATUS.md §5).
 */

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** Endereços que servem OUTRO produto. Nunca podem aparecer numa casca. */
const PROIBIDOS = ['digiapp-a5e.pages.dev'];

/** Os quatro lugares que precisam concordar sobre onde o Soulmon vive. */
const FONTES = [
  { arquivo: 'capacitor.config.json', extrai: (s: string) => JSON.parse(s).server?.url },
  {
    arquivo: 'android/app/src/main/assets/capacitor.config.json',
    extrai: (s: string) => JSON.parse(s).server?.url,
  },
  {
    arquivo: 'desktop/renderer/src/config.ts',
    extrai: (s: string) => s.match(/APP_URL\s*=\s*['"]([^'"]+)['"]/)?.[1],
  },
  {
    arquivo: 'desktop/electron/main.js',
    extrai: (s: string) => s.match(/FULL_APP_URL\s*=\s*[^|]*\|\|\s*['"]([^'"]+)['"]/)?.[1],
  },
];

describe('fronteira casca nativa ↔ deploy', () => {
  it('todas as fontes declaram uma URL (o extrator não pode falhar em silêncio)', () => {
    // Sem este caso, uma regex que parasse de casar faria os outros passarem
    // comparando `undefined` com `undefined`.
    for (const { arquivo, extrai } of FONTES) {
      const url = extrai(read(arquivo));
      expect(url, `${arquivo}: não consegui extrair a URL — o extrator quebrou`).toBeTruthy();
      expect(url).toMatch(/^https:\/\//);
    }
  });

  it('nenhuma casca aponta para um endereço de outro produto', () => {
    const infratores: string[] = [];
    for (const { arquivo, extrai } of FONTES) {
      const url = extrai(read(arquivo)) ?? '';
      for (const proibido of PROIBIDOS) {
        if (url.includes(proibido)) infratores.push(`${arquivo} → ${url}`);
      }
    }
    expect(infratores, 'a casca abriria outro app com a cara do Soulmon').toEqual([]);
  });

  it('as quatro fontes concordam sobre onde o Soulmon vive', () => {
    const urls = FONTES.map(({ arquivo, extrai }) => ({ arquivo, url: extrai(read(arquivo)) }));
    const distintas = [...new Set(urls.map(u => u.url))];
    expect(
      distintas,
      `divergência entre cascas:\n${urls.map(u => `  ${u.arquivo} → ${u.url}`).join('\n')}`,
    ).toHaveLength(1);
  });

  it('a config do Android é cópia fiel da raiz (cap sync não pode ter ficado para trás)', () => {
    // `android/.../assets/capacitor.config.json` é GERADO por `npx cap sync` e
    // commitado. Se alguém edita a raiz e esquece o sync, o APK continua indo
    // para o endereço velho — e o build passa.
    const raiz = JSON.parse(read('capacitor.config.json'));
    const android = JSON.parse(read('android/app/src/main/assets/capacitor.config.json'));
    expect(android.server?.url).toBe(raiz.server?.url);
    expect(android.appId).toBe(raiz.appId);
    expect(android.appName).toBe(raiz.appName);
  });
});
