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
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FULL_UNLOCK_PRICE_LABEL } from './monetization';

const HTML = readFileSync(resolve(__dirname, '../../public/termos.html'), 'utf8');
const MARCADOR = /<span data-price="full-unlock">([^<]*)<\/span>/g;

/** Compara VALOR, não formatação: o texto PT usa "R$ 29,90" e o EN "R$29.90",
 *  e as duas formas são o mesmo preço. O que não pode divergir é o número. */
function valor(rotulo: string): number {
  const m = /R\$\s*([\d.,]+)/.exec(rotulo);
  if (!m) return NaN;
  // O ÚLTIMO separador é o decimal (29,90 em PT · 29.90 em EN); os anteriores
  // são de milhar e caem fora. Sem isso, "29.90" virava 2990.
  const bruto = m[1];
  const corte = Math.max(bruto.lastIndexOf(','), bruto.lastIndexOf('.'));
  if (corte < 0) return Number(bruto);
  const inteiro = bruto.slice(0, corte).replace(/[.,]/g, '');
  return Number(`${inteiro}.${bruto.slice(corte + 1)}`);
}

describe('preço do desbloqueio completo — Termos x código', () => {
  const marcados = [...HTML.matchAll(MARCADOR)].map(m => m[1]);

  it('os Termos marcam o preço nos dois idiomas', () => {
    expect(marcados.length).toBe(2);
  });

  it('o preço publicado é o MESMO de FULL_UNLOCK_PRICE_LABEL', () => {
    const esperado = valor(FULL_UNLOCK_PRICE_LABEL);
    expect(Number.isNaN(esperado)).toBe(false);
    for (const rotulo of marcados) {
      expect(rotulo, `"${rotulo}" precisa citar a moeda`).toContain('R$');
      expect(valor(rotulo), `"${rotulo}" diverge de FULL_UNLOCK_PRICE_LABEL (${FULL_UNLOCK_PRICE_LABEL})`)
        .toBe(esperado);
    }
  });

  it('não existe preço solto fora do marcador', () => {
    const semMarcados = HTML.replace(MARCADOR, '');
    const soltos = semMarcados.match(/R\$\s*\d[\d.,]*/g) ?? [];
    expect(soltos, 'preço fora de data-price="full-unlock" não é verificável').toEqual([]);
  });

  it('a checagem REPROVA de verdade quando o HTML diverge (o teste do teste)', () => {
    // Sem este caso, um marcador escrito errado (que nunca casa) faria os
    // outros passarem vazios e o teste viraria decoração.
    const divergente = HTML.replace(
      MARCADOR,
      (_todo, rotulo: string) =>
        `<span data-price="full-unlock">${rotulo.replace(/\d/, d => String((Number(d) + 1) % 10))}</span>`,
    );
    const outros = [...divergente.matchAll(MARCADOR)].map(m => m[1]);
    expect(outros.length).toBe(2);
    expect(outros.every(r => valor(r) === valor(FULL_UNLOCK_PRICE_LABEL))).toBe(false);
  });
});
