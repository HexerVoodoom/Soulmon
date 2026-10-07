// ---------------------------------------------------------------------------
// PR15a — a FICHA reage ao COMPORTAMENTO do jogador na evolução (núcleo puro).
//
// O que o jogador fez no estágio que TERMINA (`attributesSinceLastEvolution`, a janela) vira um plano de
// elementos BASE que pesa `PESO_COMPORTAMENTO` do orçamento de elementos do estágio SEGUINTE; o resto segue a
// leitura do Oráculo. O comportamento só mexe na DIREÇÃO (proporções), nunca no ORÇAMENTO (regra #16: o
// esforço não compra ficha mais forte, só ficha diferente) — por isso o plano é normalizado (invariante a
// volume) e abaixo de `MIN_AMOSTRA` pontos não existe (plano nulo = a ficha de hoje, bit a bit).
//
// Este arquivo é o DONO ÚNICO de: o peso (35%, decisão do dono §2.31), a amostra mínima, a tabela
// `GALHO_PARA_ELEMENTO` e `evoluirFicha`. Não decide a família (é `estabilidadeFamilia.ts`), não conhece
// save, relógio nem rede: a integração é o PR15b e o espelho no servidor o PR15c.
// ---------------------------------------------------------------------------

import type { OracleAxes, ClassElementId } from '../types';
import { CLASS_ELEMENT_ORDER } from '../types';
import type { SpecialFamily } from '../../combate/specials';
import { buildFicha, CLASS_DATA, type ElementPlan, type RebirthBoost } from './buildSheet';
import { elementosDoStage, buildStageSkills, perfilDaFicha, escolaDominante, type StageSkills } from './skills';
import { proximaFamilia, GALHOS, type Galho, type PerfilEstagio } from './estabilidadeFamilia';
import type { Ficha, FichaStage } from './types';

/** Fatia do orçamento de ELEMENTOS que o comportamento redistribui (decisão do dono, 07/10/2026: 35%, não 25%). */
export const PESO_COMPORTAMENTO = 0.35;

/** Total de pontos da janela abaixo do qual a leitura é ruído: plano nulo, ficha igual à de hoje. */
export const MIN_AMOSTRA = 30;

/** A janela do save (`attributesSinceLastEvolution`). */
export interface JanelaComportamento { power: number; harmony: number; benevolence: number }

const CHAVE_DO_GALHO: Record<Galho, keyof JanelaComportamento> = { poder: 'power', harmonia: 'harmony', benevolencia: 'benevolence' };

/**
 * Do galho aos elementos BASE: 3 linhas × 17 bases, cada linha soma 1. Semântica do mundo (Ruptura = Poder,
 * Trama = Harmonia, Guarda = Benevolência — `NARRATIVA-E-UNIVERSO.md` §6.6), CALIBRADA com o
 * `classSystem.data.json`: cada galho herda as famílias de criatura em `FAMILIAS_DO_GALHO` e a linha segue as
 * afinidades delas (fogo domina Poder, arcano/ar a Harmonia, vida/terra a Benevolência); os cinco elementos
 * sem criatura no snapshot (eletricidade, tempo, som, gravidade, espaço) entram por semântica. Os 17
 * aparecem em alguma linha. A régua `comportamento.test.ts` recalcula a afinidade do snapshot e reprova a
 * tabela que se afastar dela. Só ids BASE: o par continua exclusivo da cascata (proteção WP4.22).
 */
export const GALHO_PARA_ELEMENTO: Readonly<Record<Galho, Readonly<Partial<Record<ClassElementId, number>>>>> = {
  poder: {
    fogo: 0.26, vileza: 0.10, eletricidade: 0.10, marcial: 0.10, morte: 0.08, vigor: 0.08, terra: 0.06,
    arcano: 0.05, sombra: 0.05, gravidade: 0.04, ar: 0.03, som: 0.03, vida: 0.02,
  },
  harmonia: {
    arcano: 0.20, ar: 0.15, agua: 0.12, luz: 0.10, tempo: 0.08, som: 0.08, espaco: 0.08, marcial: 0.05,
    eletricidade: 0.04, sombra: 0.04, vida: 0.02, terra: 0.02, morte: 0.02,
  },
  benevolencia: {
    vida: 0.28, terra: 0.22, vigor: 0.16, agua: 0.10, luz: 0.10, gravidade: 0.06, sombra: 0.03, arcano: 0.03, marcial: 0.02,
  },
};

/** As famílias de criatura do snapshot que cada galho herda (a base da calibração da tabela acima). */
export const FAMILIAS_DO_GALHO: Readonly<Record<Galho, readonly string[]>> = {
  poder: ['ignea', 'draconico', 'gigante', 'demonio', 'morto_vivo', 'aberracao'],
  harmonia: ['ave', 'aquatica', 'espirito', 'construto', 'humanoide'],
  benevolencia: ['besta', 'planta', 'geleia'],
};

