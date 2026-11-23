/**
 * CONTRATO DAS MARGENS DE MOLDURA (P7 fase 2, 22/11/2026). O conteúdo de um modal com moldura rola no vão entre as laterais da arte;
 * `--sm2-moldura-pad-x` precisa deixar, de cada lado, pelo menos `MARGEM_MIN_U` de respiro ALÉM da largura da lateral — senão o texto
 * encosta ou fica atrás da borda. Medido em `u` (1% da largura do modal), então vale igual em 360, 375 e 412 px (e o px resultante é
 * conferido abaixo). Quem criar uma variante de moldura nova entra na tabela.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('src/index.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const MARGEM_MIN_U = 1.5;
const LARGURAS = [360, 375, 412];

/** Valor em `u` de uma declaração `prop: calc(var(--u) * N)` dentro do corpo de uma regra cujo seletor casa `sel`. */
function uDe(sel: RegExp, prop: string): number | null {
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  let achou: number | null = null;
  while ((m = re.exec(CSS))) {
    if (!sel.test(m[1].trim())) continue;
    const d = new RegExp(String.raw`${prop}:\s*calc\(var\(--u\)\s*\*\s*([0-9.]+)\)`).exec(m[2]);
    if (d) achou = parseFloat(d[1]);
  }
  return achou;
}

const VARIANTES = [
  { nome: 'padrão (prédios)', pad: /^\.sm2-moldura-modal$/, lado: /^\.sm2-moldura-modal__lado$/ },
  { nome: 'ranking', pad: /^\.sm3-ranking$/, lado: /^\.sm2-moldura-modal--ranking \.sm2-moldura-modal__lado$/ },
  { nome: 'files', pad: /^\.sm3-mochila\.sm3-files$/, lado: /^\.sm2-moldura-modal--files \.sm2-moldura-modal__lado$/ },
  { nome: 'aço (Hexsmith)', pad: /^\.sm2-moldura-modal\.sm2-moldura-modal--aco$/, lado: /^\.sm2-moldura-modal--aco \.sm2-moldura-modal__lado$/ },
];

describe('margens internas das molduras de modal', () => {
  for (const v of VARIANTES) {
    it(`${v.nome}: pad-x ≥ lateral + ${MARGEM_MIN_U}u`, () => {
      const pad = uDe(v.pad, '--sm2-moldura-pad-x');
      const lado = uDe(v.lado, 'width');
      expect(pad, 'pad-x não encontrado').not.toBeNull();
      expect(lado, 'largura da lateral não encontrada').not.toBeNull();
      expect(pad! - lado!).toBeGreaterThanOrEqual(MARGEM_MIN_U);
      for (const w of LARGURAS) {
        // respiro em px real entre a borda da arte e o conteúdo
        expect(((pad! - lado!) * w) / 100).toBeGreaterThanOrEqual(5);
      }
    });
  }
});
