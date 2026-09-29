/**
 * O PALCO DO BOSQUE (`docs/PLANO-GUILDA.md` §6 e §3.2, WPG-11) — quem aparece
 * no visor da roda e onde.
 *
 * `petStage.ts` descreve o palco de UM pet só (`PET_BOX`, `DECOR_SLOTS`, os cinco
 * espaços de objeto), e o Bosque tem uma composição diferente: até quatro
 * criaturas pequenas na MESMA linha do chão (`GROUND_Y`). Esta é a parte PURA,
 * para o teste provar as regras sem montar React:
 *
 *  · **de 5 a 12 membros, só a SUA criatura** — a fileira com lacunas de uma roda
 *    de 12 é a sala de aula que LV-G2 veta;
 *  · **até 4, todos, na ORDEM DE CHEGADA** que o servidor manda: nada de ordenar
 *    por presença, e nenhuma criatura "apagada" ou vazia para quem não veio hoje
 *    (o palco nem lê `apareceuHoje`);
 *  · **nunca o estágio, a linha ou o HP de outra pessoa** (LV-G10): o servidor não
 *    os manda, então a criatura dos OUTROS é uma das nossas linhas escolhida por
 *    hash do id público — a mesma decisão do `legacySpriteForStage`: o mesmo
 *    membro renderiza sempre a mesma criatura. Nunca URL de sprite alheia
 *    (`isSafeSpriteUrl` não fixa host).
 */
import { GUILD_PRESENCE_NOMINAL_MAX } from './guildRules';
import { DUNGEON_LINE_SPRITES } from './sprites';
import type { GuildView } from './community';

/** Escalas INTEIRAS do sprite de 256² (2× e 4×): escala fracionária borra pixel art. */
export const OWN_RENDER = 128;
export const OTHER_RENDER = 64;

export interface GroveCreature {
  /** Chave estável (o id público do membro, ou a posição). */
  key: string;
  own: boolean;
  /** Centro horizontal, em % da largura do visor. */
  x: number;
  /** Lado renderizado, em px. */
  size: number;
  /** Só existe para as dos OUTROS (a própria vem do App, que sabe o estágio). */
  sprite: string | null;
}

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

const LINES = Object.keys(DUNGEON_LINE_SPRITES);

/** A criatura de um membro que não sou eu: uma das nossas linhas, por hash — nunca o estágio dele. */
export function spriteForMember(key: string): string {
  return DUNGEON_LINE_SPRITES[LINES[hash(key) % LINES.length]].rookie;
}

/**
 * Largura NOMINAL do vidro em px (a folha real mede ~326 em 390 de tela). A
 * distribuição é feita nela e devolvida em %: criaturas de tamanhos diferentes
 * (a sua é o dobro) não podem ficar equidistantes pelo CENTRO, senão a grande
 * come a vizinha. O vão é o que sobra dividido entre n+1 espaços — nada colado
 * na borda arredondada, e os pés todos na mesma linha do chão.
 */
const VIDRO_NOMINAL = 320;

export function spreadX(sizes: number[]): number[] {
  const vao = Math.max(0, (VIDRO_NOMINAL - sizes.reduce((a, b) => a + b, 0)) / (sizes.length + 1));
  let cursor = 0;
  return sizes.map(size => {
    cursor += vao;
    const centro = cursor + size / 2;
    cursor += size;
    return Math.round((centro / VIDRO_NOMINAL) * 1000) / 10;
  });
}

export function groveCreatures(guild: Pick<GuildView, 'size' | 'members'>): GroveCreature[] {
  const nominal = guild.size <= GUILD_PRESENCE_NOMINAL_MAX && guild.members.length > 0 && guild.members.length <= GUILD_PRESENCE_NOMINAL_MAX;
  const sozinho: GroveCreature[] = [{ key: 'eu', own: true, x: 50, size: OWN_RENDER, sprite: null }];
  if (!nominal) return sozinho;
  if (!guild.members.some(m => m.euMesmo)) return sozinho;
  const sizes = guild.members.map(m => (m.euMesmo ? OWN_RENDER : OTHER_RENDER));
  const xs = spreadX(sizes);
  return guild.members.map((m, i) => ({
    key: m.id ?? `m${i}`,
    own: m.euMesmo,
    x: xs[i],
    size: sizes[i],
    sprite: m.euMesmo ? null : spriteForMember(m.id ?? `m${i}`),
  }));
}
