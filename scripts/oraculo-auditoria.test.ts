// Auditoria permanente do Oráculo — Fase 0 (`docs/PLANO-ORACULO.md` §8,
// `docs/oraculo-plano/rodada2-regua.md`).
//
// Promovido do protótipo `_diag.test.ts` (scratchpad, temporário, não
// commitado). Fica FORA do `vitest.config.ts` (`include` não cobre
// `scripts/**`) — nunca trava `npx vitest run` nem PR. Roda manual/CI
// noturno via `npm run oraculo:auditoria` (= `vitest run
// scripts/oraculo-auditoria.test.ts`), continua sendo um arquivo de teste
// vitest (mesma resolução de alias/TS que o resto da suíte) só que não
// listado no include default.
//
// Mede C1 (cobertura: 17 elementos, 79 classes, 65 talentos, 11 profissões,
// 32 companheiros, 194 criaturas, 72 famílias visuais), C2 nos 4 eixos
// (elemento/caminho/PAPEL/REINO — os dois últimos não tinham número antes
// desta auditoria), C3 escola dominante, C4 grupos/famílias, C7 linhagem,
// C8 unicidade de tupla + colisão de NOME DA CRIATURA (excluindo
// `PREMADE_CHARACTERS`, que não passam pelo mesmo mecanismo).
//
// Seeds de AUDITORIA (`19870412` e `31415926`) são DISTINTAS da seed de
// CALIBRAÇÃO (`20260928`, usada para ajustar `RITUAL_ELEMENT_SCALE` etc. em
// `src/utils/oracle.ts`/`axes.ts`) — o protótipo `_diag.test.ts` errava isso
// (rodava a de calibração como se fosse validação). Nunca usar `20260928`
// aqui.
//
// Vitest engolia `console.log` no protótipo — a saída real vai para arquivo
// (`docs/reviews/oraculo-auditoria/<data>.json` + `.md`), git-tracked, como
// evidência de decisão (regra do sweeper: sem saída real colada, a fase não
// fecha).

import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildSoulProfile } from '../src/utils/soulProfile/profile';
import { CITIES } from '../src/utils/soulProfile/cities';
import { ORACLE_QUESTIONS, mulberry32, ELEMENT_ORDER, ALIGNMENT_ORDER } from '../src/utils/oracle';
import type { OracleInput } from '../src/utils/oracle';
import type { Answers, Answer } from '../src/utils/soulProfile/personality/types';
import { items as PERSONALITY_ITEMS } from '../src/utils/soulProfile/personality/questions';
import { nomeSintetico, nascimentoSintetico } from '../src/utils/soulProfile/perfisSinteticos';
import { generateOracleComplete, type OracleComplete } from '../src/utils/soulProfile/pipeline';
import { computeClassTitle } from '../src/utils/soulProfile/ficha/classTitle';
import { BESTIARY_POOL, especieDe } from '../src/utils/soulProfile/bestiary/select';
import { PREMADE_CHARACTERS } from '../src/utils/monetization';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs/reviews/oraculo-auditoria');
const TODAY = new Date().toISOString().slice(0, 10);

// Seeds de VALIDAÇÃO — nenhuma pode coincidir com a de calibração 20260928.
const SEEDS = [19870412, 31415926] as const;
const N_PER_SEED = 400; // N total ≥ 800 (2 seeds × 400)

