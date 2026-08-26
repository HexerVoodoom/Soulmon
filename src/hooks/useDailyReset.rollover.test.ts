import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ts, fonteDe } from '../test/tsAst';
import { rolloverPendingFor } from './useDailyReset';

/**
 * X-7 — **a regra 3 do §3.3 estava declarada e não implementada.**
 *
 * A spec da geração incremental manda: "nunca durante a virada do dia, o
 * `DailyReportModal`, a cerimônia ou uma animação de cuidado. Enfileira." O
 * `busy` do `useSpriteGeneration` cobria três das quatro — e o comentário logo
 * acima dele, no `App.tsx`, dizia "as quatro regras de janela". O achado estava
 * escrito por extenso no próprio código.
 *
 * A razão mecânica de ter passado: `grep busy` nos testes dava **zero**. A regra
 * nunca teve teste nenhum, então nada podia notar que ela era parcial.
 */

const SRC = path.resolve(__dirname, '..');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-26T12:00:00'));
});
afterEach(() => vi.useRealTimers());

describe('X-7: a virada do dia é um sinal, e tem uma dona só', () => {
  it('pendente quando o último reset é de outro dia', () => {
    expect(rolloverPendingFor('Tue Aug 25 2026')).toBe(true);
  });

  it('não pendente depois do reset commitado', () => {
    expect(rolloverPendingFor(new Date().toDateString())).toBe(false);
  });

  it('save sem `lastResetDate` conta como virada pendente (fail-open para o reset rodar)', () => {
    expect(rolloverPendingFor(undefined)).toBe(true);
  });
});

describe('X-7: a fiação existe (guard de elo, no AST — comentário não conta)', () => {
  /* Textual não serve: o `App.tsx` já CITAVA "as quatro regras de janela" no
     comentário enquanto passava três. É o defeito do F-2 na mesma família —
     a sexta lição de método deste run. */
  it('o `busy` de useSpriteGeneration inclui o sinal de virada do dia', async () => {
    const arquivo = path.join(SRC, 'App.tsx');
    const sf = fonteDe(arquivo);

    let busy: string | null = null;
    const visita = (node: import('typescript').Node): void => {
      if (
        ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === 'useSpriteGeneration'
      ) {
        const arg = node.arguments[0];
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(sf) === 'busy') {
              busy = prop.initializer.getText(sf);
            }
          }
        }
      }
      ts.forEachChild(node, visita);
    };
    visita(sf);

    expect(busy, 'useSpriteGeneration perdeu o `busy`').not.toBeNull();
    expect(
      busy,
      'o lote pode partir DURANTE a virada do dia — regra 3 do §3.3 (X-7)',
    ).toContain('rolloverPending');
  });

  it('e o sinal vem do useDailyReset, não de uma segunda cópia da regra no App', () => {
    const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
    expect(
      app.includes('const { rolloverPending } = useDailyReset('),
      'o App recalcular a virada por conta própria é a cópia contra a qual o useDailyReset.ts avisa',
    ).toBe(true);
  });
});
