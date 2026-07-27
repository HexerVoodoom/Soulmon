import { useState } from 'react';
import { X } from 'lucide-react';
import type { Language } from '../utils/i18n';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { SPECIAL_ITEMS, CHIP_BOOST, HEART_HEAL } from '../utils/shop';

interface ItemsWindowProps {
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  onClose: () => void;
  language?: Language;
  theme?: 'default' | 'win98' | 'glitch';
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

export function ItemsWindow({ foodInventory, onFeed, onClose, language = 'en-US', theme = 'default' }: ItemsWindowProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
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
      style={{ background: isWin98 ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-2xl overflow-hidden ${
          isGlitch ? 'glitch-activity-card' : isWin98 ? 'win98-activity-card' : 'sm-card'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2 px-4 py-3 ${isWin98 ? '' : 'border-b'}`}
          style={{
            borderColor: !isWin98 && !isGlitch ? 'var(--sm-line)' : undefined,
            borderBottom: isGlitch ? '1px solid rgba(0,255,255,0.4)' : undefined,
            background: isWin98 ? 'linear-gradient(to right, #000080, #1084d0)' : undefined,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>📁</span>
          <span
            className="flex-1 font-bold"
            style={{
              fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
              fontSize: isWin98 ? '0.8rem' : '1rem',
              color: isWin98 ? '#fff' : isGlitch ? '#00ffff' : 'var(--sm-ink)',
              textShadow: isGlitch ? '0 0 8px rgba(0,255,255,0.6)' : undefined,
            }}
          >
            {titleText}
          </span>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 26, height: 26, borderRadius: isWin98 ? 3 : 999,
              color: isWin98 ? '#000' : isGlitch ? '#00ffff' : 'var(--sm-muted)',
              background: isWin98 ? '#c0c0c0' : isGlitch ? 'rgba(0,255,255,0.08)' : 'var(--sm-bg)',
              border: isWin98 ? '1.5px solid' : 'none',
              borderColor: isWin98 ? '#ffffff #808080 #808080 #ffffff' : undefined,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-3 overflow-y-auto"
          style={{
            maxHeight: '50vh',
            background: isWin98 ? '#fff' : undefined,
          }}
        >
          {items.length === 0 ? (
            <p
              className="text-center py-8"
              style={{
                fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                fontSize: '0.85rem',
                color: isGlitch ? 'rgba(0,255,255,0.5)' : 'var(--sm-muted)',
              }}
            >
              {isPt ? 'Sua pastinha está vazia.' : 'Your item folder is empty.'}
            </p>
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
                      background: isActive
                        ? (isWin98 ? '#000080' : isGlitch ? 'rgba(0,255,255,0.15)' : 'var(--sm-primary-soft)')
                        : (isWin98 ? 'transparent' : isGlitch ? 'rgba(255,255,255,0.03)' : 'var(--sm-bg)'),
                      border: isGlitch ? '1px solid rgba(0,255,255,0.25)' : 'none',
                      transform: isFed ? 'scale(0.92)' : 'none',
                    }}
                    title={getFoodName(emoji, language)}
                  >
                    <span style={{ fontSize: '1.7rem', lineHeight: 1 }}>{emoji}</span>
                    <span
                      className="text-center leading-tight break-words px-0.5"
                      style={{
                        fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        color: isActive
                          ? (isWin98 ? '#fff' : isGlitch ? '#00ffff' : 'var(--sm-primary)')
                          : (isWin98 ? '#000' : isGlitch ? 'rgba(0,255,255,0.8)' : 'var(--sm-ink)'),
                      }}
                    >
                      {getFoodName(emoji, language)}
                    </span>
                    <span
                      style={{
                        fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                        fontSize: '0.65rem',
                        color: isActive ? (isWin98 ? '#adf' : 'inherit') : 'var(--sm-muted)',
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
              style={{
                background: isWin98 ? '#c0c0c0' : isGlitch ? 'rgba(0,255,255,0.06)' : 'var(--sm-bg)',
                border: isGlitch ? '1px solid rgba(0,255,255,0.3)' : isWin98 ? '1.5px solid' : '1px solid var(--sm-line)',
                borderColor: isWin98 ? '#808080 #ffffff #ffffff #808080' : undefined,
              }}
            >
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{selected}</span>
                <div className="min-w-0 flex-1">
                  <div
                    className="font-bold"
                    style={{
                      fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                      fontSize: '0.8rem',
                      color: isGlitch ? '#00ffff' : isWin98 ? '#000' : 'var(--sm-ink)',
                    }}
                  >
                    {selectedDetail.name}
                  </div>
                  {selectedDetail.desc && (
                    <div
                      style={{
                        fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                        fontSize: '0.7rem',
                        color: isGlitch ? 'rgba(0,255,255,0.6)' : 'var(--sm-muted)',
                        marginTop: 2,
                      }}
                    >
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
                    style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: ATTR_COLORS[k], fontWeight: 'bold' }}
                  >
                    {k === 'vaccine' ? '💉' : k === 'data' ? '💾' : '🦠'}+{selectedDetail.attrs![k]}
                  </span>
                ))}
                {selectedDetail.special?.kind === 'chip' && selectedDetail.special.attr && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: ATTR_COLORS[selectedDetail.special.attr], fontWeight: 'bold' }}>
                    {selectedDetail.special.attr === 'vaccine' ? '💉' : selectedDetail.special.attr === 'data' ? '💾' : '🦠'}+{CHIP_BOOST}
                  </span>
                )}
                {selectedDetail.special?.kind === 'glitchtama' && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#8b5cf6', fontWeight: 'bold' }}>
                    ⭐+1 {isPt ? 'dia perfeito' : 'perfect day'}
                  </span>
                )}
                {selectedDetail.special?.kind === 'heart' && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#E94F4F', fontWeight: 'bold' }}>
                    ❤️+{HEART_HEAL}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setSelected(null)}
                  className={isWin98 ? '' : isGlitch ? '' : 'sm-btn-secondary sm-btn'}
                  style={{
                    fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                    fontSize: '0.75rem',
                    padding: isWin98 || isGlitch ? '4px 12px' : undefined,
                    background: isWin98 ? '#c0c0c0' : isGlitch ? 'transparent' : undefined,
                    border: isWin98 ? '1.5px solid' : isGlitch ? '1px solid rgba(0,255,255,0.4)' : undefined,
                    borderColor: isWin98 ? '#ffffff #808080 #808080 #ffffff' : undefined,
                    color: isGlitch ? '#00ffff' : isWin98 ? '#000' : undefined,
                    borderRadius: isWin98 ? 3 : isGlitch ? 6 : undefined,
                  }}
                >
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleFeed(selected!)}
                  className={isWin98 ? '' : isGlitch ? '' : 'sm-btn'}
                  style={{
                    fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: isWin98 || isGlitch ? '4px 12px' : undefined,
                    background: isWin98 ? '#c0c0c0' : isGlitch ? 'linear-gradient(to right, #ff00ff, #00ffff)' : undefined,
                    border: isWin98 ? '1.5px solid' : 'none',
                    borderColor: isWin98 ? '#ffffff #808080 #808080 #ffffff' : undefined,
                    color: isGlitch ? '#000' : isWin98 ? '#000' : undefined,
                    borderRadius: isWin98 ? 3 : isGlitch ? 6 : undefined,
                  }}
                >
                  {isPt ? 'Usar' : 'Use'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div
          className="px-4 py-1.5 text-right"
          style={{
            fontFamily: isWin98 || isGlitch ? 'monospace' : undefined,
            fontSize: '0.65rem',
            color: isGlitch ? 'rgba(0,255,255,0.5)' : 'var(--sm-muted)',
            borderTop: isWin98 ? '1.5px solid #808080' : isGlitch ? '1px solid rgba(0,255,255,0.2)' : '1px solid var(--sm-line)',
          }}
        >
          {countText}
        </div>
      </div>
    </div>
  );
}
