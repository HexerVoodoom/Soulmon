// ---------------------------------------------------------------------------
// sync-oracle-data — materializa os dados que o oráculo consome dos outros
// dois repositórios do ecossistema:
//
//   • Class-System  → src/utils/soulProfile/ficha/classSystem.data.json
//     (profissões, talentos, criaturas capturáveis, famílias, escolas,
//     recursos — o vocabulário que a distribuição de pontos usa)
//   • Besti-rio-    → src/utils/soulProfile/bestiary/pool.json
//     (amostra ESTRATIFICADA do corpus canônico: cobre todos os elementos,
//     todas as famílias e todos os tamanhos, com descrição real)
//
// Por que snapshot commitado e não dependência de git como no
// teste-personalidade: o Soulmon builda para APK/Cloudflare com dist/
// commitado, e o typecheck estrito não pode depender do tsconfig de outro
// repo. O snapshot carrega PROCEDÊNCIA (repo + ref + SHA + data) — atualizar
// é rodar `npm run sync:oracle-data` com os clones irmãos presentes.
//
// Uso:  node scripts/sync-oracle-data.mjs
//       CLASS_SYSTEM_DIR=/x BESTIARIO_DIR=/y node scripts/sync-oracle-data.mjs
//       BESTIARIO_REF=<ref>            (default: origin/main)
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { entradaPermitida } from './bestiario-procedencia.mjs';
import { curarEntrada } from './bestiario-curadoria.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLASS_DIR = process.env.CLASS_SYSTEM_DIR ?? path.resolve(ROOT, '../Class-System');
const BEST_DIR = process.env.BESTIARIO_DIR ?? path.resolve(ROOT, '../Besti-rio-');
// A classificação canônica (elementos/família/biologia/classificacaoConfianca)
// foi MERGEADA na `main` do Besti-rio- em 25/ago/2026 (merge 56933df). Antes
// disso o default era a branch de trabalho `claude/canonical-classification`:
// TODO o pool.json dependia de uma ref não mergeada de OUTRO repositório, e o
// sumiço/renomeação dela quebrava o sync em silêncio. Não volte a apontar para
// branch de trabalho — se o canônico mudar, ele vira main lá.
const BEST_REF = process.env.BESTIARIO_REF ?? 'origin/main';

const POOL_TARGET = 2000;

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
/** FNV-1a — o mesmo hash do oracle.ts, para a amostragem ser determinística. */
function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
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
// 2. Besti-rio- — corpus canônico lido por `git show` na ref pinada; amostra
//    estratificada por (elemento primário × família), depois por tamanho.
// ---------------------------------------------------------------------------
if (!existsSync(BEST_DIR)) throw new Error(`Besti-rio- não encontrado em ${BEST_DIR}`);
/* ⚠️ **CAMADA 0 — `pokemon`, `digimon` e `dnd` SAÍRAM em 27/09/2026.**
 *
 * Esta linha era a causa-raiz e ninguém precisava de regex para achá-la: o
 * script BUSCAVA os três arquivos de propósito, toda vez, e só DEPOIS tentava
 * filtrar por `origem` — que neles vem rotulada "Geração Procedural
 * (Class-System)". O filtro inspecionava o rótulo errado de um dado que tinha
 * sido pedido deliberadamente, então ele nunca teve chance.
 *
 * Resultado medido no pool commitado: **1.101 das 1.718 entradas** eram de
 * franquia — a Pokédex Gen I inteira, mais Beholder, Mind Flayer, Displacer
 * Beast, Murloc, Deathwing, Zergling, Chocobo, Tonberry, Rathalos e Balrog.
 *
 * Não reintroduza os três nomes. O que o pipeline usa da criatura-inspiração
 * é elemento, família, biologia, bioma, tamanho e atributos — tudo genérico e
 * disponível em fauna e flora reais, que são domínio público e mais diversas
 * que qualquer Pokédex. */
