import { describe, it, expect } from 'vitest';
import { onRequest } from './save.js';

/**
 * QA Rodada 2 (22/09/2026) — CONCORRÊNCIA REAL do `/api/save`.
 *
 * O que este arquivo DOCUMENTA (não conserta — ADR-004 está em "Proposta"):
 *   1. Dois POSTs intercalados: o ÚLTIMO a chegar no `put` vence, em silêncio,
 *      os dois recebem 200. Nenhum lado descobre que perdeu.
 *   2. NOVO (não está na ADR-001 nem na ADR-004): a RENOVAÇÃO PREGUIÇOSA de
 *      TTL do GET (`RENEW_AFTER_SECONDS`) reescreve o `raw` que o GET LEU.
 *      Se um POST cai entre o `getWithMetadata` e o `put` da renovação, o GET
 *      grava o save VELHO por cima do NOVO — e o cliente que fez o POST viu
 *      200. É perda de dado causada por uma LEITURA.
 *
 * O KV falso tem latência controlada por gatilho (`segurar`/`soltar`), não por
 * `setTimeout` — a ordem é determinística, não depende do relógio do runner.
 */
const ID = 'a'.repeat(32);

function kvComLatencia() {
  const store = new Map();
  const meta = new Map();
  const historico = []; // ordem real das escritas que chegaram ao "disco"
  const portoes = [];   // puts segurados, na ordem em que foram pedidos
  return {
    store, meta, historico, portoes,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put(k, v, opts) {
      return new Promise(resolve => {
        portoes.push(() => {
          store.set(k, v);
          if (opts?.metadata) meta.set(k, opts.metadata);
          historico.push(JSON.parse(v));
          resolve();
        });
      });
    },
    delete: async k => { store.delete(k); meta.delete(k); },
    /** libera o i-ésimo put pendente (por ordem de chegada) */
    soltar(i) { const f = portoes[i]; portoes[i] = null; f(); },
  };
}

const post = (state) => new Request(`https://x/api/save?id=${ID}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }),
});
const tick = () => new Promise(r => setTimeout(r, 0));

describe('DOCUMENTAÇÃO — último POST vence em silêncio (ADR-004 §Contexto)', () => {
  it('dois POSTs intercalados: ambos 200, só o segundo sobrevive, e o primeiro nunca sabe', async () => {
    const kv = kvComLatencia();
    const env = { DIGIAPP_SAVES: kv };
    const pA = onRequest({ request: post({ perfectDays: 10, comida: 'desktop' }), env });
    await tick(); await tick();
    const pB = onRequest({ request: post({ perfectDays: 10, tarefa: 'celular' }), env });
    await tick(); await tick();
    expect(kv.portoes.filter(Boolean)).toHaveLength(2);
    // A chegou primeiro à rede mas o disco atende B primeiro e A depois (KV eventual)
    kv.soltar(1); kv.soltar(0);
    const [rA, rB] = await Promise.all([pA, pB]);
    expect(rA.status).toBe(200);
    expect(rB.status).toBe(200);
    const final = JSON.parse(kv.store.get(ID));
    // O save final tem SÓ um dos dois lados — não há merge nem 409.
    expect('comida' in final !== 'tarefa' in final).toBe(true);
    // Documentado: quem perdeu recebeu 200 igual a quem ganhou.
  });
});

describe('🔴 NOVO — a renovação de TTL do GET sobrescreve um POST concorrente', () => {
  // `it.fails`: o defeito está ABERTO. Quando save.js parar de reescrever o
  // conteúdo para renovar prazo, este caso passa a PASSAR e o `.fails` some.
  //
  // QA rodada 2 (backend): `save.js` ganhou a MITIGAÇÃO "reler antes do put"
  // (`save.test.js`, "MITIGAÇÃO"). Ela NÃO cobre este cenário de propósito —
  // aqui o POST chega DEPOIS da releitura e ANTES do `put` chegar ao disco,
  // que é exatamente a janela que só um compare-and-set fecha. O KV não tem
  // CAS; a saída real é a ADR-004 (`revision` + 409), decisão do dono (#52).
  // O `.fails` fica até lá.
  it.fails('GET (save velho) → POST (novo) → put da renovação do GET → o NOVO some', async () => {
    const kv = kvComLatencia();
    kv.store.set(ID, JSON.stringify({ perfectDays: 7, versao: 'velha' }));
    kv.meta.set(ID, { t: Date.now() - 40 * 86400 * 1000 }); // > RENEW_AFTER_SECONDS
    const env = { DIGIAPP_SAVES: kv };

    // 1. GET começa: lê o raw velho e pede um put de renovação (fica segurado)
    const pGet = onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env });
    await tick(); await tick();
    expect(kv.portoes.filter(Boolean)).toHaveLength(1);

    // 2. POST novo chega e é gravado ANTES do put do GET terminar
    const pPost = onRequest({ request: post({ perfectDays: 8, versao: 'nova' }), env });
    await tick(); await tick();
    expect(kv.portoes.filter(Boolean)).toHaveLength(2);
    kv.soltar(1);
    expect((await pPost).status).toBe(200);
    expect(JSON.parse(kv.store.get(ID)).versao).toBe('nova');

    // 3. Agora o put da renovação do GET chega ao disco
    kv.soltar(0);
    const rGet = await pGet;
    expect(rGet.status).toBe(200);

    // O que ficou gravado:
    const final = JSON.parse(kv.store.get(ID));
    // ESPERADO pelo contrato ("renovar prazo" não é "escrever conteúdo"): 'nova'.
    // HOJE: 'velha' — o GET destruiu o POST que recebeu 200.
    expect(final.versao, 'a renovação de TTL do GET sobrescreveu um POST que já tinha recebido 200').toBe('nova');
  });
});
