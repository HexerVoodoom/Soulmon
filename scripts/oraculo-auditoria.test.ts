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
import { ORACLE_QUESTIONS, mulberry32, ELEMENT_ORDER, ALIGNMENT_ORDER, generateOracleAsync } from '../src/utils/oracle';
import type { OracleInput } from '../src/utils/oracle';
import type { Answers, Answer } from '../src/utils/soulProfile/personality/types';
import { items as PERSONALITY_ITEMS } from '../src/utils/soulProfile/personality/questions';
import { nomeSintetico, nascimentoSintetico } from '../src/utils/soulProfile/perfisSinteticos';
import { generateOracleComplete, type OracleComplete } from '../src/utils/soulProfile/pipeline';
import { computeClassTitle } from '../src/utils/soulProfile/ficha/classTitle';
import { BESTIARY_POOL, especieDe } from '../src/utils/soulProfile/bestiary/select';
import { PREMADE_CHARACTERS } from '../src/utils/monetization';
import { computeCarePattern, resolveBranch } from '../src/utils/carePattern';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs/reviews/oraculo-auditoria');
// `ORACULO_TAG=b2 npm run oraculo:auditoria` grava `<data>-b2.{json,md}` —
// preserva a medição ANTES de cada conserto (Fase 1) em vez de sobrescrevê-la.
const TODAY = new Date().toISOString().slice(0, 10) + (process.env.ORACULO_TAG ? `-${process.env.ORACULO_TAG}` : '');

// Seeds de VALIDAÇÃO — nenhuma pode coincidir com a de calibração 20260928.
const SEEDS = [19870412, 31415926] as const;
const N_PER_SEED = 400; // N total ≥ 800 (2 seeds × 400)

