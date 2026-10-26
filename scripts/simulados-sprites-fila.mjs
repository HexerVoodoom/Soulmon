#!/usr/bin/env node
/**
 * FILA DE SPRITES DOS 50 SIMULADOS (BACKLOG-BETA3 M11) — manual, DRY-RUN por padrão.
 *
 * Por ora os simulados usam arte que já existe (`artLine` de `_artLine.js` + o roster de `src/utils/enemyRoster.ts`).
 * Quando houver crédito de imagem, este script gera UM sprite por simulado pelo MESMO endpoint do jogador
 * (`POST /api/generate-sprite`, mesmo pipeline Higgsfield → Gemini, fundo verde #00FF00 + recorte no servidor) e
 * grava a URL resultante em `sim:sprite:<id>` no KV; o motor (`_simulados.js › upsertSimulado`) lê essa chave e
 * passa a servir `spriteUrl` no perfil público — sem mudar mais nada.
 *
 *   node scripts/simulados-sprites-fila.mjs                 # dry-run: lista o que seria gerado (custo estimado)
 *   node scripts/simulados-sprites-fila.mjs --run [--only sim_0003,sim_0007] [--url https://...]
 *
 * `--run` exige (nada vai em argumento de linha de comando):
 *   SIMULADOS_ID_TOKEN       ID token Firebase de uma conta ADMIN/beta-full (o endpoint cobra a cota dessa conta);
 *   SIMULADOS_ADMIN_SAVE_ID  o saveId dessa mesma conta (o `id` do corpo tem de bater com o token);
 *   SIMULADOS_KV_NAMESPACE_ID  namespace KV de produção (`wrangler kv key put --namespace-id`).
 * Saídas: 0 ok · 2 faltou variável · 1 erro. NUNCA rode em CI.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SIMULADOS } from '../functions/api/_simulados.data.js';

export const APP_URL_PADRAO = 'https://soulmon.mateus-sprnd.workers.dev';
/** Hosts que podem receber o token admin (o do projeto, em wrangler.jsonc/docs). Qualquer outro é recusado. */
export const HOSTS_PERMITIDOS = Object.freeze(['soulmon.mateus-sprnd.workers.dev']);

/** `--url`: só https, sem credencial embutida, e só host da allowlist. Devolve a origem normalizada ou lança. */
export function validarUrlBase(raw) {
  let u;
  try { u = new URL(String(raw)); } catch { throw new Error('--url inválida'); }
  if (u.protocol !== 'https:') throw new Error('--url precisa ser https');
  if (u.username || u.password) throw new Error('--url não pode ter credenciais');
  if (!HOSTS_PERMITIDOS.includes(u.hostname)) throw new Error(`--url: host fora da allowlist (${HOSTS_PERMITIDOS.join(', ')})`);
  return u.origin;
}

const WRANGLER_BIN = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
/** O id de sprite devolvido pelo servidor: `/api/sprite-image?k=<32 hex>` e nada mais (vai para o argv do wrangler). */
export const SPRITE_URL_RE = /^\/api\/sprite-image\?k=[0-9a-f]{32}$/;
const ELEMENTO_EN = {
  fogo: 'fire', vileza: 'venom and thorns', morte: 'bone and grave mist', sombra: 'shadow', vigor: 'raw vigor',
  marcial: 'martial arts', arcano: 'arcane runes', tempo: 'time and clockwork', espaco: 'warped space', gravidade: 'gravity',
  som: 'sound waves', eletricidade: 'electricity', vida: 'plants and life', luz: 'light', agua: 'water', terra: 'stone and earth', ar: 'wind',
};

/** O estágio de arte pedido: a forma rookie (a arte de todo simulado nasce rookie; as altas vêm com a evolução). */
export const FORM_ID = 'rookie';

