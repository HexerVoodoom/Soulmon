/**
 * 🍲 Textos do Restaurante (EN primeiro, PT-BR é localização). Só TEXTO: a regra mora em `restaurant.ts`.
 * Nada aqui cobra: recusa é convite ("ainda falta…"), nunca culpa.
 */
import type { ChefId, CookRefusal, DishEffect } from './restaurant';
import { MEAL_BUFF_HOURS } from './restaurantState';

export const CHEF_VOICE: Record<ChefId, { nameEn: string; namePt: string; lineEn: string; linePt: string; daysEn: string; daysPt: string }> = {
  snapjaw: {
    nameEn: 'Snapjaw, the carnivorous chef', namePt: 'Snapjaw, a chef carnívora',
    lineEn: 'Fresh from the garden! Bring me what you gathered and I will turn it into a dish.',
    linePt: 'Fresquinho da horta! Traga o que você colheu e eu transformo em prato.',
    daysEn: 'Mon · Wed · Fri', daysPt: 'seg · qua · sex',
  },
  caldo: {
    nameEn: 'Broth, the cauldron cook', namePt: 'Caldo, o cozinheiro do caldeirão',
    lineEn: 'The pot is warm. Pick a recipe and I will stir it slowly, just right.',
    linePt: 'O caldeirão está quente. Escolha uma receita e eu mexo devagar, no ponto.',
    daysEn: 'Tue · Thu · Sat', daysPt: 'ter · qui · sáb',
  },
};

export const SUNDAY_LINE = {
  en: 'Sunday: both kitchens are open, the whole menu is on the table.',
  pt: 'Domingo: as duas cozinhas abertas, o cardápio inteiro na mesa.',
};

export function effectText(e: DishEffect, isPt: boolean): string {
  const h = MEAL_BUFF_HOURS;
  switch (e.kind) {
    case 'energy': return isPt ? `+${e.value} de energia agora` : `+${e.value} energy now`;
    case 'regen': return isPt ? `Energia volta ${e.value}% mais rápido por ${h} h` : `Energy refills ${e.value}% faster for ${h}h`;
    case 'atk': return isPt ? `+${e.value}% de ataque por ${h} h` : `+${e.value}% attack for ${h}h`;
    case 'def': return isPt ? `+${e.value}% de defesa por ${h} h` : `+${e.value}% defense for ${h}h`;
    case 'spd': return isPt ? `+${e.value}% de velocidade por ${h} h` : `+${e.value}% speed for ${h}h`;
  }
}

export function refusalText(r: CookRefusal, isPt: boolean): string {
  switch (r) {
    case 'unknown': return isPt ? 'Essa receita não está no cardápio.' : "That recipe isn't on the menu.";
    case 'not-today': return isPt ? 'Esse prato é de outro dia da semana.' : 'That dish is on another day of the week.';
    case 'daily-cap': return isPt ? 'Por hoje já deu: a cozinha reabre amanhã.' : "That's it for today: the kitchen reopens tomorrow.";
    case 'no-food': return isPt ? 'Ainda faltam comidas na pastinha. Elas vêm das atividades concluídas.' : 'A few foods are still missing. They come from finished activities.';
    case 'no-extra': return isPt ? 'Ainda falta o ingrediente especial.' : 'The special ingredient is still missing.';
    case 'no-bits': return isPt ? 'Ainda faltam Bits.' : 'Not enough Bits yet.';
    case 'not-earned': return isPt ? 'Prato de combate só com Bits ganhos jogando.' : 'Combat dishes take only Bits earned by playing.';
  }
}

export const COMBAT_NOTE = {
  en: 'Combat boosts count in the Rift, Arena and Nightmare, inside the usual 5% cap.',
  pt: 'Reforço de combate vale na Fenda, na Arena e no Pesadelo, dentro do teto de 5% de sempre.',
};
