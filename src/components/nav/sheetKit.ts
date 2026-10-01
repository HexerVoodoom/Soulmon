import type { CSSProperties } from 'react';

/**
 * O CARD DE DENTRO DE UMA FOLHA DE LOTE (01/10/2026, I1/I2 da navegação do
 * dono: "hoje tudo misturado"). Toda opção que a pessoa escolhe dentro de uma
 * folha — um jogo do Ateliê, uma conquista, uma Travessia — é um bloco com
 * fundo e contorno PRÓPRIOS, separado do vizinho por espaço, e não mais uma
 * linha de texto sobre a folha com um filete embaixo.
 *
 * Só tokens existentes (`docs/manual/04-IDENTIDADE-VISUAL.md` §4): fundo
 * `surface-2` sobre a folha `surface`, traço `line`, raio `radius-md` (o degrau
 * de card/painel). Nenhuma cor nova.
 */
export const sheetCard: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
  padding: 'var(--sm2-space-3, 12px)',
  boxSizing: 'border-box',
  border: '1px solid var(--sm2-line)',
  borderRadius: 'var(--sm2-radius-md)',
  backgroundColor: 'var(--sm2-surface-2)',
};

/** A lista de cards: sem marcador, com o respiro entre eles (nunca filete). */
export const sheetCardList: CSSProperties = {
  listStyle: 'none', margin: 0, padding: 0,
  display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-3, 12px)',
};

/** O título de um card: display, peso de título, tinta de texto. */
export const sheetCardTitle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--sm2-font-display)', fontWeight: 600,
  fontSize: 'var(--sm2-text-md)', lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
};
