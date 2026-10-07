// ---------------------------------------------------------------------------
// PR14 — a FAMÍLIA do especial é ESTÁVEL: ela só muda quando o PERFIL muda de verdade.
//
// Decisão do dono: o Soulmon PODE trocar a família do especial ao evoluir, mas isso é RARO. A família
// do estágio seguinte só é sorteada de novo se houve MUDANÇA FORTE DE PERFIL em relação ao estágio
// anterior; senão ela se MANTÉM. Mudança forte = o ELEMENTO dominante (base ou par) mudou de verdade,
// OU o GALHO dominante (Poder / Harmonia / Benevolência) mudou de verdade. O elemento e a skill seguem
// recalculados a cada estágio (quem chama); o NOME segue determinístico por seed e muda quando
// elemento, família ou estágio mudam — este módulo só decide a FAMÍLIA.
//
// "De verdade" = os limiares abaixo, nomeados e testados. Um empate apertado que vira de um estágio
// para o outro não conta (histerese por margem), e um par que apenas REFINA a base que já dominava
// (fogo → vapor, fogo → chama solar) é a mesma linhagem, não uma mudança de perfil.
//
// Puro: sem rede, sem relógio, sem Math.random. Mesma entrada = mesma saída (o servidor deriva a
// família da ficha congelada com o mesmo módulo; o `lex` do nome sai da família + seed).
// ---------------------------------------------------------------------------

import type { SpecialFamily } from '../../combate/specials';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { familiaDoEspecial } from './nomeEspecial';
import type { EscolaSkillId } from './types';

export type Galho = 'poder' | 'harmonia' | 'benevolencia';
export const GALHOS: readonly Galho[] = ['poder', 'harmonia', 'benevolencia'];

/** O perfil de UM estágio, só com o que a regra olha. Os pesos são "pontos efetivos" (par já ×CUSTO_PONTO_PAR). */
export interface PerfilEstagio {
  /** Peso efetivo por elemento (base ou par). */
  elementos: Readonly<Record<string, number>>;
  /** Pontos por galho. Ausente/zerado = o estágio não informa galho (a regra do galho não dispara). */
  galhos?: Readonly<Partial<Record<Galho, number>>>;
}

/**
 * LIMIARES (fração do total do perfil, 0..1). Calibrados nas fichas de teste (`estabilidadeFamilia.test.ts`
 * mede a taxa de troca por evolução e trava o teto).
 */
export const LIMIARES = {
  /** O novo elemento dominante tem de passar o antigo por pelo menos esta fração do peso de elementos, no estágio novo. */
  ELEMENTO_MARGEM: 0.06,
  /** …e o peso RELATIVO dele tem de ter crescido pelo menos isto desde o estágio anterior. */
  ELEMENTO_DESLOCAMENTO: 0.06,
  /** O novo galho dominante tem de liderar o 2º por pelo menos esta fração dos pontos de galho. */
  GALHO_MARGEM: 0.10,
  /** …e a fatia dele tem de ter crescido pelo menos isto desde o estágio anterior. */
  GALHO_DESLOCAMENTO: 0.08,
} as const;

/** Quanto maior a taxa observada de troca por evolução, menos "raro". Meta do dono: ≤ ~20–25%. */
export const TETO_TAXA_TROCA = 0.25;

const DERIVADO = new Map(DERIVED_ELEMENT_PAIRS.map(p => [p.id, p.componentes as readonly string[]]));

