/**
 * LOTE 5 dos elementos "curados" (23/11/2026, pedido P5): 4 TRIOS novos (fantasma, morto-vivo, sangue, fúria). Dados puros e ADITIVOS:
 * nenhum id nem receita existente muda; os números 268-271 vêm depois do lote 4 (262-267).
 * [número, slug = id do elemento, nome PROVISÓRIO do Soulmon (aguarda o dono), elemento 1 (DOMINANTE: dá os golpes e a arte de reserva), elemento 2, elemento 3].
 * Receitas (livres em `ELEMENTOS_CURADOS`, verificadas): fantasma = vida+morte+tempo; morto_vivo = vida+morte+vileza; sangue = vida+vileza+água; fúria = fogo+vigor+vileza.
 * Dominante = 1º componente da linha: fantasma→morte, morto_vivo→morte, sangue→vida, furia→fogo (decisão e motivo em `docs/REGISTRO-DE-DECISOES.md`).
 * Sem arte própria ainda: `enemyRosterArt.ts` cai para o rookie da criatura base do dominante; ícone (`el-<id>`) cai para o do 1º componente
 * (`elementIconArt.ts`); FX e Soulmon na lista de `docs/ASSETS-A-GERAR.md`.
 */
export type Lote5Row = readonly [string, string, string, string, string, string];

export const COMBINADOS_LOTE5_DATA: ReadonlyArray<Lote5Row> = [
  ['268', 'fantasma', 'Spectrel', 'morte', 'vida', 'tempo'],
  ['269', 'morto_vivo', 'Revenox', 'morte', 'vida', 'vileza'],
  ['270', 'sangue', 'Hemolisk', 'vida', 'vileza', 'agua'],
  ['271', 'furia', 'Furiosk', 'fogo', 'vigor', 'vileza'],
];
