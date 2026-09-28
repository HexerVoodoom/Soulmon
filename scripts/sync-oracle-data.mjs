// ---------------------------------------------------------------------------
// sync-oracle-data — materializa os dados que o oráculo consome dos outros
// dois repositórios do ecossistema:
//
//   • Class-System  → src/utils/soulProfile/ficha/classSystem.data.json
//     (profissões, talentos, criaturas capturáveis, famílias, escolas,
//     recursos — o vocabulário que a distribuição de pontos usa)
//   • bestiário     → src/utils/soulProfile/bestiary/pool.json
//     (desde 28/09/2026 SÓ entradas originais curadas no próprio repo —
//     scripts/bestiario-originais.mjs; o corpus do Besti-rio- não entra mais)
//
// Por que snapshot commitado e não dependência de git como no
// teste-personalidade: o Soulmon builda para APK/Cloudflare com dist/
// commitado, e o typecheck estrito não pode depender do tsconfig de outro
// repo. O snapshot carrega PROCEDÊNCIA (repo + ref + SHA + data) — atualizar
// é rodar `npm run sync:oracle-data` com os clones irmãos presentes.
//
// Uso:  node scripts/sync-oracle-data.mjs
//       CLASS_SYSTEM_DIR=/x node scripts/sync-oracle-data.mjs
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { entradaPermitida } from './bestiario-procedencia.mjs';
import { montarPool } from './bestiario-originais.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLASS_DIR = process.env.CLASS_SYSTEM_DIR ?? path.resolve(ROOT, '../Class-System');