const inc = (o: Record<string, number>, k: string) => { o[k] = (o[k] ?? 0) + 1; };
const razao = (o: Record<string, number>, n: number) => {
  const vals = Object.values(o);
  if (vals.length === 0) return { razao: Infinity, piso: 0, topo: 0, k: 0, ruido: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { razao: min === 0 ? Infinity : +(max / min).toFixed(2), piso: +(min / n * 100).toFixed(1), topo: +(max / n * 100).toFixed(1), k: vals.length, ruido: pisoRuido(n, vals.length) };
};
/** Piso de RUÍDO da razão topo/piso: mediana da razão max/min de uma
 *  multinomial PERFEITAMENTE uniforme com o mesmo n e k (Fase 1, Etapa A).
 *  Com k=9 e n=165, uma roleta honesta já dá ~2× — uma razão medida só é
 *  buraco estrutural se passa BEM do próprio piso. */
function pisoRuido(n: number, k: number): number {
  if (n <= 0 || k <= 1) return 1;
  const rng = mulberry32(424242 + n * 31 + k);
  const rs: number[] = [];
  for (let t = 0; t < 400; t++) {
    const c = new Array(k).fill(0);
    for (let i = 0; i < n; i++) c[Math.floor(rng() * k)]++;
    const mn = Math.min(...c);
    rs.push(mn === 0 ? 99 : Math.max(...c) / mn);
  }
  rs.sort((a, b) => a - b);
  return +rs[Math.floor(rs.length / 2)].toFixed(2);
}
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

const N_FATIA_POR_SEED = 1200; // N=2400 por fatia
/** Fatias ESTRUTURAIS (Fase 1, Etapa A): cada fatia com N=2400 próprio, só
 *  pelo `generateOracle` (os 4 eixos não dependem do resto do pipeline). As
 *  fatias da população mista têm n de 165-410 e o piso de ruído delas passa
 *  de 1,5× sozinho — medir a meta lá é medir a roleta. */
async function fatiaEstrutural(grupo: Grupo): Promise<Record<'elemento' | 'papel' | 'reino', { razao: number; piso: number; topo: number; k: number; ruido: number; fatia: Record<string, number> }>> {
  const M = { elemento: {} as Record<string, number>, papel: {} as Record<string, number>, reino: {} as Record<string, number> };
  let n = 0;
  for (const seed of SEEDS) {
    const rng = mulberry32(seed + 17);
    for (let i = 0; i < N_FATIA_POR_SEED; i++) {
      const c = CITIES[Math.floor(rng() * CITIES.length)];
      const nome = nomeSintetico(rng);
      const nasc = nascimentoSintetico(rng);
      const quiz: Record<string, string> = {};
      for (const q of ORACLE_QUESTIONS) quiz[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
      const answers: Answers = grupo === 'curto' ? {} : respostasSinteticas(rng);
      const soulProfile = buildSoulProfile({
        fullName: nome, ...nasc, timeUnknown: grupo === 'timeUnknown', placeLabel: c.name,
        latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
      }, answers);
      const r = await generateOracleAsync({ fullName: nome, birthDate: nasc.birthDate, birthTime: nasc.birthTime, birthPlace: c.name, answers: quiz, soulProfile } as OracleInput, 1);
      inc(M.elemento, r.dominantElement); inc(M.papel, r.dominantRole); inc(M.reino, r.dominantRealm);
      n++;
    }
  }
  return { elemento: { ...razao(M.elemento, n), fatia: M.elemento }, papel: { ...razao(M.papel, n), fatia: M.papel }, reino: { ...razao(M.reino, n), fatia: M.reino } };
}

/**
 * C9 — divergência comportamental (plano §6 KR2; Fase 1 B5). Pares com a
 * MESMA leitura (logo, o mesmo Oráculo inteiro: `OracleInput` não tem campo
 * de comportamento) e trajetórias opostas de RITMO — Constante (1 conclusão
 * por dia, 14 dias) × Explosivo (tudo em 2 dias) —, com as MESMAS categorias
 * de tarefa (mesmos atributos). Cada estágio (champion, ultimate, mega) decide
 * o galho por `resolveBranch`, como a cerimônia. Mede quantos pares terminam
 * com galho final / caminho diferentes. Referência: o mesmo par com
 * categorias INDEPENDENTES (atributos diferentes).
 */
function c9(seed: number, pares: number) {
  type B = 'virus' | 'data' | 'vaccine';
  const rng = mulberry32(seed);
  const now = new Date('2026-09-28T12:00:00Z');
  const dia = (d: number) => new Date(now.getTime() - (d + 0.5) * 86400000).toISOString();
  const T = 14;
  const constante = computeCarePattern(Array.from({ length: T }, (_, j) => ({ completedAt: dia(j) })), now);
  const explosivo = computeCarePattern(Array.from({ length: T }, (_, j) => ({ completedAt: dia(j % 2) })), now);
  const cats = (): Record<B, number> => {
    const p = { virus: 0, data: 0, vaccine: 0 } as Record<B, number>;
    for (let j = 0; j < T; j++) p[(['virus', 'data', 'vaccine'] as B[])[Math.floor(rng() * 3)]]++;
    return p;
  };
  let finalMesmasCat = 0; let caminhoMesmasCat = 0; let empates = 0; let finalIndep = 0; let decisoes = 0;
  for (let i = 0; i < pares; i++) {
    let a: B = 'data'; let b: B = 'data'; const pathA: B[] = []; const pathB: B[] = [];
    let ai: B = 'data'; let bi: B = 'data';
    for (let est = 0; est < 3; est++) {
      const pts = cats();
      const vals = Object.values(pts); const mx = Math.max(...vals);
      if (vals.filter(v => v === mx).length > 1) empates++;
      decisoes++;
      a = resolveBranch(pts, constante, a); b = resolveBranch(pts, explosivo, b);
      pathA.push(a); pathB.push(b);
      ai = resolveBranch(cats(), constante, ai); bi = resolveBranch(cats(), explosivo, bi);
    }
    if (a !== b) finalMesmasCat++;
    if (pathA.join() !== pathB.join()) caminhoMesmasCat++;
    if (ai !== bi) finalIndep++;
  }
  return {
    pares,
    leituraConstante: constante.pattern.id, leituraExplosivo: explosivo.pattern.id,
    oraculoDiverge: 0,
    formaFinalDiverge: +(finalMesmasCat / pares).toFixed(3),
    caminhoDiverge: +(caminhoMesmasCat / pares).toFixed(3),
    decisoesEmpatadas: +(empates / decisoes).toFixed(3),
    referenciaAtributosIndependentes: +(finalIndep / pares).toFixed(3),
  };
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

  // ---- C4 ESTRUTURAL (Fase 1 B3): 72 famílias visuais em N=800 dão ~11 por
  // caixa e piso de ruído ~4,75× — a razão topo/piso ali mede a roleta. Aqui
  // N=2400 extra (população mista, seeds de validação +29), só grupo/família.
  const c4e = { grupo: {} as Record<string, number>, familia: {} as Record<string, number>, n: 0 };
  for (const seed of SEEDS) {
    const ps = pessoas(seed + 29, 1200);
    for (let i = 0; i < ps.length; i++) {
      const r = await generateOracleComplete(ps[i].input, 9000 + seed + i);
      inc(c4e.grupo, String(r.bestiaryPick.creature.familia));
      inc(c4e.familia, r.result.creature.family.primary.family.pt);
      c4e.n++;
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
      estrutural: { n: c4e.n, grupoBestiario: { ...razao(c4e.grupo, c4e.n), fatia: c4e.grupo }, familiaVisual: { ...razao(c4e.familia, c4e.n), fatia: c4e.familia } },
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
    c9_divergenciaComportamental: c9(SEEDS[0], 4000),
    fatiasEstruturais: {
      timeUnknown: await fatiaEstrutural('timeUnknown'),
      curto: await fatiaEstrutural('curto'),
      completo: await fatiaEstrutural('completo'),
    },
    naoCoberto: [
      'C5 (fidelidade direcional por eixo) — desenhado em rodada2-regua.md §5, não implementado nesta rodada.',
      'reroll — desenho pendente (rodada2-regua.md §8).',
      'rebirth (orçamento ×1.5) — fora do escopo da régua C1-C8 por decisão registrada em rodada2-regua.md §8.',
      'nome não-latino/vazio/gigante — robustez de entrada, não distribuição; fica para o sweeper de robustez.',
    ],
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, `${TODAY}.json`), JSON.stringify(relatorio, null, 2));

  const pct = (x: number) => `${x}%`;
  const linhaEixo = (nome: string, r: { razao: number; piso: number; topo: number; k: number; ruido: number }) =>
    `| ${nome} | ${r.k} | ${pct(r.piso)}–${pct(r.topo)} | ${r.razao === Infinity ? '∞ (zero em algum)' : r.razao + '×'} | ${r.ruido}× |`;
  const rz = (r: { razao: number; ruido: number }) => `${r.razao} (ruído ${r.ruido})`;

  const md = `# Auditoria do Oráculo — ${TODAY}

N = ${n} (${SEEDS.map(s => `seed ${s} × ${N_PER_SEED}`).join(' + ')}). Seed de calibração
(20260928) NÃO usada aqui.

## C2 — 4 eixos, sem vencedor estrutural

| Eixo | k distintos | faixa | razão topo/piso | piso de ruído (uniforme, mesmo n) |
|---|---|---|---|---|
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

| Eixo | k | faixa | razão | ruído |
|---|---|---|---|---|
${linhaEixo('Escola', relatorio.c3_escolaDominante)}

## C4 — grupos do bestiário e famílias visuais

| Eixo | k | faixa | razão | ruído |
|---|---|---|---|---|
${linhaEixo('Grupo do bestiário', relatorio.c4_grupos.grupoBestiario)}
${linhaEixo('Família visual', relatorio.c4_grupos.familiaVisual)}
${linhaEixo('Grupo — estrutural N=' + relatorio.c4_grupos.estrutural.n, relatorio.c4_grupos.estrutural.grupoBestiario)}
${linhaEixo('Família visual — estrutural N=' + relatorio.c4_grupos.estrutural.n, relatorio.c4_grupos.estrutural.familiaVisual)}

## C7 — linhagem

- Pares consecutivos que continuam na mesma família: ${(relatorio.c7_linhagem.taxaParesContinuos * 100).toFixed(1)}% (alvo 70–90%)
- Perfis que atravessam família ao menos 1×: ${(relatorio.c7_linhagem.taxaAtravessaFamilia * 100).toFixed(1)}% (alvo 30–65%)

## C8 — unicidade e colisão de nome

- Tuplas visíveis únicas: ${(relatorio.c8_unicidade.tuplasUnicas * 100).toFixed(1)}% (alvo ≥85–97%)
- Colisão de NOME DA CRIATURA (excluindo ${relatorio.c8_unicidade.premadeExcluidos.length} premade): ${(relatorio.c8_unicidade.colisaoNomeCriatura * 100).toFixed(2)}% sobre ${relatorio.c8_unicidade.totalNomesConsiderados} nomes (alvo ≤2%)

## Edge cases da população sintética

| Fatia | n | elemento (razão) | papel (razão) | reino (razão) | tuplas únicas |
|---|---|---|---|---|---|
| timeUnknown (~20%) | ${relatorio.edgeCases.timeUnknown.n} | ${rz(relatorio.edgeCases.timeUnknown.elemento)} | ${rz(relatorio.edgeCases.timeUnknown.papel)} | ${rz(relatorio.edgeCases.timeUnknown.reino)} | ${(relatorio.edgeCases.timeUnknown.tuplasUnicas * 100).toFixed(1)}% |
| só 6 perguntas, sem teste longo (~30%) | ${relatorio.edgeCases.soCincoPerguntasSemTesteLongo.n} | ${rz(relatorio.edgeCases.soCincoPerguntasSemTesteLongo.elemento)} | ${rz(relatorio.edgeCases.soCincoPerguntasSemTesteLongo.papel)} | ${rz(relatorio.edgeCases.soCincoPerguntasSemTesteLongo.reino)} | ${(relatorio.edgeCases.soCincoPerguntasSemTesteLongo.tuplasUnicas * 100).toFixed(1)}% |
| completo (mapa + teste longo) | ${relatorio.edgeCases.completo.n} | ${rz(relatorio.edgeCases.completo.elemento)} | ${rz(relatorio.edgeCases.completo.papel)} | ${rz(relatorio.edgeCases.completo.reino)} | ${(relatorio.edgeCases.completo.tuplasUnicas * 100).toFixed(1)}% |

## C9 — divergência comportamental (mesma leitura, ritmo oposto)

- Pares: ${relatorio.c9_divergenciaComportamental.pares} (Constante lido como ${relatorio.c9_divergenciaComportamental.leituraConstante}, Explosivo como ${relatorio.c9_divergenciaComportamental.leituraExplosivo}), mesmas categorias de tarefa
- Oráculo (família, linhagem do bestiário, nome, companheiro, skills): ${relatorio.c9_divergenciaComportamental.oraculoDiverge * 100}% — nenhum campo de comportamento entra em OracleInput
- Forma final (galho da mega) diferente: ${(relatorio.c9_divergenciaComportamental.formaFinalDiverge * 100).toFixed(1)}%
- Caminho de galhos (champion→ultimate→mega) diferente: ${(relatorio.c9_divergenciaComportamental.caminhoDiverge * 100).toFixed(1)}%
- Decisões com empate de atributo (único lugar onde o ritmo pesa): ${(relatorio.c9_divergenciaComportamental.decisoesEmpatadas * 100).toFixed(1)}%
- Referência — mesmo ritmo oposto com atributos INDEPENDENTES: ${(relatorio.c9_divergenciaComportamental.referenciaAtributosIndependentes * 100).toFixed(1)}% (quem diverge é a categoria das tarefas, não o ritmo)

## Fatias estruturais (N=2400 POR fatia, só generateOracle)

| Fatia | elemento | papel | reino |
|---|---|---|---|
| timeUnknown + teste longo | ${rz(relatorio.fatiasEstruturais.timeUnknown.elemento)} | ${rz(relatorio.fatiasEstruturais.timeUnknown.papel)} | ${rz(relatorio.fatiasEstruturais.timeUnknown.reino)} |
| só 6 perguntas | ${rz(relatorio.fatiasEstruturais.curto.elemento)} | ${rz(relatorio.fatiasEstruturais.curto.papel)} | ${rz(relatorio.fatiasEstruturais.curto.reino)} |
| completo | ${rz(relatorio.fatiasEstruturais.completo.elemento)} | ${rz(relatorio.fatiasEstruturais.completo.papel)} | ${rz(relatorio.fatiasEstruturais.completo.reino)} |

## Não coberto por esta auditoria (registrado, não escondido)

${relatorio.naoCoberto.map(x => `- ${x}`).join('\n')}

JSON completo: docs/reviews/oraculo-auditoria/${TODAY}.json.
`;
  writeFileSync(path.join(OUT_DIR, `${TODAY}.md`), md);

  // eslint-disable-next-line no-console
  console.log('Auditoria gravada em', path.join(OUT_DIR, `${TODAY}.md`));
}, 20 * 60 * 1000);
