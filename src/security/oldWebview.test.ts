// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * O aviso de WebView antigo vive num <script> inline do `index.html`, fora do
 * bundle — tem que rodar mesmo quando o bundle não roda. Isso o deixa fora do
 * alcance de qualquer teste de componente, que é exatamente o tipo de lugar
 * onde defeito mora sem ninguém ver (ver docs/STATUS.md §5).
 *
 * Este teste extrai o script do HTML de verdade e o executa nas DUAS direções.
 * Sem o caso "navegador moderno", um script quebrado que nunca faz nada
 * passaria despercebido; sem o caso "navegador antigo", um script que nunca
 * dispara passaria igual.
 */

const ROOT = path.resolve(__dirname, '../..');

/** Pega o script inline que contém o aviso — por conteúdo, não por posição. */
function extrairAviso(): string {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    m => m[1],
  );
  const alvo = scripts.find(s => s.includes('oklch'));
  if (!alvo) throw new Error('não achei o script de aviso no index.html');
  return alvo;
}

function rodar(supports: (prop: string, valor: string) => boolean) {
  document.body.innerHTML = '<div id="root"></div>';
  // @ts-expect-error — substituindo a API do ambiente de propósito
  globalThis.CSS = { supports };
  // eslint-disable-next-line no-new-func
  new Function(extrairAviso())();
  return document.getElementById('root')!.innerHTML;
}

const MODERNO = () => true;
const ANTIGO = (_p: string, v: string) => !/oklch|color-mix/.test(v);

describe('aviso de WebView antigo (index.html)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
  });

  it('num navegador moderno não escreve nada (o React assume o #root)', () => {
    expect(rodar(MODERNO)).toBe('');
  });

  it('num navegador sem oklch/color-mix mostra o aviso em vez de tela branca', () => {
    const html = rodar(ANTIGO);
    expect(html).not.toBe('');
    expect(html).toContain('WebView');
    expect(html).toMatch(/atualiza/i);
  });

  it('fala a língua do aparelho (EN é a base, PT-BR é a localização)', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    const en = rodar(ANTIGO);
    expect(en).toContain('out of date');
    expect(en).not.toMatch(/desatualizado/);

    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    const pt = rodar(ANTIGO);
    expect(pt).toContain('desatualizado');
  });

  it('não explode se CSS.supports não existir (navegador MUITO antigo)', () => {
    document.body.innerHTML = '<div id="root"></div>';
    // @ts-expect-error — o caso que este guard existe para cobrir
    globalThis.CSS = undefined;
    expect(() => new Function(extrairAviso())()).not.toThrow();
    expect(document.getElementById('root')!.innerHTML).not.toBe('');
  });

  it('escapa o user agent antes de injetar como HTML', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 <img src=x onerror=alert(1)>',
      configurable: true,
    });
    rodar(ANTIGO);
    const raiz = document.getElementById('root')!;
    // A afirmação é sobre ELEMENTO criado, não sobre a string: o texto pode
    // conter "onerror=" à vontade desde que seja texto. A primeira versão deste
    // bloco concatenava HTML e filtrava `<>&` depois — inerte, mas é o padrão
    // que vira XSS quando alguém acrescenta o próximo campo ao lado. Agora é
    // createElement + textContent, e não existe caminho de injeção.
    expect(raiz.querySelectorAll('img')).toHaveLength(0);
    expect(raiz.innerHTML).not.toContain('<img');
    // o UA continua VISÍVEL para diagnóstico, só que como texto
    expect(raiz.textContent).toContain('onerror=alert(1)');
  });
});
