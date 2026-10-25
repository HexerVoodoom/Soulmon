/**
 * O PERFIL DO SOULMON (beta-2, 11, 13/10/2026) — a LEITURA pura do que o app já sabe sobre o Soulmon, para o prédio `laboratorio.perfil`.
 *
 * Nada aqui inventa dado: cada campo sai do dono dele e vira `null` quando o app não tem o valor (a tela então NÃO desenha a linha):
 *  · personalidade        ← `petPassive` (`utils/passives.ts`, o traço de nascimento);
 *  · atributo principal   ← o maior entre ATK/DEF/SPD do `soulCombatant` (`utils/soulXP.ts`) — QUALITATIVO: Força / Resistência / Agilidade,
 *                           nunca o número (o prédio não mostra pontuação). Empate: Força > Resistência > Agilidade;
 *  · equipamento          ← o MAIOR nível entre as peças EQUIPADAS no Soulsmith (`utils/forge.ts › pieceLevel`); sem peça equipada, `null`;
 *  · elemento principal   ← `fighterIdentity(...).basico.elemento` (dono único da identidade de combate — o mesmo da luta);
 *  · tipo de ataque       ← `fighterIdentity(...).basico.forma` (corpo a corpo × à distância);
 *  · especial (nome e efeito) ← a skill especial da ficha do estágio e `fighterIdentity(...).especial.familia`; sem ficha, `null`;
 *  · elemento do especial ← sempre que há ficha (igual ao do principal também aparece; o card mostra o especial sempre).
 *
 * 11.3: o elemento e o tipo de ataque saíram da Arena livre (`DueloSheet`) e moram SÓ aqui — a fonte continua uma (`fighterIdentity`).
 * Sem React, sem relógio, sem localStorage.
 */
import { soulCombatant, type SoulXPState } from './soulXP';
import { fighterIdentity } from './fighterIdentity';
import { elementoDoOraculo } from './elementoDoOraculo';
import { elementoConhecido } from './soulProfile/ficha/elementoNome';
import { getStageLevel } from '../types/progression';
import { pieceLevel } from './forge';
import { EQUIP_SLOTS } from './equipment';
import { getPassive, type PetPassive } from './passives';
import type { SpecialFamily } from './combate/specials';
import type { StageSkills } from './soulProfile/ficha/skills';
import type { FichaStage } from './soulProfile/ficha/types';
import type { StrikeForm } from './soulProfile/ficha/strikeForm';

export type MainAttr = 'forca' | 'resistencia' | 'agilidade';

export interface PerfilInput extends SoulXPState {
  evolutionStage: string;
  petPassive?: string;
  /** A ficha por estágio (`gameState.soulmonSkills`). */
  skills?: Partial<Record<FichaStage, StageSkills>> | null;
  /** O elemento dominante do oráculo — o fallback da identidade sem ficha. */
  petElement?: string | null;
  /** `gameState.equipment` (peças possuídas/equipadas) e `gameState.forge` (níveis). */
  equipment?: unknown;
  forge?: unknown;
}

export interface Perfil {
  personalidade: PetPassive | null;
  atributo: MainAttr;
  /** Maior nível entre as peças equipadas no Soulsmith; `null` = nada equipado. */
  equipamentoNivel: number | null;
  elementoId: string;
  forma: StrikeForm;
  /** Nome do ataque básico da ficha; `null` sem ficha. */
  basicoNome: { pt: string; en: string } | null;
  /** Só com ficha do estágio. O elemento do especial aparece SEMPRE (inclusive igual ao do básico). */
  especial: { nome: { pt: string; en: string }; familia: SpecialFamily; elementoId: string } | null;
}

/** O estágio da ficha (mesma regra do `DueloSheet` de antes e do `ArenaGame`). */
export function fichaStageOf(evolutionStage: string): FichaStage {
  const nivel = getStageLevel(evolutionStage);
  return (['rookie', 'champion', 'ultimate', 'mega', 'ultra'].includes(nivel) ? nivel : 'rookie') as FichaStage;
}

/** O atributo que mais pesa no combatente (qualitativo). Empate: Força > Resistência > Agilidade. */
export function atributoPrincipal(c: { atk: number; def: number; spd: number }): MainAttr {
  if (c.atk >= c.def && c.atk >= c.spd) return 'forca';
  if (c.def >= c.spd) return 'resistencia';
  return 'agilidade';
}

