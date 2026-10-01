/**
 * RASCUNHO DO PORTÃO DE IDENTIDADE
 * ================================
 *
 * O portão de e-mail (`IDENTITY_STEP` do `SoulmonOnboarding`) manda um link e
 * a pessoa SAI do app para abri-lo. Quando ela volta, `App.tsx` conclui o
 * login e chama `window.location.reload()` — o onboarding remonta do zero e o
 * estado do componente morre junto.
 *
 * Sem persistência, a viagem até o e-mail cobraria de volta o objetivo, a
 * dificuldade e o aceite dos Termos. Um portão que pune quem passa por ele é
 * um portão que ninguém atravessa.
 *
 * **Por que não reusar `oracleDraft.ts`:** ele é o rascunho do RITUAL PAGO e
 * recusa por contrato qualquer passo `< 1` (`readOracleDraft`), justamente
 * para nunca retomar na geração ou depois. O trecho antes da escolha vive em
 * ids negativos. Esticar aquele contrato para caber aqui misturaria duas
 * coisas que têm regras de descarte diferentes — este morre ao terminar o
 * onboarding, aquele morre ao gerar a criatura.
 *
 * **O que NUNCA entra**, pelos mesmos motivos do outro rascunho:
 *
 *  · **o e-mail** — quem prova posse dele é o Firebase, não o `localStorage`;
 *  · **o mês/ano de nascimento do demo** — não é persistido de propósito (ver
 *    `demoAgeMonth` no onboarding): ele serve só para conferir 18+ naquele
 *    instante e não alimenta mapa astral nenhum. A prova de que a checagem
 *    passou é o próprio `consent` guardado aqui;
 *  · o nome do pet e a criatura escolhida — acontecem no fim e não são
 *    atravessados pela viagem.
 *
 * ⚠️ **O que PASSOU a entrar em 01/10/2026** (pedido do dono: "todas as
 * perguntas obrigatórias, fazem parte do onboarding", e quem fecha no meio
 * volta de onde parou): o PASSO em que a pessoa estava, o NOME do jogador
 * (que agora é a 1ª pergunta depois da conta e é o nome público, não o real),
 * as 6 respostas do ritual, os 20 itens do teste e os itens DESMARCADOS do
 * ponto de partida. Antes a viagem só cobrava objetivo e aceite porque eram as
 * únicas respostas antes da escolha; hoje quase o onboarding inteiro vem
 * antes dela, e um rascunho que guarda só metade faz a pessoa responder 26
 * perguntas de novo. Tudo opcional na LEITURA — rascunho antigo lê sem os
 * campos, sem trocar a versão.
 *
 * Funções puras sobre o storage, como as do `oracleDraft`.
 */
