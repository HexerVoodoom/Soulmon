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
  digiegg: 0,         // Egg (Start)
  pichimon: 50,       // Egg → Baby I (1 day)
  pukamon: 150,       // Baby I → Baby II (2 days)
  tapirmon: 300,      // Baby II → Rookie (4 days)
  champion: 600,      // Rookie → Champion (7 days)
  ultimate: 1000,     // Champion → Ultimate (9 days)
  mega: 1500,         // Ultimate → Mega (11 days)
  itto: 2300,         // Mega → Itto Mode (14 days)
};

export type BranchType = 'virus' | 'data' | 'vaccine';

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
