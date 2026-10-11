import { describe, it, expect } from 'vitest';
// @ts-expect-error — script .mjs sem .d.ts
import { parseArgs, janela, renderTabela, APP_URL_PADRAO } from '../scripts/crash-report.mjs';

describe('crash-report.mjs', () => {
  it('args: padrões, --days limitado a 14, APP_URL do ambiente', () => {
    expect(parseArgs([], {})).toEqual({ url: APP_URL_PADRAO, days: 7, json: false });
    expect(parseArgs(['--days', '99', '--json'], {}).days).toBe(14);
    expect(parseArgs([], { APP_URL: 'https://x' }).url).toBe('https://x');
  });
  it('janela de N dias termina hoje (UTC)', () => {
    expect(janela(3, new Date('2026-10-11T12:00:00Z'))).toEqual({ from: '2026-10-09', to: '2026-10-11' });
  });
  it('tabela: vazio e com crash', () => {
    expect(renderTabela({ crashes: [], from: 'a', to: 'b' })).toContain('Nenhum crash');
    const t = renderTabela({ from: 'a', to: 'b', count: 1, crashes: [{ n: 3, kind: 'error', msg: 'boom', day: 'a', vers: ['1.1.4'], plat: 'apk', route: '/', first: 'h1', last: 'h2', sig: 'abcd', stack: 'E\n at f' }] });
    expect(t).toContain('3x');
    expect(t).toContain('boom');
  });
});
