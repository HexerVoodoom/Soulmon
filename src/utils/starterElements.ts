/**
 * O ELEMENTO DOS 5 INICIAIS — dono único (15/10/2026, REGISTRO §73).
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

/** Elemento de um inicial (`demoCharacterId`); `undefined` para qualquer outro id. */
export function starterElementOf(id: unknown): StarterElement | undefined {
  return isStarterId(id) ? STARTER_ELEMENT[id] : undefined;
}

/** O elemento de COMBATE do pet: o do inicial; senão o dominante do oráculo. Um lugar só para as telas de luta e a aura. */
export function petElementOf(state: { demoCharacterId?: string; soulmonMeta?: { dominantElement?: string } | null }): string | undefined {
  return starterElementOf(state.demoCharacterId) ?? state.soulmonMeta?.dominantElement;
}
