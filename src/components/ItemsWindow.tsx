import { useState } from 'react';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import type { Language } from '../utils/i18n';
import { PixelButton, PixelPanel } from './pixel/PixelKit';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { SPECIAL_ITEMS, CHIP_BOOST, HEART_HEAL, CHIP_EMOJI, HEART_ITEM_EMOJI } from '../utils/shop';
import iconHeartItem from '../assets/icons/icon-heart-item.png';
import iconChipVirus from '../assets/icons/icon-chip-virus.png';
import iconChipData from '../assets/icons/icon-chip-data.png';
import iconChipVaccine from '../assets/icons/icon-chip-vaccine.png';

// Emoji continua sendo a CHAVE de inventário (ver utils/shop.ts) — este mapa
// é só o visual pixel-art que substitui o emoji nativo do SO nesses 4 itens.
const SPECIAL_ITEM_IMG: Record<string, string> = {
  [HEART_ITEM_EMOJI]: iconHeartItem,
  [CHIP_EMOJI.virus]: iconChipVirus,
  [CHIP_EMOJI.data]: iconChipData,
  [CHIP_EMOJI.vaccine]: iconChipVaccine,
};
const ATTR_IMG: Record<'virus' | 'data' | 'vaccine', string> = {
  virus: iconChipVirus, data: iconChipData, vaccine: iconChipVaccine,
};

interface ItemsWindowProps {
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  onClose: () => void;
  language?: Language;
}

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
  const entry = FOOD_NAMES[emoji];
  if (!entry) return '';
  return lang === 'pt-BR' ? entry.descPt : entry.descEn;
}

function getFoodAttrs(emoji: string) {
  const foodDef = Object.values(FOOD_BY_CATEGORY).find(f => f.emoji === emoji);
  if (!foodDef) return null;
  return CATEGORY_ATTRIBUTES[foodDef.category];
}

const ATTR_COLORS = {
  vaccine: '#22c55e',
  data: '#4F80E9',
  virus: '#E94F4F',
};

