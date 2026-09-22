import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ===========================================================================
// GUARD — orçamento de performance em BYTES, lido do `dist/` commitado.
//
// Até 21/09/2026 não existia orçamento de performance declarado no repo
// (`06-perf-a11y.md` §6). Decisão do dono #31: os números propostos viram
// régua. A condição real é PWA + WebView Capacitor no pior aparelho, e o app
// abre toda vez que o jogador olha o celular — cada KB do caminho crítico se
// paga centenas de vezes por dia.
//
// O que este guard faz: mede o que `dist/` tem HOJE, compara com o teto, e
// aceita SÓ a dívida listada em `DIVIDA_ATUAL` (por nome, com o tamanho
// medido). Um arquivo NOVO acima do teto reprova; uma dívida que CRESCE
// reprova. Pagar dívida é apagar a linha — o guard confere que linha morta
// some junto.
//
// Como o nome do asset carrega hash de conteúdo (`index-BmQOgiTC.js`), a
// dívida é identificada pelo NOME SEM HASH (`index.js`), que é o que o
// próximo build preserva.
//
// Exige `npm run build` antes (o `swCache.contract.test.ts` já exige o mesmo).
// ===========================================================================

const KB = 1024;

/** Tetos (decisão #31, `06-perf-a11y.md` §6). */
const TETO_JS_DE_ENTRADA = 250 * KB;   // chunk `index-*.js` referenciado por dist/index.html
const TETO_CSS_DE_ENTRADA = 100 * KB;  // único CSS, sem split, render-blocking
const TETO_IMAGEM = 400 * KB;          // qualquer imagem em dist/assets (hoje tudo é WebP)
const TETO_VIDEO = 800 * KB;           // qualquer .mp4/.webm em dist/assets

/**
 * Folga para a dívida de JS/CSS: um ajuste de copy ou um `if` novo mudam o
 * chunk em poucos bytes, e o guard não pode ficar vermelho por isso. O que
 * ele reprova é CRESCIMENTO — acima da folga, ou se pagou (mede e atualiza a
 * linha para baixo), ou se justifica (mede e atualiza para cima, no PR, com
 * o motivo). Mídia não tem folga: um vídeo não muda "por acaso".
 */
const FOLGA_JS_CSS = 8 * KB;

/**
 * DÍVIDA ATUAL — medida em 21/09/2026 (`ls -l dist/assets`), nome sem hash →
 * bytes. Cada linha é um arquivo que HOJE estoura o teto. Apagar a linha
 * quando o arquivo couber no teto (o guard cobra).
 */
const DIVIDA_ATUAL: Record<string, number> = {
  'index.js': 641_016,           // 626 KB — 2,5× o teto; `06-perf-a11y.md` correção #2
  'index.css': 142_696,          // 139 KB — 1,4× o teto
  'evolution-bg.mp4': 3_917_240, // 3,7 MB — fundo de UMA cerimônia; correção #3 (WebM/CSS)
  'intro.mp4': 2_524_939,        // 2,4 MB — vídeo da intro
};

const RAIZ = resolve(__dirname, '../..');
const DIST = resolve(RAIZ, 'dist');
const ASSETS = join(DIST, 'assets');

/** `index-BmQOgiTC.js` → `index.js`; `evolution-bg-DM-tg_BX.mp4` → `evolution-bg.mp4`. */
const semHash = (nome: string) => nome.replace(/-[A-Za-z0-9_-]{8}(\.[a-z0-9]+)$/, '$1');
const tamanho = (p: string) => statSync(p).size;
const kb = (n: number) => `${(n / KB).toFixed(0)} KB`;

const html = existsSync(join(DIST, 'index.html')) ? readFileSync(join(DIST, 'index.html'), 'utf8') : null;
const arquivos = existsSync(ASSETS) ? readdirSync(ASSETS) : [];

/**
 * Um arquivo acima do teto passa SÓ se está na dívida e não cresceu além da
 * folga. Devolve a mensagem do problema, ou `null`.
 */
function avaliar(nome: string, bytes: number, teto: number, folga: number): string | null {
  if (bytes <= teto) return null;
  const chave = semHash(nome);
  const divida = DIVIDA_ATUAL[chave];
  if (divida === undefined) {
    return `${nome}: ${kb(bytes)} > teto ${kb(teto)} e NÃO está em DIVIDA_ATUAL — arquivo novo acima do orçamento`;
  }
  if (bytes > divida + folga) {
    return `${nome}: ${kb(bytes)} cresceu além da dívida registrada (${kb(divida)} + folga ${kb(folga)}) — pague ou re-meça com justificativa`;
  }
  return null;
}

