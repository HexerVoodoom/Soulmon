/** O preço da troca de nome é o MESMO no servidor e no cliente (`src/utils/hexsmithRename.ts`). */
import { describe, it, expect } from 'vitest';
import { HEX_RENAME_COST as SERVER } from './_hexRename.js';
import { HEX_RENAME_COST as CLIENT, HEX_RENAME_MAX } from '../../src/utils/hexsmithRename';
import { ESPECIAL_NOME_MAX } from './_especialNomeRegra.js';

describe('hexRename: paridade cliente/servidor', () => {
  it('preço e limite de tamanho iguais', () => {
    expect(CLIENT).toBe(SERVER);
    expect(HEX_RENAME_MAX).toBe(ESPECIAL_NOME_MAX);
  });
});