/** Prompt de UM simulado (mesma convenção do app: criatura original, fundo #00FF00 liso, sem verde na peça). */
export function promptDe(p) {
  const el = ELEMENTO_EN[p.element] ?? p.element;
  return `Original cute creature character named "${p.petName}", element: ${el}, ${p.line === 'poder' ? 'bold and sturdy' : p.line === 'harmonia' ? 'curious and elegant' : 'gentle and friendly'} personality, `
    + 'hand-painted watercolour game sprite, single creature, full body, calm expression, no text, '
    + 'on a flat solid #00FF00 green background; the creature must contain no green and have no green fringe.';
}

/** Id de simulado (`sim_NNNN`) — vai para chave de KV e argv. */
export const assertSimId = (id) => { if (!/^sim_\d{4}$/.test(id)) throw new Error(`id de simulado inválido: ${id}`); return id; };

/** O plano da fila (puro, testável). `only` = lista de ids para restringir. */
export function planejar(only = null) {
  return SIMULADOS.filter(p => !only || only.includes(p.id)).map(p => ({
    id: assertSimId(p.id), formId: FORM_ID, prompt: promptDe(p), kvKey: `sim:sprite:${p.id}`,
  }));
}

export function parseArgs(argv) {
  const o = { run: false, only: null, url: APP_URL_PADRAO };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run') o.run = true;
    else if (argv[i] === '--only') o.only = String(argv[++i] ?? '').split(',').map(s => s.trim()).filter(Boolean);
    else if (argv[i] === '--url') o.url = String(argv[++i] ?? '');
  }
  return o;
}

async function gerar(o, item, env) {
  const r = await fetch(`${o.url}/api/generate-sprite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.SIMULADOS_ID_TOKEN}` },
    body: JSON.stringify({ id: env.SIMULADOS_ADMIN_SAVE_ID, formId: item.formId, prompt: item.prompt }),
  });
  if (r.status === 202) throw new Error('202 pending (tente de novo daqui a pouco)');
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  const j = await r.json();
  if (typeof j.image !== 'string' || !SPRITE_URL_RE.test(j.image)) throw new Error('resposta sem URL de sprite válida (esperado /api/sprite-image?k=<32 hex>)');
  return j.image;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const fila = planejar(o.only);
  if (o.run) o.url = validarUrlBase(o.url); // ANTES de qualquer fetch: o token admin só vai para host conhecido
  if (!o.run) {
    console.log(`DRY-RUN: ${fila.length} sprites seriam gerados (forma ${FORM_ID}) via ${o.url}/api/generate-sprite. Use --run para executar.`);
    for (const it of fila) console.log(`${it.id}  ->  ${it.kvKey}\n    ${it.prompt}`);
    return;
  }
  const falta = ['SIMULADOS_ID_TOKEN', 'SIMULADOS_ADMIN_SAVE_ID', 'SIMULADOS_KV_NAMESPACE_ID'].filter(k => !process.env[k]);
  if (falta.length) { console.error(`Defina: ${falta.join(', ')}`); process.exit(2); }
  const ns = process.env.SIMULADOS_KV_NAMESPACE_ID;
  if (!/^[0-9a-f]{32}$/.test(ns)) { console.error('SIMULADOS_KV_NAMESPACE_ID inválido (esperado 32 hex)'); process.exit(2); }
  let ok = 0;
  for (const it of fila) {
    try {
      const url = await gerar(o, it, process.env);
      // sem shell, argv em array; wrangler via `node <bin>` (npx.cmd exigiria shell no Windows)
      const put = spawnSync(process.execPath, [WRANGLER_BIN, 'kv', 'key', 'put', it.kvKey, url, '--namespace-id', ns, '--remote'], { stdio: 'inherit', shell: false });
      if (put.status !== 0) throw new Error('wrangler kv put falhou');
      ok++;
      console.log(`${it.id}: ok (${url})`);
    } catch (e) {
      console.error(`${it.id}: ${e.message}`);
    }
  }
  console.log(`${ok}/${fila.length} sprites gravados.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
