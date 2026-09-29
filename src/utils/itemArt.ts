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
import itemHeart from '../assets/soulmon/items/item-heart.png';
import itemGlitchtama from '../assets/soulmon/items/item-glitchtama.png';

/** Chave = emoji-identidade do item (FOOD_BY_CATEGORY / SPECIAL_ITEMS). */
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
  '💗': itemHeart,
  '🌀': itemGlitchtama,
};
