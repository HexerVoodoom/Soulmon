import { describe, it, expect } from 'vitest';
import { decideUpdate, parseAppConfig, parseInstalledBuild } from './appUpdate';

const cfg = (minVersionCode: number, recommendedVersionCode: number) => ({ minVersionCode, recommendedVersionCode });

describe('decideUpdate', () => {
  it('abaixo da mínima bloqueia', () => expect(decideUpdate(30, cfg(31, 35))).toBe('block'));
  it('na mínima mas abaixo da recomendada só sugere', () => expect(decideUpdate(31, cfg(31, 35))).toBe('suggest'));
  it('na recomendada ou acima: nada', () => {
    expect(decideUpdate(35, cfg(31, 35))).toBe('none');
    expect(decideUpdate(99, cfg(31, 35))).toBe('none');
  });
  it('valor inicial (min 0, rec 31): ninguém bloqueado, 30 sugere, 31 não', () => {
    expect(decideUpdate(1, cfg(0, 31))).toBe('suggest');
    expect(decideUpdate(31, cfg(0, 31))).toBe('none');
  });
  it('erro/sem config/sem versão = nada (fail-open)', () => {
    expect(decideUpdate(30, null)).toBe('none');
    expect(decideUpdate(null, cfg(99, 99))).toBe('none');
  });
});

describe('parsers', () => {
  it('config válida e inválida', () => {
    expect(parseAppConfig({ minVersionCode: 0, recommendedVersionCode: 31 })).toEqual(cfg(0, 31));
    expect(parseAppConfig(null)).toBeNull();
    expect(parseAppConfig({ minVersionCode: '3', recommendedVersionCode: 31 })).toBeNull();
    expect(parseAppConfig({ minVersionCode: -1, recommendedVersionCode: 3 })).toBeNull();
  });
  it('build do nativo', () => {
    expect(parseInstalledBuild('31')).toBe(31);
    expect(parseInstalledBuild('')).toBeNull();
    expect(parseInstalledBuild('abc')).toBeNull();
    expect(parseInstalledBuild(undefined)).toBeNull();
  });
});
