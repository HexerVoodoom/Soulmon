/**
 * RASCUNHO DO RITUAL DO ORÁCULO (WP1.7 do PLANO-MELHORIAS)
 * =======================================================
 *
 * O ritual pago tem 8 telas de dados + 6 perguntas + (opcional) 20 itens
 * psicométricos. Antes, fechar o app no item 15 de 20 jogava tudo fora e o
 * ritual recomeçava do zero — o dossiê Mobbin (ABY, D2) mostra que o rascunho
 * persistente é o padrão em onboarding longo, e a pesquisa de nascimento diz
 * por quê: um ritual que a pessoa já respondeu inteiro não pode ser cobrado
 * de novo por causa de uma ligação no meio.
 *
 * O que ENTRA no rascunho: o passo, o caminho, as respostas, os dados de
 * nascimento — exatamente o que o `SOULMON_PROFILE` já guarda no aparelho
 * depois da geração — e o REGISTRO de consentimento (data + versões dos
 * Termos): sem ele, um ritual retomado terminaria num save sem a prova do
 * aceite, que é a peça que as caixas do portão produzem (o `CONSENT_STEP` foi
 * apagado em 07/09/2026 e o aceite desceu para a própria tela de conta). O que NUNCA
 * entra: e-mail, o mês/ano do demo (que não é persistido de propósito — ver `demoAgeText` no onboarding),
 * o resultado gerado (a geração custa; quem chegou ao reveal tem o perfil com
 * `seed` para regenerar) e nada do cadastro.
 *
 * A BIFURCAÇÃO SEM VOLTA continua sem volta: `refine` é guardado como está —
 * quem aceitou o teste longo retoma DENTRO dele; quem recusou já foi para a
 * geração e não tem rascunho a retomar. Não existe caminho novo aqui.
 *
 * Funções PURAS sobre o storage: `now` e o passo máximo entram por parâmetro.
 */
import { readJson, writeJson, removeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import type { City } from './soulProfile/cities';
import type { Answers as SoulAnswers } from './soulProfile/personality/types';
import { normalizeConsent, type ConsentRecord } from './consent';

export const ORACLE_DRAFT_VERSION = 1;

export interface OracleDraft {
  v: typeof ORACLE_DRAFT_VERSION;
  mode: 'onboarding' | 'upgrade';
  step: number;
  soulGoal: string;
  soulStruggle: string;
  fullName: string;
  birthDate: string;
  birthDateText: string;
  birthTime: string;
  birthCity: City | null;
  timeUnknown: boolean;
  /* ⚰️ `favoriteCreature` e `skipFavorite` SAÍRAM em 22/09/2026, com o degrau
     "Qual sua criatura favorita?" do ritual (ver `FAVORITE_STEP` em
     `SoulmonOnboarding.tsx`). Regra nova do dono: o jogador só insere texto
     que vai para o prompt DEPOIS do Renascimento. Rascunho antigo que ainda
     carregue as duas chaves continua legível — chave a mais é ignorada na
     leitura —, por isso `ORACLE_DRAFT_VERSION` NÃO sobe: subir descartaria
     rascunhos válidos de quem está no meio do ritual agora. */
  answers: Record<string, string>;
  testAnswers: SoulAnswers;
  refine: boolean | null;
  /** Prova do aceite dos Termos, tirada nas caixas do portão de conta. */
  consent: ConsentRecord | null;
  /** ISO de quando foi gravado — só para o leitor humano do storage. */
  savedAt: string;
}

/**
 * Lê o rascunho SE ele for retomável neste modo: mesmo `mode`, versão certa e
 * passo dentro de `[1, maxResumableStep]`. Fora disso devolve `null` — um
 * rascunho no passo de GERAÇÃO ou depois nunca é retomado (regeneraria a
 * criatura, e geração custa).
 */
export function readOracleDraft(
  mode: 'onboarding' | 'upgrade',
  maxResumableStep: number,
): OracleDraft | null {
  const d = readJson<Partial<OracleDraft> | null>(STORAGE_KEYS.ORACLE_DRAFT, null);
  if (!d || typeof d !== 'object') return null;
  if (d.v !== ORACLE_DRAFT_VERSION || d.mode !== mode) return null;
  if (!Number.isInteger(d.step) || (d.step as number) < 1 || (d.step as number) > maxResumableStep) return null;
  return {
    v: ORACLE_DRAFT_VERSION,
    mode,
    step: d.step as number,
    soulGoal: typeof d.soulGoal === 'string' ? d.soulGoal : '',
    soulStruggle: typeof d.soulStruggle === 'string' ? d.soulStruggle : '',
    fullName: typeof d.fullName === 'string' ? d.fullName : '',
    birthDate: typeof d.birthDate === 'string' ? d.birthDate : '',
    birthDateText: typeof d.birthDateText === 'string' ? d.birthDateText : '',
    birthTime: typeof d.birthTime === 'string' ? d.birthTime : '12:00',
    birthCity: d.birthCity && typeof d.birthCity === 'object' ? (d.birthCity as City) : null,
    timeUnknown: d.timeUnknown === true,
    answers: d.answers && typeof d.answers === 'object' ? (d.answers as Record<string, string>) : {},
    testAnswers: d.testAnswers && typeof d.testAnswers === 'object' ? (d.testAnswers as SoulAnswers) : {},
    refine: d.refine === true ? true : d.refine === false ? false : null,
    // Mesmo dono do `gateDraft` e do `GameStateContext`: `normalizeConsent`.
    // A cópia que morava aqui era equivalente, e "equivalente" é o estado em
    // que duas regras ficam até a primeira divergir (footgun 9).
    consent: normalizeConsent(d.consent) ?? null,
    savedAt: typeof d.savedAt === 'string' ? d.savedAt : '',
  };
}

/** Grava em silêncio: rascunho não vale um aviso de "storage cheio". */
export function writeOracleDraft(draft: Omit<OracleDraft, 'v' | 'savedAt'>, now: Date = new Date()): boolean {
  const full: OracleDraft = { ...draft, v: ORACLE_DRAFT_VERSION, savedAt: now.toISOString() };
  return writeJson(STORAGE_KEYS.ORACLE_DRAFT, full, { silent: true });
}

export function clearOracleDraft(): void {
  removeLocal(STORAGE_KEYS.ORACLE_DRAFT, { silent: true });
}

/** As chaves que NUNCA podem aparecer num rascunho. Há teste travando. */
export const ORACLE_DRAFT_FORBIDDEN_KEYS = ['email', 'demoAgeText', 'result', 'nickname', 'petNameEdit', 'password'] as const;
