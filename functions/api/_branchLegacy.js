// Compatibilidade de LEITURA das chaves KV gravadas com os ids de forma
// antigos (renomeio de 29/09/2026: vírus→poder, dado→harmonia,
// vacina→benevolência).
//
// DECISÃO: o servidor ACEITA só os ids novos (`VALID_FORM_ID`) e ESCREVE só
// chaves novas. As chaves já gravadas com id antigo — cache de sprite
// `sprite:img:<saveId>:<formId>` e o contador vitalício por forma
// `ent.aiForms.<formId>` — continuam sendo LIDAS pelo id antigo equivalente:
//  - o cache, para o sprite já pago não ser gerado (e cobrado) de novo;
//  - o contador, para o renomeio não ZERAR o teto por forma (seria gerar de
//    graça trocando de nome).
// Não migramos as chaves no KV: seria um job de varredura sem usuário em
// produção; a leitura dupla custa uma `get` a mais só no caminho de miss.
//
// O mapeamento é o de `src/utils/branchMigration.ts` (`newFormIdToLegacy`) e
// a paridade é travada por `branchLegacy.parity.test.js` (footgun 9).

const NEW_TO_OLD = { power: 'vir' + 'us', harmony: 'da' + 'ta', benevolence: 'vacc' + 'ine' };

/** Id de forma NOVO → o id antigo equivalente, ou `null` (rookie/ultra/desconhecido). */
export function legacyFormIdOf(formId) {
  if (typeof formId !== 'string') return null;
  const m = /^(champion|ultimate|mega)-(power|harmony|benevolence)$/.exec(formId);
  return m ? `${m[1]}-${NEW_TO_OLD[m[2]]}` : null;
}
