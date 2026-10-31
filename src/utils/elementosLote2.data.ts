/**
 * LOTE 2 dos 50 elementos "curados" do class-system que ainda não eram elementos do jogo (30/10/2026): 17 trios (`E:/tmp/elementos-lote2.json`).
 * Dados puros. [número, slug = id do class-system, nome do Soulmon, elemento 1 (dominante: dá os golpes e a arte de reserva), elemento 2, elemento 3].
 * Sem arte própria ainda: `enemyRosterArt.ts` cai para o rookie da criatura base do elemento dominante; quando o PNG
 * `combinados/NNN-slug.png` entrar, ele vence sozinho. Ver `docs/ELEMENTO-POR-SPRITE.md`.
 */
export const COMBINADOS_LOTE2_DATA: ReadonlyArray<readonly [string, string, string, string, string, string]> = [
  ['229', 'materia_escura', 'Voidmass', 'gravidade', 'sombra', 'arcano'],
  ['230', 'milagre', 'Miraclo', 'luz', 'vida', 'arcano'],
  ['231', 'memoria', 'Remembra', 'tempo', 'arcano', 'luz'],
  ['232', 'coral_celeste', 'Choralis', 'som', 'luz', 'arcano'],
  ['233', 'via_lactea', 'Galaxu', 'espaco', 'luz', 'arcano'],
  ['234', 'delirio', 'Deliro', 'vileza', 'som', 'arcano'],
  ['235', 'cacador_de_almas', 'Soulreap', 'marcial', 'morte', 'sombra'],
  ['236', 'presagio', 'Omenyx', 'tempo', 'sombra', 'espaco'],
  ['237', 'horizonte_de_eventos', 'Eventor', 'gravidade', 'espaco', 'sombra'],
  ['238', 'lamina_do_juizo', 'Judgeblade', 'marcial', 'luz', 'morte'],
  ['239', 'bencao_marcial', 'Blessarm', 'luz', 'marcial', 'vigor'],
  ['240', 'arauto', 'Heraldo', 'marcial', 'som', 'luz'],
  ['241', 'farol', 'Beaconel', 'luz', 'espaco', 'som'],
  ['242', 'carniceiro', 'Gorevor', 'vileza', 'vigor', 'morte'],
  ['243', 'entropia_final', 'Entropyx', 'tempo', 'morte', 'gravidade'],
  ['244', 'gladiador', 'Gladiox', 'marcial', 'vigor', 'som'],
  ['245', 'punho_gravitico', 'Gravifist', 'marcial', 'gravidade', 'vigor'],
];
