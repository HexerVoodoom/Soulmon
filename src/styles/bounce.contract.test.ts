import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * D-54 (19/10/2026): o sobe/desce dos Soulmons virou BOUNCE (achata na altura e volta, base no chão);
 * os voadores (`sm-pet-air-float`) mantêm a flutuação (Q4); movimento reduzido = sem bounce.
 */
const css = readFileSync(join(__dirname, '..', 'index.css'), 'utf8');

function keyframe(name: string): string {
  const i = css.indexOf(`@keyframes ${name}`);
  expect(i, `@keyframes ${name} existe`).toBeGreaterThan(-1);
  const open = css.indexOf('{', i);
  let depth = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}' && --depth === 0) return css.slice(open, j + 1);
  }
  throw new Error(`@keyframes ${name} sem fechamento`);
}

function rule(selector: string): string {
  const re = new RegExp(`(^|\\n)${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`);
  const m = re.exec(css);
  expect(m, `regra ${selector}`).not.toBeNull();
  return m![2];
}

describe('bounce dos Soulmons (D-54)', () => {
  it.each(['sm-bounce', 'dungeon-idle', 'sm-bs-bounce', 'sm2-grove-bob'])('%s achata (scaleY) e NÃO flutua (translateY)', (nome) => {
    const k = keyframe(nome);
    expect(k).toMatch(/scaleY\(/);
    expect(k).not.toMatch(/translateY/);
    expect(k).not.toMatch(/translate\(/);
  });

  it('o achatamento é leve (entre 0,85 e 0,98) e volta a 1', () => {
    const k = keyframe('sm-bounce');
    const m = /var\(--sm-bounce-squash,\s*([0-9.]+)\)/.exec(k);
    expect(m).not.toBeNull();
    const v = Number(m![1]);
    expect(v).toBeGreaterThanOrEqual(0.85);
    expect(v).toBeLessThanOrEqual(0.98);
    expect(k).toMatch(/0%, 100%\s*\{[^}]*scaleY\(1\)/);
  });

  it('o bounce ancora a base no chão (transform-origin embaixo)', () => {
    for (const sel of ['.sm-battle-idle', '.sm-bs-bounce', '.sm2-grove-bob']) {
      expect(rule(sel), sel).toMatch(/transform-origin:\s*50% 100%/);
    }
  });

  it('os voadores mantêm a flutuação vertical (sm-pet-air-float)', () => {
    const k = keyframe('sm-pet-air-float');
    expect(k).toMatch(/translate:/);
    expect(rule('.sm-pet-air')).toMatch(/animation:\s*sm-pet-air-float/);
  });

  it('movimento reduzido: bounce desligado no ÚLTIMO bloco prefers-reduced-motion', () => {
    const i = css.indexOf('SENTINELA-MOVIMENTO-REDUZIDO-CANONICO');
    expect(i).toBeGreaterThan(-1);
    const bloco = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    for (const sel of ['.sm-bs-bounce', '.sm2-grove-bob']) {
      expect(bloco, sel).toContain(sel);
    }
    // `.sm-battle-idle` é cortado no bloco geral do arquivo (cobertura inteira).
    expect(css).toMatch(/\.sm-battle-idle\s*\{\s*animation:\s*none !important/);
  });
});
