// `scripts/top-consumidores.mjs` + `functions/api/top-ai.js` (release/beta-1).
import { describe, it, expect } from 'vitest';
import { parseArgs, renderTabela } from '../scripts/top-consumidores.mjs';
// @ts-expect-error — rota JS do Worker sem tipos
import { onRequestGet, ranking } from '../functions/api/top-ai.js';

function kv(seed: Record<string, string>) {
  const m = new Map(Object.entries(seed));
  return {
    get: async (k: string) => m.get(k) ?? null,
    list: async ({ prefix }: { prefix: string }) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }),
  };
}
const get = (key: string | null, qs = '') => new Request(`https://s/api/top-ai${qs}`, { headers: { 'CF-Connecting-IP': '9.9.9.9', ...(key ? { 'X-Metrics-Key': key } : {}) } });

describe('top consumidores de IA', () => {
  it('ranking: tira @all/@admin, trunca o saveId em 8, ordena e marca ≥ 80% da cota', () => {
    const r = ranking('chat', [
      { saveId: '@all', n: 999 }, { saveId: 'aaaaaaaa11112222', n: 3 }, { saveId: 'bbbbbbbb33334444', n: 19 },
    ]);
    expect(r).toEqual([
      { bucket: 'chat', saveIdPrefix: 'bbbbbbbb', n: 19, acima80: true },
      { bucket: 'chat', saveIdPrefix: 'aaaaaaaa', n: 3, acima80: false },
    ]);
  });

  it('rota: 404 sem chave configurada, 401 com chave errada, top do dia com saveId truncado', async () => {
    const env = { METRICS_ADMIN_KEY: 'segredo', DIGIAPP_SAVES: kv({
      'ai:chat:abcdefgh12345678:2026-10-11': '12', 'ai:chat:@all:2026-10-11': '40',
      'ai:chat:zzzzzzzz12345678:2026-10-10': '99', 'ai:sprite:abcdefgh12345678:2026-10-11': '2',
    }) };
    expect((await onRequestGet({ request: get('x'), env: {} })).status).toBe(404);
    expect((await onRequestGet({ request: get('errada'), env })).status).toBe(401);
    const j = await (await onRequestGet({ request: get('segredo', '?day=2026-10-11'), env })).json();
    expect(j.top.chat).toEqual([{ bucket: 'chat', saveIdPrefix: 'abcdefgh', n: 12, acima80: false }]);
    expect(j.top.sprite[0].n).toBe(2);
    expect(JSON.stringify(j)).not.toContain('abcdefgh12345678');
    expect((await onRequestGet({ request: get('segredo', '?day=ontem'), env })).status).toBe(400);
  });

  it('script: argumentos e tabela', () => {
    expect(parseArgs(['--day', '2026-10-11']).day).toBe('2026-10-11');
    expect(() => parseArgs(['--day', 'x'])).toThrow();
    const t = renderTabela({ day: '2026-10-11', top: { chat: [{ saveIdPrefix: 'abcdefgh', n: 19, acima80: true }], sprite: [] } });
    expect(t).toContain('abcdefgh    19 *');
    expect(t).toContain('(ninguém)');
  });
});
