import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chaveDuplicata, emailValido } from '../functions/_lib/email.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const sqlStr = (v) => (v === null || v === undefined ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'");

// Executor SQL via wrangler d1 execute (binding DB). Default local; --remote opcional.
export function criarExecutor({ remote = false } = {}) {
  const bin = path.join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  return (sql) => {
    const args = [bin, 'd1', 'execute', 'DB', remote ? '--remote' : '--local', '--json', '--command', sql];
    if (!remote) args.push('--persist-to', '.wrangler/state');
    const out = execFileSync(process.execPath, args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    const j = JSON.parse(out);
    return (Array.isArray(j) ? j[0] : j).results || [];
  };
}

export function carregarSal() {
  if (process.env.HASH_SALT) return process.env.HASH_SALT;
  const f = path.join(RAIZ, '.dev.vars');
  if (existsSync(f)) {
    const m = readFileSync(f, 'utf8').match(/^HASH_SALT=(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error('HASH_SALT ausente (variavel de ambiente ou .dev.vars)');
}

export async function chaveDoEmail(email, sal = carregarSal()) {
  if (!emailValido(email)) throw new Error('e-mail invalido');
  return chaveDuplicata(sal, email);
}

export const temFlag = (argv, f) => argv.includes(f);
