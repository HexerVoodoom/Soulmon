// Serve a imagem REPUBLICADA pelo `generate-sprite.js`.
//
// Por que existe: o contrato de `/api/generate-sprite` é que `image` seja
// sempre `https://…`. O Higgsfield já devolve URL; o fallback Gemini devolve
// `data:image/png;base64,…`, e data URL de 256×256 × 11 formas no `GameState`
// vai para o `localStorage` (cota compartilhada com o DigiApp) e para a KV a
// cada save — já estourou uma vez neste projeto. Então o servidor guarda o
// binário e devolve um endereço.
//
// **A chave é um TOKEN aleatório, não o `saveId`.** O `saveId` é SHA-256 de
// e-mail: quem sabe o e-mail deriva a chave. E esta rota **não pode exigir
// `Authorization`** — quem busca a imagem é um `<img src>`, que não manda
// header nenhum. Logo a autorização é a própria URL (capacidade não-adivinhável
// de 128 bits), e é por isso que o token nunca aparece em log.
//
// GET /api/sprite-image?k=<32 hex>  → 200 image/*  |  400  |  404
//
// ⚠️ Enquanto não houver R2 no projeto (`wrangler.jsonc` só tem KV), o binário
// mora na KV `DIGIAPP_SAVES`. Ver o achado B-2 do resumo desta fatia: é decisão
// do dono, não minha.

const IMMUTABLE = 'public, max-age=31536000, immutable';

/** 32 hex, exatamente o que `crypto.randomUUID()` sem os hífens produz.
 *  Recusar o resto é o que impede a chave de virar caminho de leitura livre
 *  no mesmo namespace onde moram os SAVES e os contadores de cota. */
const TOKEN = /^[0-9a-f]{32}$/;

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('k') || '';
  if (!TOKEN.test(token)) {
    return Response.json({ error: 'invalid token' }, { status: 400 });
  }
  if (!env?.DIGIAPP_SAVES) {
    return Response.json({ error: 'storage-not-bound' }, { status: 503 });
  }

  let found;
  try {
    found = await env.DIGIAPP_SAVES.getWithMetadata(`sprite:blob:${token}`, 'arrayBuffer');
  } catch (err) {
    console.error('sprite-image: falha ao ler o blob', err?.message);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
  if (!found?.value) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }

  // Content-Type vem do metadado gravado na republicação, e é sanitizado: um
  // tipo arbitrário aqui viraria `text/html` servido da nossa origem.
  const declarado = found.metadata?.contentType;
  const contentType =
    typeof declarado === 'string' && /^image\/[a-z0-9.+-]+$/i.test(declarado)
      ? declarado
      : 'image/png';

  return new Response(found.value, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': IMMUTABLE,
      // O conteúdo é imutável por token; nada aqui deve ser interpretado.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Access-Control-Allow-Origin': '*',
    },
  });
}