const inc = (o: Record<string, number>, k: string) => { o[k] = (o[k] ?? 0) + 1; };
const razao = (o: Record<string, number>, n: number) => {
  const vals = Object.values(o);
  if (vals.length === 0) return { razao: Infinity, piso: 0, topo: 0, k: 0 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { razao: min === 0 ? Infinity : +(max / min).toFixed(2), piso: +(min / n * 100).toFixed(1), topo: +(max / n * 100).toFixed(1), k: vals.length };
};
const top = (o: Partial<Record<string, number>>) => Object.entries(o).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? '-';

/** Respostas sintéticas para os 20 itens do teste longo — determinísticas
 *  pelo RNG semeado de quem chama. Usadas na fatia "teste completo" da
 *  população; a fatia "só 6 perguntas" passa `{}` (sem teste longo). */
function respostasSinteticas(rng: () => number): Answers {
  const out: Answers = {};
  for (const item of PERSONALITY_ITEMS) {
    let a: Answer;
    if (item.kind === 'likert' || item.kind === 'frequency') a = { kind: 'likert', value: (1 + Math.floor(rng() * 5)) as 1 | 2 | 3 | 4 | 5 };
    else if (item.kind === 'forced-choice') a = { kind: 'forced-choice', choice: rng() < 0.5 ? 'a' : 'b' };
    else a = { kind: 'scenario', optionId: item.options[Math.floor(rng() * item.options.length)].id };
    out[item.id] = a;
  }
  return out;
}

type Grupo = 'completo' | 'timeUnknown' | 'curto';

interface Pessoa { input: OracleInput; grupo: Grupo }

function pessoas(seed: number, n: number): Pessoa[] {
  const rng = mulberry32(seed);
  const out: Pessoa[] = [];
  for (let i = 0; i < n; i++) {
    const r = rng();
    // ~20% sem hora de nascimento, ~30% só as 6 perguntas (sem teste longo),
    // resto = caminho completo (mapa astral com hora + teste longo).
    const grupo: Grupo = r < 0.2 ? 'timeUnknown' : r < 0.5 ? 'curto' : 'completo';
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    const nome = nomeSintetico(rng);
    const nasc = nascimentoSintetico(rng);
    const quiz: Record<string, string> = {};
    for (const q of ORACLE_QUESTIONS) quiz[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
    const timeUnknown = grupo === 'timeUnknown';
    const answers: Answers = grupo === 'curto' ? {} : respostasSinteticas(rng);
    const soulProfile = buildSoulProfile({
      fullName: nome, ...nasc, timeUnknown, placeLabel: c.name,
      latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
    }, answers);
    const input = {
      fullName: nome, birthDate: nasc.birthDate, birthTime: nasc.birthTime,
      birthPlace: c.name, answers: quiz, soulProfile,
    } as OracleInput;
    out.push({ input, grupo });
  }
  return out;
}

it('auditoria do oráculo — C1/C2/C3/C4/C7/C8, N>=800, seeds de validação', async () => {
  const { ARQUETIPOS } = await import('class-system') as any;
  const premadeNomes = new Set(PREMADE_CHARACTERS.map((p: any) => p.name ?? p.nome));

  const M = {
    elemento: {} as Record<string, number>,
    caminho: {} as Record<string, number>,
    papel: {} as Record<string, number>,
    reino: {} as Record<string, number>,
    escola: {} as Record<string, number>,
    grupoBestiario: {} as Record<string, number>,
    familiaVisual: {} as Record<string, number>,
    especie: {} as Record<string, number>,
    classe: {} as Record<string, number>,
    companheiro: {} as Record<string, number>,
    pickBestiario: {} as Record<string, number>,
    nomeCriatura: {} as Record<string, number>,
    tupla: {} as Record<string, number>,
  };
  const porGrupo: Record<Grupo, { n: number; elemento: Record<string, number>; papel: Record<string, number>; reino: Record<string, number>; tupla: Record<string, number> }> = {
    completo: { n: 0, elemento: {}, papel: {}, reino: {}, tupla: {} },
    timeUnknown: { n: 0, elemento: {}, papel: {}, reino: {}, tupla: {} },
    curto: { n: 0, elemento: {}, papel: {}, reino: {}, tupla: {} },
  };

  let n = 0;
  let pares = 0; let continuas = 0; let atravessaram = 0;
  const seedsUsadas: number[] = [];

  for (const seed of SEEDS) {
    seedsUsadas.push(seed);
    const ps = pessoas(seed, N_PER_SEED);
    for (let i = 0; i < ps.length; i++) {
      const { input, grupo } = ps[i];
      const r: OracleComplete = await generateOracleComplete(input, 7000 + seed + i);
      const res = r.result;

      inc(M.elemento, res.dominantElement);
      inc(M.caminho, res.dominantAlignment);
      inc(M.papel, res.dominantRole);
      inc(M.reino, res.dominantRealm);
      inc(M.escola, top(r.fichaByStage.ultra.escolas));
      inc(M.grupoBestiario, String(r.bestiaryPick.creature.familia));
      inc(M.familiaVisual, res.creature.family.primary.family.pt);
      inc(M.especie, especieDe(r.bestiaryPick.creature.nome));
      inc(M.companheiro, r.companion?.criatura.nome ?? 'nenhum');
      inc(M.pickBestiario, r.bestiaryPick.creature.nome);
      inc(M.nomeCriatura, res.creature.baseName);
      for (const stage of ['mega', 'ultra'] as const) {
        inc(M.classe, (await computeClassTitle(r.fichaByStage[stage], res.dominantElement)).nome.pt);
      }
      const tuplaKey = [res.dominantElement, res.creature.family.primary.family.pt, especieDe(r.bestiaryPick.creature.nome)].join('|');
      inc(M.tupla, tuplaKey);

      const g = porGrupo[grupo];
      g.n++;
      inc(g.elemento, res.dominantElement);
      inc(g.papel, res.dominantRole);
      inc(g.reino, res.dominantRealm);
      inc(g.tupla, tuplaKey);

      const estagios = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;
      let trocou = false;
      for (let s = 1; s < estagios.length; s++) {
        pares++;
        const a = r.bestiaryLineage[estagios[s - 1]].creature.familia;
        const b = r.bestiaryLineage[estagios[s]].creature.familia;
        if (a === b) continuas++; else trocou = true;
      }
      if (trocou) atravessaram++;

      n++;
    }
  }

  // ---- C8: colisão de NOME DA CRIATURA (não do humano), excluindo premade.
  const nomesNaoPremade = Object.entries(M.nomeCriatura).filter(([nome]) => !premadeNomes.has(nome));
  const totalNaoPremade = nomesNaoPremade.reduce((a, [, v]) => a + v, 0);
  const colisoes = nomesNaoPremade.reduce((a, [, v]) => a + Math.max(0, v - 1), 0);
  const taxaColisaoNome = totalNaoPremade > 0 ? colisoes / totalNaoPremade : 0;

  // ---- C1: cobertura contra os totais declarados no plano.
  const todasClasses: string[] = Object.values(ARQUETIPOS).map((a: any) => a.nome as string);
  const classesNuncaSaidas = todasClasses.filter(t => !M.classe[t]);
  const nuncaEscolhidasBestiario = BESTIARY_POOL.filter((b: any) => !M.pickBestiario[b.nome]).map((b: any) => b.nome);

  const relatorio = {
    geradoEm: new Date().toISOString(),
    n,
    seedsAuditoria: seedsUsadas,
    seedCalibracaoExcluida: 20260928,
    porEixo: {
      elemento: { ...razao(M.elemento, n), fatia: M.elemento },
      caminho: { ...razao(M.caminho, n), fatia: M.caminho },
      papel: { ...razao(M.papel, n), fatia: M.papel },
      reino: { ...razao(M.reino, n), fatia: M.reino },
    },
    c1_cobertura: {
      elementosVistos: Object.keys(M.elemento).length, elementosEsperados: 17,
      classesVistas: Object.keys(M.classe).length, classesEsperadas: 79, classesNuncaSaidas,
      companheirosVistos: Object.keys(M.companheiro).length, companheirosEsperados: 32,
      especiesVistas: Object.keys(M.especie).length, criaturasEsperadas: 194,
      familiasVisuaisVistas: Object.keys(M.familiaVisual).length, familiasVisuaisEsperadas: 72,
      nuncaEscolhidasBestiario,
    },
    c3_escolaDominante: { ...razao(M.escola, n), fatia: M.escola },
    c4_grupos: {
      grupoBestiario: { ...razao(M.grupoBestiario, n), fatia: M.grupoBestiario },
      familiaVisual: { ...razao(M.familiaVisual, n), fatia: M.familiaVisual },
    },
    c7_linhagem: {
      taxaAtravessaFamilia: +(atravessaram / n).toFixed(3),
      taxaParesContinuos: +(continuas / pares).toFixed(3),
    },
    c8_unicidade: {
      tuplasUnicas: +(Object.keys(M.tupla).length / n).toFixed(3),
      colisaoNomeCriatura: +taxaColisaoNome.toFixed(4),
      totalNomesConsiderados: totalNaoPremade,
      premadeExcluidos: [...premadeNomes],
    },
    edgeCases: {
      timeUnknown: { n: porGrupo.timeUnknown.n, elemento: razao(porGrupo.timeUnknown.elemento, porGrupo.timeUnknown.n), papel: razao(porGrupo.timeUnknown.papel, porGrupo.timeUnknown.n), reino: razao(porGrupo.timeUnknown.reino, porGrupo.timeUnknown.n), tuplasUnicas: +(Object.keys(porGrupo.timeUnknown.tupla).length / (porGrupo.timeUnknown.n || 1)).toFixed(3) },
      soCincoPerguntasSemTesteLongo: { n: porGrupo.curto.n, elemento: razao(porGrupo.curto.elemento, porGrupo.curto.n), papel: razao(porGrupo.curto.papel, porGrupo.curto.n), reino: razao(porGrupo.curto.reino, porGrupo.curto.n), tuplasUnicas: +(Object.keys(porGrupo.curto.tupla).length / (porGrupo.curto.n || 1)).toFixed(3) },
      completo: { n: porGrupo.completo.n, elemento: razao(porGrupo.completo.elemento, porGrupo.completo.n), papel: razao(porGrupo.completo.papel, porGrupo.completo.n), reino: razao(porGrupo.completo.reino, porGrupo.completo.n), tuplasUnicas: +(Object.keys(porGrupo.completo.tupla).length / (porGrupo.completo.n || 1)).toFixed(3) },
    },
    naoCoberto: [
      'C5 (fidelidade direcional por eixo) — desenhado em rodada2-regua.md §5, não implementado nesta rodada.',
      'C9 (divergência comportamental / trajetória) — Fase 1, plano §6.',
      'reroll — desenho pendente (rodada2-regua.md §8).',
      'rebirth (orçamento ×1.5) — fora do escopo da régua C1-C8 por decisão registrada em rodada2-regua.md §8.',
      'nome não-latino/vazio/gigante — robustez de entrada, não distribuição; fica para o sweeper de robustez.',
    ],
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, `${TODAY}.json`), JSON.stringify(relatorio, null, 2));

  const pct = (x: number) => `${x}%`;
  const linhaEixo = (nome: string, r: { razao: number; piso: number; topo: number; k: number }) =>
    `| ${nome} | ${r.k} | ${pct(r.piso)}–${pct(r.topo)} | ${r.razao === Infinity ? '∞ (zero em algum)' : r.razao + '×'} |`;

  const md = `# Auditoria do Oráculo — ${TODAY}

N = ${n} (${SEEDS.map(s => `seed ${s} × ${N_PER_SEED}`).join(' + ')}). Seed de calibração
(20260928) NÃO usada aqui.

## C2 — 4 eixos, sem vencedor estrutural

| Eixo | k distintos | faixa | razão topo/piso |
|---|---|---|---|
${linhaEixo('Elemento', relatorio.porEixo.elemento)}
${linhaEixo('Caminho (alinhamento)', relatorio.porEixo.caminho)}
${linhaEixo('Papel', relatorio.porEixo.papel)}
${linhaEixo('Reino', relatorio.porEixo.reino)}

Alvo do plano: ≤1,5× em todos os quatro. Papel e reino são medidos aqui pela
primeira vez nesta régua (achado do crítico em rodada2-critica.md).

## C1 — cobertura

- Elementos: ${relatorio.c1_cobertura.elementosVistos}/${relatorio.c1_cobertura.elementosEsperados}
- Classes: ${relatorio.c1_cobertura.classesVistas}/${relatorio.c1_cobertura.classesEsperadas} — nunca saíram: ${classesNuncaSaidas.length ? classesNuncaSaidas.join(', ') : 'nenhuma'}
- Companheiros: ${relatorio.c1_cobertura.companheirosVistos}/${relatorio.c1_cobertura.companheirosEsperados}
- Espécies do bestiário citadas como inspiração: ${relatorio.c1_cobertura.especiesVistas}/${relatorio.c1_cobertura.criaturasEsperadas}
- Famílias visuais: ${relatorio.c1_cobertura.familiasVisuaisVistas}/${relatorio.c1_cobertura.familiasVisuaisEsperadas}

## C3 — escola dominante

${linhaEixo('Escola', relatorio.c3_escolaDominante)}

## C4 — grupos do bestiário e famílias visuais

${linhaEixo('Grupo do bestiário', relatorio.c4_grupos.grupoBestiario)}
${linhaEixo('Família visual', relatorio.c4_grupos.familiaVisual)}

## C7 — linhagem

- Pares consecutivos que continuam na mesma família: ${(relatorio.c7_linhagem.taxaParesContinuos * 100).toFixed(1)}% (alvo 70–90%)
- Perfis que atravessam família ao menos 1×: ${(relatorio.c7_linhagem.taxaAtravessaFamilia * 100).toFixed(1)}% (alvo 30–65%)

## C8 — unicidade e colisão de nome

- Tuplas visíveis únicas: ${(relatorio.c8_unicidade.tuplasUnicas * 100).toFixed(1)}% (alvo ≥85–97%)
- Colisão de NOME DA CRIATURA (excluindo ${relatorio.c8_unicidade.premadeExcluidos.length} premade): ${(relatorio.c8_unicidade.colisaoNomeCriatura * 100).toFixed(2)}% sobre ${relatorio.c8_unicidade.totalNomesConsiderados} nomes (alvo ≤2%)

## Edge cases da população sintética

| Fatia | n | elemento (razão) | papel (razão) | reino (razão) | tuplas únicas |
|---|---|---|---|---|---|
| timeUnknown (~20%) | ${relatorio.edgeCases.timeUnknown.n} | ${relatorio.edgeCases.timeUnknown.elemento.razao} | ${relatorio.edgeCases.timeUnknown.papel.razao} | ${relatorio.edgeCases.timeUnknown.reino.razao} | ${(relatorio.edgeCases.timeUnknown.tuplasUnicas * 100).toFixed(1)}% |
| só 6 perguntas, sem teste longo (~30%) | ${relatorio.edgeCases.soCincoPerguntasSemTesteLongo.n} | ${relatorio.edgeCases.soCincoPerguntasSemTesteLongo.elemento.razao} | ${relatorio.edgeCases.soCincoPerguntasSemTesteLongo.papel.razao} | ${relatorio.edgeCases.soCincoPerguntasSemTesteLongo.reino.razao} | ${(relatorio.edgeCases.soCincoPerguntasSemTesteLongo.tuplasUnicas * 100).toFixed(1)}% |
| completo (mapa + teste longo) | ${relatorio.edgeCases.completo.n} | ${relatorio.edgeCases.completo.elemento.razao} | ${relatorio.edgeCases.completo.papel.razao} | ${relatorio.edgeCases.completo.reino.razao} | ${(relatorio.edgeCases.completo.tuplasUnicas * 100).toFixed(1)}% |

## Não coberto por esta auditoria (registrado, não escondido)

${relatorio.naoCoberto.map(x => `- ${x}`).join('\n')}

JSON completo: docs/reviews/oraculo-auditoria/${TODAY}.json.
`;
  writeFileSync(path.join(OUT_DIR, `${TODAY}.md`), md);

  // eslint-disable-next-line no-console
  console.log('Auditoria gravada em', path.join(OUT_DIR, `${TODAY}.md`));
}, 20 * 60 * 1000);
