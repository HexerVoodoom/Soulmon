// ---------------------------------------------------------------------------
// gen-cascata-fixtures — gera `src/utils/soulProfile/ficha/cascata.fixtures.json`
// A PARTIR DO VENDOR (`vendor/class-system/index.js`), nunca de um clone irmão.
//
// Por quê: os fixtures antigos viviam dentro de `classSystem.data.json`, cuja
// procedência é a do `npm run sync:oracle-data` — e o sync roda contra o clone
// irmão, que pode estar num SHA DIFERENTE do vendor. Foi exatamente isso que
// escondeu o defeito: fixtures do `1025012c` (branch de trabalho) contra um
// motor `fb866455`, sem nada no repositório dizendo que os dois discordavam.
//
// Gerando do vendor, o SHA do fixture é o SHA do motor que roda no app, POR
// CONSTRUÇÃO. `cascata.parity.test.ts` ainda assim confere os dois contra o
// motor vivo — o fixture é conveniência, o motor é a verdade.
//
// Uso: node scripts/gen-cascata-fixtures.mjs
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(ROOT, 'vendor/class-system');
const engine = await import(pathToFileURL(path.join(VENDOR, 'index.js')).href);
const vendorProv = JSON.parse(readFileSync(path.join(VENDOR, '_provenance.json'), 'utf8'));

const ehPar = id => engine.ELEMENTOS[id]?.receita?.length === 2;

// Os 17 ids base, na ordem do motor.
const BASES = Object.values(engine.ELEMENTOS).filter(d => d.tipo === 'base').map(d => d.id);

// A tabela de sinergia de ALVO ÚNICO é DADO, não regra copiada: a réplica
// (`ficha/cascata.ts`) lê daqui em vez de reescrever os 19 pares à mão.
const sinergiasAlvoUnico = engine.SINERGIAS
  .filter(s => s.para.length === 1)
  .map(s => ({ de: s.de, para: s.para[0], razao: s.razao }));

// ---------------------------------------------------------------------------
// Casos. Os 7 antigos (fogo/agua/terra/tempo/ar/luz) ficam — nenhum deles tem
// sinergia de alvo único, e é justamente por isso que a cobertura antiga não
// pegou nada. Os novos existem para cobrir a CLASSE DE DEFEITO achada:
// componente que RECEBE transbordo, componente que EMITE, transbordo que
// atravessa o limiar de destrave, e transbordo que faz nascer um par cujos
// dois componentes o jogador nem tocou.
// ---------------------------------------------------------------------------
const casos = [
  // --- legado (sem sinergia de alvo único) ---
  { fogo: 5, agua: 5 },
  { fogo: 4, agua: 5 },
  { fogo: 20, agua: 5 },
  { fogo: 50, agua: 50 },
  { fogo: 49, agua: 50 },
  { fogo: 88, terra: 57, tempo: 55 },
  { ar: 51, terra: 34, luz: 32 },

  // --- transbordo simples: `luz → vida` (0.1) empurra `vida` de 14 p/ 15 ---
  { luz: 40, vida: 14 },
  // --- mão dupla: `vida ↔ vigor` (0.1 nos dois sentidos) ---
  { vida: 49, vigor: 49 },
  // --- `terra → vigor` (0.05) + `marcial → vigor` (0.1) somam no MESMO alvo ---
  { terra: 60, marcial: 40, vigor: 41 },
  // --- transbordo ATRAVESSA o limiar de destrave (10 passivos) ---
  { luz: 100, vida: 49 },
  { vigor: 100, marcial: 49 },
  // --- razão 0.08: `arcano → tempo` e `arcano → espaco` ---
  { arcano: 100, tempo: 47, espaco: 47 },
  // --- `espaco → gravidade` e `gravidade → espaco` ---
  { espaco: 60, gravidade: 44 },
  // --- razão 0.05: `eletricidade → som`, `ar → som`, `eletricidade → ar` ---
  { eletricidade: 80, ar: 43, som: 39 },
  // --- par que NASCE do transbordo: o jogador não pôs 1 ponto em `som` ---
  { eletricidade: 100, ar: 100 },
  // --- `fogo ↔ vileza` e `sombra ↔ morte` ---
  { fogo: 60, vileza: 44, sombra: 60, morte: 44 },
  // --- piso: razão * pontos < 1 → transbordo ZERO (floor), nada muda ---
  { luz: 9, vida: 5 },
  // --- ficha larga, do tipo que o `buildFicha` do ultra produz ---
  { fogo: 60, agua: 20, terra: 45, ar: 30, eletricidade: 55, arcano: 70,
    sombra: 25, luz: 50, vileza: 15, morte: 20, vida: 48, vigor: 47,
    marcial: 35, tempo: 46, som: 10, gravidade: 12, espaco: 45 },
];

const cascataFixtures = casos.map(diretos => {
  const c = engine.calcularCascata(diretos);
  const pares = {};
  for (const [id, passivos] of c.passivos) {
    if (!ehPar(id)) continue; // a réplica do Soulmon modela só gen-2
    if ((passivos ?? 0) > 0) pares[id] = { passivos, destravado: c.destravados.has(id) };
  }
  return { diretos, pares };
});

// Quantos casos o TRANSBORDO realmente muda — a medida honesta da cobertura.
// A regra antiga (min(floor(a/5), floor(b/5)) sobre os diretos crus) é
// reproduzida aqui SÓ para essa contagem; ela não vai para o JSON.
const divisor = engine.DIVISOR_CASCATA[2];
const limiar = engine.LIMIAR_DESTRAVAMENTO[2];
const comSinergia = cascataFixtures.filter(f => {
  for (const [id, esperado] of Object.entries(f.pares)) {
    const [a, b] = engine.ELEMENTOS[id].receita.map(c => c.elemento);
    const antigo = Math.min(
      Math.floor((f.diretos[a] ?? 0) / divisor),
      Math.floor((f.diretos[b] ?? 0) / divisor),
    );
    if (antigo !== esperado.passivos || antigo >= limiar !== esperado.destravado) return true;
  }
  return false;
}).length;

const out = {
  _procedencia: {
    origem: 'vendor/class-system/index.js',
    repo: vendorProv.repo,
    sha: vendorProv.sha,
    commitSubject: vendorProv.commitSubject,
    bundleSha256: vendorProv.bundleSha256,
    geradoPor: 'scripts/gen-cascata-fixtures.mjs',
    geradoEm: new Date().toISOString(),
    nota: 'Regenere com `npm run gen:cascata-fixtures` SEMPRE que rodar `npm run vendor:class-system`. O SHA daqui TEM que ser o de vendor/class-system/_provenance.json — cascata.parity.test.ts falha se divergir.',
  },
  bases: BASES,
  sinergiasAlvoUnico,
  cascataFixtures,
};

const alvo = path.join(ROOT, 'src/utils/soulProfile/ficha/cascata.fixtures.json');
writeFileSync(alvo, JSON.stringify(out, null, 1) + '\n');
console.log(`cascata.fixtures.json @ ${vendorProv.sha.slice(0, 8)} — ${cascataFixtures.length} casos (${comSinergia} com sinergia de alvo único) · ${sinergiasAlvoUnico.length} sinergias de alvo único · ${BASES.length} bases`);
