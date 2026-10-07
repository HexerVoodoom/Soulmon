// ---------------------------------------------------------------------------
// PR15a — simulador do comportamento: N jornadas × 5 políticas de jogador, cada uma passando por
// `evoluirFicha` nos 5 estágios. Mede a TAXA REAL de troca de família por evolução (a meta do dono é
// "rara", teto `TETO_TAXA_TROCA`) e o que o comportamento muda de fato na ficha, contra a linha de base
// (a mesma jornada sem plano). Puro: o rng entra por parâmetro; só os testes e o runbook importam.
//
// O jogador é modelado no nível da CATEGORIA de atividade (`CATEGORY_ATTRIBUTES`), que é de onde os pontos
// de galho saem de verdade: cada alimentação cai na categoria preferida da política com `FIDELIDADE` de
// chance e, no resto, numa categoria uniforme — ninguém é 100% fiel a uma categoria por semanas.
// ---------------------------------------------------------------------------

import { CATEGORY_ATTRIBUTES, type ActivityCategory } from '../../../types/attributes';
import type { OracleAxes } from '../types';
import type { SpecialFamily } from '../../combate/specials';
import { evoluirFicha, type EstagioAnterior, type JanelaComportamento } from './comportamento';
import { elementoDominanteDe } from './estabilidadeFamilia';
import { FICHA_STAGE_ORDER, type Ficha } from './types';

export type PoliticaId = 'uniforme' | 'so-poder' | 'so-harmonia' | 'so-benevolencia' | 'alternante';
export const POLITICAS: readonly PoliticaId[] = ['uniforme', 'so-poder', 'so-harmonia', 'so-benevolencia', 'alternante'];

/** Categoria preferida de cada política (a de maior fatia do galho: Creativity 3/1/0, Study 0/3/1, Discipline 0/1/3). */
const PREFERIDA: Record<Exclude<PoliticaId, 'uniforme' | 'alternante'>, ActivityCategory> = {
  'so-poder': 'Creativity', 'so-harmonia': 'Study', 'so-benevolencia': 'Discipline',
};
const ALTERNANTE: readonly ActivityCategory[] = ['Creativity', 'Study', 'Discipline'];
const CATEGORIAS = Object.keys(CATEGORY_ATTRIBUTES) as ActivityCategory[];

/** Chance de a alimentação cair na categoria preferida da política. */
export const FIDELIDADE = 0.85;
/** Alimentações por estágio (uniforme): de 15 (60 pontos) a 150 (600), incluindo janelas curtas. */
export const ALIMENTACOES_MIN = 15;
export const ALIMENTACOES_MAX = 150;

/** A janela de UM estágio sob a política. */
export function janelaDaPolitica(politica: PoliticaId, estagio: number, rng: () => number): JanelaComportamento {
  const n = ALIMENTACOES_MIN + Math.floor(rng() * (ALIMENTACOES_MAX - ALIMENTACOES_MIN + 1));
  const preferida = politica === 'uniforme' ? null
    : politica === 'alternante' ? ALTERNANTE[estagio % ALTERNANTE.length] : PREFERIDA[politica];
  const j = { power: 0, harmony: 0, benevolence: 0 };
  for (let i = 0; i < n; i++) {
    const cat = preferida && rng() < FIDELIDADE ? preferida : CATEGORIAS[Math.floor(rng() * CATEGORIAS.length)];
    const a = CATEGORY_ATTRIBUTES[cat];
    j.power += a.power; j.harmony += a.harmony; j.benevolence += a.benevolence;
  }
  return j;
}

export interface EstagioSimulado {
  ficha: Ficha;
  familia: SpecialFamily;
  trocou: boolean;
  elementoDominante: string | null;
}

/** Uma jornada de 5 estágios. `comportamento: false` = a linha de base (janela vazia → plano nulo). */
export function simularJornada(
  e: { oracle: OracleAxes; nome: string; seedKey: string; politica: PoliticaId; comportamento: boolean; janelaRng: () => number },
): EstagioSimulado[] {
  const saida: EstagioSimulado[] = [];
  let anterior: EstagioAnterior | null = null;
  let janela: JanelaComportamento | null = null;
  const usados = new Set<string>();
  FICHA_STAGE_ORDER.forEach((stage, i) => {
    const r = evoluirFicha({
      anterior, janela: e.comportamento ? janela : null, oracle: e.oracle, nome: e.nome, seedKey: e.seedKey, stage, usados,
    });
    saida.push({ ficha: r.ficha, familia: r.familia, trocou: r.trocouFamilia, elementoDominante: elementoDominanteDe(r.perfil.elementos as Record<string, number>) });
    anterior = { stage, ficha: r.ficha, familia: r.familia, perfil: r.perfil };
    // o jogador vive o estágio `i`; o que fez vira a janela da próxima evolução
    janela = janelaDaPolitica(e.politica, i, e.janelaRng);
  });
  return saida;
}

export interface MedidaPolitica {
  politica: PoliticaId;
  evolucoes: number;
  trocas: number;
  taxaTroca: number;
  /** Fração dos estágios 2..5 em que o elemento dominante difere do da MESMA jornada sem comportamento. */
  elementoMudouPeloComportamento: number;
  /** Fração dos estágios 2..5 em que a família difere da da jornada sem comportamento. */
  familiaDifereDaBase: number;
  /** Quantas jornadas tiveram 0,1,2,3,4 trocas. */
  trocasPorJornada: number[];
  /** Distribuição das famílias nos estágios 2..5. */
  familias: Record<string, number>;
}

/** `oraculos[i]` e `nomes[i]` definem a jornada i; a MESMA jornada é jogada sob as 5 políticas. */
export function medirPoliticas(oraculos: readonly OracleAxes[], nomes: readonly string[], rngDaJornada: (i: number, politica: PoliticaId) => () => number): MedidaPolitica[] {
  return POLITICAS.map(politica => {
    let evolucoes = 0, trocas = 0, difElemento = 0, difFamilia = 0, amostras = 0;
    const trocasPorJornada = [0, 0, 0, 0, 0];
    const familias: Record<string, number> = {};
    oraculos.forEach((oracle, i) => {
      const base = simularJornada({ oracle, nome: nomes[i], seedKey: nomes[i], politica, comportamento: false, janelaRng: rngDaJornada(i, politica) });
      const com = simularJornada({ oracle, nome: nomes[i], seedKey: nomes[i], politica, comportamento: true, janelaRng: rngDaJornada(i, politica) });
      let n = 0;
      for (let s = 1; s < com.length; s++) {
        evolucoes++; amostras++;
        if (com[s].trocou) { trocas++; n++; }
        if (com[s].elementoDominante !== base[s].elementoDominante) difElemento++;
        if (com[s].familia !== base[s].familia) difFamilia++;
        familias[com[s].familia] = (familias[com[s].familia] ?? 0) + 1;
      }
      trocasPorJornada[n]++;
    });
    return {
      politica, evolucoes, trocas, taxaTroca: trocas / evolucoes,
      elementoMudouPeloComportamento: difElemento / amostras, familiaDifereDaBase: difFamilia / amostras,
      trocasPorJornada, familias,
    };
  });
}
