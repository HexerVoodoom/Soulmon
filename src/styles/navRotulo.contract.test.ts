/**
 * O RÓTULO DE NAVEGAÇÃO cabe no lugar dele — nos dois idiomas.
 *
 * ## De onde vem
 *
 * Este guard nasceu na barra inferior de 5 abas (09/09/2026): medido em
 * **320×640**, a célula tinha 60px, a caixa do rótulo 54px e "ATIVIDADES"
 * precisava de 61px — com `text-overflow: clip`, a pessoa lia "ATIVIDADE",
 * palavra completa no singular, sem sinal de corte. Só acontecia em PT-BR, e
 * por isso não aparecia para quem desenvolvia em inglês.
 *
 * A barra SAIU em 23/09/2026 (minimal-ui F1). Os rótulos de navegação agora
 * são os nomes das SEIS ÁREAS do Mapa (`areaLabel`, `navigation.ts`), num
 * cartão de meia largura. A lição continua valendo, e é ela que este arquivo
 * trava:
 *
 *  1. o rótulo mais longo tem teto de caracteres medido contra a caixa real;
 *  2. o rótulo nunca é cortado EM SILÊNCIO — no cartão ele quebra linha, e a
 *     fonte do `MapPage` não pode ganhar `nowrap`/`clip` no rótulo;
 *  3. o rótulo é Cinzel/Rubik, nunca Silkscreen (a voz do aparelho só mora
 *     dentro do visor);
 *  4. a AUTOVERIFICAÇÃO prova que os rótulos foram lidos da fonte de verdade.
 *
 * ⚠️ Não mede pixel — jsdom não faz layout. É um limite de CONTAGEM,
 * deliberadamente grosseiro; a conta está no `MAX_CARACTERES`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AREAS, areaLabel } from '../navigation';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(join(RAIZ, p), 'utf8');

/**
 * Teto de caracteres do nome da área. O cartão do Mapa em **320px**: 320 − 48
 * de gutter (px-6) − 12 de vão = 260 → 130px por cartão, − 24 de padding =
 * **106px de caixa**. A conta original era da Fredoka (~8,5px/caractere a
 * 16px). Desde 01/10/2026 a display é a Cinzel, mais larga: medido pelo
 * `hmtx` do woff2, "Laboratório" a 16px dá ~111px. Hoje o rótulo do Mapa é a
 * pílula de 12px (`MapPage`), onde a mesma palavra fica em ~83px — por isso o
 * teto de 12 continua valendo; se o rótulo voltar a 16px, ele cai para 10.
 */
const MAX_CARACTERES = 12;

/** Os rótulos vêm da FONTE (`areaLabel`), nunca copiados para cá (footgun 9). */
function rotulos(): Array<{ pt: string; en: string }> {
  return AREAS.map(id => ({ pt: areaLabel(id, true), en: areaLabel(id, false) }));
}

describe('🔴 o nome da área cabe no cartão do Mapa', () => {
  it('nenhum rótulo passa do teto, em nenhum dos dois idiomas', () => {
    const longos = rotulos()
      .flatMap(p => [p.pt, p.en])
      .filter(t => t.length > MAX_CARACTERES);
    expect(
      longos,
      `Nome de área com mais de ${MAX_CARACTERES} caracteres não cabe numa linha do cartão em 320px. Encurte a palavra.`,
    ).toEqual([]);
  });

  it('🔴 o rótulo nunca é cortado em silêncio: sem `nowrap`/`clip` no MapPage', () => {
    /* `clip` transformou "ATIVIDADES" em "ATIVIDADE", uma palavra portuguesa
       válida. No cartão o rótulo QUEBRA LINHA — e quem quiser mudar isso tem
       que reabrir esta decisão, não escorregar num estilo. */
    const src = ler('src/components/nav/MapPage.tsx');
    expect(src).not.toMatch(/textOverflow:\s*'clip'/);
    expect(src).not.toMatch(/whiteSpace:\s*'nowrap'/);
  });

  it('🔴 Silkscreen nunca sai do vidro: o rótulo é Cinzel/Rubik', () => {
    const src = ler('src/components/nav/MapPage.tsx');
    expect(src).toMatch(/var\(--sm2-font-display\)/);
    expect(src).not.toMatch(/font-pixel|Silkscreen/);
    expect(src).not.toMatch(/textTransform:\s*'uppercase'/);
  });

  it('AUTOVERIFICAÇÃO: seis áreas, os seis nomeados, par de idioma real', () => {
    // Guard que não acha nada passa sempre. Leitura frouxa ("achou mais que
    // zero") foi o que fez a primeira versão deste arquivo medir o vácuo.
    const pares = rotulos();
    expect(pares.map(p => p.pt)).toEqual(
      ['Mercado', 'Jogos', 'Arena', 'Exploração', 'Laboratório', 'Hall'],
    );
    expect(pares.map(p => p.en)).toEqual(
      ['Market', 'Games', 'Arena', 'Exploration', 'Laboratory', 'Hall'],
    );
    // Arena e Hall são iguais nos dois idiomas de propósito; os outros quatro
    // diferem — senão o teto do inglês nunca seria medido.
    expect(pares.filter(p => p.pt !== p.en).length).toBe(4);
  });
});
