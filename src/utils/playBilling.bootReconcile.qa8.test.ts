/**
 * QA-8: a compra paga interrompida (app fechado entre a cobrança e o `verify`) é creditada ao ABRIR o app, sem "Restaurar compras".
 * Trava de contrato: o App chama `reconcilePurchases` no mount e ao voltar ao primeiro plano, só com `saveId`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

describe('QA-8: reconciliação de compras no boot', () => {
  it('o efeito de mount chama creditarPendentes() e o visibilitychange também', () => {
    const efeito = app.slice(app.indexOf('const creditarPendentes'));
    expect(efeito).toMatch(/void reconcilePurchases\(\)\.then/);
    expect(efeito).toMatch(/sync\.run\('mount'\);\s*creditarPendentes\(\);/);
    expect(efeito).toMatch(/visibilityState === 'visible'\) \{ sync\.run\('visible'\); creditarPendentes\(\); \}/);
  });
  it('só tenta com saveId (o servidor credita na conta)', () => {
    expect(app).toMatch(/const creditarPendentes = \(\) => \{\s*if \(!saveId\) return;/);
  });
});
