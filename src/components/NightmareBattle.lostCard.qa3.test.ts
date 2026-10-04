/**
 * QA3 — `NightmareBattle.onLose` "só marca a noite": o cartão da derrota ("o sonho passou, você
 * acorda bem") mora DENTRO do modal. O App ligava `onLose` em `closeNightmare`, que também
 * fecha o modal: o cartão nunca aparecia e o jogador via a luta sumir sem a mensagem de que
 * nada se perdeu. Contrato: `onLose` não pode ser o callback que fecha.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

describe('App › Pesadelo', () => {
  it('onLose NÃO é o callback que fecha o modal', () => {
    expect(app).not.toMatch(/onLose=\{closeNightmare\}/);
    expect(app).toMatch(/onLose=\{markNightmareFought\}/);
  });
  it('closeNightmare marca a noite e fecha; markNightmareFought só marca', () => {
    const mark = /const markNightmareFought = useCallback\(([\s\S]*?)\n  \}, \[setGameState\]\);/.exec(app)?.[1] ?? '';
    expect(mark).toMatch(/markFought\(/);
    expect(mark).not.toMatch(/setNightmareOpen\(false\)/);
    expect(app).toMatch(/const closeNightmare = useCallback\(\(\) => \{\s*markNightmareFought\(\);\s*setNightmareOpen\(false\);/);
  });
});
