import type { Language } from '../utils/i18n';
import { SPECIAL_ITEMS } from '../utils/shop';

/**
 * Nomes e descrições de comida/item (PT+EN). A tela da pastinha que morava
 * aqui saiu na minimal-ui (a MOCHILA da Home, `home/Mochila.tsx`, é a entrada
 * de item desde a F2); ficaram só os helpers que a Mochila e o HUD leem.
 *
 * Histórico — PASTINHA, revamp minimalista:
 *
 * Uma ação dominante: USAR um item. Tudo o que não ajuda a escolher qual
 * item usar saiu:
 *
 * · **Os 5 PNGs de ícone** (coraçãozinho + 3 chips + fechar) e os dois mapas
 *   que os resolviam. O item da pastinha é CONTEÚDO, e o conteúdo aqui é o
 *   emoji — que já é a CHAVE de inventário (`utils/shop.ts`). Duas
 *   representações do mesmo item era o bug de moeda que a loja tinha.
 * · **A barra de status "N itens"**. Contar itens não decide nada; a grade já
 *   mostra quantos são.
 * · **As etiquetas de efeito com cor chapada** (`#22c55e`, `#4F80E9`,
 *   `#E94F4F` — três hex fora dos tokens, em monoespaçada). O efeito virou
 *   FRASE: "+2 Benevolência, +1 Poder". Rótulo nomeado no lugar de número
 *   colorido que ninguém decodifica.
 * · **A moldura de janela + o modal centralizado.** Virou folha de baixo
 *   (`ModalSheet`): o polegar alcança, e o Escape/foco preso vêm de graça.
 */

const FOOD_NAMES: Record<string, { en: string; pt: string; descEn: string; descPt: string }> = {
  '🍎': { en: 'Apple',       pt: 'Maçã',      descEn: 'A crisp, sweet apple — perfect brain food',          descPt: 'Uma maçã crocante e doce, perfeita para o cérebro'   },
  '🥩': { en: 'Protein',     pt: 'Proteína',   descEn: 'A juicy, flavorful piece of meat',                   descPt: 'Um pedaço suculento e saboroso de carne'             },
  '🥗': { en: 'Salad',       pt: 'Salada',     descEn: 'Fresh colorful veggies with a light dressing',       descPt: 'Legumes coloridos e frescos com um molho leve'        },
  '☕': { en: 'Coffee',      pt: 'Café',       descEn: 'Bitter black coffee, great for waking up',           descPt: 'Café amargo sem açúcar, muito bom para acordar'       },
  '🧃': { en: 'Juice',       pt: 'Suco',       descEn: 'Freshly squeezed tropical fruit juice',              descPt: 'Suco de fruta tropical espremido na hora'             },
  '🍚': { en: 'Rice',        pt: 'Arroz',      descEn: 'Simple steamed rice, steady fuel for the day',       descPt: 'Arroz cozido simples, energia constante pro dia'      },
  '🍕': { en: 'Pizza',       pt: 'Pizza',      descEn: 'A warm, cheesy slice — best shared with friends',    descPt: 'Uma fatia quente e queijuda, melhor compartilhada'    },
  '🍭': { en: 'Candy',       pt: 'Doce',       descEn: 'A colorful lollipop bursting with sweet flavor',     descPt: 'Uma bala colorida cheia de sabor doce'               },
  '📚': { en: 'EduPack',     pt: 'Edu-Pack',   descEn: 'Packed with nutrients that feed a curious mind',     descPt: 'Cheio de nutrientes que alimentam a mente curiosa'   },
  '🎯': { en: 'FocusBite',   pt: 'FocoSnack',  descEn: 'A small but mighty snack, laser-sharp focus',        descPt: 'Um petisco pequeno mas poderoso, foco total'          },
  '💧': { en: 'AquaDrop',    pt: 'AquaDrop',   descEn: 'Pure, ice-cold water — the simplest fuel',           descPt: 'Água pura e gelada, o combustível mais simples'       },
  '🧘': { en: 'ZenBar',      pt: 'Zen Bar',    descEn: 'A light herbal bar that settles the mind',           descPt: 'Uma barrinha herbal leve que acalma a mente'          },
  '💪': { en: 'ProtBar',     pt: 'Prot-Bar',   descEn: 'High-protein bar, straight fuel for tired muscles',  descPt: 'Barra proteica, combustível direto para músculos'    },
  '📓': { en: 'ThinkSnack',  pt: 'PensaSnack', descEn: 'A thoughtful mix of seeds and dark chocolate',       descPt: 'Uma mistura de sementes e chocolate amargo'          },
  '🌅': { en: 'DawnBite',    pt: 'Amanhecer',  descEn: 'A sunrise smoothie to kickstart your morning',       descPt: 'Um smoothie matinal para começar o dia com tudo'     },
  '💻': { en: 'CodeFuel',    pt: 'CodeFuel',   descEn: 'Energy gel for long hours at the keyboard',          descPt: 'Gel energético para longas horas no teclado'          },
  '📅': { en: 'PlanBite',    pt: 'PlanBite',   descEn: 'A structured snack to keep your day on track',       descPt: 'Um petisco estruturado para manter o dia nos trilhos' },
  '🍅': { en: 'TomatoBit',   pt: 'TomatoBit',  descEn: 'A ripe, tangy tomato — burst of fresh energy',       descPt: 'Um tomate maduro e ácido, explosão de energia fresca' },
  '🔕': { en: 'FocusPack',   pt: 'SilêncPac',  descEn: 'Noise-cancelling nutrients for deep work sessions',  descPt: 'Nutrientes que bloqueiam distrações para foco total' },
  '📞': { en: 'SocialPill',  pt: 'SocialPil',  descEn: 'A fizzy drink that boosts your social battery',      descPt: 'Uma bebida gaseificada que recarrega sua bateria social' },
};

/** Nome do alimento/item no idioma da pessoa — dono único (PL-5, 21/09/2026):
 *  o `CompanionHUD` usava `FOOD_BY_CATEGORY[].name` (só EN) para o MESMO item
 *  e o leitor de tela em PT ouvia "Protein × 2" no deck e "Proteína ×2" aqui. */
export function getFoodName(emoji: string, lang: Language): string {
  const special = SPECIAL_ITEMS[emoji];
  if (special) return lang === 'pt-BR' ? special.namePt : special.nameEn;
  const entry = FOOD_NAMES[emoji];
  if (!entry) return emoji;
  return lang === 'pt-BR' ? entry.pt : entry.en;
}

export function getFoodDesc(emoji: string, lang: Language): string {
  const special = SPECIAL_ITEMS[emoji];
  if (special) return lang === 'pt-BR' ? special.descPt : special.descEn;
  return FOOD_NAMES[emoji] ? (lang === 'pt-BR' ? FOOD_NAMES[emoji].descPt : FOOD_NAMES[emoji].descEn) : '';
}