import { readJson, writeJson, removeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { normalizeConsent, type ConsentRecord } from './consent';
import type { Answers as SoulAnswers } from './soulProfile/personality/types';
import {
  LIFE_AREAS, STRUGGLE_LABEL, STRENGTH_LABEL,
  type LifeArea, type StruggleId, type StrengthId,
} from '../types/activityCatalog';

export const GATE_DRAFT_VERSION = 1;

export interface GateDraft {
  v: typeof GATE_DRAFT_VERSION;
  soulGoal: string;
  soulStruggle: string;
  /** Prova do aceite dos Termos, tirada nas caixas do portão
   *  (`IDENTITY_STEP`/`GOOGLE_STEP`/`EMAIL_STEP`). O `CONSENT_STEP` que este
   *  comentário citava foi APAGADO em 07/09/2026, quando o aceite desceu para
   *  a própria tela de conta — a referência sobreviveu ao passo. */
  consent: ConsentRecord | null;
  /** B4/B5 (01/10/2026): as escolhas OBJETIVAS de metas (ids do catálogo).
   *  Opcionais na leitura — rascunho gravado antes delas lê como `[]`, sem
   *  trocar a versão. Ids desconhecidos são descartados (storage não é
   *  confiável). */
  areas?: LifeArea[];
  struggles?: StruggleId[];
  strengths?: StrengthId[];
  /** 01/10/2026 — retomada do onboarding inteiro (ver o cabeçalho). O PASSO é
   *  só uma sugestão: quem decide onde retomar é o onboarding, que confere se
   *  as respostas anteriores existem. */
  step?: number;
  /** O nome do jogador (nome PÚBLICO, `userName`). Cortado em 24, como o campo. */
  nickname?: string;
  /** As 6 respostas do ritual (`ORACLE_QUESTIONS`), id → id da opção. */
  answers?: Record<string, string>;
  /** Os 20 itens do teste (`SOUL_TEST_ITEMS`), id → resposta. */
  testAnswers?: SoulAnswers;
  /** Itens do ponto de partida que a pessoa DESMARCOU. */
  starterOff?: string[];
  /** ISO de quando foi gravado — só para o leitor humano do storage. */
  savedAt: string;
}

/**
 * Lê o rascunho do portão. Devolve `null` se não houver, se a versão não bater
 * ou se o formato estiver corrompido — o storage é dado NÃO confiável, e um
 * rascunho ilegível nunca pode derrubar o onboarding.
 */
export function readGateDraft(): GateDraft | null {
  const d = readJson<Partial<GateDraft> | null>(STORAGE_KEYS.GATE_DRAFT, null);
  if (!d || typeof d !== 'object') return null;
  if (d.v !== GATE_DRAFT_VERSION) return null;
  return {
    v: GATE_DRAFT_VERSION,
    soulGoal: typeof d.soulGoal === 'string' ? d.soulGoal : '',
    soulStruggle: typeof d.soulStruggle === 'string' ? d.soulStruggle : '',
    // O consent é a peça que as caixas do portão produzem. Se vier
    // quebrado, vale `null`: o onboarding pede o aceite de novo, que é o
    // comportamento seguro. Consentimento presumido não é consentimento.
    //
    // ⚠️ QUEM DECIDE ISSO É `normalizeConsent` (`utils/consent.ts`), e não uma
    // checagem escrita aqui. Estavam em três lugares com TRÊS rigores
    // diferentes: o `GameStateContext` usava o dono correto, o `oracleDraft`
    // tinha uma cópia que também exigia `acceptedAt`, e ESTA aqui aceitava
    // qualquer objeto — inclusive `[]`, porque `typeof [] === 'object'`. Ou
    // seja: a checagem MAIS FROUXA das três era a do portão de conta, que é
    // exatamente onde o aceite nasce. Achado na sessão de QA de 08/09/2026.
    consent: normalizeConsent(d.consent) ?? null,
    areas: idsValidos(d.areas, LIFE_AREAS),
    struggles: idsValidos(d.struggles, Object.keys(STRUGGLE_LABEL) as StruggleId[]),
    strengths: idsValidos(d.strengths, Object.keys(STRENGTH_LABEL) as StrengthId[]),
    step: Number.isInteger(d.step) ? (d.step as number) : undefined,
    nickname: typeof d.nickname === 'string' ? d.nickname.slice(0, 24) : '',
    answers: respostasValidas(d.answers),
    testAnswers: itensValidos(d.testAnswers),
    starterOff: Array.isArray(d.starterOff)
      ? d.starterOff.filter((x): x is string => typeof x === 'string').slice(0, 20)
      : [],
    savedAt: typeof d.savedAt === 'string' ? d.savedAt : '',
  };
}

function idsValidos<T extends string>(v: unknown, permitidos: readonly T[]): T[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is T => typeof x === 'string' && (permitidos as readonly string[]).includes(x)).slice(0, 3);
}

/** Só pares texto → texto: o storage não é confiável. */
function respostasValidas(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (typeof x === 'string') out[k] = x;
  }
  return out;
}

/** Só respostas com a FORMA de uma das três espécies de item. */
function itensValidos(v: unknown): SoulAnswers {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: SoulAnswers = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (!x || typeof x !== 'object') continue;
    const a = x as Record<string, unknown>;
    if (a.kind === 'likert' && typeof a.value === 'number' && [1, 2, 3, 4, 5].includes(a.value)) {
      out[k] = { kind: 'likert', value: a.value as 1 | 2 | 3 | 4 | 5 };
    } else if (a.kind === 'forced-choice' && (a.choice === 'a' || a.choice === 'b')) {
      out[k] = { kind: 'forced-choice', choice: a.choice };
    } else if (a.kind === 'scenario' && typeof a.optionId === 'string') {
      out[k] = { kind: 'scenario', optionId: a.optionId };
    }
  }
  return out;
}

export function writeGateDraft(
  dados: Pick<GateDraft, 'soulGoal' | 'soulStruggle' | 'consent' | 'areas' | 'struggles' | 'strengths'
    | 'step' | 'nickname' | 'answers' | 'testAnswers' | 'starterOff'>,
  now: Date = new Date(),
): boolean {
  return writeJson(
    STORAGE_KEYS.GATE_DRAFT,
    {
      v: GATE_DRAFT_VERSION,
      soulGoal: dados.soulGoal,
      soulStruggle: dados.soulStruggle,
      consent: dados.consent,
      areas: dados.areas ?? [],
      struggles: dados.struggles ?? [],
      strengths: dados.strengths ?? [],
      ...(dados.step !== undefined ? { step: dados.step } : {}),
      ...(dados.nickname !== undefined ? { nickname: dados.nickname.slice(0, 24) } : {}),
      ...(dados.answers !== undefined ? { answers: dados.answers } : {}),
      ...(dados.testAnswers !== undefined ? { testAnswers: dados.testAnswers } : {}),
      ...(dados.starterOff !== undefined ? { starterOff: dados.starterOff } : {}),
      savedAt: now.toISOString(),
    } satisfies GateDraft,
    { silent: true },
  );
}

export function clearGateDraft(): void {
  removeLocal(STORAGE_KEYS.GATE_DRAFT, { silent: true });
}
