/**
 * 07/10/2026 (decisão do dono, modal) — "o Ultra precisa de TODAS as formas
 * prévias liberadas". Revoga os dois caminhos de WP4.2/D6: a PACIÊNCIA
 * (`ULTRA_PATIENCE_DAYS`) saiu; sobra a coleção completa, 10 formas.
 */
import { describe, it, expect } from 'vitest';
import * as progression from './progression';
import { canReachUltra, ultraFormsKnown, ULTRA_PRIOR_FORMS } from './progression';
import { getNextEvolution } from '../utils/dailyReset';
import { rebirthRefusal } from '../utils/rebirthGate';
import { xpForLevel } from '../utils/bond';
import { readFileSync } from 'node:fs';

const DEZ = [
  'rookie',
  'champion-power', 'champion-harmony', 'champion-benevolence',
  'ultimate-power', 'ultimate-harmony', 'ultimate-benevolence',
  'mega-power', 'mega-harmony', 'mega-benevolence',
];
const MEGAS = DEZ.filter(i => i.startsWith('mega-'));

describe('Ultra = as 10 formas prévias', () => {
  it('a lista derivada tem exatamente as 10 formas', () => {
    expect([...ULTRA_PRIOR_FORMS].sort()).toEqual([...DEZ].sort());
  });
  it('todas as 10 abrem; nove não', () => {
    expect(canReachUltra({ unlockedEvolutions: DEZ })).toBe(true);
    for (const falta of DEZ) {
      expect(canReachUltra({ unlockedEvolutions: DEZ.filter(i => i !== falta) }), falta).toBe(false);
    }
  });
  it('três megas conhecidas mas faltando champions/ultimates: não', () => {
    expect(canReachUltra({ unlockedEvolutions: ['rookie', ...MEGAS] })).toBe(false);
  });
  it('só paciência não abre nada (caminho revogado)', () => {
    expect(canReachUltra({ unlockedEvolutions: ['rookie', 'mega-power'], perfectDays: 999 } as never)).toBe(false);
    expect('ULTRA_PATIENCE_DAYS' in progression).toBe(false);
  });
  it('save sem campo não abre de graça; contagem é coleção', () => {
    expect(canReachUltra({})).toBe(false);
    expect(ultraFormsKnown(undefined)).toBe(0);
    expect(ultraFormsKnown(['rookie', 'mega-power', 'x'])).toBe(2);
  });
  it('a árvore: mega com as 10 vai a ultra; sem, fica; ultra nunca regride', () => {
    expect(getNextEvolution('mega-power', 'power', DEZ)).toBe('ultra');
    expect(getNextEvolution('mega-power', 'power', MEGAS)).toBe('mega-power');
    expect(getNextEvolution('ultra', 'harmony', [])).toBe('ultra');
  });
  it('a regra não está copiada no servidor nem no desktop', () => {
    for (const f of ['functions/api/_combate.js', 'desktop/renderer/src/care.ts']) {
      let src = ''; try { src = readFileSync(f, 'utf8'); } catch { /* ausente */ }
      expect(src).not.toMatch(/canReachUltra|PATIENCE/);
    }
  });
});

describe('Renascimento: só depois do Ultra (regra intacta)', () => {
  const base = { accountTier: 'paid' as const, totalXP: xpForLevel(12) };
  it("qualquer estágio ≠ ultra devolve 'not-ultra', mesmo pago e Vínculo ≥ 12", () => {
    for (const st of [...DEZ, undefined, 'egg']) {
      expect(rebirthRefusal({ ...base, evolutionStage: st })).toBe('not-ultra');
    }
    expect(rebirthRefusal({ ...base, evolutionStage: 'ultra' })).toBeNull();
  });
  it('Guia e Ajuda dizem que é depois do Ultra', () => {
    const g = readFileSync('src/components/GuideModal.tsx', 'utf8');
    const h = readFileSync('src/components/HelpModal.tsx', 'utf8');
    expect(g).toContain('Depois do Ultra existe o Renascimento');
    expect(g).toContain('After the Ultra comes Rebirth');
    expect(h).toContain('Depois do Ultra');
    expect(h).toContain('After the Ultra');
  });
});
