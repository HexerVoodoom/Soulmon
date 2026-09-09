/**
 * O acessor do namespace KV, e por que ele aceita DOIS nomes.
 *
 * O binding se chamava `DIGIAPP_SAVES` (herança do fork) e o
 * `docs/SEPARACAO-DIGIAPP.md` explicava que renomeá-lo exigiria mudar todos os
 * arquivos de `functions/api/` **e** acertar o Cloudflare no mesmo instante —
 * "qualquer descompasso derruba save, créditos e compras ao mesmo tempo".
 *
 * O risco era real; a conclusão de que não dava para trocar, não. Aceitando os
 * dois nomes, a ordem entre mergear e clicar no painel deixa de importar, e
 * não existe janela de queda. Este teste é o que mantém a propriedade.
 */
import { describe, it, expect } from 'vitest';
import { kv, kvOrThrow } from './_kv.js';

const NS = (nome) => ({ nome });

describe('kv(env)', () => {
  it('prefere o nome NOVO quando os dois estão ligados', () => {
    expect(kv({ SOULMON_SAVES: NS('novo'), DIGIAPP_SAVES: NS('velho') })).toEqual(NS('novo'));
  });

  it('cai no nome ANTIGO enquanto o painel não muda', () => {
    // É este caso que torna o deploy seguro: o código novo roda em produção
    // com o binding velho, sem ninguém precisar clicar em nada primeiro.
    expect(kv({ DIGIAPP_SAVES: NS('velho') })).toEqual(NS('velho'));
  });

  it('funciona com só o nome novo — o estado final da migração', () => {
    expect(kv({ SOULMON_SAVES: NS('novo') })).toEqual(NS('novo'));
  });

  it('sem nenhum binding devolve undefined, e NÃO lança', () => {
    // Quem chama trata isso como `storage-not-bound` e responde 500. Lançar
    // aqui trocaria uma resposta clara por um erro de runtime opaco.
    expect(kv({})).toBeUndefined();
    expect(kv(undefined)).toBeUndefined();
    expect(kv(null)).toBeUndefined();
  });
});

describe('nenhum arquivo de functions/ lê o binding direto', () => {
  it('todo acesso passa pelo acessor', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const suspeitos = readdirSync('functions/api')
      .filter(f => f.endsWith('.js') && !f.endsWith('.test.js') && f !== '_kv.js')
      .filter(f => /\benv\??\.(SOULMON|DIGIAPP)_SAVES\b/
        .test(readFileSync(`functions/api/${f}`, 'utf8')));
    // Um `env.DIGIAPP_SAVES` solto continuaria funcionando hoje e quebraria no
    // dia em que o painel só tivesse o nome novo — falha silenciosa e tardia,
    // que é a pior forma de falhar.
    expect(suspeitos).toEqual([]);
  });
});

describe('kvOrThrow', () => {
  it('devolve o mesmo namespace que o kv() quando há binding', () => {
    const ns = { get: async () => null };
    expect(kvOrThrow({ SOULMON_SAVES: ns })).toBe(ns);
    expect(kvOrThrow({ DIGIAPP_SAVES: ns })).toBe(ns);
    // Mesma preferência do `kv()`: o nome novo ganha do herdado.
    expect(kvOrThrow({ SOULMON_SAVES: ns, DIGIAPP_SAVES: { get: async () => 'x' } })).toBe(ns);
  });

  it('falha com nome quando NENHUM binding está ligado', () => {
    // A rede, não o caminho: toda rota já recusa com `storage-not-bound` na
    // guarda de entrada. Isto só existe para que um uso futuro SEM guarda
    // falhe com um nome legível em vez de `Cannot read properties of undefined`.
    expect(() => kvOrThrow({})).toThrow('storage-not-bound');
    expect(() => kvOrThrow(undefined)).toThrow('storage-not-bound');
    expect(() => kvOrThrow(null)).toThrow('storage-not-bound');
  });
});

describe('a convenção do acessor é uma só', () => {
  it('quem desreferencia o namespace usa kvOrThrow, nunca kv', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    // `kv(env)` decide resposta HTTP na guarda; `kvOrThrow(env)` é para USAR.
    // Um `kv(env).get(...)` solto reintroduziria os 79 erros de typecheck que
    // esta convenção fechou — e a regra em dois lugares é o footgun nº 9.
    const suspeitos = readdirSync('functions/api')
      .filter(f => f.endsWith('.js') && !f.endsWith('.test.js'))
      .filter(f => /\bkv\(env\)\s*\./.test(readFileSync(`functions/api/${f}`, 'utf8')));
    expect(suspeitos).toEqual([]);
  });
});
