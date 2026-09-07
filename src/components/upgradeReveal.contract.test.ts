import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// A criatura do reveal é a criatura do jogo — TAMBÉM na rota de quem pagou.
//
// A auditoria de alinhamento (06/09/2026) achou o dano do WP1.1 vivo em
// `handleUpgradeRevealed`: `onRevealed` não carregava o `revealSprite` e o
// handler não tocava no `spriteLibrary`. Como o demo nunca gera sprite
// (`enabled: !demoCharacterId`), o acervo do recém-comprador está VAZIO —
// então, assim que `demoCharacterId` some, o `birthBatch` pede a forma inicial
// do zero e o app desenha outro bicho. Quem acabou de pagar pela criatura
// própria via a cerimônia mostrar um bicho e o jogo entregar outro.
//
// Isto é um guard de FIAÇÃO, não de comportamento, porque montar o ritual
// inteiro em jsdom para provar uma passagem de argumento custa mais do que
// vale. O que ele trava é a ligação que já se perdeu uma vez.
// ---------------------------------------------------------------------------
const onboarding = readFileSync('src/components/SoulmonOnboarding.tsx', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');

describe('o sprite do reveal chega ao save no upgrade', () => {
  it('o ritual passa o revealSprite para quem chamou', () => {
    expect(onboarding).toMatch(/onRevealed\?\.\(result, revealSprite/);
  });

  it('a assinatura de onRevealed aceita o sprite', () => {
    expect(onboarding).toMatch(/onRevealed\?:\s*\(result: OracleResult,\s*revealSprite\?/);
  });

  it('handleUpgradeRevealed ADOTA o desenho, em vez de gerar outro', () => {
    const inicio = app.indexOf('const handleUpgradeRevealed');
    expect(inicio).toBeGreaterThan(-1);
    const corpo = app.slice(inicio, inicio + 2200);
    expect(corpo).toContain('recordSprite(');
    // `adopt: 'now'` e não a adoção com história: é a primeira criatura
    // autoral deste save, não há rosto anterior a proteger.
    expect(corpo).toContain("adopt: 'now'");
  });
});
