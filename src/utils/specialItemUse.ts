import { CHIP_BOOST, HEART_HEAL, SPECIAL_ITEMS, type Attr } from './shop';

/**
 * O USO de um item especial da pastinha — glitchtama, coraçãozinho, chip.
 *
 * ⚠️ Por que este arquivo existe, e por que NÃO é o `careUpdaters.ts`.
 *
 * O ramo de `SPECIAL_ITEMS` do `handleFeed` carregava **três updaters inline
 * com regra de verdade dentro**: o decremento do inventário (repetido três
 * vezes, palavra por palavra), o `HEART_HEAL`, o `CHIP_BOOST` e o `+1` de
 * `perfectDays`. Regra dentro de updater inline é regra sem teste: nada em
 * `src/utils/*.test.ts` conseguia alcançá-la sem montar o `App.tsx` em jsdom.
 *
 * Não foi para o `careUpdaters.ts` de propósito. Aquele arquivo é dos GESTOS DE
 * CUIDADO COMUNS — carinho e comida —, e a coisa que ele existe para guardar é
 * o TETO (`careCaps`: janela de comida por hora, carinho por dia). Item especial
 * não tem teto nenhum: o próprio `careRules.ts` declara isso por escrito no
 * cabeçalho de `feedFood` ("Itens especiais da loja NÃO passam por aqui: eles
 * têm efeitos próprios e não contam no limite"). Enfiá-los ali reabriria a
 * pergunta "isso conta no teto?" em cima do arquivo cuja razão de ser é
 * responder que sim.
 *
 * Também não foi para o `shop.ts`: aquilo é CATÁLOGO — o que existe, quanto
 * custa, como se chama. Aqui é o que ACONTECE ao usar. Este arquivo consome o
 * catálogo (`SPECIAL_ITEMS`, `CHIP_BOOST`, `HEART_HEAL`) e não o redefine, para
 * os números continuarem tendo um dono só.
 *
 * ⚠️ PROGRESSÃO: `perfectDays`, `totalPerfectDays` e o `CHIP_BOOST` alimentam
 * evolução, que alimenta a árvore e o teto de geração de sprite. Esta extração
 * é aritmeticamente idêntica ao que estava inline — há teste travando cada
 * número (`specialItemUse.test.ts`).
 *
 * O que fica no `App.tsx`: só os efeitos (som por tipo de item, animação de
 * comer, toast do glitchtama) e a decisão de recusar, que dispara sinal na UI e
 * por isso não pode morar dentro de um updater — efeito colateral em updater
 * roda 2× no StrictMode.
 */

export type SpecialRefusal = 'no-stock' | 'already-full';

/** Fatia do GameState que o uso de item especial lê e escreve. */
export interface SpecialItemState {
  healthPoints: number;
  maxHealthPoints: number;
  foodInventory: Record<string, number>;
  perfectDays: number;
  totalPerfectDays?: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  totalXP: number;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
}

/**
 * O uso seria recusado? Separado de `applySpecialItem` pelo mesmo motivo de
 * `rubDecision`: a recusa acende sinal na UI (o coração cheio pisca o
 * `healCapSignal`), e efeito colateral não entra em updater.
 *
 * O `petPassive` não entra aqui de propósito: nenhum traço mexe em item
 * especial hoje. Se um dia mexer, ele vem do ESTADO, como em `rubDecision`.
 */
export function specialRefusal(state: SpecialItemState, emoji: string): SpecialRefusal | undefined {
  const special = SPECIAL_ITEMS[emoji];
  if (!special) return undefined;
  if ((state.foodInventory[emoji] ?? 0) <= 0) return 'no-stock';
  // Só o coraçãozinho recusa por estado: ele é a única cura comprável, e gastar
  // um com a vida cheia queimaria o item por nada.
  if (special.kind === 'heart' && state.healthPoints >= state.maxHealthPoints) return 'already-full';
  return undefined;
}

/**
 * Um item especial usado sobre o `prev`.
 *
 * ⚠️ A recusa é RECONFERIDA aqui, sobre o `prev` — a checagem de fora existe só
 * pelo sinal na UI. É a família de bug do X-6, e ela ESTAVA presente no
 * coraçãozinho: a recusa de vida cheia só era lida do `gameState` de fora, e o
 * updater inline se limitava a clampar a cura com `Math.min`. Dois toques no
 * mesmo lote do React com 4/5 de vida liam o mesmo `gameState` (4 < 5, passa
 * duas vezes), e a segunda passada decrementava o inventário para curar ZERO —
 * um coraçãozinho queimado em silêncio. Aqui a segunda passada já enxerga a
 * vida cheia que a primeira escreveu e devolve `prev` intacto.
 *
 * O estoque também vem do `prev`, e não de fora, pelo mesmo motivo: com UM item
 * no inventário, dois toques no mesmo lote passariam os dois pela checagem
 * externa.
 */
export function applySpecialItem<T extends SpecialItemState>(
  prev: T,
  emoji: string,
): { state: T; refused?: SpecialRefusal } {
  const special = SPECIAL_ITEMS[emoji];
  if (!special) return { state: prev };

  const refused = specialRefusal(prev, emoji);
  if (refused) return { state: prev, refused };

  // Decremento do inventário — era esta a linha copiada três vezes inline.
  const count = prev.foodInventory[emoji] ?? 0;
  const foodInventory = { ...prev.foodInventory, [emoji]: count - 1 };
  if (foodInventory[emoji] === 0) delete foodInventory[emoji];

  if (special.kind === 'glitchtama') {
    // 🌀 Glitchtama: cai zerando as 5 salas da masmorra e vale 1 dia perfeito —
    // isto é PONTO DE EVOLUÇÃO, não enfeite. `perfectDays` é o contador que a
    // escada consome; `totalPerfectDays` é o vitalício das missões, e por isso
    // ele NÃO é decrementado na evolução (ver `degeneratedPerfectDays`).
    return {
      state: {
        ...prev,
        foodInventory,
        perfectDays: prev.perfectDays + 1,
        totalPerfectDays: (prev.totalPerfectDays ?? 0) + 1,
      },
    };
  }

  if (special.kind === 'heart') {
    // A única cura comprável. O `Math.min` continua aqui como segunda trava,
    // mas quem barra o desperdício agora é a recusa acima.
    return {
      state: {
        ...prev,
        foodInventory,
        healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + HEART_HEAL),
      },
    };
  }

  // Chip: só atributo, sem energia. Os três atributos são escritos por extenso
  // em vez de por chave computada porque a chave computada obriga o retorno a
  // largar o tipo do estado — e era exatamente disso que o updater inline vivia.
  const attr = special.attr as Attr;
  const boost = (a: Attr) => (attr === a ? CHIP_BOOST : 0);
  const since = prev.attributesSinceLastEvolution;
  return {
    state: {
      ...prev,
      foodInventory,
      virusPoints: prev.virusPoints + boost('virus'),
      dataPoints: prev.dataPoints + boost('data'),
      vaccinePoints: prev.vaccinePoints + boost('vaccine'),
      totalXP: prev.totalXP + CHIP_BOOST * 10,
      attributesSinceLastEvolution: {
        virus: (since?.virus ?? 0) + boost('virus'),
        data: (since?.data ?? 0) + boost('data'),
        vaccine: (since?.vaccine ?? 0) + boost('vaccine'),
      },
    },
  };
}