const FILES = ['variantes', 'enriched', 'faunaflora'];
const corpus = [];
for (const f of FILES) {
  let raw;
  try { raw = sh(BEST_DIR, 'git', ['show', `${BEST_REF}:src/registry/data/${f}.json`]); }
  catch { continue; }
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
  for (const c of arr) {
    // Só entra o que a classificação declarou confiável E tem descrição real —
    // é a descrição que vira inspiração; ficha vazia não inspira nada.
    if (c.classificacaoConfianca !== 'alta') continue;
    if (!c.descricao || /sem registro f/i.test(c.descricao)) continue;
    // `familia` é OPCIONAL: 5.354 variantes de confiança alta têm elementos e
    // descrição mas não têm família — exigir o campo jogava fora metade da
    // biblioteca. A seleção pontua por elementos; família é bônus quando há.
    if (!Array.isArray(c.elementos) || c.elementos.length === 0) continue;
    corpus.push({ ...c, _fonte: f });
  }
}
console.log(`bestiário: corpus elegível = ${corpus.length}`);

// Estratos: (elemento primário, família). Ordena cada estrato por hash do nome
// (determinístico) e colhe em rodadas — 1 de cada estrato por vez — até o
// alvo. Estratos raros entram inteiros; os comuns são cortados por igual.
const strata = new Map();
for (const c of corpus) {
  const key = `${c.elementos[0]}|${c.familia ?? c.biologia?.[0] ?? '-'}`;
  if (!strata.has(key)) strata.set(key, []);
  strata.get(key).push(c);
}
for (const list of strata.values()) list.sort((a, b) => hashString(a.nome) - hashString(b.nome));
const keys = [...strata.keys()].sort();
// Dedup por nome DURANTE a colheita: o corpus tem variantes homônimas entre
// arquivos, e nome duplicado no pool vira criatura que "não existe" para a
// cobertura (o sorteio nunca distingue as duas).
/**
 * ⚠️ O CRITÉRIO NÃO MORA MAIS AQUI — ele é de `scripts/bestiario-procedencia.mjs`,
 * importado por ESTE script **e** pelo guard de `pipeline.test.ts`.
 *
 * Até 27/09/2026 a regra era uma lista de onze nomes escrita nos DOIS lugares
 * (`agumon|…|pokemon|pikachu|charizard|goku`). As duas cópias erraram igual, e
 * por isso o teste chamado "nenhuma criatura do pool vem de franquia
 * protegida" passava VERDE com 1.101 entradas de franquia no pool. Régua
 * copiada não diverge um pouco: ela mente nos dois lugares ao mesmo tempo.
 *
 * O módulo único aplica quatro camadas — não ingerir (o `FILES` acima),
 * allowlist de BASES procedurais, rede de segurança sobre a descrição, e a
 * corroboração nome↔descrição que pega o drift de texto do upstream. A
 * fundamentação está em `docs/BESTIARIO-PROCEDENCIA.md`.
 */

const picked = [];
const nomesVistos = new Set();
for (let round = 0; picked.length < POOL_TARGET; round++) {
  let took = false;
  for (const k of keys) {
    const list = strata.get(k);
    if (round < list.length && picked.length < POOL_TARGET) {
      took = true;
      let c = list[round];
      if (!entradaPermitida(c)) continue;
      c = curarEntrada(c); // nome/tags/descrição coerentes — dono: bestiario-curadoria.mjs
      if (nomesVistos.has(c.nome)) continue;
      nomesVistos.add(c.nome);
      picked.push(c);
    }
  }
  if (!took) break; // corpus esgotado antes do alvo
}

const pool = picked.map(c => ({
  nome: c.nome,
  origem: c.origem ?? '',
  descricao: String(c.descricao).replace(/\s+/g, ' ').slice(0, 200),
  elementos: c.elementos,
  familia: c.familia ?? null,
  biologia: Array.isArray(c.biologia) ? c.biologia : [],
  bioma: Array.isArray(c.bioma) ? c.bioma : [],
  tamanho: c.tamanho ?? 'Medio',
  hostilidade: typeof c.hostilidade === 'number' ? c.hostilidade : 5,
  atributos: c.atributos ?? null,
}));
const bestDir = path.join(ROOT, 'src/utils/soulProfile/bestiary');
mkdirSync(bestDir, { recursive: true });
const poolOut = { _provenance: provenance(BEST_DIR, BEST_REF), _corpusElegivel: corpus.length, criaturas: pool };
writeFileSync(path.join(bestDir, 'pool.json'), JSON.stringify(poolOut) + '\n');

const els = new Set(pool.map(c => c.elementos[0]));
const fams = new Set(pool.filter(c => c.familia).map(c => c.familia));
console.log(`pool: ${pool.length} criaturas · ${els.size} elementos primários · ${fams.size} famílias @ ${poolOut._provenance.sha.slice(0, 8)}`);
