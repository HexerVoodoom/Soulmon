/**
 * `/api/sprite-image` — a rota que serve BYTES DE TERCEIRO da NOSSA origem.
 *
 * Ela tinha teste (`generate-sprite.dedupe.test.js`), mas só do que interessa
 * ao fluxo do sprite: formato do token, 404, e os bytes certos. As defesas que
 * o cabeçalho do arquivo declara — e que existem porque o conteúdo vem de um
 * provedor de IA e é servido de `soulmon.app` — não eram afirmadas por
 * ninguém (medido em 09/09/2026).
 *
 * O que está em jogo: esta rota **não pode exigir `Authorization`**, porque
 * quem busca a imagem é um `<img src>`, que não manda header nenhum. A
 * autorização é a própria URL. Então tudo que impede um blob de virar uma
 * página HTML servida do nosso domínio — com os nossos cookies e a nossa
 * origem — mora nos CABEÇALHOS, e cabeçalho que ninguém afirma é cabeçalho
 * que some numa refatoração sem deixar rastro.
 */
import { describe, it, expect } from 'vitest';
import { onRequestGet } from './sprite-image.js';

const TOKEN = 'a'.repeat(32);
const BYTES = new Uint8Array([137, 80, 78, 71]);

function envCom(metadata, valor = BYTES.buffer) {
  return {
    DIGIAPP_SAVES: {
      getWithMetadata: async k => (k === `sprite:blob:${TOKEN}` ? { value: valor, metadata } : { value: null, metadata: null }),
    },
  };
}

const buscar = (env, k = TOKEN) =>
  onRequestGet({ request: new Request(`https://soulmon.app/api/sprite-image?k=${k}`), env });

describe('🔴 o Content-Type é SANITIZADO — um tipo arbitrário viraria HTML na nossa origem', () => {
  it('tipo declarado fora de `image/*` cai para `image/png`', async () => {
    for (const declarado of [
      'text/html',
      'text/html; charset=utf-8',
      'application/javascript',
      'image/svg+xml, text/html',
      'IMAGE/png\r\nSet-Cookie: a=b',
      '../image/png',
    ]) {
      const res = await buscar(envCom({ contentType: declarado }));
      expect(res.headers.get('Content-Type'), `"${declarado}" não pode ser servido`).toBe('image/png');
    }
  });

  it('metadado ausente, nulo ou de tipo errado também cai para `image/png`', async () => {
    for (const metadata of [null, {}, { contentType: 42 }, { contentType: null }, { contentType: '' }]) {
      const res = await buscar(envCom(metadata));
      expect(res.headers.get('Content-Type')).toBe('image/png');
    }
  });

  it('e um `image/*` legítimo é PRESERVADO — senão tudo acima seria vácuo', async () => {
    for (const bom of ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/avif']) {
      const res = await buscar(envCom({ contentType: bom }));
      expect(res.headers.get('Content-Type')).toBe(bom);
    }
  });
});

describe('🔴 os cabeçalhos que impedem o blob de ser interpretado', () => {
  it('`nosniff` — sem ele o navegador adivinha o tipo e desfaz a sanitização acima', async () => {
    const res = await buscar(envCom({ contentType: 'image/png' }));
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('CSP `default-src none` + `sandbox` — nada aqui deve executar nem buscar nada', async () => {
    // Cinto e suspensório do `nosniff`: `image/svg+xml` é servido de propósito
    // (é um tipo de imagem legítimo) e SVG executa script. A CSP é o que
    // impede isso de ser um XSS na nossa origem.
    const csp = (await buscar(envCom({ contentType: 'image/svg+xml' }))).headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain('sandbox');
  });

  it('cache imutável — a URL é um token, o conteúdo dela nunca muda', async () => {
    const res = await buscar(envCom({ contentType: 'image/png' }));
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('o 400 e o 404 NÃO ganham o cache imutável', async () => {
    // Um erro cacheado por um ano é um sprite que nunca mais aparece para
    // quem pegou a resposta na hora errada.
    const ruim = await buscar(envCom({ contentType: 'image/png' }), 'zz');
    const ausente = await buscar({ DIGIAPP_SAVES: { getWithMetadata: async () => ({ value: null }) } });
    expect(ruim.status).toBe(400);
    expect(ausente.status).toBe(404);
    for (const r of [ruim, ausente]) {
      // Ausente serve tanto quanto explícito — o que não pode é o `immutable`.
      expect(r.headers.get('Cache-Control') ?? '').not.toContain('immutable');
    }
  });
});

describe('o que acontece quando o armazenamento falha', () => {
  it('sem KV ligado é 503 `storage-not-bound`, e não 500 nem 404', async () => {
    // 404 diria "esta imagem não existe" para uma falha de configuração que
    // atinge TODAS as imagens — e o cliente desistiria do sprite para sempre.
    const res = await buscar({});
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('storage-not-bound');
  });

  it('KV que LANÇA vira 500, e a mensagem do erro não vaza para o cliente', async () => {
    const env = {
      DIGIAPP_SAVES: {
        getWithMetadata: async () => { throw new Error('KV interno: bucket=xyz token=segredo'); },
      },
    };
    const res = await buscar(env);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('segredo');
  });

  it('o token nunca aparece no corpo de uma resposta de erro', async () => {
    // A URL É a credencial (capacidade de 128 bits). Ecoá-la num corpo de erro
    // a leva para log de cliente, relatório de erro e captura de tela.
    const res = await buscar(envCom({ contentType: 'image/png' }), 'nao-hex-mas-longo-o-suficiente');
    expect(await res.text()).not.toContain('nao-hex');
  });
});