/** O maior nível entre as peças equipadas; `null` sem equipamento. Lê o save cru e tolera lixo (nada de peça = `null`). */
export function nivelDoEquipamento(equipment: unknown, forge: unknown): number | null {
  const eq = (equipment ?? {}) as { owned?: unknown; equipped?: Record<string, unknown> };
  const owned = Array.isArray(eq.owned) ? (eq.owned as unknown[]) : [];
  const equipped = eq.equipped && typeof eq.equipped === 'object' ? eq.equipped : {};
  let best: number | null = null;
  for (const slot of EQUIP_SLOTS) {
    const id = (equipped as Record<string, unknown>)[slot];
    if (typeof id !== 'string' || !owned.includes(id)) continue;
    const lvl = pieceLevel(id, forge, true);
    if (lvl > 0 && (best === null || lvl > best)) best = lvl;
  }
  return best;
}

export function buildPerfil(input: PerfilInput): Perfil {
  const par = input.skills?.[fichaStageOf(input.evolutionStage)];
  const ident = fighterIdentity(par, elementoDoOraculo(input.petElement) ?? input.petElement); // defesa: o oráculo cru vira o da classe
  const c = soulCombatant(input);
  const esp = par?.especial;
  const elEsp = ident.especial.elemento;
  return {
    personalidade: getPassive(input.petPassive) ?? null,
    atributo: atributoPrincipal(c),
    equipamentoNivel: nivelDoEquipamento(input.equipment, input.forge),
    elementoId: ident.basico.elemento,
    forma: ident.basico.forma,
    basicoNome: par?.basica?.nome ? (par.basica.nome as { pt: string; en: string }) : null,
    especial: esp?.nome
      ? {
          nome: esp.nome as { pt: string; en: string },
          familia: ident.especial.familia,
          // sempre presente: o do especial se conhecido; senão o do básico (igual não some mais).
          elementoId: elementoConhecido(elEsp) ? elEsp : ident.basico.elemento,
        }
      : null,
  };
}

/** Rótulos curtos (PT/EN). Dono único dos textos do Perfil — a tela não escreve texto à mão. */
export const PERFIL_ATRIBUTO: Readonly<Record<MainAttr, { pt: string; en: string }>> = {
  forca: { pt: 'Força', en: 'Strength' },
  resistencia: { pt: 'Resistência', en: 'Resilience' },
  agilidade: { pt: 'Agilidade', en: 'Agility' },
};
export const PERFIL_FORMA: Readonly<Record<StrikeForm, { pt: string; en: string }>> = {
  melee: { pt: 'Corpo a corpo', en: 'Melee' },
  ranged: { pt: 'À distância', en: 'Ranged' },
};
/** O efeito principal do especial, em uma ou duas palavras (a família do núcleo de combate). */
export const PERFIL_EFEITO: Readonly<Record<SpecialFamily, { pt: string; en: string }>> = {
  direct: { pt: 'Dano', en: 'Damage' },
  dot: { pt: 'Dano contínuo', en: 'Damage over time' },
  heal: { pt: 'Cura', en: 'Healing' },
  shield: { pt: 'Escudo', en: 'Shield' },
  atkBuff: { pt: 'Apoio: mais ataque', en: 'Support: more attack' },
  defDebuff: { pt: 'Enfraquece a defesa', en: 'Weakens defense' },
  spdBuff: { pt: 'Apoio: mais ritmo', en: 'Support: more speed' },
};

/** O IMPACTO de cada campo no jogo (curto; só o que a regra do código faz — combate `utils/combate/`, `bonus.ts`, anel de elementos). */
export const PERFIL_IMPACTO = {
  atributo: {
    forca: { pt: 'Seus golpes pesam mais em toda luta.', en: 'Your hits land harder in every fight.' },
    resistencia: { pt: 'Aguenta mais dano em toda luta.', en: 'You take less damage in every fight.' },
    agilidade: { pt: 'Seus ataques saem mais rápido em toda luta.', en: 'Your attacks come faster in every fight.' },
  } as Readonly<Record<MainAttr, { pt: string; en: string }>>,
  equipamento: {
    pt: 'Peças do Soulsmith dão um bônus pequeno em combate; melhorar a peça aumenta o bônus, e nenhuma fonte passa do teto.',
    en: 'Soulsmith pieces give a small combat bonus; upgrading a piece raises it, and no source goes past the ceiling.',
  },
  basico: {
    pt: 'O elemento do golpe básico decide contra quem você é forte ou fraco no anel de elementos.',
    en: 'The basic strike element decides who you are strong or weak against on the element ring.',
  },
  especial: {
    pt: 'O efeito mostra o que o especial faz na luta: machuca, cura, protege ou apoia.',
    en: 'The effect shows what the special does in a fight: hurt, heal, shield or support.',
  },
} as const;
