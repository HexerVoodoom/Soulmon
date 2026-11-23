import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Chunk faltante simulado: o Worker devolve 200 text/html para /assets/x.js ausente.
function carregarFuncoes() {
  const src = readFileSync('public/sw.js', 'utf8');
  const trecho = src.slice(src.indexOf('function htmlNoLugarDeAsset'), src.indexOf("self.addEventListener('install'"));
  const ctx: Record<string, unknown> = { Response };
  vm.createContext(ctx);
  vm.runInContext(trecho, ctx);
  return ctx as { semHtmlFalso: (p: string, r: Response) => Response };
}

describe('sw: HTML no lugar de asset', () => {
  const { semHtmlFalso } = carregarFuncoes();
  it('vira 404 para /assets/*.js com text/html', () => {
    const r = semHtmlFalso('/assets/Modal-BR2GV1gM.js', new Response('<html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }));
    expect(r.status).toBe(404);
  });
  it('JS de verdade passa', () => {
    const ok = new Response('x', { headers: { 'content-type': 'text/javascript' } });
    expect(semHtmlFalso('/assets/a.js', ok)).toBe(ok);
  });
  it('fora de /assets/ não mexe', () => {
    const h = new Response('<html>', { headers: { 'content-type': 'text/html' } });
    expect(semHtmlFalso('/index.html', h)).toBe(h);
  });
});
