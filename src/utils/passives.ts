// ---------------------------------------------------------------------------
// TRAÇOS DE NASCIMENTO
//
// Cada Soulmon nasce com UM traço sorteado. Ele não muda nada de fundamental —
// muda um detalhe do dia a dia, e é isso que transforma "meu bichinho" em *o
// meu* bichinho. Dois jogadores no mesmo estágio têm rotinas ligeiramente
// diferentes, e isso dá o que contar.
//
// REGRA DE DESIGN: todo traço é POSITIVO. Um traço negativo puniria o jogador
// por um dado que ele não jogou, e o Soulmon não pune por sorte. A variedade
// vem de serem diferentes EM ESPÉCIE (um mexe na comida, outro no carinho,
// outro no cocô), não de uns serem melhores que os outros.
//
// Como é lido: o traço mora no GameState (`petPassive`) e as regras de cuidado
// leem dele — nunca por parâmetro novo. É o que faz o app de desktop herdar o
// comportamento de graça, sem uma segunda implementação para divergir.
// ---------------------------------------------------------------------------

export interface PetPassive {
  id: string;
  emoji: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
}

export const PET_PASSIVES: readonly PetPassive[] = [
  {
    id: 'guloso',
    emoji: '🍴',
    namePt: 'Guloso',
    nameEn: 'Foodie',
    descPt: 'Come com tanto gosto que cada refeição rende 1 ponto de atributo a mais.',
    descEn: 'Eats with such gusto that every meal grants 1 extra attribute point.',
  },
  {
    id: 'carinhoso',
    emoji: '🫶',
    namePt: 'Carinhoso',
    nameEn: 'Cuddly',
    descPt: 'Adora colo: o carinho cura até 1½ coração por dia, em vez de 1.',
    descEn: 'Loves being held: rubbing heals up to 1½ hearts a day instead of 1.',
  },
  {
    id: 'teimoso',
    emoji: '🛡️',
    namePt: 'Teimoso',
    nameEn: 'Stubborn',
    descPt: 'Não se abala fácil: num dia ruim perde só meio coração.',
    descEn: 'Not easily shaken: a rough day costs only half a heart.',
  },
  {
    id: 'sortudo',
    emoji: '🍀',
    namePt: 'Sortudo',
    nameEn: 'Lucky',
    descPt: 'Tropeça em coisa boa: acha coraçãozinho na masmorra com mais frequência.',
    descEn: 'Stumbles into good things: finds Little Hearts in the dungeon more often.',
  },
  {
    id: 'madrugador',
    emoji: '🌅',
    namePt: 'Madrugador',
    nameEn: 'Early Bird',
    descPt: 'Tem seus horários: nunca faz cocô antes das 10h da manhã.',
    descEn: 'Keeps a schedule: never poops before 10am.',
  },
] as const;

/** Sorteia o traço de um Soulmon recém-nascido. */
export function rollPetPassive(rng: () => number = Math.random): string {
  return PET_PASSIVES[Math.floor(rng() * PET_PASSIVES.length)].id;
}

export function getPassive(id: string | undefined): PetPassive | undefined {
  if (!id) return undefined;
  return PET_PASSIVES.find(p => p.id === id);
}

/** `true` se o pet tem exatamente este traço. Saves antigos (sem traço) dão `false`. */
export function hasPassive(petPassive: string | undefined, id: string): boolean {
  return petPassive === id;
}

// --- Efeitos, num lugar só, para não se espalharem por handlers ------------

/** Pontos de atributo extras por comida (traço Guloso). */
export const GULOSO_BONUS_ATTR = 1;

/** Teto de cura por carinho no dia, considerando o traço Carinhoso. */
export function rubDailyCap(petPassive: string | undefined, baseCap: number): number {
  return hasPassive(petPassive, 'carinhoso') ? baseCap + 0.5 : baseCap;
}

/** Teto de corações perdidos por dia, considerando o traço Teimoso. */
export function heartLossCap(petPassive: string | undefined, baseCap: number): number {
  return hasPassive(petPassive, 'teimoso') ? baseCap / 2 : baseCap;
}

/** Pontos percentuais somados à chance de coraçãozinho (traço Sortudo). */
export function heartDropBonus(petPassive: string | undefined): number {
  return hasPassive(petPassive, 'sortudo') ? 0.05 : 0;
}

/** Hora mínima em que o cocô pode aparecer (traço Madrugador). */
export function earliestPoopHour(petPassive: string | undefined, baseHour: number): number {
  return hasPassive(petPassive, 'madrugador') ? Math.max(baseHour, 10) : baseHour;
}