function total(m: Readonly<Record<string, number | undefined>>): number {
  let t = 0;
  for (const v of Object.values(m)) t += typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
  return t;
}
function peso(m: Readonly<Record<string, number | undefined>>, id: string): number {
  const v = m[id];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/** Ordem estável: maior peso, empate pelo id (mesma regra de `rankElementos` em `skills.ts`). */
export function elementoDominanteDe(elementos: Readonly<Record<string, number>>): string | null {
  let melhor: string | null = null;
  let melhorPeso = 0;
  for (const id of Object.keys(elementos).sort()) {
    const p = peso(elementos, id);
    if (p > melhorPeso) { melhor = id; melhorPeso = p; }
  }
  return melhor;
}

/** Galho dominante + a margem sobre o segundo (fração dos pontos de galho). Nulo se não há pontos. */
export function galhoDominanteDe(galhos: PerfilEstagio['galhos']): { id: Galho; margem: number; fatia: Record<Galho, number> } | null {
  if (!galhos) return null;
  const t = total(galhos as Record<string, number>);
  if (t <= 0) return null;
  const fatia = Object.fromEntries(GALHOS.map(g => [g, peso(galhos as Record<string, number>, g) / t])) as Record<Galho, number>;
  const ord = [...GALHOS].sort((a, b) => fatia[b] - fatia[a] || GALHOS.indexOf(a) - GALHOS.indexOf(b));
  return { id: ord[0], margem: fatia[ord[0]] - fatia[ord[1]], fatia };
}

/** Mesma linhagem: um par que contém o elemento (ou o elemento contido no par) refina, não troca de perfil. */
export function mesmaLinhagem(a: string, b: string): boolean {
  if (a === b) return true;
  return !!DERIVADO.get(a)?.includes(b) || !!DERIVADO.get(b)?.includes(a);
}

export function elementoMudouDeVerdade(ant: PerfilEstagio, atual: PerfilEstagio): boolean {
  const a = elementoDominanteDe(ant.elementos);
  const n = elementoDominanteDe(atual.elementos);
  if (!a || !n || mesmaLinhagem(a, n)) return false;
  const tAtual = total(atual.elementos), tAnt = total(ant.elementos);
  if (tAtual <= 0 || tAnt <= 0) return false;
  const margem = (peso(atual.elementos, n) - peso(atual.elementos, a)) / tAtual;
  const deslocamento = peso(atual.elementos, n) / tAtual - peso(ant.elementos, n) / tAnt;
  return margem >= LIMIARES.ELEMENTO_MARGEM && deslocamento >= LIMIARES.ELEMENTO_DESLOCAMENTO;
}

export function galhoMudouDeVerdade(ant: PerfilEstagio, atual: PerfilEstagio): boolean {
  const a = galhoDominanteDe(ant.galhos);
  const n = galhoDominanteDe(atual.galhos);
  if (!a || !n || a.id === n.id) return false;
  const deslocamento = n.fatia[n.id] - a.fatia[n.id];
  return n.margem >= LIMIARES.GALHO_MARGEM && deslocamento >= LIMIARES.GALHO_DESLOCAMENTO;
}

/** A pergunta da regra: o perfil mudou o bastante para a família ser sorteada de novo? */
export function perfilMudouForte(ant: PerfilEstagio, atual: PerfilEstagio): boolean {
  return elementoMudouDeVerdade(ant, atual) || galhoMudouDeVerdade(ant, atual);
}

export interface EntradaJornada {
  seedKey: string;
  /** Escola de skill de cada estágio (a regra de sorteio é a de `familiaDoEspecial`). */
  escolas: readonly EscolaSkillId[];
  /** Elemento do ESPECIAL de cada estágio (entra só no peso do sorteio, nunca na decisão de trocar). */
  elementosEspecial: readonly string[];
  /** Perfil de cada estágio, na ordem da jornada. */
  perfis: readonly PerfilEstagio[];
  /** Ids dos estágios na ordem (a seed do sorteio usa `seedKey|familia|<stage>`). */
  stages: readonly string[];
  tendencia?: string;
}

export interface FamiliaDaJornada {
  familia: SpecialFamily;
  /** true quando a família foi sorteada de novo neste estágio (estágio 1 não conta como troca). */
  trocou: boolean;
}

/** O que o sorteio da família precisa saber do estágio (a regra é a de `familiaDoEspecial`). */
export interface BaseFamilia {
  escola: EscolaSkillId;
  /** Elemento do ESPECIAL do estágio (só pesa no sorteio, nunca na decisão de trocar). */
  elementoId: string;
  tendencia?: string;
  seedKey: string;
  stage: string;
}

/**
 * PR15a: a família do estágio SEGUINTE a partir do par (anterior, atual) — sem recalcular a jornada inteira.
 * `anterior` nulo = primeiro estágio (sorteio da seed). Senão: a família em vigor se mantém, salvo
 * `perfilMudouForte` — aí novo sorteio que exclui a que estava em vigor. Pura e idempotente.
 */
export function proximaFamilia(
  anterior: SpecialFamily | null,
  perfilAnterior: PerfilEstagio | null,
  perfilAtual: PerfilEstagio,
  base: BaseFamilia,
): FamiliaDaJornada {
  if (!anterior || !perfilAnterior) return { familia: familiaDoEspecial(base), trocou: false };
  if (!perfilMudouForte(perfilAnterior, perfilAtual)) return { familia: anterior, trocou: false };
  return { familia: familiaDoEspecial({ ...base, excluir: anterior }), trocou: true };
}

/**
 * A família de CADA estágio. Estágio 1 = sorteio da seed do onboarding (como no PR9, sem lista de usadas).
 * Estágios seguintes: família do anterior, salvo mudança forte de perfil — aí novo sorteio ponderado que
 * exclui a família que estava em vigor (trocar para a mesma não seria troca).
 */
export function familiasDaJornada(e: EntradaJornada): FamiliaDaJornada[] {
  const saida: FamiliaDaJornada[] = [];
  for (let i = 0; i < e.stages.length; i++) {
    const base: BaseFamilia = { escola: e.escolas[i], elementoId: e.elementosEspecial[i], tendencia: e.tendencia, seedKey: e.seedKey, stage: e.stages[i] };
    saida.push(proximaFamilia(i === 0 ? null : saida[i - 1].familia, i === 0 ? null : e.perfis[i - 1], e.perfis[i], base));
  }
  return saida;
}
