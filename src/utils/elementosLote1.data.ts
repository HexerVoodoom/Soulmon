/**
 * LOTE 1 dos 50 elementos "curados" do class-system que ainda não eram elementos do jogo (30/10/2026): 13 trios + 4 que
 * vêm do lote 1 (`E:/tmp/elementos-lote1.json`). Dados puros. [número, slug = id do class-system, nome do Soulmon,
 * elemento 1 (dominante: dá os golpes e a arte de reserva), elemento 2, elemento 3].
 * Sem arte própria ainda: `enemyRosterArt.ts` cai para o rookie da criatura base do elemento dominante; quando o PNG
 * `combinados/NNN-slug.png` entrar, ele vence sozinho (sem mexer em código). Ver `docs/ELEMENTO-POR-SPRITE.md`.
 */
export const COMBINADOS_LOTE1_DATA: ReadonlyArray<readonly [string, string, string, string, string, string]> = [
  ['212', 'geiser', 'Geyzor', 'fogo', 'agua', 'terra'],
  ['213', 'vulcao', 'Vulkar', 'fogo', 'terra', 'ar'],
  ['214', 'deserto', 'Dunarid', 'fogo', 'terra', 'tempo'],
  ['215', 'relampago_seco', 'Fulgaru', 'fogo', 'ar', 'eletricidade'],
  ['216', 'supernova', 'Novarok', 'fogo', 'gravidade', 'espaco'],
  ['217', 'nevasca', 'Blizzo', 'agua', 'terra', 'ar'],
  ['218', 'permafrost', 'Frostal', 'agua', 'terra', 'tempo'],
  ['219', 'monsoes', 'Monsun', 'agua', 'ar', 'vida'],
  ['220', 'peste_negra', 'Plaguor', 'agua', 'vileza', 'morte'],
  ['221', 'coro_dos_afogados', 'Drownell', 'agua', 'morte', 'som'],
  ['222', 'ossario_vivo', 'Bonegrow', 'terra', 'morte', 'vida'],
  ['223', 'jardim_eterno', 'Evergro', 'terra', 'vida', 'tempo'],
  ['224', 'aurora_boreal', 'Borealis', 'ar', 'eletricidade', 'luz'],
  ['225', 'duelista_temporal', 'Chronduel', 'ar', 'marcial', 'tempo'],
  ['226', 'pulso_cosmico', 'Cosmopulse', 'eletricidade', 'som', 'espaco'],
  ['227', 'sabbat', 'Sabbatu', 'arcano', 'sombra', 'vileza'],
  ['228', 'hipnose', 'Hypnore', 'arcano', 'sombra', 'som'],
];
