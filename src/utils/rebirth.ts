// ---------------------------------------------------------------------------
// RENASCIMENTO (Rebirth) — o que se ganha por ter chegado ao topo.
//
// Regra do produto, decidida pelo dono em 06/09/2026:
//   1. Só depois do ULTRA, o ápice da escada.
//   2. UMA VEZ SÓ, e é definitivo — não é prestígio de idle game, é um
//      momento. Por isso o registro (`rebirth`) mora no save e nunca é
//      apagado: é ele que impede a segunda vez.
//   3. Volta para ROOKIE com CERIMÔNIA de ovo. Não existe estágio `egg` —
//      ele foi apagado da escada de propósito (`types/progression.ts`), e
//      reabri-lo custaria sprite, HP máximo, requisito diário e masmorra. O
//      ovo aqui é a TELA, não um estágio jogável.
//   4. Perde-se o ESTÁGIO e os PONTOS DE ATRIBUTO. E só. Bits, Emblemas,
//      decoração, cenários, sonhos, marcos de hábito, constância,
//      `perfectDays`, `totalPerfectDays` e `unlockedEvolutions` ficam
//      INTACTOS — a regra geral do produto é que perda só toca item
//      recuperável, nunca identidade nem coleção, e o Rebirth não é exceção
//      a ela: ele é uma TROCA declarada (estágio por autoria), não um
//      castigo. Há teste travando cada um desses campos.
//   5. Exclusivo de quem comprou (`accountTier: 'paid'`) — a criatura autoral
//      é o que os Créditos liberam, e o Rebirth entrega exatamente isso.
//
// Consequência aceita da regra 4: como `perfectDays` NÃO zera, quem renasce
// reescala a árvore rápido. É de propósito — o preço do Rebirth é abrir mão
// da forma que você já tinha, não passar meses de castigo para recuperá-la.
//
// Este módulo é PURO: sem React, sem localStorage, `now` sempre por
// parâmetro. Ele não decide NADA sobre a criatura em si — quem compõe o
// prompt continua sendo `utils/oracle.ts` (`composeSpritePrompts`), que
// recebe estas escolhas como entrada.
// ---------------------------------------------------------------------------

