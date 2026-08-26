/**
 * As chaves da reconciliação de `saveId` moraram fora de casa por uma frente.
 *
 * `RECONCILE_KEYS` nasceu DENTRO de `cloudSave.ts` porque a frente que criou
 * `reconcileSaveId` não era dona de `utils/storageKeys.ts`, e ela deixou isso
 * escrito no próprio código ("Ao integrar, mova-as para lá"). Este arquivo é a
 * integração — e o guard que a torna segura.
 *
 * ## O que é contrato e o que é arrumação
 *
 * Mudar a constante DE ARQUIVO é arrumação: ninguém no mundo tem um
 * `localStorage` que saiba de que módulo TypeScript a string veio.
 *
 * Mudar o VALOR da string é contrato quebrado, e quebrado em silêncio: quem já
 * tomou a reconciliação tem `soulmon-previous-save-id` e
 * `soulmon-reconcile-backup` gravados no aparelho. `CONFLICT_BACKUP` em
 * especial é a CÓPIA DO PROGRESSO LOCAL descartado quando a nuvem ganhou o
 * conflito — é o único lugar de onde uma recuperação manual ainda é possível.
 * Renomeá-la não apaga o backup: torna-o inalcançável para sempre, que dá no
 * mesmo e sem nem um erro para avisar.
 *
 * Por isso os valores estão escritos aqui como LITERAIS, e não derivados do
 * módulo — um teste que dissesse `expect(K.X).toBe(K.X)` passaria feliz depois
 * de qualquer renomeação. O literal é a memória do aparelho do jogador, colada
 * dentro da suíte.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RECONCILE_KEYS, STORAGE_KEYS } from './storageKeys';

describe('RECONCILE_KEYS mora em storageKeys.ts, com os valores intactos', () => {
  it('o VALOR de cada chave é o que já está gravado no aparelho do jogador', () => {
    expect(
      RECONCILE_KEYS.PREVIOUS_SAVE_ID,
      'renomear isto perde o rastro do id anterior de todo mundo que já reconciliou',
    ).toBe('soulmon-previous-save-id');
    expect(
      RECONCILE_KEYS.CONFLICT_BACKUP,
      'renomear isto torna INALCANÇÁVEL o backup do progresso local de quem perdeu o conflito',
    ).toBe('soulmon-reconcile-backup');
  });

  it('as duas chaves não colidem com nenhuma chave já existente', () => {
    const existentes = Object.values(STORAGE_KEYS) as string[];
    for (const valor of Object.values(RECONCILE_KEYS)) {
      expect(
        existentes,
        `${valor} colide com uma chave de STORAGE_KEYS — duas verdades no mesmo slot`,
      ).not.toContain(valor);
    }
  });

  it('`cloudSave.ts` não declara mais uma segunda cópia da tabela', () => {
    // Duas declarações compilariam, e a que sobrasse importada em cada ponto de
    // uso decidiria em silêncio sob que chave o backup é gravado — e sob que
    // chave ele é procurado depois. É o mesmo defeito de fiação de sempre.
    expect(
      readFileSync('src/utils/cloudSave.ts', 'utf-8'),
      'RECONCILE_KEYS voltou a ser declarada em cloudSave.ts: a casa dela é storageKeys.ts',
    ).not.toMatch(/export\s+const\s+RECONCILE_KEYS/);
  });
});