function sh(cwd, cmd, args) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// Roda TypeScript dentro do clone irmão. NÃO usa `npx`: no Windows o executável
// é `npx.cmd`, e desde a correção do CVE-2024-27980 o Node RECUSA spawnar .cmd
// sem `shell: true` (EINVAL) — o sync inteiro morria na máquina do dono. Passar
// `shell: true` resolveria e traria de volta o parser do cmd.exe em cima de um
// caminho com espaço. Então chamamos o CLI do tsx PELO CAMINHO, com o mesmo
// `process.execPath` que já está rodando: um binário só, sem shell, igual nos
// três sistemas. Sem node_modules no clone, a mensagem diz o que fazer em vez
// de estourar um ENOENT sem contexto.
function tsxEval(cwd, code) {
  const cli = path.join(cwd, 'node_modules/tsx/dist/cli.mjs');
  if (!existsSync(cli)) {
    throw new Error(`tsx nao encontrado em ${cwd} - rode \`npm install\` no clone irmao.`);
  }
  return sh(cwd, process.execPath, [cli, '-e', code]);
}
function provenance(dir, ref) {
  return {
    repo: sh(dir, 'git', ['remote', 'get-url', 'origin']).trim(),
    ref: ref ?? sh(dir, 'git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim(),
    sha: sh(dir, 'git', ['rev-parse', ref ?? 'HEAD']).trim(),
    syncedAt: new Date().toISOString(),
    script: 'scripts/sync-oracle-data.mjs',
  };
}

// ---------------------------------------------------------------------------
// 1. Class-System — extrai o registro rodando tsx DENTRO do clone (o pacote é
//    TypeScript puro; extrair lá evita depender do tsconfig dele aqui).
// ---------------------------------------------------------------------------
if (!existsSync(CLASS_DIR)) throw new Error(`Class-System não encontrado em ${CLASS_DIR}`);
const extract = `
import { PROFISSOES, TALENTOS, CRIATURAS, FAMILIAS, ESCOLAS, RECURSOS } from './src/index';
const talentos = Object.fromEntries(Object.entries(TALENTOS).map(([id, t]) => [id, {
  nome: t.nome, ranksMaximos: t.ranksMaximos,
  ...(t.requisito ? { requisito: t.requisito } : {}),
  ...(t.exclusivoCom ? { exclusivoCom: t.exclusivoCom } : {}),
}]));
const profissoes = Object.fromEntries(Object.entries(PROFISSOES).map(([id, p]) => [id, {
  nome: p.nome, fatoresElementos: p.fatoresElementos,
  ...(p.fatoresEscolas ? { fatoresEscolas: p.fatoresEscolas } : {}),
}]));
const criaturas = Object.fromEntries(Object.entries(CRIATURAS).map(([id, c]) => [id, {
  nome: c.nome, familia: c.familia, afinidades: c.afinidades, poderBase: c.poderBase,
}]));
const familias = Object.fromEntries(Object.entries(FAMILIAS).map(([id, f]) => [id, { nome: f.nome }]));
const escolas = Object.fromEntries(Object.entries(ESCOLAS).map(([id, e]) => [id, { nome: e.nome }]));
const recursos = Object.fromEntries(Object.entries(RECURSOS).map(([id, r]) => [id, { nome: r.nome }]));
console.log(JSON.stringify({ escolas, recursos, profissoes, talentos, criaturas, familias }));
`;
const classData = JSON.parse(tsxEval(CLASS_DIR, extract));

// Os fixtures de PARIDADE da cascata NÃO são mais gerados aqui. Ficavam neste
// snapshot, com a procedência do CLONE IRMÃO — e o clone pode estar num SHA
// diferente do vendor que roda no app. Foi assim que fixtures do `1025012c`
// (branch de trabalho) ficaram confrontando um motor `fb866455`, escondendo
// 21.795 pares divergentes. Agora saem do PRÓPRIO vendor:
// `npm run gen:cascata-fixtures` → `ficha/cascata.fixtures.json`.

// Diais da alocação geracional, lidos do CONTRATO DE MÁQUINA do class-system
// (`taxonomy.json` v2, gerado por `npm run export:taxonomy` a partir de
// `src/registry/geracoes.ts` e travado por teste lá). Os fixtures acima pegam
// divisor e limiar (mudar um deles muda passivos/destrave), mas NÃO pegam o
// preço do ponto: `CUSTO_PONTO_PAR` é econômico, não entra em nenhuma cascata,
// e por isso sobrevivia a qualquer mutação — footgun 9 em estado puro. Com os
// diais no snapshot, `cascata.parity.test.ts` afirma os QUATRO contra a fonte.
const taxonomyPath = path.join(CLASS_DIR, 'taxonomy.json');
if (!existsSync(taxonomyPath)) {
  throw new Error(`taxonomy.json não encontrado em ${CLASS_DIR} — rode \`npm run export:taxonomy\` lá.`);
}
const taxonomy = JSON.parse(readFileSync(taxonomyPath, 'utf8'));
const g = taxonomy.geracoes;
for (const campo of ['divisorCascata', 'limiarDestravamento', 'custoPontoAlocacao']) {
  if (!g?.[campo] || typeof g[campo]['1'] !== 'number' || typeof g[campo]['2'] !== 'number') {
    throw new Error(`taxonomy.json sem geracoes.${campo} por aridade — o export do class-system mudou de forma.`);
  }
}
const geracoes = {
  divisorCascata: g.divisorCascata,
  limiarDestravamento: g.limiarDestravamento,
  custoPontoAlocacao: g.custoPontoAlocacao,
};

const classOut = {
  _provenance: provenance(CLASS_DIR),
  ...classData,
  geracoes,
};
const fichaDir = path.join(ROOT, 'src/utils/soulProfile/ficha');
mkdirSync(fichaDir, { recursive: true });
writeFileSync(path.join(fichaDir, 'classSystem.data.json'), JSON.stringify(classOut, null, 1) + '\n');
console.log(`class-system: ${Object.keys(classData.talentos).length} talentos · ${Object.keys(classData.profissoes).length} profissões · ${Object.keys(classData.criaturas).length} criaturas · ${Object.keys(classData.familias).length} famílias @ ${classOut._provenance.sha.slice(0, 8)}`);
console.log(`  diais gen-2: divisor ${geracoes.divisorCascata['2']} · limiar ${geracoes.limiarDestravamento['2']} · custo direto ${geracoes.custoPontoAlocacao['2']} (base ${geracoes.custoPontoAlocacao['1']})`);

// ---------------------------------------------------------------------------
// 2. Bestiário — SÓ ENTRADAS ORIGINAIS (decisão do dono, 28/09/2026).
//
// ⚠️ Até 28/09/2026 este bloco lia o corpus do Besti-rio- (variantes,
// enriched, faunaflora), amostrava 2.000 entradas, aplicava procedência,
// curadoria, ponte de elementos e arquétipos — e o resultado eram 732
// VARIANTES GERADAS de ~42 bases ('Titânico Cão de Fogo', 'Leão do Saara
// Venenoso'…), nenhuma entrada limpa. O dono mandou desativar as geradas e
// usar só as originais, com diversidade real de grupos. O pool agora é
// montado por `scripts/bestiario-originais.mjs` (41 bases originais com
// texto curado + o catálogo curado de `bestiario-catalogo-curado.mjs`), e
// o corpus do Besti-rio- não entra mais — ele não tem fauna real além de
// meia dúzia de mamíferos grandes (ver docs/BESTIARIO-PROCEDENCIA.md §14).
// ---------------------------------------------------------------------------
const bestDir = path.join(ROOT, 'src/utils/soulProfile/bestiary');
mkdirSync(bestDir, { recursive: true });
const criaturas = montarPool();
for (const c of criaturas) {
  if (!entradaPermitida(c)) throw new Error(`entrada reprovada pela procedência: ${c.nome}`);
}
const poolOut = {
  _provenance: {
    repo: 'HexerVoodoom/Soulmon', ref: 'scripts/bestiario-originais.mjs', sha: 'curado-no-repo',
    syncedAt: new Date().toISOString().slice(0, 10),
    fonte: 'scripts/bestiario-originais.mjs + scripts/bestiario-catalogo-curado.mjs (só entradas originais)',
  },
  criaturas,
};
writeFileSync(path.join(bestDir, 'pool.json'), JSON.stringify(poolOut) + '\n');
const fams = new Set(criaturas.map(c => c.familia));
console.log(`pool: ${criaturas.length} criaturas originais · ${fams.size} famílias`);
