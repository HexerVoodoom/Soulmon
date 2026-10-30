// Arte dos 3 estágios de "comer" (inteira → mordida → sobrinha) da bolha do pet.
// Arquivos: assets/soulmon/items/eat/<comida>-1|2|3.png. Descobertos por glob:
// arte que ainda não existe simplesmente não aparece (a bolha cai no coração).
import { premiumBase } from './premiumFood';

const FILES = import.meta.glob('../assets/soulmon/items/eat/*.png', { eager: true, import: 'default' }) as Record<string, string>;

/** Chave de arte = emoji-identidade (mesma de `ITEM_ART`) → nome do arquivo. */
export const EAT_FOOD_KEY: Record<string, string> = {
  '🥩': 'protein', '🥗': 'salad', '🍎': 'apple', '☕': 'coffee',
  '🧃': 'juice', '🍚': 'rice', '🍕': 'pizza', '🍭': 'candy',
};

/** [estágio1, estágio2, estágio3] ou null se a comida não tem os 3 PNGs. */
export function eatStages(emoji: string): [string, string, string] | null {
  const key = EAT_FOOD_KEY[premiumBase(emoji)];
  if (!key) return null;
  const pick = (n: number) => {
    const hit = Object.keys(FILES).find(p => p.endsWith(`/eat/${key}-${n}.png`));
    return hit ? FILES[hit] : undefined;
  };
  const [a, b, c] = [pick(1), pick(2), pick(3)];
  return a && b && c ? [a, b, c] : null;
}
