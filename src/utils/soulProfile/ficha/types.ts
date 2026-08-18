// ---------------------------------------------------------------------------
// Ficha do class-system — vocabulário.
//
// Os DADOS (profissões, talentos, criaturas, famílias) vêm do snapshot
// `classSystem.data.json`, gerado por `scripts/sync-oracle-data.mjs` a partir
// do repositório real `HexerVoodoom/Class-System` — com procedência (SHA)
// gravada no próprio arquivo. Estes tipos descrevem o snapshot e a `Ficha`
// que a distribuição de pontos monta; os ids batem 1:1 com o class-system,
// então uma Ficha daqui é um `Personagem` válido lá.
// ---------------------------------------------------------------------------

import type { ClassElementId } from '../types';

export type ElementoBaseId = ClassElementId;

export type EscolaId =
  | 'combate_fisico' | 'longo_alcance' | 'evocacao' | 'conjuracao' | 'benca' | 'maldicao';

export type RecursoId = 'mana' | 'fe' | 'furia' | 'soullink' | 'ressonancia';

export type ProfissaoId =
  | 'ferreiro' | 'tecelao' | 'artesao' | 'joalheiro' | 'alquimista' | 'curtidor'
  | 'encantador' | 'escriba' | 'cozinheiro' | 'luthier' | 'cartografo';

export interface TalentoSnapshot {
  nome: string;
  ranksMaximos: number;
  requisito?: { escola?: EscolaId; recurso?: RecursoId; nivelMinimo: number };
  exclusivoCom?: string[];
}

export interface ProfissaoSnapshot {
  nome: string;
  fatoresElementos: Partial<Record<string, number>>;
  fatoresEscolas?: Partial<Record<EscolaId, number>>;
}

export interface CriaturaSnapshot {
  nome: string;
  familia: string;
  afinidades: ElementoBaseId[];
  poderBase: number;
}

/** Diais da alocação geracional, copiados do `taxonomy.json` v2 do
 *  class-system (que os gera de `src/registry/geracoes.ts`). Chaves = ARIDADE
 *  em texto ('1' = base, '2' = par, '3' = tripla, '4' = quádrupla) — o
 *  Soulmon só replica 1 e 2, mas o bloco vem inteiro para que uma mudança lá
 *  chegue aqui sem outro round de sync. */
export interface GeracoesSnapshot {
  divisorCascata: Record<string, number>;
  limiarDestravamento: Record<string, number>;
  custoPontoAlocacao: Record<string, number>;
}

export interface ClassSystemSnapshot {
  _provenance: { repo: string; ref: string; sha: string; syncedAt: string };
  escolas: Record<EscolaId, { nome: string }>;
  recursos: Record<RecursoId, { nome: string }>;
  profissoes: Record<ProfissaoId, ProfissaoSnapshot>;
  talentos: Record<string, TalentoSnapshot>;
  criaturas: Record<string, CriaturaSnapshot>;
  familias: Record<string, { nome: string }>;
  geracoes: GeracoesSnapshot;
}

/** A ficha de personagem que a distribuição monta para UM estágio. */
export interface Ficha {
  nome: string;
  /** Pontos diretos por elemento. Chaves são ids BASE e, nos estágios altos,
   *  ids de PAR destravado pela cascata geracional (ex.: `vapor`) — exatamente
   *  como um `Personagem` do class-system pós-destrave. */
  elementos: Partial<Record<string, number>>;
  escolas: Partial<Record<EscolaId, number>>;
  recursos: Partial<Record<RecursoId, number>>;
  talentos: Partial<Record<string, number>>;
  profissoes: Partial<Record<ProfissaoId, number>>;
  totals: {
    /** Em pontos de ORÇAMENTO: base custa 1, par destravado custa 2
     *  (`CUSTO_PONTO_PAR`) — o peso econômico da geração. */
    elementos: number;
    escolas: number;
    recursos: number;
    talentos: number;
    profissoes: number;
  };
}

export type FichaStage = 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra';
export const FICHA_STAGE_ORDER: FichaStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
