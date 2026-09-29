/**
 * NADA DA GUILDA MORA NO SAVE (`docs/PLANO-GUILDA.md` §10.7).
 *
 * O ponteiro autoritativo é `coopOf:<saveId>`, no servidor. Um `guildId` no
 * GameState seria uma segunda fonte para o mesmo fato — e mentiria depois de uma
 * saída feita em outro aparelho (footgun 9). Também não vai `localStorage` além
 * de duas chaves de conveniência, e todas passam por `storageKeys.ts`.
 *
 * Guard sobre o AST (não regex sobre texto): comentário que cita o nome do campo
 * para explicar por que ele NÃO existe não pode reprovar.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
const src = (rel: string) => ts.createSourceFile(rel, read(rel), ts.ScriptTarget.Latest, true);

const VETADO = /guild|coop|roda\b|bosque|grove/i;
/** As ÚNICAS chaves de localStorage da guilda que o plano admite (§10.7). */
const CHAVES_DE_CONVENIENCIA = new Set(['soulmon-guild-last-stage', 'soulmon-guild-thread-day']);

function membrosDe(file: ts.SourceFile, nome: string): string[] {
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === nome) {
      for (const m of n.members) if (m.name) out.push(m.name.getText(file));
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return out;
}

describe('a guilda não entra no save nem no localStorage', () => {
  it('a interface GameState existe e não tem campo de guilda', () => {
    const campos = membrosDe(src('src/contexts/GameStateContext.tsx'), 'GameState');
    expect(campos.length).toBeGreaterThan(50); // o guard enxerga o alvo
    expect(campos.filter(c => VETADO.test(c))).toEqual([]);
  });

  it('storageKeys.ts: no máximo as duas chaves de conveniência, com esses nomes', () => {
    const file = src('src/utils/storageKeys.ts');
    const valores: string[] = [];
    const visit = (n: ts.Node) => {
      if (ts.isStringLiteralLike(n)) valores.push(n.text);
      ts.forEachChild(n, visit);
    };
    visit(file);
    expect(valores.length).toBeGreaterThan(20); // o guard enxerga o alvo
    const daGuilda = valores.filter(v => VETADO.test(v));
    expect(daGuilda.filter(v => !CHAVES_DE_CONVENIENCIA.has(v))).toEqual([]);
    expect(daGuilda.length).toBeLessThanOrEqual(2);
  });

  it('o cliente da guilda não grava em localStorage direto (só storageKeys/safeStorage)', () => {
    for (const rel of ['src/utils/community.ts', 'src/utils/guildCopy.ts', 'src/utils/guildRules.ts', 'src/components/guild/GuildSheet.tsx']) {
      const ids: string[] = [];
      const visit = (n: ts.Node) => {
        if (ts.isIdentifier(n)) ids.push(n.text);
        ts.forEachChild(n, visit);
      };
      visit(src(rel));
      expect(ids, rel).not.toContain('localStorage');
      expect(ids, rel).not.toContain('setGameState');
    }
  });
});
