/**
 * LOTE 4 dos elementos "curados" (05/11/2026, `planos/curados-novos.md`): os 6 que faltavam para Planta, Industrial e Fada deixarem
 * de parar em 2 componentes em `elementoCombinado` (§232, emenda). 3 trios e 3 quádruplos. Dados puros.
 * [número, slug = id do elemento, nome do Soulmon, elemento 1 (dominante: dá os golpes e a arte de reserva), elemento 2, elemento 3, (elemento 4)].
 * Números 262-267 (lote 3 = 246-261). Não existem no class-system vendorizado: a receita mora aqui.
 * Sem arte própria ainda: `enemyRosterArt.ts` cai para o rookie da criatura base do elemento dominante; ícone e FX entram por glob
 * (`elementos/el-<id>.png`, `fx-ataque/fx-<id>-*.png`) e a lista do que falta está em `docs/ASSETS-A-GERAR.md`.
 */
export type Lote4Row = readonly [string, string, string, string, string, string] | readonly [string, string, string, string, string, string, string];

export const COMBINADOS_LOTE4_DATA: ReadonlyArray<Lote4Row> = [
  ['262', 'clareira', 'Glaedryn', 'planta', 'luz', 'vida'],
  ['263', 'alto_forno', 'Furnarok', 'industrial', 'fogo', 'terra'],
  ['264', 'bencao_feerica', 'Blessylle', 'fada', 'luz', 'vida'],
  ['265', 'floresta_ancestral', 'Eldrowan', 'planta', 'terra', 'tempo', 'arcano'],
  ['266', 'colosso_blindado', 'Colossarm', 'industrial', 'eletricidade', 'vigor', 'marcial'],
  ['267', 'corte_feerica', 'Faecourt', 'fada', 'arcano', 'luz', 'som'],
];

/**
 * Os 3 trios que JÁ existiam no roster (nº 205-207, `enemyRosterData.ts`, arte e ícone na main) e agora entram no catálogo curado.
 * Não geram roster (os `cmb205`..`cmb207` já existem, com 2 componentes nos golpes). Receita = a do motor (`vendor/class-system`).
 */
export const CURADOS_PROMOVIDOS_DATA: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ['205', 'pestilencia', 'planta', 'morte', 'vileza'],
  ['206', 'maldicao', 'fada', 'sombra', 'vileza'],
  ['207', 'cyber', 'industrial', 'eletricidade', 'arcano'],
];
