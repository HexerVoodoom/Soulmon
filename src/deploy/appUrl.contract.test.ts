import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

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
/**
 * `android/app/src/main/assets/capacitor.config.json` é GERADO por
 * `npx cap sync` e está no `.gitignore` (android/.gitignore:98). Ele NÃO entra
 * na lista de fontes obrigatórias.
 *
 * A primeira versão deste guard o tratava como fonte fixa — e passava, porque
 * existia como resíduo local na máquina de quem o escreveu. Num checkout limpo
 * (worktree novo, CI, outro dev) os 4 casos quebravam com ENOENT. Guard que
 * depende de artefato não-versionado passa por motivo ambiental, que é
 * exatamente a família de defeito que este arquivo existe para pegar.
 */
const GERADO_ANDROID = 'android/app/src/main/assets/capacitor.config.json';
const temGeradoAndroid = fs.existsSync(path.join(ROOT, GERADO_ANDROID));

const FONTES = [
  { arquivo: 'capacitor.config.json', extrai: (s: string) => JSON.parse(s).server?.url },
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

  it('o artefato do cap sync não é versionado (senão vira uma quinta fonte da verdade)', () => {
    // Se alguém commitar este arquivo, ele passa a poder DIVERGIR da raiz e o
    // APK vai para o endereço velho com o build verde. A garantia é que ele
    // não exista no índice do git — regenerado a cada build, sempre da raiz.
    const rastreado = execSync('git ls-files -- ' + GERADO_ANDROID, { cwd: ROOT })
      .toString()
      .trim();
    expect(rastreado, `${GERADO_ANDROID} foi versionado — remova do índice`).toBe('');
  });

  it.skipIf(!temGeradoAndroid)(
    'se o cap sync já rodou aqui, a cópia gerada bate com a raiz',
    () => {
      // Só roda onde o artefato existe (máquina de dev que já buildou). No CI e
      // em checkout limpo é pulado de propósito — e o caso acima garante que
      // pular é seguro, porque o arquivo é sempre regenerado da raiz.
      const raiz = JSON.parse(read('capacitor.config.json'));
      const android = JSON.parse(read(GERADO_ANDROID));
      expect(android.server?.url).toBe(raiz.server?.url);
      expect(android.appId).toBe(raiz.appId);
      expect(android.appName).toBe(raiz.appName);
    },
  );
});
