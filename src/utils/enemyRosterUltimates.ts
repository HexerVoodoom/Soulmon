/**
 * ULTIMATES DE 2 COMPONENTES (dono, 15/11/2026, REGISTRO §405): 14 criaturas que existem SÓ como Ultimate (sem Champion), uma por par
 * de elementos, para a Arena de run do elemento ter Ultimate de 2 componentes com arte nos 20 elementos (`arenaComponentes.ts`).
 * `[id, par (= id fundido em DERIVED_ELEMENT_PAIRS), componentes, elemento DOS GOLPES (o da run), nome]`.
 * A arte é `novos-arquivo/paralelos/<id>-ultimate.png` (glob de `enemyRosterArt.ts`). Entram no FIM do roster (o `#N` do Bestiário não muda).
 *
 * TABELA ÚNICA DOS NOMES: trocar um nome é editar só a última coluna desta linha. Nomes APROVADOS pelo dono em 15/11/2026 (só o EN: o roster não tem campo PT; os PT de
 * `nomes-propostos.md` ficam fora do código): `E:/Soulmon-assets/_lote-15-11/ultimate-2comp/nomes-propostos.md`.
 */
export const ULTIMATES_2COMP_DATA: ReadonlyArray<readonly [string, string, readonly string[], string, string]> = [
  ['pargelo', 'gelo', ['agua', 'ar'], 'agua', 'Rimeveil'],
  ['partempestade', 'tempestade', ['ar', 'eletricidade'], 'ar', 'Galemantle'],
  ['parplasma', 'plasma', ['fogo', 'eletricidade'], 'eletricidade', 'Ionwyrm'],
  ['parcristal', 'cristal', ['terra', 'arcano'], 'arcano', 'Prismoth'],
  ['parconstelacao', 'constelacao', ['espaco', 'luz'], 'espaco', 'Astracoil'],
  ['parmagnetar', 'magnetar', ['gravidade', 'eletricidade'], 'gravidade', 'Orbitrix'],
  ['paraurora', 'aurora', ['ar', 'luz'], 'luz', 'Auraveil'],
  ['parforja', 'forja', ['marcial', 'fogo'], 'marcial', 'Anvilhorn'],
  ['partrovao', 'trovao', ['som', 'eletricidade'], 'som', 'Resonyx'],
  ['parcrepusculo', 'crepusculo', ['sombra', 'luz'], 'sombra', 'Vesperwing'],
  ['parcronomancia', 'cronomancia', ['tempo', 'arcano'], 'tempo', 'Chronomane'],
  ['parfenix', 'fenix', ['fogo', 'vida'], 'vida', 'Emberbloom'],
  ['parmaestria', 'maestria', ['marcial', 'vigor'], 'vigor', 'Acornarch'],
  ['parheresia', 'heresia', ['luz', 'vileza'], 'vileza', 'Heretorn'],
];
