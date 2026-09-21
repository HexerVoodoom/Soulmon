#!/usr/bin/env node
/**
 * Delta de documentação: o que mudou no CÓDIGO desde a última vez que o
 * manual (`docs/manual/`) foi sincronizado, e quais docs isso toca.
 *
 * A última sincronização vive em `docs/manual/.sincronizado.json`
 * (`{ sha, data, por }`), gravada pelo `doc-mantenedor` ao fechar uma
 * rodada. Este script compara aquele SHA com o HEAD e devolve, por doc do
 * manual, os arquivos que o afetam — mais três listas que o guard não pega
 * sozinho: módulos NOVOS sem entrada na referência, módulos APAGADOS que
 * ainda têm entrada, e módulos cujos EXPORTS mudaram (a entrada pode estar
 * desatualizada mesmo existindo).
 *
 * Uso:
 *   node scripts/docs-delta.mjs            # relatório em markdown
 *   node scripts/docs-delta.mjs --json     # o mesmo, em JSON
 *   node scripts/docs-delta.mjs --resumo   # uma linha (para o hook de sessão)
 *   node scripts/docs-delta.mjs --strict   # exit 1 se houver delta (CI)
 *   node scripts/docs-delta.mjs --desde <sha>   # ignora o .sincronizado
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ARVORES, modulosDe } from './docs-inventario.mjs';

const ROOT = process.cwd();
const SYNC = join(ROOT, 'docs/manual/.sincronizado.json');
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const desdeArg = args.includes('--desde') ? args[args.indexOf('--desde') + 1] : undefined;

const git = cmd => { try { return execSync(`git ${cmd}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

/** Caminho de código → docs do manual que o descrevem (espelha o §5 do 00-MAPA). */
const MAPA_ARQUIVO_DOC = [
  [/^src\/utils\/(sounds|audioBus|loudness)\.ts$/, ['04-IDENTIDADE-VISUAL.md', '06-REFERENCIA/utils.md']],
  [/^src\/utils\/(petStage|backgrounds|dungeonScenes|sprites|decorArt|pixelizer|spriteGen)\.ts$/, ['04-IDENTIDADE-VISUAL.md', '06-REFERENCIA/utils.md']],
  [/^src\/utils\/(cloudSave|storageKeys|safeStorage|careCaps|playerDay)\.ts$/, ['07-DADOS-E-SAVE.md', '06-REFERENCIA/utils.md']],
  [/^src\/utils\/(auth|entitlements|playBilling|aiClient|notifications|telemetry|vapid|serverConfig)\.ts$/, ['08-INTEGRACOES-E-DEPLOY.md', '06-REFERENCIA/utils.md']],
  [/^src\/utils\//, ['02-REGRAS-DE-NEGOCIO.md', '06-REFERENCIA/utils.md']],
  [/^src\/types\//, ['02-REGRAS-DE-NEGOCIO.md', '06-REFERENCIA/hooks-contexts-types.md']],
  [/^src\/hooks\//, ['05-ARQUITETURA.md', '06-REFERENCIA/hooks-contexts-types.md']],
  [/^src\/contexts\//, ['07-DADOS-E-SAVE.md', '06-REFERENCIA/hooks-contexts-types.md']],
  [/^src\/plugins\//, ['03-FLUXO-DE-TELAS.md', '06-REFERENCIA/plugins-constants.md']],
  [/^src\/constants\/|^src\/translations\//, ['06-REFERENCIA/plugins-constants.md']],
  [/^src\/components\//, ['03-FLUXO-DE-TELAS.md', '06-REFERENCIA/components.md']],
  [/^src\/(App|main)\.tsx$/, ['03-FLUXO-DE-TELAS.md', '05-ARQUITETURA.md', '06-REFERENCIA/components.md']],
  [/^src\/index\.css$|^src\/styles\/|^index\.html$|^public\/manifest/, ['04-IDENTIDADE-VISUAL.md']],
  [/^src\/(security|deploy)\//, ['05-ARQUITETURA.md', '08-INTEGRACOES-E-DEPLOY.md']],
  [/^functions\/|^workers\/|^wrangler\.jsonc$|^migrations\/|^\.github\/workflows\/|^public\/sw\.js$|^public\/_headers$/, ['08-INTEGRACOES-E-DEPLOY.md', '06-REFERENCIA/api-workers.md']],
  [/^desktop\//, ['05-ARQUITETURA.md', '06-REFERENCIA/desktop.md']],
  [/^android\//, ['03-FLUXO-DE-TELAS.md', '05-ARQUITETURA.md', '08-INTEGRACOES-E-DEPLOY.md']],
  [/^package\.json$|^vite\.config\.ts$|^vitest\.config\.ts$|^tsconfig/, ['05-ARQUITETURA.md']],
  [/^CLAUDE\.md$|^docs\/REGISTRO-DE-DECISOES\.md$|^docs\/STATUS\.md$/, ['01-VISAO.md', '10-DISCUSSOES-E-DECISOES.md']],
  [/^docs\/(?!manual\/).*\.md$/, ['00-MAPA.md', '10-DISCUSSOES-E-DECISOES.md']],
  [/^\.claude\//, ['00-MAPA.md', '12-COMO-MANTER.md']],
];
const IGNORAR = /^(dist\/|docs\/manual\/|node_modules\/|.*\.(png|webp|jpg|svg|woff2?)$|.*\.test\.(ts|tsx|js|mjs)$|.*\.snap$)/;

const sync = existsSync(SYNC) ? JSON.parse(readFileSync(SYNC, 'utf8')) : null;
const base = desdeArg || sync?.sha;
const head = git('rev-parse HEAD');
const saida = { base, head, sincronizadoEm: sync?.data ?? null, ok: true, avisos: [], porDoc: {}, novos: [], apagados: [], exportsMudaram: [], commits: 0 };

if (!base) { saida.ok = false; saida.avisos.push('docs/manual/.sincronizado.json não existe — sem base para comparar'); }
else if (!git(`cat-file -t ${base}`)) { saida.ok = false; saida.avisos.push(`o SHA sincronizado ${base} não está neste clone (clone raso? rode git fetch --unshallow)`); }
else {
  try { execSync(`git merge-base --is-ancestor ${base} HEAD`, { cwd: ROOT, stdio: 'ignore' }); }
  catch { saida.avisos.push(`o SHA sincronizado ${base} não é ancestral do HEAD — histórico divergiu`); }
}

if (saida.ok) {
  const linhas = git(`diff --name-status ${base}..HEAD`).split('\n').filter(Boolean);
  saida.commits = Number(git(`rev-list --count ${base}..HEAD`) || 0);
  const mudados = [];
  for (const l of linhas) {
    const [status, ...rest] = l.split('\t');
    const path = rest[rest.length - 1];
    if (IGNORAR.test(path)) continue;
    mudados.push({ status: status[0], path });
    for (const [re, docs] of MAPA_ARQUIVO_DOC) {
      if (re.test(path)) { for (const d of docs) (saida.porDoc[d] ??= []).push(`${status[0]} ${path}`); break; }
    }
  }
  // Referência: novos / apagados / exports
  const refDir = join(ROOT, 'docs/manual/06-REFERENCIA');
  let ref = '';
  try { for (const f of execSync('ls', { cwd: refDir }).toString().split('\n').filter(Boolean)) ref += readFileSync(join(refDir, f), 'utf8'); } catch { /* sem referência */ }
  const vivos = new Set(ARVORES.flatMap(a => modulosDe(a)));
  for (const m of vivos) if (!ref.includes('`' + m + '`')) saida.novos.push(m);
  // A LINHA INTEIRA do H3, não só o caminho: uma entrada já marcada `⚰️ apagado
  // em <sha>` é trabalho FEITO, e sinalizá-la de novo a cada rodada é um alarme
  // que nunca fecha. Medido em 21/09/2026: `EvoTrail.tsx` estava com a lápide
  // desde `7ea27825` e voltava em toda sincronização como se faltasse fazer —
  // e alarme permanente é o que ensina a ignorar o alarme, que é exatamente o
  // modo de falha que este manual existe para evitar.
  for (const l of ref.matchAll(/^### `([^`]+)`(.*)$/gm)) {
    const p = l[1];
    if (/⚰️/.test(l[2])) continue;
    if (/^(src|functions|workers|desktop)\//.test(p) && !vivos.has(p) && !existsSync(join(ROOT, p))) saida.apagados.push(p);
  }
  const exportsDe = src => (src.match(/^export\s+(?:default\s+)?(?:async\s+)?(?:const|let|function\*?|class|type|interface|enum)\s+[A-Za-z_$][\w$]*/gm) || []).sort().join('\n');
  for (const { status, path } of mudados) {
    if (status !== 'M' || !vivos.has(path)) continue;
    const antes = git(`show ${base}:${path}`);
    const agora = readFileSync(join(ROOT, path), 'utf8');
    if (exportsDe(antes) !== exportsDe(agora)) saida.exportsMudaram.push(path);
  }
}

const total = Object.keys(saida.porDoc).length + saida.novos.length + saida.apagados.length;
saida.temDelta = total > 0;

if (flag('--json')) { console.log(JSON.stringify(saida, null, 2)); }
else if (flag('--resumo')) {
  if (!saida.ok) console.log(`docs: SEM BASE (${saida.avisos.join('; ')})`);
  else if (!saida.temDelta) console.log(`docs: sincronizado com ${base.slice(0, 8)} (${saida.sincronizadoEm}); ${saida.commits} commit(s) desde então, nenhum toca o que o manual descreve`);
  else console.log(`docs: DEFASADO — ${saida.commits} commit(s) desde ${base.slice(0, 8)} (${saida.sincronizadoEm}) tocam ${Object.keys(saida.porDoc).length} doc(s)${saida.novos.length ? `, ${saida.novos.length} módulo(s) novo(s) sem entrada` : ''}${saida.apagados.length ? `, ${saida.apagados.length} entrada(s) de módulo apagado` : ''}${saida.exportsMudaram.length ? `, ${saida.exportsMudaram.length} módulo(s) com exports mudados` : ''} → rode /manter-docs`);
} else {
  console.log(`# Delta do manual — ${base ? base.slice(0, 8) : '(sem base)'} → ${head.slice(0, 8)}\n`);
  for (const a of saida.avisos) console.log(`> ⚠️ ${a}\n`);
  if (saida.ok && !saida.temDelta) console.log(`Nada a sincronizar: ${saida.commits} commit(s), nenhum toca código descrito pelo manual.\n`);
  for (const [doc, files] of Object.entries(saida.porDoc)) { console.log(`## ${doc}`); for (const f of files) console.log(`- ${f}`); console.log(''); }
  if (saida.novos.length) console.log(`## Módulos NOVOS sem entrada em 06-REFERENCIA/\n${saida.novos.map(m => `- \`${m}\``).join('\n')}\n`);
  if (saida.apagados.length) console.log(`## Entradas de módulos APAGADOS (marcar ⚰️ ou remover)\n${saida.apagados.map(m => `- \`${m}\``).join('\n')}\n`);
  if (saida.exportsMudaram.length) console.log(`## Módulos com EXPORTS mudados (reconferir a entrada)\n${saida.exportsMudaram.map(m => `- \`${m}\``).join('\n')}\n`);
}
if (flag('--strict') && saida.temDelta) process.exit(1);