export function ItemsWindow({ foodInventory, onFeed, onClose, language = 'en-US' }: ItemsWindowProps) {
  const isPt = language === 'pt-BR';
  const [selected, setSelected] = useState<string | null>(null);
  const [justFed, setJustFed] = useState<string | null>(null);

  const items = Object.entries(foodInventory).filter(([, c]) => c > 0);

  const handleFeed = (emoji: string) => {
    onFeed(emoji);
    setJustFed(emoji);
    setSelected(null);
    setTimeout(() => setJustFed(null), 600);
  };

  const handleItemClick = (emoji: string) => {
    setSelected(prev => (prev === emoji ? null : emoji));
  };

  const titleText = isPt ? 'Itens' : 'Items';
  const countText = `${items.length} ${isPt ? (items.length === 1 ? 'item' : 'itens') : (items.length === 1 ? 'item' : 'items')}`;

  const selectedDetail = selected ? (() => {
    const name = getFoodName(selected, language);
    const desc = getFoodDesc(selected, language);
    const special = SPECIAL_ITEMS[selected];
    const attrs = special ? null : getFoodAttrs(selected);
    const attrEntries = attrs
      ? (['vaccine', 'data', 'virus'] as const).filter(k => attrs[k] > 0)
      : [];
    return { name, desc, special, attrEntries, attrs };
  })() : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      {/* Moldura de janela do kit (Ref B, "Windows & Dialogues"): cano de cobre
          9-slice em volta do modal. O miolo segue o token de superfície do
          tema, então o tema claro continua claro. */}
      <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
      <PixelPanel padded={false}>
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: 'var(--sm-line)' }}
        >
          <span style={{ fontSize: '1.1rem' }}>📁</span>
          <span
            className="flex-1 font-bold"
            style={{ fontSize: '1rem', color: 'var(--sm-ink)' }}
          >
            {titleText}
          </span>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            className="flex items-center justify-center shrink-0"
            /* 44x44 de area de toque com o circulo de 26px dentro (WCAG 2.2 AA 2.5.8). */
            style={{ width: 44, height: 44, padding: 9, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 999, color: 'var(--sm-muted)', background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={iconClose} alt="" width={15} height={15} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <img src={ravenMascot} alt="" width={56} height={56} style={{ objectFit: 'contain', opacity: 0.85 }} />
              <p className="text-center" style={{ fontSize: '0.85rem', color: 'var(--sm-muted)' }}>
                {isPt ? 'Sua pastinha está vazia.' : 'Your item folder is empty.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map(([emoji, count]) => {
                const isActive = selected === emoji;
                const isFed = justFed === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleItemClick(emoji)}
                    className="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-transform"
                    style={{
                      background: isActive ? 'var(--sm-primary-soft)' : 'var(--sm-bg)',
                      border: 'none',
                      transform: isFed ? 'scale(0.92)' : 'none',
                    }}
                    title={getFoodName(emoji, language)}
                  >
                    {SPECIAL_ITEM_IMG[emoji] ? (
                      <img src={SPECIAL_ITEM_IMG[emoji]} alt="" style={{ width: '1.7rem', height: '1.7rem', imageRendering: 'pixelated' }} />
                    ) : (
                      <span style={{ fontSize: '1.7rem', lineHeight: 1 }}>{emoji}</span>
                    )}
                    <span
                      className="text-center leading-tight break-words px-0.5"
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        color: isActive ? 'var(--sm-primary)' : 'var(--sm-ink)',
                      }}
                    >
                      {getFoodName(emoji, language)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: isActive ? 'inherit' : 'var(--sm-muted)',
                        opacity: isActive ? 0.85 : 1,
                      }}
                    >
                      ×{count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected item detail — inline, no floating popover */}
          {selectedDetail && (
            <div
              className="mt-3 rounded-xl p-3"
              style={{ background: 'var(--sm-bg)', border: '1px solid var(--sm-line)' }}
            >
              <div className="flex items-start gap-2">
                {selected && SPECIAL_ITEM_IMG[selected] ? (
                  <img src={SPECIAL_ITEM_IMG[selected]} alt="" style={{ width: '1.6rem', height: '1.6rem', imageRendering: 'pixelated' }} />
                ) : (
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{selected}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold" style={{ fontSize: '0.8rem', color: 'var(--sm-ink)' }}>
                    {selectedDetail.name}
                  </div>
                  {selectedDetail.desc && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--sm-muted)', marginTop: 2 }}>
                      {selectedDetail.desc}
                    </div>
                  )}
                </div>
              </div>

              {/* Effect tags */}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {selectedDetail.attrEntries.map(k => (
                  <span
                    key={k}
                    className="flex items-center gap-0.5"
                    style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: ATTR_COLORS[k], fontWeight: 'bold' }}
                  >
                    <img src={ATTR_IMG[k]} alt="" style={{ width: 12, height: 12, imageRendering: 'pixelated' }} />+{selectedDetail.attrs![k]}
                  </span>
                ))}
                {selectedDetail.special?.kind === 'chip' && selectedDetail.special.attr && (
                  <span
                    className="flex items-center gap-0.5"
                    style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: ATTR_COLORS[selectedDetail.special.attr], fontWeight: 'bold' }}
                  >
                    <img src={ATTR_IMG[selectedDetail.special.attr]} alt="" style={{ width: 12, height: 12, imageRendering: 'pixelated' }} />+{CHIP_BOOST}
                  </span>
                )}
                {selectedDetail.special?.kind === 'glitchtama' && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#8b5cf6', fontWeight: 'bold' }}>
                    ⭐+1 {isPt ? 'dia perfeito' : 'perfect day'}
                  </span>
                )}
                {selectedDetail.special?.kind === 'heart' && (
                  <span className="flex items-center gap-0.5" style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#E94F4F', fontWeight: 'bold' }}>
                    <img src={iconHeartItem} alt="" style={{ width: 12, height: 12, imageRendering: 'pixelated' }} />+{HEART_HEAL}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-3">
                <PixelButton size="sm" onClick={() => setSelected(null)}>
                  {isPt ? 'Cancelar' : 'Cancel'}
                </PixelButton>
                <PixelButton size="sm" variant="primary" onClick={() => handleFeed(selected!)}>
                  {isPt ? 'Usar' : 'Use'}
                </PixelButton>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div
          className="px-4 py-1.5 text-right"
          style={{ fontSize: '0.65rem', color: 'var(--sm-muted)', borderTop: '1px solid var(--sm-line)' }}
        >
          {countText}
        </div>
      </PixelPanel>
      </div>
    </div>
  );
}
