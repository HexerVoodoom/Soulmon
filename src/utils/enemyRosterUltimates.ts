/**
 * ULTIMATES DE 2 COMPONENTES (dono, 15/11/2026, REGISTRO §405): 14 criaturas que existem SÓ como Ultimate (sem Champion), uma por par
 * de elementos, para a Arena de run do elemento ter Ultimate de 2 componentes com arte nos 20 elementos (`arenaComponentes.ts`).
 * `[id, par (= id fundido em DERIVED_ELEMENT_PAIRS), componentes, elemento DOS GOLPES (o da run), nome]`.
 * A arte é `novos-arquivo/paralelos/<id>-ultimate.png` (glob de `enemyRosterArt.ts`). Entram no FIM do roster (o `#N` do Bestiário não muda).
 *
 * TABELA ÚNICA DOS NOMES: trocar um nome é editar só a última coluna desta linha. Os nomes abaixo são provisórios (o do par); os
 * propostos estão em `E:/Soulmon-assets/_lote-15-11/ultimate-2comp/nomes-propostos.md` e entram aqui quando o dono aprovar.
 */
export const ULTIMATES_2COMP_DATA: ReadonlyArray<readonly [string, string, readonly string[], string, string]> = [
  ['pargelo', 'gelo', ['agua', 'ar'], 'agua', 'Gelo'],
  ['partempestade', 'tempestade', ['ar', 'eletricidade'], 'ar', 'Tempestade'],
  ['parplasma', 'plasma', ['fogo', 'eletricidade'], 'eletricidade', 'Plasma'],
  ['parcristal', 'cristal', ['terra', 'arcano'], 'arcano', 'Cristal'],
  ['parconstelacao', 'constelacao', ['espaco', 'luz'], 'espaco', 'Constelação'],
  ['parmagnetar', 'magnetar', ['gravidade', 'eletricidade'], 'gravidade', 'Magnetar'],
  ['paraurora', 'aurora', ['ar', 'luz'], 'luz', 'Aurora'],
  ['parforja', 'forja', ['marcial', 'fogo'], 'marcial', 'Forja'],
  ['partrovao', 'trovao', ['som', 'eletricidade'], 'som', 'Trovão'],
  ['parcrepusculo', 'crepusculo', ['sombra', 'luz'], 'sombra', 'Crepúsculo'],
  ['parcronomancia', 'cronomancia', ['tempo', 'arcano'], 'tempo', 'Cronomancia'],
  ['parfenix', 'fenix', ['fogo', 'vida'], 'vida', 'Fênix'],
  ['parmaestria', 'maestria', ['marcial', 'vigor'], 'vigor', 'Maestria'],
  ['parheresia', 'heresia', ['luz', 'vileza'], 'vileza', 'Heresia'],
];
