// ---------------------------------------------------------------------------
// Vocabulário do perfil de alma (soulProfile) — a leitura ROBUSTA que virou o
// oráculo do Soulmon.
//
// Os eixos que importam para o jogo (`ElementId` / `RoleId` / `AlignmentId` /
// `RealmId`) NÃO são redeclarados aqui: vêm de `utils/oracle.ts`, que continua
// sendo a fonte da verdade do vocabulário do jogo. Este módulo produz os
// MESMOS eixos por um caminho melhor (psicometria + efemérides reais +
// numerologia completa) — ele troca o motor, não a linguagem.
//
// Origem: repositório `teste-personalidade` (`src/lib/oracle/types.ts`).
// ---------------------------------------------------------------------------

import type {
  AlignmentId, ElementId, RealmId, RoleId,
} from '../oracle';
import type { DominantElementCandidate } from './derivedElements';

export type { AlignmentId, ElementId, RealmId, RoleId };

/**
 * Registro de 17 elementos do class-system
 * (`class-system/src/registry/elementos.ts`). Só 6 têm nome igual aos 8 do
 * Soulmon (`agua fogo terra ar sombra luz`); os outros 11 não têm âncora nos
 * dados de personalidade/astros/numerologia e ficam num piso baixo e
 * documentado em vez de inventados.
 *
 * O Soulmon não consome esses elementos hoje — quem consome é a ficha de
 * personagem do class-system. Eles ficam aqui porque são parte do contrato de
 * saída do motor, e manter o arquivo idêntico ao do `teste-personalidade` é o
 * que permite sincronizar os dois com um diff em vez de uma reescrita.
 */
export type ClassElementId =
  | 'fogo' | 'agua' | 'terra' | 'ar'
  | 'eletricidade' | 'arcano' | 'sombra' | 'luz'
  | 'vileza' | 'morte' | 'vida' | 'vigor'
  | 'marcial' | 'tempo' | 'som' | 'gravidade' | 'espaco';

export const CLASS_ELEMENT_ORDER: ClassElementId[] = [
  'fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz',
  'vileza', 'morte', 'vida', 'vigor', 'marcial', 'tempo', 'som', 'gravidade', 'espaco',
];

/** Os quatro eixos do jogo, já normalizados para somar 100 em cada eixo. */
export interface OracleAxes {
  elements: Record<ElementId, number>;
  roles: Record<RoleId, number>;
  alignments: Record<AlignmentId, number>;
  realms: Record<RealmId, number>;
  /** Ponte provisória com o registro de 17 elementos do class-system. */
  classElements: Record<ClassElementId, number>;
  dominantElement: ElementId;
  dominantRole: RoleId;
  dominantAlignment: AlignmentId;
  dominantRealm: RealmId;
  /**
   * Elemento(s) do class-system — base ou combo derivado (ex.: Água+Terra →
   * Pântano) — que melhor representam `classElements`, considerando o
   * equilíbrio entre os componentes do par. Ver `derivedElements.ts`. 1–3.
   */
  dominantClassElements: DominantElementCandidate[];
}
