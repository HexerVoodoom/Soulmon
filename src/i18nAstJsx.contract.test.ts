/**
 * Guard (AST): no visible JSX text and no accessible attribute is written only
 * in Portuguese. English is the base language; PT-BR is the localization.
 *
 * Two shapes are locked, both without heuristics about "which words are PT":
 *  1. JSX text nodes containing Portuguese accents/stopwords (JSX text can
 *     never sit inside a language branch, so any hit is a bare PT string);
 *  2. string-literal values of aria-label / placeholder / title / alt that
 *     contain Portuguese characters, unless the attribute sits in a
 *     conditional expression (the `isPt ? pt : en` shape).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const RAIZ = join(process.cwd(), 'src');
const PT = /[ãõçáéíóúâêô]|\b(você|para|não|seu|sua|hoje|uma|dos|das|está|quando|tudo)\b/i;
const ATTRS = new Set(['aria-label', 'placeholder', 'title', 'alt', 'aria-description']);

function tsx(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) tsx(p, out);
    else if (/\.tsx$/.test(e.name) && !e.name.includes('.test.')) out.push(p);
  }
  return out;
}

describe('i18n AST: nada visível só em português', () => {
  it('JSX text e atributos acessíveis literais não têm português solto', () => {
    const achados: string[] = [];
    for (const f of tsx(RAIZ)) {
      const sf = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (n: ts.Node) => {
        if (ts.isJsxText(n) && n.text.trim().length > 2 && PT.test(n.text)) {
          achados.push(`${f}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1} text "${n.text.trim().slice(0, 40)}"`);
        }
        if (ts.isJsxAttribute(n) && ATTRS.has(n.name.getText()) && n.initializer && ts.isStringLiteral(n.initializer) && PT.test(n.initializer.text)) {
          achados.push(`${f}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1} attr ${n.name.getText()}="${n.initializer.text.slice(0, 40)}"`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    expect(achados, achados.join('\n')).toEqual([]);
  });
});
