import { useState, useRef, useEffect } from 'react';
import type { Language } from '../utils/i18n';

interface ItemsWindowProps {
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  onClose: () => void;
  language?: Language;
}

// Pixel-art food icon names (Win98 file names style)
const FOOD_NAMES: Record<string, { en: string; pt: string }> = {
  '🍎': { en: 'Apple',      pt: 'Maçã'      },
  '🥩': { en: 'Meat',       pt: 'Carne'     },
  '🥗': { en: 'Salad',      pt: 'Salada'    },
  '📚': { en: 'EduPack',    pt: 'Edu-Pack'  },
  '🎯': { en: 'FocusBite',  pt: 'FocoSnack' },
  '💧': { en: 'AquaDrop',   pt: 'AquaDrop'  },
  '🧘': { en: 'ZenBar',     pt: 'Zen Bar'   },
  '💪': { en: 'ProtBar',    pt: 'Prot-Bar'  },
  '📓': { en: 'ThinkSnack', pt: 'PensaSnack'},
  '🌅': { en: 'DawnBite',   pt: 'Amanhecer' },
  '💻': { en: 'CodeFuel',   pt: 'CodeFuel'  },
  '📅': { en: 'PlanBite',   pt: 'PlanBite'  },
  '🍅': { en: 'TomatoBit',  pt: 'TomatoBit' },
  '🔕': { en: 'FocusPack',  pt: 'SilêncPac' },
  '📞': { en: 'SocialPill', pt: 'SocialPil' },
};

function getFoodName(emoji: string, lang: Language): string {
  const entry = FOOD_NAMES[emoji];
  if (!entry) return emoji;
  return lang === 'pt-BR' ? entry.pt : entry.en;
}

export function ItemsWindow({ foodInventory, onFeed, onClose, language = 'en-US' }: ItemsWindowProps) {
  const [pos, setPos] = useState({ x: 40, y: -320 }); // relative to bottom of screen
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, px: 0, py: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [justFed, setJustFed] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const isPt = language === 'pt-BR';
  const items = Object.entries(foodInventory).filter(([, c]) => c > 0);

  // Drag handlers
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

  const handleFeed = (emoji: string) => {
    onFeed(emoji);
    setJustFed(emoji);
    setTimeout(() => setJustFed(null), 600);
  };

  return (
    <div
      ref={windowRef}
      className="fixed z-[200] select-none"
      style={{ bottom: `calc(0px + ${-pos.y}px)`, left: pos.x, width: 260 }}
    >
      {/* Win98 window frame */}
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
          {/* Title bar buttons */}
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
          onClick={() => setSelected(null)}
        >
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
              {isPt ? '(sem itens)' : '(no items)'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 p-1">
              {items.map(([emoji, count]) => {
                const isSelected = selected === emoji;
                const isFed = justFed === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={e => { e.stopPropagation(); setSelected(emoji); }}
                    onDoubleClick={e => { e.stopPropagation(); handleFeed(emoji); }}
                    className="flex flex-col items-center gap-0.5 p-1 rounded-none w-14 transition-none"
                    style={{
                      backgroundColor: isSelected ? '#000080' : 'transparent',
                      border: isFed ? '1px dashed #2bff95' : isSelected ? 'none' : 'none',
                      transform: isFed ? 'scale(0.92)' : 'none',
                      cursor: 'default',
                    }}
                    title={`${getFoodName(emoji, language)} ×${count} — ${isPt ? 'duplo clique para usar' : 'double-click to use'}`}
                  >
                    <span style={{ fontSize: '1.5rem', imageRendering: 'pixelated', lineHeight: 1 }}>{emoji}</span>
                    <span
                      className="text-center leading-tight break-all"
                      style={{
                        fontFamily: 'monospace', fontSize: '0.6rem', lineHeight: '1.1',
                        color: isSelected ? '#fff' : '#000',
                        maxWidth: 52,
                      }}
                    >
                      {getFoodName(emoji, language)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace', fontSize: '0.6rem',
                        color: isSelected ? '#adf' : '#666',
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
          {selected && (
            <button
              onClick={() => handleFeed(selected)}
              style={{
                fontSize: '0.65rem', fontFamily: 'monospace',
                backgroundColor: '#c0c0c0', padding: '1px 6px',
                border: '1.5px solid', borderColor: '#ffffff #808080 #808080 #ffffff',
              }}
            >
              {isPt ? 'Usar' : 'Use'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
