#!/usr/bin/env node
/**
 * Inventário MEDIDO do código para a documentação (`docs/manual/`).
 *
 * Não descreve intenção — só lista o que existe: módulos, exports (com a
 * primeira linha do JSDoc quando há), campos do GameState, chaves de
 * localStorage, tokens de CSS, rotas de API e as eras do git. É a entrada
 * do `doc-cartografo` e o que os redatores recebem antes de escrever; o
 * guard `src/docsManual.contract.test.ts` usa a mesma varredura de módulos
 * para exigir que a referência cubra tudo.
 *
 * Uso:  node scripts/docs-inventario.mjs [--json] > saida.md
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const JSON_OUT = process.argv.includes('--json');

/** As árvores que a referência de funções tem de cobrir. */
export const ARVORES = [
  'src/utils', 'src/hooks', 'src/contexts', 'src/types', 'src/plugins',
  'src/components', 'src/security', 'src/deploy', 'src/constants',
  'functions/api', 'workers', 'desktop/renderer/src', 'desktop/electron',
];
const EXT = /\.(ts|tsx|js|mjs)$/;
const TESTE = /\.(test|spec)\.(ts|tsx|js|mjs)$|\.d\.ts$|\.d\.mts$/;

export function modulosDe(arvore) {
  const out = [];
  const walk = dir => {
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'assets') walk(p); continue; }
      if (EXT.test(e.name) && !TESTE.test(e.name)) out.push(p.replace(/\\/g, '/'));
    }
  };
  try { walk(arvore); } catch { /* árvore ausente */ }
  return out.sort();
}

function cabecalho(src) {
  const m = src.match(/^\s*\/\*\*([\s\S]*?)\*\//);
  if (!m) return '';
  return m[1].split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean).slice(0, 3).join(' ');
}

function exportsDe(src) {
  const linhas = src.split('\n');
  const found = [];
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    let m = l.match(/^export\s+(?:default\s+)?(?:async\s+)?(const|let|function\*?|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/);
    if (m) {
      // JSDoc imediatamente acima
      let j = i - 1, doc = '';
      while (j >= 0 && linhas[j].trim() === '') j--;
      if (j >= 0 && linhas[j].trim().endsWith('*/')) {
        let k = j; while (k >= 0 && !linhas[k].includes('/**')) k--;
        doc = linhas.slice(k, j + 1).join(' ').replace(/\/\*\*|\*\/|^\s*\*\s?/g, '').replace(/\s*\*\s*/g, ' ').trim().slice(0, 160);
      }
      found.push({ nome: m[2], tipo: m[1].replace('*', ''), doc });
      continue;
    }
    m = l.match(/^export\s*\{([^}]*)\}/);
    if (m) for (const n of m[1].split(',')) { const nn = n.trim().split(/\s+as\s+/).pop(); if (nn) found.push({ nome: nn, tipo: 're-export', doc: '' }); }
    if (/^export\s+default\s/.test(l) && !m) found.push({ nome: 'default', tipo: 'default', doc: '' });
  }
  return found;
}

function inventarioModulos() {
  const res = {};
  for (const a of ARVORES) {
    res[a] = modulosDe(a).map(p => {
      const src = readFileSync(join(ROOT, p), 'utf8');
      return { path: p, linhas: src.split('\n').length, cabecalho: cabecalho(src), exports: exportsDe(src) };
    });
  }
  return res;
}

function camposGameState() {
  const src = readFileSync(join(ROOT, 'src/contexts/GameStateContext.tsx'), 'utf8');
  const m = src.match(/export\s+interface\s+GameState\s*\{([\s\S]*?)\n\}/);
  if (!m) return [];
  return m[1].split('\n').map(l => l.trim()).filter(l => /^[a-zA-Z_]\w*\??\s*:/.test(l)).map(l => l.replace(/;.*$/, ''));
}

function chavesStorage() {
  const src = readFileSync(join(ROOT, 'src/utils/storageKeys.ts'), 'utf8');
  return [...src.matchAll(/^\s*([A-Z_]+):\s*(['"`][^'"`]+['"`]|[^,\n]+)/gm)].map(m => `${m[1]} = ${m[2].trim()}`);
}

function tokensCss() {
  const src = readFileSync(join(ROOT, 'src/index.css'), 'utf8');
  return [...new Set([...src.matchAll(/(--sm-[a-z0-9-]+):/g)].map(m => m[1]))].sort();
}

function rotasApi() {
  return modulosDe('functions/api').filter(p => !/\/_/.test(p)).map(p => {
    const src = readFileSync(join(ROOT, p), 'utf8');
    const metodos = [...src.matchAll(/export\s+(?:async\s+)?function\s+onRequest(\w*)/g)].map(m => m[1] || 'ANY');
    return { rota: '/api/' + p.replace('functions/api/', '').replace(/\.js$/, ''), arquivo: p, metodos };
  });
}

function erasGit() {
  try {
    const raw = execSync('git log --format=%ad --date=short', { cwd: ROOT }).toString().trim().split('\n');
    const porMes = {};
    for (const d of raw) { const k = d.slice(0, 7); porMes[k] = (porMes[k] || 0) + 1; }
    const tags = execSync('git tag --sort=creatordate', { cwd: ROOT }).toString().trim().split('\n').filter(Boolean);
    return { total: raw.length, primeiro: raw[raw.length - 1], ultimo: raw[0], porMes, tags };
  } catch { return null; }
}

const ehPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ehPrincipal) main();

function main() {
const inv = {
  geradoEm: new Date().toISOString().slice(0, 10),
  modulos: inventarioModulos(),
  gameState: camposGameState(),
  storageKeys: chavesStorage(),
  tokensCss: tokensCss(),
  rotasApi: rotasApi(),
  git: erasGit(),
};

if (JSON_OUT) { console.log(JSON.stringify(inv, null, 2)); return; }

const out = [];
out.push(`# Inventário medido — gerado em ${inv.geradoEm} por \`node scripts/docs-inventario.mjs\``, '');
for (const [arv, mods] of Object.entries(inv.modulos)) {
  out.push(`## ${arv} — ${mods.length} módulos`, '');
  for (const m of mods) {
    out.push(`### \`${m.path}\` (${m.linhas} linhas)`);
    if (m.cabecalho) out.push(`> ${m.cabecalho}`);
    for (const e of m.exports) out.push(`- \`${e.nome}\` (${e.tipo})${e.doc ? ' — ' + e.doc : ''}`);
    out.push('');
  }
}
out.push(`## GameState — ${inv.gameState.length} campos`, '', ...inv.gameState.map(c => `- \`${c}\``), '');
out.push(`## STORAGE_KEYS — ${inv.storageKeys.length}`, '', ...inv.storageKeys.map(c => `- \`${c}\``), '');
out.push(`## Tokens --sm-* — ${inv.tokensCss.length}`, '', inv.tokensCss.map(t => `\`${t}\``).join(' · '), '');
out.push(`## Rotas /api — ${inv.rotasApi.length}`, '', ...inv.rotasApi.map(r => `- \`${r.rota}\` ← \`${r.arquivo}\` [${r.metodos.join(', ')}]`), '');
if (inv.git) {
  out.push(`## Git — ${inv.git.total} commits, ${inv.git.primeiro} → ${inv.git.ultimo}; tags: ${inv.git.tags.join(', ') || '(nenhuma)'}`, '');
  out.push(...Object.entries(inv.git.porMes).sort().map(([k, v]) => `- ${k}: ${v}`), '');
}
console.log(out.join('\n'));
}