import { BASE_ELEMENT_LABELS, DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { CLASS_DATA } from './soulProfile/ficha/buildSheet';
import type { EscolaId } from './soulProfile/ficha/types';

/** Estágio que habilita o Rebirth. O ápice da escada, não um número solto. */
export const REBIRTH_REQUIRED_STAGE = 'ultra';

/**
 * O ganho: multiplicador sobre o ORÇAMENTO de pontos da ficha, em TODOS os
 * estágios (`ROOKIE_BUDGET` × `STAGE_MULTIPLIER` × isto). Renascer rende uma
 * criatura mais funda desde o primeiro nível e, por composição, em todos os
 * seguintes — que é exatamente a promessa feita ao jogador.
 *
 * 1.5 e não 2: o dobro de pontos num sistema com custo de par (`CUSTO_PONTO_PAR`)
 * destrava geração adiantada e faz o rookie renascido ler como um mega. O
 * ganho tem de ser sentido sem apagar a escada que o jogador vai subir de novo.
 */
export const REBIRTH_BUDGET_MULTIPLIER = 1.5;

/** Uma escolha de elemento vai até o SEGUNDO nível: base ou par derivado. */
export interface RebirthElementOption {
  id: string;
  nome: string;
  /** `1` = elemento base; `2` = par derivado (ex.: Vapor = Fogo + Água). */
  nivel: 1 | 2;
}

export interface RebirthEscolaOption {
  id: EscolaId;
  nome: string;
}

/** As escolhas do jogador na cerimônia. `criatura` é campo ABERTO. */
export interface RebirthChoices {
  criatura: string;
  escola: EscolaId;
  elemento: string;
}

export interface RebirthRecord extends RebirthChoices {
  /** ISO. Existe para a tela poder contar a data, e para o registro ser
   *  auditável — nunca para derivar "quantos rebirths", que é sempre 1. */
  at: string;
  /** Estágio de onde se renasceu. Guardado porque é a única prova de que a
   *  escada foi subida inteira uma vez; a tela pode contá-la. */
  fromStage: string;
}

/** Teto do campo aberto. Ele entra em prompt de gerador de imagem: texto
 *  longo demais não é criatividade, é injeção de instrução. */
export const REBIRTH_CRIATURA_MAX = 60;

/** As 6 escolas do class-system, na ordem do snapshot. Dropdown, não texto. */
export function rebirthEscolaOptions(): RebirthEscolaOption[] {
  return (Object.keys(CLASS_DATA.escolas) as EscolaId[])
    .map(id => ({ id, nome: CLASS_DATA.escolas[id].nome }));
}

/**
 * Elementos oferecidos: os 17 base + os pares derivados (2º nível). Não vai
 * além do par de propósito — triplas e quádruplas existem no class-system,
 * mas o Soulmon só replica aridade 1 e 2 (ver `ficha/types.ts`), e oferecer
 * uma escolha que o motor de ficha não sabe alocar seria prometer no menu o
 * que a cozinha não faz.
 */
export function rebirthElementOptions(): RebirthElementOption[] {
  const base: RebirthElementOption[] = CLASS_ELEMENT_ORDER.map(id => ({
    id, nome: BASE_ELEMENT_LABELS[id], nivel: 1,
  }));
  const pares: RebirthElementOption[] = DERIVED_ELEMENT_PAIRS.map(p => ({
    id: p.id, nome: p.nome, nivel: 2,
  }));
  return [...base, ...pares];
}

export function isValidRebirthElement(id: string): boolean {
  return rebirthElementOptions().some(o => o.id === id);
}

export function isValidRebirthEscola(id: string): id is EscolaId {
  return Object.prototype.hasOwnProperty.call(CLASS_DATA.escolas, id);
}

/**
 * Higieniza o campo aberto ANTES de ele virar prompt: colapsa espaço, corta
 * no teto e remove quebra de linha e cerca de código — os dois vetores que
 * transformam "descreva sua criatura" em "ignore as instruções acima".
 * Devolve `''` para entrada inútil, e `''` é recusado por `rebirthRefusal`.
 */
export function sanitizeCriatura(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\r\n\t`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, REBIRTH_CRIATURA_MAX);
}

export interface RebirthEligibilityInput {
  evolutionStage?: string;
  accountTier?: 'demo' | 'paid';
  rebirth?: RebirthRecord | null;
}

/**
 * Por que uma RECUSA com motivo em vez de um booleano: cada motivo tem uma
 * saída diferente na tela (comprar, subir a escada, ou nada — já usou). Um
 * `false` mudo mandaria o jogador adivinhar qual dos três é.
 */
export type RebirthRefusal = 'not-ultra' | 'not-paid' | 'already-used' | null;

export function rebirthRefusal(input: RebirthEligibilityInput): RebirthRefusal {
  if (input.rebirth) return 'already-used';
  if (input.accountTier !== 'paid') return 'not-paid';
  if (input.evolutionStage !== REBIRTH_REQUIRED_STAGE) return 'not-ultra';
  return null;
}

export function canRebirth(input: RebirthEligibilityInput): boolean {
  return rebirthRefusal(input) === null;
}

/** O alvo mínimo que `applyRebirth` sabe reescrever. Genérico em `T` para o
 *  chamador passar o `GameState` inteiro e receber ele de volta sem perder
 *  campo — o mesmo contrato de `taskTriage`. */
export interface RebirthTarget {
  evolutionStage?: string;
  virusPoints?: number;
  dataPoints?: number;
  vaccinePoints?: number;
  accountTier?: 'demo' | 'paid';
  rebirth?: RebirthRecord | null;
}

export interface RebirthOutcome<T> {
  state: T;
  /** `false` quando nada foi feito — a recusa diz por quê. */
  applied: boolean;
  refusal: RebirthRefusal;
}

/**
 * Aplica o renascimento. IDEMPOTENTE por construção: a segunda chamada bate
 * em `already-used` e devolve o estado IDÊNTICO (a mesma referência), porque
 * o registro que ela mesma gravou é o que a barra. Isso importa porque um
 * updater do React pode rodar duas vezes (StrictMode, footgun 6) e a segunda
 * passada não pode zerar de novo os atributos que a primeira acabou de zerar.
 *
 * O que ele NÃO toca, e é o ponto: Bits, Emblemas, Créditos, decoração,
 * cenários, sonhos, `habitRhythms`, `perfectDays`, `totalPerfectDays`,
 * `unlockedEvolutions`, tarefas, hábitos, `bornAt`. Tudo isso passa pelo
 * spread e sai inteiro do outro lado.
 */
export function applyRebirth<T extends RebirthTarget>(
  prev: T,
  choices: RebirthChoices,
  now: Date,
): RebirthOutcome<T> {
  const refusal = rebirthRefusal(prev);
  if (refusal) return { state: prev, applied: false, refusal };

  const criatura = sanitizeCriatura(choices.criatura);
  if (!criatura || !isValidRebirthEscola(choices.escola) || !isValidRebirthElement(choices.elemento)) {
    return { state: prev, applied: false, refusal: 'not-ultra' };
  }

  const record: RebirthRecord = {
    criatura,
    escola: choices.escola,
    elemento: choices.elemento,
    at: now.toISOString(),
    fromStage: prev.evolutionStage ?? REBIRTH_REQUIRED_STAGE,
  };

  return {
    state: {
      ...prev,
      evolutionStage: 'rookie',
      virusPoints: 0,
      dataPoints: 0,
      vaccinePoints: 0,
      rebirth: record,
    },
    applied: true,
    refusal: null,
  };
}
