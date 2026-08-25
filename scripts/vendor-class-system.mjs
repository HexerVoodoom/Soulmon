// ---------------------------------------------------------------------------
// vendor-class-system — materializa o ARTEFATO COMPILADO do Class-System em
// `vendor/class-system/`, commitado, para que o build do Soulmon nunca precise
// buscar aquele repositório (ADR-002 §1).
//
// Por que artefato vendorizado e não dependência npm de git:
// o `class-system` é CÓDIGO EXECUTÁVEL dentro do bundle (`ficha/realEngine.ts`
// faz `await import('class-system')`), e o Cloudflare Pages roda `npm ci` a
// cada deploy. A resolução era `git+ssh://git@github.com/HexerVoodoom/
// Class-System.git`, que só funciona porque o repositório é PÚBLICO (o npm cai
// para HTTPS anônimo). No dia em que ele virar privado, o `npm ci` do
// Cloudflare falha e a `main` PARA DE PUBLICAR — não é degradação, é o site
// fora do ar no push seguinte. O vendor tira a rede e a credencial do caminho
// do build; a credencial passa a existir só na CI que abre o PR de sync.
//
// O que é gerado (tudo commitado):
//   vendor/class-system/index.js         bundle ESM (esbuild, sem minificar —
//                                        o Vite minifica; aqui o diff tem que
//                                        ser legível na revisão do PR)
//   vendor/class-system/index.d.ts       fachada de tipos, re-exportando…
//   vendor/class-system/types/**.d.ts    …a árvore de declaração emitida pelo
//                                        tsc do PRÓPRIO clone
//   vendor/class-system/_provenance.json repo + ref + SHA + data + hash
//
// Os `.d.ts` são AUTOSSUFICIENTES de propósito: o motivo original do snapshot
// (`sync-oracle-data.mjs:14-19`) é que o typecheck estrito do Soulmon não pode
// depender do `tsconfig` de outro repositório. Declaração não é compilada, e
// `skipLibCheck` cobre o resto.
//
// Uso:  node scripts/vendor-class-system.mjs
//       CLASS_SYSTEM_DIR=/x node scripts/vendor-class-system.mjs
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLASS_DIR = process.env.CLASS_SYSTEM_DIR ?? path.resolve(ROOT, '../Class-System');
const OUT_DIR = path.resolve(ROOT, 'vendor/class-system');

const isWin = process.platform === 'win32';
const bin = name => path.join(CLASS_DIR, 'node_modules/.bin', isWin ? `${name}.cmd` : name);

function run(file, args, cwd) {
  return execFileSync(file, args, { cwd, encoding: 'utf8', shell: isWin }).trim();
}

if (!existsSync(CLASS_DIR)) {
  console.error(
    `[vendor] clone do Class-System não encontrado em ${CLASS_DIR}.\n` +
      `         git clone https://github.com/HexerVoodoom/Class-System "${CLASS_DIR}"\n` +
      `         ou aponte CLASS_SYSTEM_DIR.`,
  );
  process.exit(1);
}
if (!existsSync(path.join(CLASS_DIR, 'node_modules/.bin'))) {
  console.error(
    `[vendor] o clone existe mas não tem node_modules — rode \`npm install\` em ${CLASS_DIR}.\n` +
      `         (esbuild e typescript saem de lá, não daqui: o artefato é do OUTRO repo.)`,
  );
  process.exit(1);
}

// --- procedência -----------------------------------------------------------
const sha = run('git', ['rev-parse', 'HEAD'], CLASS_DIR);
const ref = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], CLASS_DIR);
const commitDate = run('git', ['log', '-1', '--format=%cI'], CLASS_DIR);
const subject = run('git', ['log', '-1', '--format=%s'], CLASS_DIR);
const dirty = run('git', ['status', '--porcelain'], CLASS_DIR);
if (dirty) {
  console.error(
    `[vendor] o clone tem mudanças não commitadas — o vendor ficaria sem procedência real.\n${dirty}`,
  );
  process.exit(1);
}

// --- JS: bundle ESM --------------------------------------------------------
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

run(
  bin('esbuild'),
  [
    'src/index.ts',
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--target=es2022',
    `--outfile=${JSON.stringify(path.join(OUT_DIR, 'index.js'))}`,
    '--log-level=warning',
  ],
  CLASS_DIR,
);

// --- .d.ts: árvore de declaração do próprio tsc do clone -------------------
const TMP = path.join(CLASS_DIR, '.vendor-dts');
rmSync(TMP, { recursive: true, force: true });
run(
  bin('tsc'),
  [
    'src/index.ts',
    '--ignoreConfig',
    '--declaration',
    '--emitDeclarationOnly',
    '--target',
    'ES2022',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler',
    '--strict',
    '--skipLibCheck',
    '--outDir',
    JSON.stringify(TMP),
  ],
  CLASS_DIR,
);
cpSync(TMP, path.join(OUT_DIR, 'types'), { recursive: true });
rmSync(TMP, { recursive: true, force: true });

writeFileSync(
  path.join(OUT_DIR, 'index.d.ts'),
  `// Fachada de tipos do artefato vendorizado — gerada por\n` +
    `// \`npm run vendor:class-system\`. NÃO EDITE À MÃO.\n` +
    `export * from './types/index';\n`,
);

// --- procedência ao lado do artefato ---------------------------------------
const jsBytes = readFileSync(path.join(OUT_DIR, 'index.js'));
writeFileSync(
  path.join(OUT_DIR, '_provenance.json'),
  `${JSON.stringify(
    {
      repo: 'https://github.com/HexerVoodoom/Class-System',
      ref,
      sha,
      commitDate,
      commitSubject: subject,
      generatedAt: new Date().toISOString(),
      generatedBy: 'scripts/vendor-class-system.mjs',
      bundleSha256: createHash('sha256').update(jsBytes).digest('hex'),
      bundleBytes: jsBytes.length,
      note:
        'Artefato COMPILADO, commitado (ADR-002 §1). O build do Soulmon não busca ' +
        'este repositório. Para atualizar: rode `npm run vendor:class-system` com o ' +
        'clone irmão atualizado e `npm run sync:oracle-data` (os fixtures de paridade ' +
        'de `cascata.parity.test.ts` têm que vir do MESMO SHA).',
    },
    null,
    2,
  )}\n`,
);

console.log(`[vendor] class-system @ ${sha.slice(0, 7)} (${ref}) → vendor/class-system/`);
console.log(`[vendor] index.js: ${(jsBytes.length / 1024).toFixed(1)} kB`);
