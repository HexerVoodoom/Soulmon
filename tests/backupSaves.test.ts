/**
 * `scripts/backup-saves.mjs` (BETA-CONTINGENCIA §0): o backup do KV de saves.
 * O wrangler é injetado — o teste nunca toca a Cloudflare. O que importa:
 * todas as chaves em lotes de ≤100, o arquivo sai no formato de `kv bulk put`
 * (restaurável sem conversão), TTL preservado, nunca em C:/.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs, lotes, extrairJson, normalizarBulk, montarRestauracao, backup, nomeArquivo } from '../scripts/backup-saves.mjs';

describe('backup-saves — argumentos', () => {
  it('padrão: SOULMON_SAVES em E:/soulmon-backups', () => {
    expect(parseArgs([])).toEqual({ binding: 'SOULMON_SAVES', out: 'E:/soulmon-backups', prefix: '', dryRun: false });
  });
  it('recusa C:/ e binding estranho', () => {
    expect(() => parseArgs(['--out', 'C:/x'])).toThrow(/C:/);
    expect(() => parseArgs(['--binding', 'x; rm -rf'])).toThrow(/binding/);
    expect(() => parseArgs(['--nada'])).toThrow(/desconhecido/);
  });
});

describe('backup-saves — peças puras', () => {
  it('lotes de no máximo 100', () => {
    const l = lotes(Array.from({ length: 250 }, (_, i) => i));
    expect(l.map((x: unknown[]) => x.length)).toEqual([100, 100, 50]);
    expect(lotes([])).toEqual([]);
  });
  it('JSON com banner do wrangler antes', () => {
    expect(extrairJson('⛅️ wrangler 4.114.0\n-----\n[{"name":"a"}]')).toEqual([{ name: 'a' }]);
    expect(() => extrairJson('sem json')).toThrow();
  });
  it('bulk get nas duas formas; null = sumiu (pula)', () => {
    expect(normalizarBulk({ a: '1', b: { value: '2', metadata: null }, c: null, d: { value: null } })).toEqual({ a: '1', b: '2' });
  });
  it('restauração no formato do bulk put, com TTL quando havia', () => {
    expect(montarRestauracao([{ name: 'a', expiration: 123 }, { name: 'b' }, { name: 'sumiu' }], { a: 'x', b: 'y' }))
      .toEqual([{ key: 'a', value: 'x', expiration: 123 }, { key: 'b', value: 'y' }]);
  });
  it('nome do arquivo sem ":" (Windows)', () => {
    expect(nomeArquivo('SOULMON_SAVES', new Date('2026-10-11T12:34:56Z'))).toBe('SOULMON_SAVES-2026-10-11T12-34-56Z.json');
  });
});

describe('backup-saves — ponta a ponta com wrangler falso', () => {
  it('lista, lê em lotes, grava e o arquivo é restaurável', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bk-'));
    const nomes = Array.from({ length: 130 }, (_, i) => `save:${i}`);
    const chamadas: string[][] = [];
    const wrangler = (args: string[]) => {
      chamadas.push(args);
      if (args[1] === 'key' && args[2] === 'list') return 'banner\n' + JSON.stringify(nomes.map((name, i) => (i === 0 ? { name, expiration: 999 } : { name })));
      const lote: string[] = JSON.parse(readFileSync(args[3], 'utf8'));
      expect(lote.length).toBeLessThanOrEqual(100);
      return JSON.stringify(Object.fromEntries(lote.map(k => [k, k === 'save:5' ? null : { value: `v-${k}` }])));
    };
    const r = await backup({ binding: 'SOULMON_SAVES', out: dir, prefix: '', dryRun: false }, { wrangler, log: () => {}, agora: new Date('2026-10-11T00:00:00Z') });
    expect(r.total).toBe(130);
    expect(r.gravadas).toBe(129);
    const dados = JSON.parse(readFileSync(r.arquivo!, 'utf8'));
    expect(dados[0]).toEqual({ key: 'save:0', value: 'v-save:0', expiration: 999 });
    expect(dados.find((d: { key: string }) => d.key === 'save:5')).toBeUndefined();
    expect(chamadas.filter(a => a[1] === 'bulk')).toHaveLength(2);
    expect(chamadas.every(a => a.includes('--remote') && a.includes('SOULMON_SAVES'))).toBe(true);
    // só leitura: nenhum put/delete no KV remoto
    expect(chamadas.some(a => a.includes('put') || a.includes('delete'))).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });
  it('--dry-run não lê valores nem grava arquivo', async () => {
    const chamadas: string[][] = [];
    const r = await backup({ binding: 'SOULMON_SAVES', out: 'E:/nunca', prefix: 'ent:', dryRun: true }, {
      wrangler: (a: string[]) => { chamadas.push(a); return '[{"name":"ent:1"}]'; }, log: () => {},
    });
    expect(r).toEqual({ arquivo: null, total: 1, gravadas: 0 });
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]).toContain('--prefix');
  });
});
