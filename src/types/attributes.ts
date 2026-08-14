export interface AttributePoints {
  virus: number;
  data: number;
  vaccine: number;
}

export type ActivityCategory = 
  | 'Health' 
  | 'Creativity' 
  | 'Discipline' 
  | 'Study' 
  | 'Work' 
  | 'Social' 
  | 'Wellness' 
  | 'Fitness';

export const CATEGORY_ATTRIBUTES: Record<ActivityCategory, AttributePoints> = {
  Health: { virus: 1, data: 1, vaccine: 2 },
  Creativity: { virus: 3, data: 1, vaccine: 0 },
  Discipline: { virus: 0, data: 1, vaccine: 3 },
  Study: { virus: 0, data: 3, vaccine: 1 },
  Work: { virus: 1, data: 2, vaccine: 1 },
  Social: { virus: 1, data: 1, vaccine: 2 },
  Wellness: { virus: 1, data: 2, vaccine: 1 },
  Fitness: { virus: 2, data: 1, vaccine: 1 },
};

export const XP_THRESHOLDS = {
  champion: 600,      // Rookie → Champion (7 days)
  ultimate: 1000,     // Champion → Ultimate (9 days)
  mega: 1500,         // Ultimate → Mega (11 days)
  itto: 2300,         // Mega → Itto Mode (14 days)
};

export type BranchType = 'virus' | 'data' | 'vaccine';

/** Cor de cada atributo (Poder/Harmonia/Benevolência) — FONTE ÚNICA DA VERDADE.
 *  Toda tela que pinta um atributo importa daqui; não redeclare localmente. */
export const ATTR_COLOR: Record<BranchType, string> = {
  virus: '#22A900',   // Poder
  data: '#009ED8',    // Harmonia
  vaccine: '#E69600', // Benevolência
};

/**
 * A mesma cor de `ATTR_COLOR`, mas na luminosidade que passa 4,5:1 como
 * TEXTO — por tema, via variável CSS (o tema é resolvido no CSS, e prender
 * isto a um hook faria cada tela repetir a decisão).
 *
 * Regra: preenchimento, ícone e linha usam `ATTR_COLOR`; TEXTO usa isto.
 * Os valores e as razões medidas estão em `src/index.css` (bloco
 * "Tinta de TEXTO dos três atributos").
 */
export const ATTR_INK: Record<BranchType, string> = {
  virus: 'var(--sm-attr-virus-ink)',
  data: 'var(--sm-attr-data-ink)',
  vaccine: 'var(--sm-attr-vaccine-ink)',
};

/** Tinta escura para texto POR CIMA de um preenchimento de atributo.
 *  Branco sobre eles mede 2,4–3,1:1; esta mede 5,4–7,0:1. */
export const ATTR_ON_FILL_INK = '#04211f';

export interface EvolutionBranch {
  type: BranchType;
  name: string;
  color: string;
  emoji: string;
  description: string;
}

export const EVOLUTION_BRANCHES: Record<BranchType, EvolutionBranch> = {
  virus: {
    type: 'virus',
    name: 'Virus',
    color: '#E94F4F',
    emoji: '🦠',
    description: 'Instinct, intensity, creative chaos',
  },
  data: {
    type: 'data',
    name: 'Data',
    color: '#4F80E9',
    emoji: '💾',
    description: 'Intellect, balance, knowledge',
  },
  vaccine: {
    type: 'vaccine',
    name: 'Vaccine',
    color: '#66E94F',
    emoji: '💉',
    description: 'Discipline, empathy, control',
  },
};
