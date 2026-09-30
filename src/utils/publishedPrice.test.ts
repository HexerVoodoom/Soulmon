// ---------------------------------------------------------------------------
// O preço publicado nos Termos não pode divergir do preço do app.
//
// `public/termos.html` é HTML estático: não importa TS, então não existe fonte
// única trivial com `FULL_UNLOCK_PRICE_LABEL`. O que existe é ESTE teste — se
// alguém mudar o preço num lado só, a suíte reprova. Um comentário pedindo
// atenção não pega nada; a auditoria do run 01 achou cinco documentos afirmando
// o oposto do código, todos com o comentário certinho por perto.
//
// O contrato é o marcador `data-price="full-unlock"`: toda menção ao preço no
// HTML mora dentro dele, e o teste também reprova preço solto FORA do marcador
// (senão bastaria escrever um novo "R$ 39,90" num parágrafo para escapar).
//
// Desde 21/09/2026 (decisão do dono #25) os DOIS idiomas têm moedas
// diferentes: o PT publica `FULL_UNLOCK_PRICE_LABEL` (R$) e o EN publica
// `FULL_UNLOCK_PRICE_LABEL_USD` (US$). A metade PT é o que vem antes de
// `<h1 id="en">`; a EN é o que vem depois.
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FULL_UNLOCK_PRICE_LABEL, FULL_UNLOCK_PRICE_LABEL_USD } from './monetization';

const HTML = readFileSync(resolve(__dirname, '../../public/termos.html'), 'utf8');
const MARCADOR = /<span data-price="full-unlock">([^<]*)<\/span>/g;
/** Qualquer preço em real ou dólar, com ou sem espaço depois do símbolo. */
const PRECO_SOLTO = /(?:R|US)\$\s*\d[\d.,]*/g;

/** Compara VALOR, não formatação: "R$ 29,90" e "R$29.90" são o mesmo preço.
 *  O que não pode divergir é o número. */
function valor(rotulo: string): number {
  const m = /(?:R|US)\$\s*([\d.,]+)/.exec(rotulo);
  if (!m) return NaN;
  // O ÚLTIMO separador é o decimal (29,90 em PT · 6.99 em EN); os anteriores
  // são de milhar e caem fora. Sem isso, "29.90" virava 2990.
  const bruto = m[1];
  const corte = Math.max(bruto.lastIndexOf(','), bruto.lastIndexOf('.'));
  if (corte < 0) return Number(bruto);
  const inteiro = bruto.slice(0, corte).replace(/[.,]/g, '');
  return Number(`${inteiro}.${bruto.slice(corte + 1)}`);
}

function metades(html: string): { pt: string; en: string } {
  // EN é o documento principal (vem primeiro); o PT é a localização em <div id="pt">.
  const corte = html.indexOf('<div id="pt"');
  if (corte < 0) throw new Error('termos.html sem o <div id="pt"> que separa EN de PT');
  return { en: html.slice(0, corte), pt: html.slice(corte) };
}

function marcados(html: string): string[] {
  return [...html.matchAll(MARCADOR)].map(m => m[1]);
}

describe('preço do desbloqueio completo — Termos x código', () => {
  const { pt, en } = metades(HTML);

  it('os Termos marcam o preço UMA vez em cada idioma', () => {
    expect(marcados(pt).length).toBe(1);
    expect(marcados(en).length).toBe(1);
  });

  it('PT publica FULL_UNLOCK_PRICE_LABEL, em real', () => {
    const esperado = valor(FULL_UNLOCK_PRICE_LABEL);
    expect(Number.isNaN(esperado)).toBe(false);
    const [rotulo] = marcados(pt);
    expect(rotulo, `"${rotulo}" precisa citar R$`).toContain('R$');
    expect(rotulo, 'o PT não publica dólar').not.toContain('US$');
    expect(valor(rotulo), `"${rotulo}" diverge de FULL_UNLOCK_PRICE_LABEL (${FULL_UNLOCK_PRICE_LABEL})`)
      .toBe(esperado);
  });

  it('EN publica FULL_UNLOCK_PRICE_LABEL_USD, em dólar', () => {
    const esperado = valor(FULL_UNLOCK_PRICE_LABEL_USD);
    expect(Number.isNaN(esperado)).toBe(false);
    expect(FULL_UNLOCK_PRICE_LABEL_USD).toContain('US$');
    const [rotulo] = marcados(en);
    expect(rotulo, `"${rotulo}" precisa citar US$`).toContain('US$');
    expect(valor(rotulo), `"${rotulo}" diverge de FULL_UNLOCK_PRICE_LABEL_USD (${FULL_UNLOCK_PRICE_LABEL_USD})`)
      .toBe(esperado);
  });

  it('não existe preço solto fora do marcador (R$ nem US$)', () => {
    const semMarcados = HTML.replace(MARCADOR, '');
    const soltos = semMarcados.match(PRECO_SOLTO) ?? [];
    expect(soltos, 'preço fora de data-price="full-unlock" não é verificável').toEqual([]);
  });

  it('a checagem REPROVA de verdade quando o HTML diverge (o teste do teste)', () => {
    // Sem este caso, um marcador escrito errado (que nunca casa) faria os
    // outros passarem vazios e o teste viraria decoração.
    const troca = (rotulo: string) => rotulo.replace(/\d/, d => String((Number(d) + 1) % 10));
    const ptDivergente = pt.replace(MARCADOR, (_t, r: string) => `<span data-price="full-unlock">${troca(r)}</span>`);
    const enDivergente = en.replace(MARCADOR, (_t, r: string) => `<span data-price="full-unlock">${troca(r)}</span>`);
    expect(marcados(ptDivergente).length).toBe(1);
    expect(marcados(enDivergente).length).toBe(1);
    expect(valor(marcados(ptDivergente)[0])).not.toBe(valor(FULL_UNLOCK_PRICE_LABEL));
    expect(valor(marcados(enDivergente)[0])).not.toBe(valor(FULL_UNLOCK_PRICE_LABEL_USD));
  });
});