describe('orçamento de bytes (decisão #31) — lido do dist/', () => {
  it('rode `npm run build` antes: dist/index.html e dist/assets existem', () => {
    expect(html).not.toBeNull();
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it('AUTOVERIFICAÇÃO: tira o hash do nome sem tirar o nome', () => {
    expect(semHash('index-BmQOgiTC.js')).toBe('index.js');
    expect(semHash('evolution-bg-DM-tg_BX.mp4')).toBe('evolution-bg.mp4');
    expect(semHash('bar-frame-96x8-C3_JefTS.webp')).toBe('bar-frame-96x8.webp');
    expect(avaliar('novo-Abcdefgh.webp', TETO_IMAGEM + 1, TETO_IMAGEM, 0)).toMatch(/arquivo novo/);
    expect(avaliar('index-Abcdefgh.js', DIVIDA_ATUAL['index.js'] + FOLGA_JS_CSS + 1, TETO_JS_DE_ENTRADA, FOLGA_JS_CSS)).toMatch(/cresceu/);
    expect(avaliar('index-Abcdefgh.js', DIVIDA_ATUAL['index.js'], TETO_JS_DE_ENTRADA, FOLGA_JS_CSS)).toBeNull();
  });

  it(`JS de entrada (index-*.js do dist/index.html) ≤ ${kb(TETO_JS_DE_ENTRADA)}, salvo dívida`, () => {
    const m = /src="\/assets\/(index-[A-Za-z0-9_-]+\.js)"/.exec(html!);
    expect(m, 'dist/index.html não referencia index-*.js').not.toBeNull();
    const nome = m![1];
    expect(avaliar(nome, tamanho(join(ASSETS, nome)), TETO_JS_DE_ENTRADA, FOLGA_JS_CSS)).toBeNull();
  });

  it(`CSS de entrada ≤ ${kb(TETO_CSS_DE_ENTRADA)}, salvo dívida`, () => {
    const m = /href="\/assets\/(index-[A-Za-z0-9_-]+\.css)"/.exec(html!);
    expect(m, 'dist/index.html não referencia index-*.css').not.toBeNull();
    const nome = m![1];
    expect(avaliar(nome, tamanho(join(ASSETS, nome)), TETO_CSS_DE_ENTRADA, FOLGA_JS_CSS)).toBeNull();
  });

  it(`toda imagem em dist/assets ≤ ${kb(TETO_IMAGEM)}, salvo dívida`, () => {
    const imagens = arquivos.filter(f => /\.(webp|png|jpe?g|gif|svg|avif)$/i.test(f));
    expect(imagens.length, 'AUTOVERIFICAÇÃO: há imagens em dist/assets').toBeGreaterThan(100);
    const problemas = imagens.map(f => avaliar(f, tamanho(join(ASSETS, f)), TETO_IMAGEM, 0)).filter(Boolean);
    expect(problemas).toEqual([]);
  });

  it(`todo vídeo em dist/assets ≤ ${kb(TETO_VIDEO)}, salvo dívida`, () => {
    const videos = arquivos.filter(f => /\.(mp4|webm)$/i.test(f));
    const problemas = videos.map(f => avaliar(f, tamanho(join(ASSETS, f)), TETO_VIDEO, 0)).filter(Boolean);
    expect(problemas).toEqual([]);
  });

  it('dívida registrada é a REAL — linha de arquivo que já cabe no teto (ou sumiu) sai da lista', () => {
    const tetoDe = (chave: string) =>
      chave.endsWith('.js') ? TETO_JS_DE_ENTRADA
      : chave.endsWith('.css') ? TETO_CSS_DE_ENTRADA
      : /\.(mp4|webm)$/.test(chave) ? TETO_VIDEO
      : TETO_IMAGEM;
    const mortas = Object.keys(DIVIDA_ATUAL).filter(chave => {
      const real = arquivos.find(f => semHash(f) === chave);
      return !real || tamanho(join(ASSETS, real)) <= tetoDe(chave);
    });
    expect(mortas, 'dívida paga (ou arquivo apagado): tire a linha de DIVIDA_ATUAL').toEqual([]);
  });

  it('⚰️ #32 (21/09/2026): dist/assets não tem PNG — o build emite WebP e reescreve as referências', () => {
    // `scripts/convert-to-webp.mjs` converte, reescreve e apaga o PNG. Se um
    // PNG sobrou, ou a conversão falhou (o script sai com 1) ou alguém
    // reintroduziu o "alongside originals" — 100 MB de dist/ por build.
    expect(arquivos.filter(f => f.endsWith('.png'))).toEqual([]);
    const js = arquivos.filter(f => f.endsWith('.js')).map(f => readFileSync(join(ASSETS, f), 'utf8'));
    const refsPng = js.flatMap(c => c.match(/\/assets\/[A-Za-z0-9_-]+\.png/g) ?? []);
    expect(refsPng, 'bundle ainda pede .png de /assets/ — a primeira visita (sem SW) receberia 404').toEqual([]);
  });
});
