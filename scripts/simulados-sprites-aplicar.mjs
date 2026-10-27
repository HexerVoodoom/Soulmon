#!/usr/bin/env node
/**
 * APLICA OS SPRITES JÁ GERADOS DOS SIMULADOS NO KV DE PRODUÇÃO — idempotente, DRY-RUN por padrão.
 *
 * Lê o mapeamento `[{ id, token }]` (publicado-kv.json) e, para cada simulado:
 *   1. garante `sim:sprite:<id>` = `/api/sprite-image?k=<token>`;
 *   2. reescreve `profile:<id>` com `spriteUrl` (e zera `simSig`, para o motor refazer o resto na próxima rodada do dia).
 * Rodar duas vezes = no-op na segunda. Não toca em nenhum perfil que não seja de simulado (`sim_NNNN` + `simulated: true`).
 * Desde 27/10/2026 as rotas já leem `sim:sprite:*` ao vivo, então só o passo 1 é necessário para o Torneio; o passo 2
 * alinha o perfil (diretório/ranking, que leem o perfil).
 *
 *   node scripts/simulados-sprites-aplicar.mjs                 # dry-run: só LÊ o KV e diz o que mudaria
 *   node scripts/simulados-sprites-aplicar.mjs --run           # grava
 *   opções: --map <arquivo.json> (padrão E:/Soulmon-assets/beta3-geradas/simulados/publicado-kv.json)
 * Exige SIMULADOS_KV_NAMESPACE_ID (32 hex). Faça backup/cópia antes (CLAUDE.md, Compatibilidade 8).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WRANGLER_BIN = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
export const MAP_PADRAO = 'E:/Soulmon-assets/beta3-geradas/simulados/publicado-kv.json';

/** Valida o mapeamento e devolve `{ id, url }[]` (puro, testável). Lança em id/token fora do formato. */
export function planejar(mapa) {
  if (!Array.isArray(mapa)) throw new Error('mapeamento não é uma lista');
  return mapa.map(({ id, token }) => {
    if (!/^sim_\d{4}$/.test(id)) throw new Error(`id inválido: ${id}`);
    if (!/^[0-9a-f]{32}$/.test(token)) throw new Error(`token inválido em ${id}`);
    return { id, url: `/api/sprite-image?k=${token}` };
  });
}

/** Decide as escritas de UM simulado, dado o que há hoje no KV (puro, testável). */
export function decidir({ url, spriteKey, perfilRaw }) {
  const out = { putSprite: spriteKey !== url, perfil: null };
  if (perfilRaw) {
    let p = null;
    try { p = JSON.parse(perfilRaw); } catch { /* perfil ilegível: não mexe */ }
    if (p && p.simulated === true && p.spriteUrl !== url) out.perfil = { ...p, spriteUrl: url, simSig: '' };
  }
  return out;
}

function wr(args, { input } = {}) {
  return spawnSync(process.execPath, [WRANGLER_BIN, 'kv', 'key', ...args], { encoding: 'utf8', shell: false, input });
}
const ler = (ns, key) => { const r = wr(['get', key, '--namespace-id', ns, '--remote', '--text']); return r.status === 0 ? r.stdout.replace(/\r?\n$/, '') : null; };
const gravar = (ns, key, value, ttl) => {
  const r = wr(['put', key, value, '--namespace-id', ns, '--remote', ...(ttl ? ['--ttl', String(ttl)] : [])]);
  if (r.status !== 0) throw new Error(`wrangler put ${key}: ${r.stderr}`);
};

function main() {
  const argv = process.argv.slice(2);
  const run = argv.includes('--run');
  const mapPath = argv.includes('--map') ? argv[argv.indexOf('--map') + 1] : MAP_PADRAO;
  const ns = process.env.SIMULADOS_KV_NAMESPACE_ID;
  if (!ns || !/^[0-9a-f]{32}$/.test(ns)) { console.error('Defina SIMULADOS_KV_NAMESPACE_ID (32 hex)'); process.exit(2); }
  const plano = planejar(JSON.parse(readFileSync(mapPath, 'utf8')));
  let mudou = 0;
  for (const { id, url } of plano) {
    const d = decidir({ url, spriteKey: ler(ns, `sim:sprite:${id}`), perfilRaw: ler(ns, `profile:${id}`) });
    if (!d.putSprite && !d.perfil) { console.log(`${id}: já ok`); continue; }
    mudou++;
    console.log(`${id}: ${d.putSprite ? 'sim:sprite ' : ''}${d.perfil ? 'profile.spriteUrl' : ''} -> ${url}${run ? '' : '  (dry-run)'}`);
    if (!run) continue;
    if (d.putSprite) gravar(ns, `sim:sprite:${id}`, url);
    if (d.perfil) gravar(ns, `profile:${id}`, JSON.stringify(d.perfil), 86400 * 365);
  }
  console.log(`${mudou}/${plano.length} com mudança${run ? ' (gravado)' : ' — rode com --run para gravar'}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
