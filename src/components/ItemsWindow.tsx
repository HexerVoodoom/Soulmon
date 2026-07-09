import { useState, useRef, useEffect } from 'react';
import type { Language } from '../utils/i18n';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { SPECIAL_ITEMS, CHIP_BOOST, HEART_HEAL } from '../utils/shop';

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

interface Popover {
  emoji: string;
  x: number;
  y: number;
}

const ATTR_COLORS = {
  vaccine: '#22c55e',
  data: '#4F80E9',
  virus: '#E94F4F',
};

export function ItemsWindow({ foodInventory, onFeed, onClose, language = 'en-US' }: ItemsWindowProps) {
  const [pos, setPos] = useState({ x: 40, y: -320 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, px: 0, py: 0 });
  const [justFed, setJustFed] = useState<string | null>(null);
  const [popover, setPopover] = useState<Popover | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const isPt = language === 'pt-BR';
  const items = Object.entries(foodInventory).filter(([, c]) => c > 0);

  const onTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPos({
        x: dragStart.px + (e.clientX - dragStart.mx),
        y: dragStart.py + (e.clientY - dragStart.my),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragStart]);

  useEffect(() => {
    if (!popover) return;
    const handler = () => setPopover(null);
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [popover]);

  const handleFeed = (emoji: string) => {
    onFeed(emoji);
    setJustFed(emoji);
    setPopover(null);
    setTimeout(() => setJustFed(null), 600);
  };

  const handleItemClick = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (popover?.emoji === emoji) {
      setPopover(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      emoji,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  return (
    <>
      <div
        ref={windowRef}
        className="fixed z-[200] select-none"
        style={{ bottom: `calc(0px + ${-pos.y}px)`, left: pos.x, width: 260 }}
      >
        <div
          className="flex flex-col"
          style={{
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            backgroundColor: '#c0c0c0',
            boxShadow: '2px 2px 0 #000',
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-1 px-1 py-0.5 cursor-move"
            style={{ background: 'linear-gradient(to right, #000080, #1084d0)', userSelect: 'none' }}
            onMouseDown={onTitleMouseDown}
          >
            <span style={{ fontSize: '0.7rem' }}>📁</span>
            <span className="text-white flex-1 text-xs font-bold" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
              {isPt ? 'Itens' : 'Items'}
            </span>
            <div className="flex gap-0.5">
              {['_', '□'].map(label => (
                <button
                  key={label}
                  className="flex items-center justify-center text-black font-bold leading-none"
                  style={{
                    width: 16, height: 14, fontSize: '0.6rem', fontFamily: 'monospace',
                    backgroundColor: '#c0c0c0',
                    border: '1.5px solid',
                    borderColor: '#ffffff #808080 #808080 #ffffff',
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={onClose}
                className="flex items-center justify-center text-black font-bold leading-none hover:bg-red-600 hover:text-white"
                style={{
                  width: 16, height: 14, fontSize: '0.65rem', fontFamily: 'monospace',
                  backgroundColor: '#c0c0c0',
                  border: '1.5px solid',
                  borderColor: '#ffffff #808080 #808080 #ffffff',
                  transition: 'background 0.1s',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Menu bar */}
          <div
            className="flex gap-3 px-2 py-0.5 border-b"
            style={{ borderColor: '#808080', fontSize: '0.7rem', fontFamily: 'monospace' }}
          >
            {[isPt ? 'Arquivo' : 'File', isPt ? 'Editar' : 'Edit', isPt ? 'Ver' : 'View'].map(m => (
              <span key={m} className="cursor-default hover:bg-[#000080] hover:text-white px-1">{m}</span>
            ))}
          </div>

          {/* Toolbar */}
          <div
            className="flex items-center gap-1 px-2 py-1 border-b"
            style={{ borderColor: '#808080' }}
          >
            <div
              className="flex items-center gap-0.5 px-1"
              style={{
                border: '1.5px solid', borderColor: '#808080 #ffffff #ffffff #808080',
                backgroundColor: '#c0c0c0', fontSize: '0.65rem', fontFamily: 'monospace',
              }}
            >
              <span>📁</span>
              <span>{isPt ? 'Itens' : 'Items'}</span>
            </div>
          </div>

          {/* Content area */}
          <div
            className="p-2 overflow-y-auto"
            style={{
              minHeight: 100, maxHeight: 180,
              backgroundColor: '#ffffff',
              border: '1.5px solid', borderColor: '#808080 #ffffff #ffffff #808080',
            }}
            onMouseDown={() => setPopover(null)}
          >
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-4" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {isPt ? '(sem itens)' : '(no items)'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1 p-1">
                {items.map(([emoji, count]) => {
                  const isActive = popover?.emoji === emoji;
                  const isFed = justFed === emoji;
                  return (
                    <button
                      key={emoji}
                      onMouseDown={e => { e.stopPropagation(); handleItemClick(emoji, e); }}
                      className="flex flex-col items-center gap-0.5 p-1 rounded-none w-14 transition-none"
                      style={{
                        backgroundColor: isActive ? '#000080' : 'transparent',
                        transform: isFed ? 'scale(0.92)' : 'none',
                        cursor: 'default',
                      }}
                      title={getFoodName(emoji, language)}
                    >
                      <span style={{ fontSize: '1.5rem', imageRendering: 'pixelated', lineHeight: 1 }}>{emoji}</span>
                      <span
                        className="text-center leading-tight break-all"
                        style={{
                          fontFamily: 'monospace', fontSize: '0.6rem', lineHeight: '1.1',
                          color: isActive ? '#fff' : '#000',
                          maxWidth: 52,
                        }}
                      >
                        {getFoodName(emoji, language)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace', fontSize: '0.6rem',
                          color: isActive ? '#adf' : '#666',
                        }}
                      >
                        ×{count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status bar */}
          <div
            className="flex items-center px-2 py-0.5 gap-2"
            style={{ borderTop: '1.5px solid #808080' }}
          >
            <div
              className="flex-1"
              style={{
                border: '1.5px solid', borderColor: '#808080 #ffffff #ffffff #808080',
                padding: '1px 4px', fontSize: '0.65rem', fontFamily: 'monospace',
              }}
            >
              {items.length} {isPt ? 'objeto(s)' : 'object(s)'}
            </div>
          </div>
        </div>
      </div>

      {/* Item detail popover */}
      {popover && (() => {
        const name = getFoodName(popover.emoji, language);
        const desc = getFoodDesc(popover.emoji, language);
        const special = SPECIAL_ITEMS[popover.emoji];
        const attrs = special ? null : getFoodAttrs(popover.emoji);
        const attrEntries = attrs
          ? (['vaccine', 'data', 'virus'] as const).filter(k => attrs[k] > 0)
          : [];

        return (
          <div
            className="fixed z-[300]"
            style={{
              left: popover.x,
              top: popover.y - 160,
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
              width: 186,
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div
              style={{
                border: '2px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                backgroundColor: '#c0c0c0',
                boxShadow: '2px 2px 0 #000',
              }}
            >
              {/* Icon + name + description */}
              <div style={{ padding: '6px 8px', display: 'flex', gap: 8, alignItems: 'flex-start', borderBottom: '1px solid #808080' }}>
                <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{popover.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 'bold', color: '#000' }}>{name}</div>
                  {desc && (
                    <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#666', marginTop: 2 }}>{desc}</div>
                  )}
                </div>
              </div>

              {/* Attribute points (food) */}
              {attrEntries.length > 0 && (
                <div style={{ padding: '4px 8px', display: 'flex', gap: 6, borderBottom: '1px solid #808080' }}>
                  {attrEntries.map(k => (
                    <span
                      key={k}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.6rem',
                        color: ATTR_COLORS[k],
                        fontWeight: 'bold',
                      }}
                    >
                      {k === 'vaccine' ? '💉' : k === 'data' ? '💾' : '🦠'}+{attrs![k]}
                    </span>
                  ))}
                </div>
              )}

              {/* Special item effect (chip = attribute; heart = heal;
                  glitchtama = perfect day; evo-equip = equips as evo item) */}
              {special && (
                <div style={{ padding: '4px 8px', display: 'flex', gap: 6, borderBottom: '1px solid #808080' }}>
                  {special.kind === 'chip' && special.attr ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: ATTR_COLORS[special.attr], fontWeight: 'bold' }}>
                      {special.attr === 'vaccine' ? '💉' : special.attr === 'data' ? '💾' : '🦠'}+{CHIP_BOOST}
                    </span>
                  ) : special.kind === 'glitchtama' ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#8b5cf6', fontWeight: 'bold' }}>
                      ⭐+1 {isPt ? 'dia perfeito' : 'perfect day'}
                    </span>
                  ) : special.kind === 'evo-equip' ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#0e7490', fontWeight: 'bold' }}>
                      ⚙ {isPt ? 'Usar = equipar p/ digievolução' : 'Use = equip for digivolution'}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#E94F4F', fontWeight: 'bold' }}>
                      ❤️+{HEART_HEAL}
                    </span>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div style={{ padding: '4px 6px', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button
                  onClick={() => setPopover(null)}
                  style={{
                    fontFamily: 'monospace', fontSize: '0.65rem',
                    backgroundColor: '#c0c0c0', padding: '2px 8px',
                    border: '1.5px solid',
                    borderColor: '#ffffff #808080 #808080 #ffffff',
                    cursor: 'default',
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleFeed(popover.emoji)}
                  style={{
                    fontFamily: 'monospace', fontSize: '0.65rem',
                    backgroundColor: '#c0c0c0', padding: '2px 8px',
                    border: '1.5px solid',
                    borderColor: '#ffffff #808080 #808080 #ffffff',
                    cursor: 'default',
                    fontWeight: 'bold',
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  {isPt ? 'Usar' : 'Use'}
                </button>
              </div>
            </div>

            {/* Down-pointing caret */}
            <div
              style={{
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #808080',
                margin: '0 auto',
              }}
            />
          </div>
        );
      })()}
    </>
  );
}
