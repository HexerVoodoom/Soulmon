import { useState, useRef, useEffect } from 'react';
import type { Language } from '../utils/i18n';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';

interface ItemsWindowProps {
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  onClose: () => void;
  language?: Language;
}

const FOOD_NAMES: Record<string, { en: string; pt: string; descEn: string; descPt: string }> = {
  '🍎': { en: 'Apple',       pt: 'Maçã',      descEn: 'Sharpens the mind',       descPt: 'Aguça a mente'         },
  '🥩': { en: 'Protein',     pt: 'Proteína',   descEn: 'Builds strength',          descPt: 'Constrói força'         },
  '🥗': { en: 'Salad',       pt: 'Salada',     descEn: 'Balanced nourishment',     descPt: 'Nutrição equilibrada'   },
  '☕': { en: 'Coffee',      pt: 'Café',       descEn: 'Fuels productivity',       descPt: 'Combustível produtivo'  },
  '🧃': { en: 'Juice',       pt: 'Suco',       descEn: 'Refreshing boost',         descPt: 'Energia refrescante'    },
  '🍚': { en: 'Rice',        pt: 'Arroz',      descEn: 'Steady sustenance',        descPt: 'Sustento constante'     },
  '🍕': { en: 'Pizza',       pt: 'Pizza',      descEn: 'Social energy',            descPt: 'Energia social'         },
  '🍭': { en: 'Candy',       pt: 'Doce',       descEn: 'Creative burst',           descPt: 'Explosão criativa'      },
  '📚': { en: 'EduPack',     pt: 'Edu-Pack',   descEn: 'Knowledge fuel',           descPt: 'Combustível do saber'   },
  '🎯': { en: 'FocusBite',   pt: 'FocoSnack',  descEn: 'Precision focus',          descPt: 'Foco preciso'           },
  '💧': { en: 'AquaDrop',    pt: 'AquaDrop',   descEn: 'Pure hydration',           descPt: 'Hidratação pura'        },
  '🧘': { en: 'ZenBar',      pt: 'Zen Bar',    descEn: 'Calm the mind',            descPt: 'Acalma a mente'         },
  '💪': { en: 'ProtBar',     pt: 'Prot-Bar',   descEn: 'Muscle recovery',          descPt: 'Recuperação muscular'   },
  '📓': { en: 'ThinkSnack',  pt: 'PensaSnack', descEn: 'Deep thinking fuel',       descPt: 'Combustível reflexivo'  },
  '🌅': { en: 'DawnBite',    pt: 'Amanhecer',  descEn: 'Morning energy',           descPt: 'Energia matinal'        },
  '💻': { en: 'CodeFuel',    pt: 'CodeFuel',   descEn: 'Digital productivity',     descPt: 'Prod. digital'          },
  '📅': { en: 'PlanBite',    pt: 'PlanBite',   descEn: 'Organize your day',        descPt: 'Organiza o dia'         },
  '🍅': { en: 'TomatoBit',   pt: 'TomatoBit',  descEn: 'Sprint booster',           descPt: 'Impulsiona sprints'     },
  '🔕': { en: 'FocusPack',   pt: 'SilêncPac',  descEn: 'Silent focus',             descPt: 'Silêncio focado'        },
  '📞': { en: 'SocialPill',  pt: 'SocialPil',  descEn: 'Connection energy',        descPt: 'Energia de conexão'     },
};

function getFoodName(emoji: string, lang: Language): string {
  const entry = FOOD_NAMES[emoji];
  if (!entry) return emoji;
  return lang === 'pt-BR' ? entry.pt : entry.en;
}

function getFoodDesc(emoji: string, lang: Language): string {
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
        const attrs = getFoodAttrs(popover.emoji);
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

              {/* Attribute points */}
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
