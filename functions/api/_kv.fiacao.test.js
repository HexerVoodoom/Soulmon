/**
 * Guard de FIAÇÃO do namespace KV.
 *
 * `_kv.test.js` prova que o acessor escolhe o nome certo. Ele não prova que
 * as ROTAS usam o acessor — e essa é a metade que quebra em produção. Hoje
 * todo teste de rota semeia o env com o binding ANTIGO (`DIGIAPP_SAVES`), que
 * funciona pelo fallback: se alguém reintroduzir um `env.DIGIAPP_SAVES` cru
 * numa rota, a suíte inteira continua verde e o app só cai no dia em que o
 * painel do Cloudflare passar a expor só o nome novo.
 *
 * Dois guards, então: nenhuma leitura crua fora do dono, e uma rota real
 * lendo de um env que só tem o nome NOVO.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('.', import.meta.url).pathname;

describe('fiação do KV', () => {
  it('só `_kv.js` lê o binding direto do env', () => {
    const culpados = [];
    for (const f of readdirSync(DIR)) {
      if (!f.endsWith('.js') || f.endsWith('.test.js') || f === '_kv.js') continue;
      const src = readFileSync(join(DIR, f), 'utf8');
      // Só a LEITURA importa: mensagem de erro e JSDoc citam os nomes de
      // propósito, e citar não é ler.
      if (/env[?]?\.(SOULMON|DIGIAPP)_SAVES/.test(src)) culpados.push(f);
    }
    expect(culpados).toEqual([]);
  });

  it('uma rota real funciona com SÓ o binding novo ligado', async () => {
    const store = new Map();
    const ns = {
      get: async (k) => store.get(k) ?? null,
      put: async (k, v) => { store.set(k, v); },
      delete: async (k) => { store.delete(k); },
      list: async () => ({ keys: [], list_complete: true }),
    };
    const { onRequest } = await import('./save.js');
    const env = { SOULMON_SAVES: ns };   // ⚠️ sem `DIGIAPP_SAVES`, de propósito
    const res = await onRequest({
      request: new Request('https://x/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveId: 'a'.repeat(32), state: { totalXP: 1 } }),
      }),
      env,
    });
    // O que se prova aqui é só que a rota ENXERGOU o storage: qualquer coisa
    // menos o 500 de "Storage not bound" já significa que o acessor pegou.
    const corpo = await res.clone().text();
    expect(corpo).not.toMatch(/Storage not bound/);
  });
});
