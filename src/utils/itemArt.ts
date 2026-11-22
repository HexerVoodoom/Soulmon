// Arte pixel dos CONSUMÍVEIS — comidas comuns e itens especiais da pastinha.
// Fronteira de troca no molde de `decorArt.ts`/`dreamArt.ts`: quem desenha
// importa daqui e não conhece PNG nenhum.
//
// ⚠️ A CHAVE É O EMOJI, e isso é deliberado: `foodInventory` indexa o estoque
// do jogador POR EMOJI (save antigo, widget Android e desktop leem assim), e
// `SPECIAL_ITEMS` idem. Trocar a chave quebraria save; trocar SÓ A ARTE não
// quebra nada. O emoji continua sendo a identidade do item — em push, log e
// fallback ele segue aparecendo — e este mapa é só a cara que ele tem DENTRO
// do app. Item sem entrada aqui cai no próprio emoji, silenciosamente: é o
// que deixa uma comida nova entrar no catálogo antes de a arte dela existir.
import foodProtein from '../assets/soulmon/items/food-protein.png';
import foodSalad from '../assets/soulmon/items/food-salad.png';
import foodApple from '../assets/soulmon/items/food-apple.png';
import foodCoffee from '../assets/soulmon/items/food-coffee.png';
import foodJuice from '../assets/soulmon/items/food-juice.png';
import foodRice from '../assets/soulmon/items/food-rice.png';
import foodPizza from '../assets/soulmon/items/food-pizza.png';
import foodCandy from '../assets/soulmon/items/food-candy.png';
import itemChipPower from '../assets/soulmon/items/item-chip-power.png';
import itemChipHarmony from '../assets/soulmon/items/item-chip-harmony.png';
import itemChipBenevolence from '../assets/soulmon/items/item-chip-benevolence.png';
import itemChipBigPower from '../assets/soulmon/items/item-chip-big-power.png';
import itemChipBigHarmony from '../assets/soulmon/items/item-chip-big-harmony.png';
import itemChipBigBenevolence from '../assets/soulmon/items/item-chip-big-benevolence.png';
import itemChipPrism from '../assets/soulmon/items/item-chip-prism.png';
import itemSpark from '../assets/soulmon/icones-ui/item-faisca.png';
import itemHeart from '../assets/soulmon/items/item-heart.png';
import itemGlitchtama from '../assets/soulmon/items/item-glitchtama.png';
import bossShard from '../assets/soulmon/items/boss-shard.png';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { DISHES } from './restaurantMenu';
import { dishKey } from './dishItems';
import { dishArt } from './dishArt';
import { premiumKey } from './premiumFood';
import { potionKey } from './elementPotion';
import { REDUCE_CHIP_SUFFIX } from './shop';
import { potionArt } from './potionArt';
import { elementIcon } from './elementIconArt';
import { ALL_ELEMENT_IDS } from './elementDex';

/** Chave = emoji-identidade do item (FOOD_BY_CATEGORY / SPECIAL_ITEMS). */
/** Chave do Fragmento de Boss (a mesma `key` da linha do resultado do Match-3). */
export const BOSS_SHARD_KEY = 'boss-shard';

export const ITEM_ART: Record<string, string> = {
  // Comidas comuns (constants/labels.ts — FOOD_BY_CATEGORY)
  '🥩': foodProtein,
  '🥗': foodSalad,
  '🍎': foodApple,
  '☕': foodCoffee,
  '🧃': foodJuice,
  '🍚': foodRice,
  '🍕': foodPizza,
  '🍭': foodCandy,
  // Especiais (utils/shop.ts — CHIP_EMOJI / HEART_ITEM_EMOJI / GLITCHTAMA_EMOJI)
  '👊': itemChipPower,
  '🎶': itemChipHarmony,
  '🤲': itemChipBenevolence,
  '🥊': itemChipBigPower,
  '🎼': itemChipBigHarmony,
  '💞': itemChipBigBenevolence,
  '🔷': itemChipPrism,
  '💠': itemChipPrism, // Chip Triplo (D-95): reusa a arte do Prisma, sem arte nova
  '💗': itemHeart,
  '🌀': itemGlitchtama,
  '🔄': itemChipPrism, // Zerador de Pontos (31/10/2026): reusa o Prisma (os 3 atributos), sem arte nova
  '✨': itemSpark, // Faísca de Alma (30/10/2026): arte própria (ChatGPT, alfa real, 96²)
  [BOSS_SHARD_KEY]: bossShard, // Fragmento de Boss (18/11/2026): arte própria (ChatGPT, alfa real, 256²); a linha do resultado do Match-3 usa `icon: BOSS_SHARD_ART`
};

/** O ícone do Fragmento de Boss (256², alfa real), para `icon` das linhas de resultado. */
export const BOSS_SHARD_ART: string = bossShard;

// Chips de REDUÇÃO (04/11/2026): a arte do chip comum do mesmo tipo; a Mochila desenha o "−" por cima (`data-reduce`).
for (const [k, base] of [['👊', itemChipPower], ['🎶', itemChipHarmony], ['🤲', itemChipBenevolence]] as const) {
  ITEM_ART[k + REDUCE_CHIP_SUFFIX] = base;
}

// Comida PREMIUM (`utils/premiumFood.ts`): a MESMA arte da comida de base — a
// diferença é a estrelinha que a Mochila desenha por cima (`.sm-premium-star`).
for (const f of Object.values(FOOD_BY_CATEGORY)) {
  if (ITEM_ART[f.emoji]) ITEM_ART[premiumKey(f.emoji)] = ITEM_ART[f.emoji];
}

// Poção de Elemento (30/10/2026): arte própria por elemento base (`potionArt`); sem ela, o ícone do elemento.
for (const id of ALL_ELEMENT_IDS) {
  const icon = potionArt(id) ?? elementIcon(id);
  if (icon) ITEM_ART[potionKey(id)] = icon;
}

// Prato do Restaurante (16/11/2026): a arte pixel do prato (`dishArt`); prato sem PNG ainda fica sem arte (a Mochila mostra só o nome).
for (const d of DISHES) {
  const art = dishArt(d.id);
  if (art) ITEM_ART[dishKey(d.id)] = art;
}
