/** §201 (dono, 30/10/2026): a bandeira branca saiu da Arena; desistir segue pelo botão de voltar com confirmação (`exitConfirm`). */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync(join(__dirname, 'ArenaGame.tsx'), 'utf8');

describe('§201 Arena sem bandeira branca', () => {
  it('nenhuma bandeira (🏳 / ícone flag) e a saída com confirmação continua', () => {
    expect(src).not.toMatch(/🏳|icon="flag"|name="flag"/);
    expect(src).toMatch(/exitConfirm=\{\{/);
  });
});
