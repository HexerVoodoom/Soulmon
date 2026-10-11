#!/usr/bin/env node
/**
 * `node scripts/backup-saves.mjs` — cópia do KV de saves para o disco (E:/), para
 * o cenário "perda de save" do beta (`docs/BETA-CONTINGENCIA.md` §0 e §3).
 *
 * Quem roda: o DONO, com `npx wrangler login` feito (precisa da conta Cloudflare;
 * a squad não tem credencial). Só LÊ o KV remoto: nada é escrito nem apagado lá.
 *
 * Uso (PowerShell, na raiz do repo):
 *   node scripts/backup-saves.mjs                         # SOULMON_SAVES → E:/soulmon-backups/
 *   node scripts/backup-saves.mjs --binding DIGIAPP_SAVES # o namespace legado
 *   node scripts/backup-saves.mjs --prefix ent:           # só entitlements
 *   node scripts/backup-saves.mjs --dry-run               # só lista e conta
 *
 * Saída: `<out>/<binding>-<AAAA-MM-DDTHH-MM-SSZ>.json`, já no formato de
 * `wrangler kv bulk put` ([{ key, value, expiration? }]). RESTAURAR (decisão do
 * dono, um save por vez de preferência — ver BETA-CONTINGENCIA §3):
 *   npx wrangler kv bulk put <arquivo-filtrado>.json --binding SOULMON_SAVES --remote
 *
 * ⚠️ O arquivo contém os saves de todo mundo (dado pessoal, LGPD): fica em E:/,
 * nunca no repo (o `.gitignore` não cobre E:/ porque E:/ não é o repo), nunca em
 * nuvem pública; apague backups com mais de 14 dias depois do beta.
 *
 * Saídas: 0 ok · 1 erro · 2 wrangler falhou (login?).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const OUT_PADRAO = 'E:/soulmon-backups';
export const BINDING_PADRAO = 'SOULMON_SAVES';
/** `kv bulk get` aceita até 100 chaves por chamada. */
export const LOTE = 100;

export function parseArgs(argv) {
  const o = { binding: BINDING_PADRAO, out: OUT_PADRAO, prefix: '', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--binding') o.binding = String(argv[++i] ?? '');
    else if (a === '--out') o.out = String(argv[++i] ?? '');
    else if (a === '--prefix') o.prefix = String(argv[++i] ?? '');
    else if (a === '--dry-run') o.dryRun = true;
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  if (!/^[A-Z][A-Z0-9_]*$/.test(o.binding)) throw new Error(`binding inválido: ${o.binding}`);
  if (!o.out) throw new Error('--out vazio');
  if (/^c:/i.test(o.out)) throw new Error('backup em C:/ não (regra do disco: use E:/ ou D:/)');
  return o;
}

export function lotes(arr, n = LOTE) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** O stdout do wrangler pode ter banner antes do JSON: pega do 1º `[`/`{` em diante. */
export function extrairJson(stdout) {
  const s = String(stdout ?? '');
  const i = s.search(/[[{]/);
  if (i < 0) throw new Error('wrangler não devolveu JSON');
  return JSON.parse(s.slice(i));
}

/** `kv key list` → [{ name, expiration? }]. */
export function normalizarLista(json) {
  if (!Array.isArray(json)) throw new Error('lista de chaves em formato inesperado');
  return json.filter(k => k && typeof k.name === 'string').map(k => ({ name: k.name, expiration: Number.isFinite(k.expiration) ? k.expiration : undefined }));
}

/**
 * `kv bulk get` → { chave: valor } . Aceita as duas formas vistas no wrangler 4
 * (`{ k: "valor" }` e `{ k: { value, metadata } }`); `null` = chave sumiu
 * entre a listagem e a leitura (não é erro: é TTL ou exclusão de conta).
 */
export function normalizarBulk(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('bulk get em formato inesperado');
  const out = {};
  for (const [k, v] of Object.entries(json)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') out[k] = v;
    else if (typeof v === 'object' && 'value' in v) { if (v.value !== null && v.value !== undefined) out[k] = typeof v.value === 'string' ? v.value : JSON.stringify(v.value); }
    else out[k] = JSON.stringify(v);
  }
  return out;
}

/** Formato de `wrangler kv bulk put`. Preserva o TTL absoluto quando havia. */
export function montarRestauracao(chaves, valores) {
  const out = [];
  for (const { name, expiration } of chaves) {
    if (!(name in valores)) continue;
    out.push(expiration ? { key: name, value: valores[name], expiration } : { key: name, value: valores[name] });
  }
  return out;
}

export function nomeArquivo(binding, agora = new Date()) {
  return `${binding}-${agora.toISOString().slice(0, 19).replace(/:/g, '-')}Z.json`;
}

function wranglerReal(args) {
  const r = spawnSync('npx', ['wrangler', ...args], { encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 512 * 1024 * 1024 });
  if (r.status !== 0) {
    const e = new Error(`wrangler ${args.slice(0, 3).join(' ')} falhou (login feito? \`npx wrangler login\`)\n${r.stderr ?? ''}`);
    e.code = 2;
    throw e;
  }
  return r.stdout;
}

/** Núcleo testável: `wrangler` é injetado. Devolve { arquivo, total, gravadas }. */
export async function backup(opts, { wrangler = wranglerReal, agora = new Date(), log = console.log } = {}) {
  const listArgs = ['kv', 'key', 'list', '--binding', opts.binding, '--remote'];
  if (opts.prefix) listArgs.push('--prefix', opts.prefix);
  const chaves = normalizarLista(extrairJson(wrangler(listArgs)));
  log(`${chaves.length} chave(s) em ${opts.binding}${opts.prefix ? ` (prefixo ${opts.prefix})` : ''}.`);
  if (opts.dryRun) return { arquivo: null, total: chaves.length, gravadas: 0 };

  const tmp = join(tmpdir(), `soulmon-backup-keys-${process.pid}.json`);
  const valores = {};
  try {
    for (const [i, lote] of lotes(chaves.map(k => k.name)).entries()) {
      writeFileSync(tmp, JSON.stringify(lote));
      Object.assign(valores, normalizarBulk(extrairJson(wrangler(['kv', 'bulk', 'get', tmp, '--binding', opts.binding, '--remote']))));
      log(`  lote ${i + 1}: ${lote.length} chave(s)`);
    }
  } finally {
    rmSync(tmp, { force: true });
  }
  const dados = montarRestauracao(chaves, valores);
  mkdirSync(opts.out, { recursive: true });
  const arquivo = join(opts.out, nomeArquivo(opts.binding, agora));
  writeFileSync(arquivo, JSON.stringify(dados));
  log(`Backup: ${arquivo} (${dados.length} de ${chaves.length} chave(s); as que faltam expiraram/foram excluídas entre a lista e a leitura).`);
  return { arquivo, total: chaves.length, gravadas: dados.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await backup(parseArgs(process.argv.slice(2)));
  } catch (e) {
    console.error(String(e?.message ?? e));
    process.exit(e?.code === 2 ? 2 : 1);
  }
}
