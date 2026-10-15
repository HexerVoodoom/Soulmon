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
  it('closeNightmare marca a noite SEM contá-la (× sem lutar não conta para os 6 dias); markNightmareFought conta e só marca', () => {
    const day = /const markNightmareDay = useCallback\(([\s\S]*?)\n  \}, \[setGameState\]\);/.exec(app)?.[1] ?? '';
    expect(day).toMatch(/markFought\(/);
    expect(day).not.toMatch(/setNightmareOpen\(false\)/);
    expect(app).toMatch(/const markNightmareFought = useCallback\(\(\) => markNightmareDay\(true\)/);
    expect(app).toMatch(/const closeNightmare = useCallback\(\(\) => \{[\s\S]*?markNightmareDay\(false\);[^\n]*\n\s*setNightmareOpen\(false\);/);
  });
});
