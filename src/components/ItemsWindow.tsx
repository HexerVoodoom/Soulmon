import { useState } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import type { Language } from '../utils/i18n';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { CATEGORY_ATTRIBUTES, ATTR_LABEL } from '../types/attributes';
import { SPECIAL_ITEMS, CHIP_BOOST, HEART_HEAL } from '../utils/shop';

/**
 * PASTINHA — revamp minimalista.
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

interface ItemsWindowProps {
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  onClose: () => void;
  language?: Language;
}

function getFoodName(emoji: string, lang: Language): string {
  const special = SPECIAL_ITEMS[emoji];
  if (special) return lang === 'pt-BR' ? special.namePt : special.nameEn;
  const entry = FOOD_NAMES[emoji];
  if (!entry) return emoji;
  return lang === 'pt-BR' ? entry.pt : entry.en;
}

function getFoodDesc(emoji: string, lang: Language): string {
  const special = SPECIAL_ITEMS[emoji];
  if (special) return lang === 'pt-BR' ? special.descPt : special.descEn;
  return FOOD_NAMES[emoji] ? (lang === 'pt-BR' ? FOOD_NAMES[emoji].descPt : FOOD_NAMES[emoji].descEn) : '';
}

/**
 * O que o item FAZ, em uma frase. Comida soma atributo pela categoria; chip,
 * coraçãozinho e Glitchtama têm efeito fixo (utils/shop.ts é o dono da regra —
 * aqui só se lê `CHIP_BOOST`/`HEART_HEAL`, nunca um número à mão).
 */
function effectLine(emoji: string, isPt: boolean): string {
  const special = SPECIAL_ITEMS[emoji];
  if (special?.kind === 'chip' && special.attr) {
    return `+${CHIP_BOOST} ${isPt ? ATTR_LABEL[special.attr].pt : ATTR_LABEL[special.attr].en}`;
  }
  if (special?.kind === 'heart') return isPt ? `+${HEART_HEAL} coração` : `+${HEART_HEAL} heart`;
  if (special?.kind === 'glitchtama') return isPt ? '+1 dia perfeito' : '+1 perfect day';
  const food = Object.values(FOOD_BY_CATEGORY).find(f => f.emoji === emoji);
  if (!food) return '';
  const attrs = CATEGORY_ATTRIBUTES[food.category];
  const parts = (['vaccine', 'data', 'virus'] as const)
    .filter(k => attrs[k] > 0)
    .map(k => `+${attrs[k]} ${isPt ? ATTR_LABEL[k].pt : ATTR_LABEL[k].en}`);
  return [isPt ? '+1 energia' : '+1 energy', ...parts].join(' · ');
}

export function ItemsWindow({ foodInventory, onFeed, onClose, language = 'en-US' }: ItemsWindowProps) {
  const isPt = language === 'pt-BR';
  const [selected, setSelected] = useState<string | null>(null);

  const items = Object.entries(foodInventory).filter(([, c]) => c > 0);
  const detail = selected && foodInventory[selected] > 0 ? selected : null;

  const use = (emoji: string) => {
    onFeed(emoji);
    setSelected(null);
  };

  return (
    <ModalSheet
      open
      title={isPt ? 'Itens' : 'Items'}
      onClose={onClose}
      language={language}
      footer={detail ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{getFoodName(detail, language)}</p>
            <p style={{ ...sm2Hint, margin: 0 }}>{effectLine(detail, isPt) || getFoodDesc(detail, language)}</p>
          </div>
          <button type="button" onClick={() => use(detail)} style={sm2Button('primary')}>
            {isPt ? 'Usar' : 'Use'}
          </button>
        </div>
      ) : undefined}
    >
      {items.length === 0 ? (
        /* Estado vazio — ilustração, não texto cru. */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
          <img src={ravenMascot} alt="" width={72} height={72} style={{ objectFit: 'contain', opacity: 0.85 }} />
          <p style={{ ...sm2Hint, textAlign: 'center' }}>
            {isPt
              ? 'Sua pastinha está vazia. Conclua uma atividade para ganhar comida.'
              : 'Your item folder is empty. Complete an activity to earn food.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {items.map(([emoji, count]) => {
            const active = detail === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelected(active ? null : emoji)}
                aria-pressed={active}
                aria-label={`${getFoodName(emoji, language)} ×${count}`}
                style={{
                  minHeight: 96, padding: '12px 6px', borderRadius: 16, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  border: active ? '1px solid var(--sm2-primary-ink)' : '1px solid transparent',
                  backgroundColor: active ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                  transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 30, lineHeight: 1 }}>{emoji}</span>
                <span style={{ ...sm2Hint, color: 'var(--sm2-ink)', fontWeight: 500, textAlign: 'center' }}>
                  {getFoodName(emoji, language)}
                </span>
                <span className="sm2-num" style={sm2Hint}>×{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </ModalSheet>
  );
}
