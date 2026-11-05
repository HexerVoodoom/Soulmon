/**
 * O ELEMENTO DOS 5 INICIAIS — dono único (15/10/2026, REGISTRO §75).
 *
 * Cada inicial grátis usa UM dos 17 elementos BASE (os mesmos nomes do anel da Arena,
 * `BASE_ELEMENT_LABELS`) e o mesmo elemento vale para: o golpe básico e o especial, a arte de FX
 * (`fx-ataque/fx-<elemento>-*`), a aura, a vantagem na Arena e o TIPO exibido na escolha.
 *
 *  - Crato  (tartaruga de caixotes)  → terra     (pedido do dono)
 *  - Brooka (pato)                   → som       (pedido do dono)
 *  - Zefi   (borboleta)              → ar        (pedido do dono)
 *  - Oaken  (planta/árvore)          → vida      (pedido do dono)
 *  - Bolid  (o vermelho)             → fogo      (pedido do dono)
 *
 * ⚠️ Módulo LEVE de propósito (só dados): é importado por `monetization.ts` e pelo `App`. As skills
 * (nome/escola do golpe) moram em `starterSkills.ts`, que puxa o motor da ficha e só entra por import dinâmico.
 * Os iniciais NÃO mudam de HP, dano nem linha de evolução: só o elemento (e a vantagem/desvantagem que ele
 * traz na Arena, como qualquer Soulmon elemental).
 */
import type { StarterId } from './sprites';
import { isStarterId } from './sprites';
import { isCorvo } from './corvoPet';
import { elementoDoOraculo } from './elementoDoOraculo';
import { elementoDoEstagioAtual, type ElementoJornada } from './elementoJornada';

export type StarterElement = 'terra' | 'som' | 'ar' | 'vida' | 'fogo';
/** Divisão do jogo (REGISTRO §67): Poder, Harmonia ou Benevolência. */
export type StarterAlignment = 'poder' | 'harmonia' | 'benevolencia';

export const STARTER_ELEMENT: Record<StarterId, StarterElement> = {
  industrial: 'terra', nascente: 'som', alento: 'ar', vida: 'vida', meteoro: 'fogo',
};

export const STARTER_ALIGNMENT: Record<StarterId, StarterAlignment> = {
  industrial: 'benevolencia', // terra
  nascente: 'harmonia',       // som
  alento: 'benevolencia',     // ar
  vida: 'benevolencia',       // vida
  meteoro: 'poder',           // fogo
};

export type PetElementState = { demoCharacterId?: string; potionElement?: string; evolutionStage?: string; elementoJornada?: ElementoJornada; soulmonMeta?: { dominantElement?: string; creature?: string } | null };

/** Elemento de um inicial (`demoCharacterId`); `undefined` para qualquer outro id. */
export function starterElementOf(id: unknown): StarterElement | undefined {
  return isStarterId(id) ? STARTER_ELEMENT[id] : undefined;
}

/** O elemento de COMBATE do pet: o do inicial; senão o dominante do oráculo validado (`elementoDoOraculo`: planta/industrial passam como são; id desconhecido→`undefined`). Um lugar só para as telas de luta e a aura.
 *  O corvinho do administrador é NEUTRO (dono, 20/10/2026): o dominante do oráculo que ficou no save dele não vale. É o ÚNICO caso em que
 *  isto devolve `'neutro'` (nenhum elemento do oráculo nem inicial se chama assim) — `fighterIdentity` lê esse valor como "ficha não decide". */
export function petElementOf(state: PetElementState): string | undefined {
  if (isCorvo({ soulmonMeta: state.soulmonMeta ?? undefined })) return 'neutro';
  // Poção de Elemento (30/10/2026): o elemento dado numa evolução vence o do oráculo (os iniciais não evoluem, então não colidem).
  // §230: o elemento do ESTÁGIO, gravado na evolução, vem antes do de nascimento; forma sem registro (save antigo) segue no do oráculo.
  return elementoDoOraculo(state.potionElement) ?? starterElementOf(state.demoCharacterId) ?? elementoDoEstagioAtual(state.elementoJornada, state.evolutionStage)?.id ?? elementoDoOraculo(state.soulmonMeta?.dominantElement);
}

/** A base nº 1 gravada para o estágio, que decide a vantagem (§230). `undefined` quando o elemento não vem do registro: vale a base dominante de sempre. */
export function petBaseOf(state: PetElementState): string | undefined {
  if (isCorvo({ soulmonMeta: state.soulmonMeta ?? undefined }) || state.potionElement || starterElementOf(state.demoCharacterId)) return undefined;
  return elementoDoEstagioAtual(state.elementoJornada, state.evolutionStage)?.base;
}