function pontos(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/** As fatias (soma 1) por galho da janela, ou nulo se não há ponto nenhum. */
export function fatiasDaJanela(janela: Partial<JanelaComportamento> | null | undefined): Record<Galho, number> | null {
  const bruto = GALHOS.map(g => pontos(janela?.[CHAVE_DO_GALHO[g]]));
  const t = bruto.reduce((a, b) => a + b, 0);
  if (t <= 0) return null;
  return Object.fromEntries(GALHOS.map((g, i) => [g, bruto[i] / t])) as Record<Galho, number>;
}

export function totalDaJanela(janela: Partial<JanelaComportamento> | null | undefined): number {
  return GALHOS.reduce((a, g) => a + pontos(janela?.[CHAVE_DO_GALHO[g]]), 0);
}

/**
 * A janela → pesos por elemento BASE (soma 1), ou nulo se a amostra é pequena demais. Invariante a volume:
 * a janela ×10 dá o mesmo plano. Nunca contém id de par.
 */
export function planoDoComportamento(janela: Partial<JanelaComportamento> | null | undefined): ElementPlan | null {
  if (totalDaJanela(janela) < MIN_AMOSTRA) return null;
  const fatias = fatiasDaJanela(janela);
  if (!fatias) return null;
  const plano: Partial<Record<ClassElementId, number>> = {};
  for (const el of CLASS_ELEMENT_ORDER) {
    let p = 0;
    for (const g of GALHOS) p += fatias[g] * (GALHO_PARA_ELEMENTO[g][el] ?? 0);
    if (p > 0) plano[el] = p;
  }
  return plano;
}

/** A ficha já vivida do estágio anterior (o PR15b lê do registro gravado; aqui é só entrada). */
export interface EstagioAnterior {
  stage: FichaStage;
  ficha: Ficha;
  familia: SpecialFamily;
  perfil: PerfilEstagio;
}

export interface EntradaEvolucao {
  /** Nulo = o primeiro estágio (rookie): ficha de hoje, plano nulo, família da seed. */
  anterior: EstagioAnterior | null;
  /** `attributesSinceLastEvolution` do estágio que TERMINA. */
  janela: Partial<JanelaComportamento> | null | undefined;
  oracle: OracleAxes;
  nome: string;
  seedKey: string;
  /** O estágio que está NASCENDO. */
  stage: FichaStage;
  boost?: RebirthBoost;
  /** Substantivos já usados nos estágios anteriores (anti-repetição de nome; mutado). */
  usados?: Set<string>;
}

export interface SaidaEvolucao {
  ficha: Ficha;
  plano: ElementPlan | null;
  /** Perfil do estágio novo: elementos efetivos da ficha + os galhos da janela que o moldou (se a amostra bastou). */
  perfil: PerfilEstagio;
  familia: SpecialFamily;
  trocouFamilia: boolean;
  skills: StageSkills;
}

/**
 * Evolui a ficha: o comportamento do estágio que termina inclina os elementos do próximo, a família só muda
 * com mudança forte de perfil (PR14), e a skill sai recalculada. Pura: mesma entrada = mesma saída; nada de
 * relógio nem `Math.random`. Sem anterior (rookie) ou com janela < `MIN_AMOSTRA`, a ficha é a de `buildFicha`
 * sem plano, idêntica à de antes do PR15.
 */
export function evoluirFicha(e: EntradaEvolucao): SaidaEvolucao {
  const plano = e.anterior ? planoDoComportamento(e.janela) : null;
  const ficha = buildFicha(e.nome, e.oracle, e.stage, e.seedKey, e.boost, plano ?? undefined, PESO_COMPORTAMENTO);
  const galhos = plano ? (fatiasDaJanela(e.janela) ?? undefined) : undefined;
  const perfil = perfilDaFicha(ficha, galhos);
  const tendencia = e.oracle.dominantElement;
  const { elEspecial } = elementosDoStage(ficha);
  const { familia, trocou } = proximaFamilia(
    e.anterior?.familia ?? null, e.anterior?.perfil ?? null, perfil,
    { escola: escolaDominante(ficha), elementoId: elEspecial, tendencia, seedKey: e.seedKey, stage: e.stage },
  );
  const skills = buildStageSkills(ficha, e.stage, e.seedKey, e.usados, tendencia, familia);
  return { ficha, plano, perfil, familia, trocouFamilia: trocou, skills };
}

/** Só para a régua de calibração: as famílias do snapshot por galho, lidas do dado real. */
export function afinidadeDoSnapshotPorGalho(): Record<Galho, Record<string, number>> {
  const criaturas = Object.values(CLASS_DATA.criaturas) as Array<{ familia: string; afinidades: string[] }>;
  const saida = {} as Record<Galho, Record<string, number>>;
  for (const g of GALHOS) {
    const c: Record<string, number> = {};
    let t = 0;
    for (const cr of criaturas) if (FAMILIAS_DO_GALHO[g].includes(cr.familia)) for (const a of cr.afinidades) { c[a] = (c[a] ?? 0) + 1; t++; }
    for (const k of Object.keys(c)) c[k] /= t || 1;
    saida[g] = c;
  }
  return saida;
}
