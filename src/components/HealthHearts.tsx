import heartFull from "figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png";

interface HealthHeartsProps {
  currentHP: number;
  maxHP: number;
}

export function HealthHearts({ currentHP, maxHP }: HealthHeartsProps) {
  // Each heart represents 2 HP
  const totalHearts = Math.ceil(maxHP / 2);
  
  const renderHeart = (index: number) => {
    const hpForThisHeart = Math.max(0, Math.min(2, currentHP - (index * 2)));
    
    // 0 HP = empty (grayscale/dark)
    // 1 HP = half filled
    // 2 HP = full
    
    if (hpForThisHeart === 0) {
      // Empty heart - dark/grayscale
      return (
        <div 
          key={index} 
          className="w-4 h-4 bg-contain bg-center bg-no-repeat grayscale brightness-50"
          style={{ 
            backgroundImage: `url(${heartFull})`,
            imageRendering: 'pixelated'
          }}
        />
      );
    } else if (hpForThisHeart === 1) {
      // Half filled heart - use clip-path to show half
      return (
        <div key={index} className="relative w-4 h-4">
          {/* Left half - colored */}
          <div 
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${heartFull})`,
              imageRendering: 'pixelated',
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
            }}
          />
          {/* Right half - dark */}
          <div 
            className="absolute inset-0 bg-contain bg-center bg-no-repeat grayscale brightness-50"
            style={{ 
              backgroundImage: `url(${heartFull})`,
              imageRendering: 'pixelated',
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
            }}
          />
        </div>
      );
    } else {
      // Full heart
      return (
        <div 
          key={index} 
          className="w-4 h-4 bg-contain bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heartFull})`,
            imageRendering: 'pixelated'
          }}
        />
      );
    }
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: totalHearts }, (_, i) => renderHeart(i))}
    </div>
  );
}
