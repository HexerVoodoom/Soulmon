/**
 * CATÁLOGO DE ATIVIDADES CURADO
 * =============================
 *
 * Dono único dos tipos do catálogo (docs/PLANO-CATALOGO-ATIVIDADES.md). O
 * catálogo em si (os itens) mora em `src/data/activityCatalog.ts`; a
 * revisão de evidência de cada item está em `docs/CATALOGO-EVIDENCIAS.md`.
 *
 * Regra inegociável do plano: **só entra no catálogo comportamento com
 * evidência verificável** (nível A ou B; C só com justificativa marcada).
 * Item sem fonte checável não entra — nunca invente citação.
 *
 * `Activity.catalogId` e `Activity.level` são OPCIONAIS (ver
 * `src/contexts/GameStateContext.tsx`): uma atividade sem `catalogId` é
 * legado/custom, criada pelo fluxo antigo ("criar do zero"). Save antigo
 * hidrata sem nenhum destes campos e continua funcionando exatamente como
 * antes — não há migração destrutiva.
 */

import type { Effort, Schedule } from './taskModel';
import type { ActivityCategory } from './attributes';

/** As nove áreas da vida que o onboarding oferece para melhorar. */
export type LifeArea =
  | 'sono'
  | 'corpo'
  | 'mente'
  | 'foco'
  | 'aprendizado'
  | 'relacoes'
  | 'casa'
  | 'financas'
  | 'proposito';

export const LIFE_AREAS: LifeArea[] = [
  'sono', 'corpo', 'mente', 'foco', 'aprendizado', 'relacoes', 'casa', 'financas', 'proposito',
];

/** Nome bilíngue de cada área, para os seletores do onboarding e do catálogo. */
export const LIFE_AREA_LABEL: Record<LifeArea, { pt: string; en: string }> = {
  sono: { pt: 'Sono', en: 'Sleep' },
  corpo: { pt: 'Corpo', en: 'Body' },
  mente: { pt: 'Mente', en: 'Mind' },
  foco: { pt: 'Foco', en: 'Focus' },
  aprendizado: { pt: 'Aprendizado', en: 'Learning' },
  relacoes: { pt: 'Relações', en: 'Relationships' },
  casa: { pt: 'Casa', en: 'Home' },
  financas: { pt: 'Finanças', en: 'Finances' },
  proposito: { pt: 'Propósito', en: 'Purpose' },
};

/** Dificuldades que o onboarding oferece para escolha múltipla (até 3). */
export type StruggleId =
  | 'comecar'
  | 'constancia'
  | 'esquecer'
  | 'energia'
  | 'ansiedade'
  | 'distracao'
  | 'tempo'
  | 'perfeccionismo';

export const STRUGGLE_LABEL: Record<StruggleId, { pt: string; en: string }> = {
  comecar: { pt: 'Começar', en: 'Getting started' },
  constancia: { pt: 'Manter constância', en: 'Staying consistent' },
  esquecer: { pt: 'Esquecer', en: 'Forgetting' },
  energia: { pt: 'Cansaço/energia', en: 'Tiredness/energy' },
  ansiedade: { pt: 'Ansiedade', en: 'Anxiety' },
  distracao: { pt: 'Distração/celular', en: 'Distraction/phone' },
  tempo: { pt: 'Falta de tempo', en: 'Lack of time' },
  perfeccionismo: { pt: 'Perfeccionismo', en: 'Perfectionism' },
};

/** Forças que o onboarding oferece para escolha múltipla (até 3). */
export type StrengthId =
  | 'disciplina'
  | 'curiosidade'
  | 'criatividade'
  | 'sociabilidade'
  | 'organizacao'
  | 'energiaFisica'
  | 'calma'
  | 'persistencia';

export const STRENGTH_LABEL: Record<StrengthId, { pt: string; en: string }> = {
  disciplina: { pt: 'Disciplina', en: 'Discipline' },
  curiosidade: { pt: 'Curiosidade', en: 'Curiosity' },
  criatividade: { pt: 'Criatividade', en: 'Creativity' },
  sociabilidade: { pt: 'Sociabilidade', en: 'Sociability' },
  organizacao: { pt: 'Organização', en: 'Organization' },
  energiaFisica: { pt: 'Energia física', en: 'Physical energy' },
  calma: { pt: 'Calma', en: 'Calm' },
  persistencia: { pt: 'Persistência', en: 'Persistence' },
};

/** Nível de evidência: A = meta-análise/RCT · B = estudo observacional forte
 *  ou consenso de especialistas · C = plausível mas com evidência fraca —
 *  só entra com justificativa explícita em `evidence.note`. */
export type EvidenceLevel = 'A' | 'B' | 'C';

export interface CatalogEvidence {
  level: EvidenceLevel;
  /** Citações no formato "Autor Ano" — cada uma tem de estar checável em
   *  `docs/CATALOGO-EVIDENCIAS.md`. Nunca inventar. */
  refs: string[];
  /** Obrigatória quando `level === 'C'`: por que o item entra mesmo assim. */
  note?: string;
}

export type CatalogLevel = 1 | 2 | 3;

export interface CatalogLevelSpec {
  label: { pt: string; en: string };
  target: { pt: string; en: string };
  effort: Effort;
  defaultSchedule: Schedule;
}

export interface CatalogItem {
  id: string;
  /** 'especifica' = comportamento concreto e mensurável ("beber água").
   *  'abrangente' = comportamento amplo que a pessoa concretiza sozinha
   *  ("estudar"). */
  kind: 'especifica' | 'abrangente';
  area: LifeArea;
  category: ActivityCategory;
  emoji: string;
  name: { pt: string; en: string };
  /** Uma frase: "por que funciona", mostrada no cartão do catálogo. */
  why: { pt: string; en: string };
  levels: [CatalogLevelSpec, CatalogLevelSpec, CatalogLevelSpec];
  /** Implementation intention sugerida (Gollwitzer & Sheeran 2006). */
  anchorSuggestion?: { pt: string; en: string };
  addresses: StruggleId[];
  leverages: StrengthId[];
  /** Nunca sugerir a quem declarou esta contraindicação (texto livre curto,
   *  usado só para leitura humana — o recomendador não faz match automático
   *  de texto; a exclusão de área "mente"/tratamento é regra própria). */
  contraindications?: string[];
  evidence: CatalogEvidence;
}
