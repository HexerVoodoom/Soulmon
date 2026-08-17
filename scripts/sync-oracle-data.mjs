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
//       BESTIARIO_REF=origin/main  (default: origin/claude/canonical-classification
//       enquanto a classificação canônica não estiver mergeada na main)
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLASS_DIR = process.env.CLASS_SYSTEM_DIR ?? path.resolve(ROOT, '../Class-System');
const BEST_DIR = process.env.BESTIARIO_DIR ?? path.resolve(ROOT, '../Besti-rio-');
// A classificação canônica (elementos/família/biologia por criatura) ainda
// vive nesta branch do Besti-rio-; a main só tem `tags`. Quando ela for
// mergeada, troque para origin/main.
const BEST_REF = process.env.BESTIARIO_REF ?? 'origin/claude/canonical-classification';

const POOL_TARGET = 2000;

function sh(cwd, cmd, args) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
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
const classData = JSON.parse(sh(CLASS_DIR, 'npx', ['tsx', '-e', extract]));

// Fixtures de PARIDADE da cascata geracional: o MOTOR REAL calcula os casos
// de referência e o Soulmon confere a réplica mínima de `ficha/cascata.ts`
// contra eles (`cascata.parity.test.ts`). Se o class-system mudar um dial
// (divisor, limiar), o próximo sync regenera isto e o teste acusa.
const parityExtract = `
import { calcularCascata, ELEMENTOS } from './src/index';
const ehPar = (id) => ELEMENTOS[id]?.receita?.length === 2;
const casos = [
  { fogo: 5, agua: 5 },
  { fogo: 4, agua: 5 },
  { fogo: 20, agua: 5 },
  { fogo: 50, agua: 50 },
  { fogo: 49, agua: 50 },
  { fogo: 88, terra: 57, tempo: 55 },
  { ar: 51, terra: 34, luz: 32 },
];
const saida = casos.map((diretos) => {
  const c = calcularCascata(diretos);
  const pares = {};
  for (const [id, passivos] of c.passivos) {
    if (!ehPar(id)) continue; // a réplica do Soulmon modela só gen-2
    if ((passivos ?? 0) > 0) pares[id] = { passivos, destravado: c.destravados.has(id) };
  }
  return { diretos, pares };
});
console.log(JSON.stringify(saida));
`;
const cascataFixtures = JSON.parse(sh(CLASS_DIR, 'npx', ['tsx', '-e', parityExtract]));

const classOut = {
  _provenance: provenance(CLASS_DIR),
  ...classData,
  cascataFixtures,
};
const fichaDir = path.join(ROOT, 'src/utils/soulProfile/ficha');
mkdirSync(fichaDir, { recursive: true });
writeFileSync(path.join(fichaDir, 'classSystem.data.json'), JSON.stringify(classOut, null, 1) + '\n');
console.log(`class-system: ${Object.keys(classData.talentos).length} talentos · ${Object.keys(classData.profissoes).length} profissões · ${Object.keys(classData.criaturas).length} criaturas · ${Object.keys(classData.familias).length} famílias @ ${classOut._provenance.sha.slice(0, 8)}`);

// ---------------------------------------------------------------------------
// 2. Besti-rio- — corpus canônico lido por `git show` na ref pinada; amostra
//    estratificada por (elemento primário × família), depois por tamanho.
// ---------------------------------------------------------------------------
if (!existsSync(BEST_DIR)) throw new Error(`Besti-rio- não encontrado em ${BEST_DIR}`);
const FILES = ['variantes', 'enriched', 'faunaflora', 'pokemon', 'digimon', 'dnd'];
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
const picked = [];
const nomesVistos = new Set();
for (let round = 0; picked.length < POOL_TARGET; round++) {
  let took = false;
  for (const k of keys) {
    const list = strata.get(k);
    if (round < list.length && picked.length < POOL_TARGET) {
      took = true;
      const c = list[round];
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
