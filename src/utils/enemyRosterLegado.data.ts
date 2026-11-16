/**
 * OS 5 RAMOS LEGADOS (dono, 16/11/2026, REGISTRO §445): as formas ANTIGAS (champion/ultimate/mega) das 5 linhas que ganharam arte nova
 * (som, eletricidade, tempo, arcano, marcial; PR 1, §438) não somem: viram um ramo extra de uma criatura base de OUTRO elemento, com NOME
 * NOVO derivado da raiz do hospedeiro (nenhuma espécie aparece com o nome de outra linha). Arte na pasta `legado/` do arquivo de arte
 * (`<id>-<estágio>.png`, 256², lida só por `enemyRosterArt.ts`). Elemento e golpes = os do hospedeiro, como em todo ramo (`buildRamos`).
 * PT = EN, como `FORMAS_ALTAS` e os outros ramos. Ids sem hífen e novos: o `#N` do Bestiário das entradas que já existiam não muda.
 * [id, linha de origem (elemento antigo), criatura hospedeira, elemento do hospedeiro, nome champion, nome ultimate, nome mega].
 */
export const LEGADO_DATA: ReadonlyArray<readonly [string, string, string, string, string, string, string]> = [
  ['lgvibri', 'som', 'zephir', 'ar', 'Zephrill', 'Zephwing', 'Zephmoth'],
  ['lgvoltrix', 'eletricidade', 'voidlet', 'espaco', 'Voidspark', 'Voidserp', 'Voidhalo'],
  ['lgchronib', 'tempo', 'smeltu', 'industrial', 'Smeltoise', 'Smeltick', 'Smeltgryph'],
  ['lgrunix', 'arcano', 'solion', 'luz', 'Solimur', 'Solowl', 'Solsphinx'],
  ['lgkenjo', 'marcial', 'bubbo', 'agua', 'Bubbonin', 'Bubbotrident', 'Bubbohydra'],
];
