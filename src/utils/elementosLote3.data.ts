/**
 * LOTE 3 dos 50 elementos "curados" do class-system que ainda não eram elementos do jogo (30/10/2026): os 16 de 4 componentes
 * (`E:/tmp/elementos-lote3.json`). Dados puros. [número, slug = id do class-system, nome do Soulmon, elemento 1 (dominante: dá os
 * golpes e a arte de reserva), elemento 2, elemento 3, elemento 4]. Números 246-261 (lote 1 = 212-228, lote 2 = 229-245).
 * Sem arte própria ainda: `enemyRosterArt.ts` cai para o rookie da criatura base do elemento dominante.
 */
export const COMBINADOS_LOTE3_DATA: ReadonlyArray<readonly [string, string, string, string, string, string, string]> = [
  ['246', 'avatar_elemental', 'Elemantis', 'fogo', 'agua', 'terra', 'ar'],
  ['247', 'titano_forjado', 'Forjatan', 'fogo', 'terra', 'vigor', 'marcial'],
  ['248', 'cataclismo', 'Cataclix', 'fogo', 'terra', 'gravidade', 'espaco'],
  ['249', 'sopro_do_dragao', 'Dragalen', 'fogo', 'ar', 'vigor', 'marcial'],
  ['250', 'ragnarok', 'Ragnavor', 'fogo', 'morte', 'tempo', 'gravidade'],
  ['251', 'genesis', 'Genesia', 'agua', 'terra', 'luz', 'vida'],
  ['252', 'tempestade_perfeita', 'Stormaris', 'agua', 'ar', 'eletricidade', 'som'],
  ['253', 'leviata', 'Leviathor', 'agua', 'sombra', 'morte', 'gravidade'],
  ['254', 'senhor_da_praga', 'Plagalor', 'agua', 'vileza', 'morte', 'vida'],
  ['255', 'sinfonia_do_caos', 'Chaosonia', 'arcano', 'sombra', 'vileza', 'som'],
  ['256', 'vontade_absoluta', 'Volitara', 'arcano', 'luz', 'vigor', 'som'],
  ['257', 'arquiteto_da_realidade', 'Realarch', 'arcano', 'tempo', 'gravidade', 'espaco'],
  ['258', 'ceifador_estelar', 'Stellareap', 'sombra', 'morte', 'marcial', 'espaco'],
  ['259', 'renascimento', 'Reborniel', 'luz', 'morte', 'vida', 'tempo'],
  ['260', 'juizo_final', 'Judicarum', 'luz', 'morte', 'tempo', 'som'],
  ['261', 'cavaleiro_absoluto', 'Absolknight', 'luz', 'vigor', 'marcial', 'tempo'],
];
