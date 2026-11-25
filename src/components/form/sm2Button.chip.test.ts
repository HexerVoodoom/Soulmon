import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sm2Button } from './FormKit';

/** Dono (24/11/2026): botão inline pequeno (`sm`) = CHIP com bordinha, SEM arte de gema; md/lg (ações normais) levam a arte. */
describe('sm2Button — chip inline sem arte', () => {
  it("só o tamanho 'sm' marca --sm2-btn-chip", () => {
    const marca = (s: object) => (s as Record<string, string>)['--sm2-btn-chip'];
    expect(marca(sm2Button('outline', false, 'sm'))).toBe('1');
    expect(marca(sm2Button('primary', false, 'sm'))).toBe('1');
    expect(marca(sm2Button('outline'))).toBeUndefined();
    expect(marca(sm2Button('primary', false, 'lg'))).toBeUndefined();
  });
  it("sm com wide:true (ação larga) NÃO marca chip e mantém kind/h", () => {
    const st = sm2Button('primary', false, 'sm', { wide: true }) as Record<string, string>;
    expect(st['--sm2-btn-chip']).toBeUndefined();
    expect(st['--sm2-btn-kind']).toBe('primary');
    expect(st['--sm2-btn-h']).toBe('44px');
    expect((sm2Button('outline', false, 'sm', { wide: false }) as Record<string, string>)['--sm2-btn-chip']).toBe('1');
    expect((sm2Button('outline', false, 'md', { wide: true }) as Record<string, string>)['--sm2-btn-chip']).toBeUndefined();
    expect((sm2Button('outline', false, 'lg') as Record<string, string>)['--sm2-btn-kind']).toBe('outline');
  });
  it('o CSS da arte exclui o chip em todas as regras de botão', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
    const i = css.indexOf('/* ── Arte dos botões `sm2Button`');
    const bloco = css.slice(i, css.indexOf('/* Drop-down de categoria do CreateModal'));
    const seletores = bloco.match(/html\[data-ui="arte"\] button[^{,]*/g) ?? [];
    expect(seletores.length).toBeGreaterThan(10);
    for (const s of seletores) expect(s, s).toContain(':not([style*="--sm2-btn-chip"])');
  });
});
