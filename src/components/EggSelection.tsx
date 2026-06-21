import React, { useState } from 'react';
import digiEggSprite from 'figma:asset/6479b687e03b8292ee02a4453bff2eb1a76cfecb.png';

export type EggType = 'tapirmon' | 'veemon' | 'salamon';

interface EggSelectionProps {
  onSelect: (eggType: EggType) => void;
  onPreview?: (eggType: EggType | null) => void;
}

const EGG_DATA = {
  tapirmon: {
    name: 'White Egg',
    description: 'Tapirmon Line',
    color: '#FFFFFF',
    borderColor: '#c0c0c0',
    sprite: digiEggSprite,
    rookie: 'Rookie: Tapirmon',
  },
  veemon: {
    name: 'Blue Egg',
    description: 'Veemon Line',
    color: '#4A90E2',
    borderColor: '#2E5C8A',
    sprite: digiEggSprite,
    rookie: 'Rookie: Veemon',
  },
  salamon: {
    name: 'Pink Egg',
    description: 'Plotmon Line',
    color: '#FFB6C1',
    borderColor: '#E88CA8',
    sprite: digiEggSprite,
    rookie: 'Rookie: Plotmon',
  },
};

export function EggSelection({ onSelect, onPreview }: EggSelectionProps) {
  const [hoveredEgg, setHoveredEgg] = useState<EggType | null>(null);
  const [selectedEgg, setSelectedEgg] = useState<EggType | null>(null);

  const handleEggClick = (eggType: EggType) => {
    setSelectedEgg(eggType);
    onPreview?.(eggType);
  };

  const handleConfirm = () => {
    if (selectedEgg) {
      onSelect(selectedEgg);
    }
  };

  return (
    <div className="p-4">
      {/* Title */}
      <div className="text-center mb-4">
        <h2
          className="text-[#00ff99] text-lg font-bold mb-1"
          style={{ fontFamily: 'Consolas, monospace', letterSpacing: '0.05em' }}
        >
          CHOOSE YOUR EGG
        </h2>
        <p
          className="text-[#d0d0d0] text-xs"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          This choice is permanent
        </p>
      </div>

      {/* Egg Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {(Object.keys(EGG_DATA) as EggType[]).map((eggType) => {
          const egg = EGG_DATA[eggType];
          const isSelected = selectedEgg === eggType;
          const isHovered = hoveredEgg === eggType;

          return (
            <button
              key={eggType}
              onClick={() => handleEggClick(eggType)}
              onMouseEnter={() => setHoveredEgg(eggType)}
              onMouseLeave={() => setHoveredEgg(null)}
              className={`
                relative p-3 rounded-lg transition-all duration-300
                ${isSelected ? 'scale-105 shadow-lg' : isHovered ? 'scale-102' : 'scale-100'}
                hover:scale-105 active:scale-95
              `}
              style={{
                backgroundColor: isSelected || isHovered ? egg.color + '30' : '#1a2332',
                border: `2px solid ${isSelected ? egg.borderColor : '#2a3342'}`,
              }}
            >
              {isSelected && (
                <div
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: egg.borderColor }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div
                className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: egg.color,
                  boxShadow: isSelected
                    ? `0 4px 16px ${egg.color}80`
                    : isHovered
                    ? `0 2px 8px ${egg.color}60`
                    : 'none',
                }}
              >
                <img
                  src={egg.sprite}
                  alt={egg.name}
                  className="w-12 h-12 object-contain drop-shadow-lg"
                  style={{
                    imageRendering: 'pixelated',
                    filter:
                      eggType === 'veemon'
                        ? 'hue-rotate(200deg) saturate(1.5)'
                        : eggType === 'salamon'
                        ? 'hue-rotate(300deg) saturate(1.3) brightness(1.1)'
                        : 'none',
                  }}
                />
              </div>

              <div className="text-center">
                <h3
                  className="text-xs font-bold mb-0.5"
                  style={{ color: egg.borderColor, fontFamily: 'Consolas, monospace' }}
                >
                  {egg.name}
                </h3>
                <p
                  className="text-[10px] text-[#9ca3af]"
                  style={{ fontFamily: 'Consolas, monospace' }}
                >
                  {egg.rookie}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedEgg}
        className="w-full bg-[#00ff99] rounded-xl py-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
        style={{
          fontFamily: 'Consolas, monospace',
          fontSize: '0.875rem',
          fontWeight: '700',
          color: '#000',
          letterSpacing: '0.05em',
        }}
      >
        confirm
      </button>
    </div>
  );
}
