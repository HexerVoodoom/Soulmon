import { useState, useEffect } from 'react';
import bgCyberpunk from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";
import digiEggSprite from 'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png';
import pichimonSprite from 'figma:asset/99ff747d7f7ecc2424e131a43c54669bcba9a301.png';
import pukamonSprite from 'figma:asset/104dc13e2c146bb51e00903d6eaa5f6fae7619c6.png';
import tapirmonSprite from 'figma:asset/7d2b0a9b519f16f1d0a258d9670cfc62230e1903.png';
import monochromon from 'figma:asset/7bc96986446973a3544f57a9055e59fc87022f42.png';
import triceramonSprite from 'figma:asset/91974d820051b34dd9e9db8f1b4f72ae1216ed98.png';
import tuskmonSprite from 'figma:asset/4545c1113c2742541bfa287e8aaad34d540d5188.png';
import ultimateBrachiomon from 'figma:asset/cfe5f78d2ba5745cf2fab94f2ea9e70d1b5bfc0a.png';
import gaioumonSprite from 'figma:asset/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png';
import bakemonSprite from 'figma:asset/cc04120f94ce0a4ae081b26d2359ca0dd7488f6d.png';
import digitamamonSprite from 'figma:asset/15b86f9a6a117217f92fc8c35383b8ba7a68d995.png';
import gigadramonSprite from 'figma:asset/61935125c675c3d79b74bdfbb783563de187250a.png';
import titamonSprite from 'figma:asset/2289f0ba6bd5182e66b3253be305d6860dbe1148.png';
import gaioumonIttoSprite from 'figma:asset/2f5fefb3d68da3d20ef1d5195a8f0ddc506b1149.png';

interface WidgetViewProps {
  variant: '1x1' | '1x8' | '2x8';
  energyLevel: number;
  message?: string;
  companionMood: 'idle' | 'happy' | 'tired';
  evolutionStage?: string;
  completedTasks?: number;
  totalTasks?: number;
}

export function WidgetView({ variant, energyLevel, message, companionMood, evolutionStage = 'tapirmon', completedTasks = 0, totalTasks = 0 }: WidgetViewProps) {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  // Walking animation
  useEffect(() => {
    const speed = companionMood === 'happy' ? 0.5 : companionMood === 'tired' ? 0.15 : 0.3;
    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = direction === 'right' ? prev + speed : prev - speed;
        
        if (newPos >= 100) {
          setDirection('left');
          return 100;
        } else if (newPos <= 0) {
          setDirection('right');
          return 0;
        }
        
        return newPos;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction, companionMood]);

  const getSprite = () => {
    switch (evolutionStage.toLowerCase()) {
      case 'digiegg':
        return digiEggSprite;
      case 'pichimon':
        return pichimonSprite;
      case 'pukamon':
        return pukamonSprite;
      case 'tapirmon':
        return tapirmonSprite;
      case 'monochromon':
        return monochromon;
      case 'triceramon':
        return triceramonSprite;
      case 'tuskmon':
        return tuskmonSprite;
      case 'bakemon':
        return bakemonSprite;
      case 'digitamamon':
        return digitamamonSprite;
      case 'gigadramon':
        return gigadramonSprite;
      case 'ultimatebrachiomon':
        return ultimateBrachiomon;
      case 'gaioumon':
        return gaioumonSprite;
      case 'titamon':
        return titamonSprite;
      case 'gaioumon-itto':
        return gaioumonIttoSprite;
      default:
        return digiEggSprite;
    }
  };

  const getCompanionFilter = () => {
    switch (companionMood) {
      case 'happy':
        return 'brightness-110 saturate-150 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]';
      case 'tired':
        return 'brightness-75 saturate-50 grayscale-[0.3]';
      default:
        return '';
    }
  };

  if (variant === '1x1') {
    return (
      <div className="bg-gray-500 rounded-lg p-2 border-2 border-gray-600 inline-block">
        <div 
          className="w-20 h-20 rounded border-2 border-gray-600 flex items-center justify-center relative overflow-hidden"
          style={{ 
            backgroundImage: `url(${bgCyberpunk})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated'
          }}
        >
          <div 
            className="absolute transition-all duration-100 ease-linear"
            style={{ 
              left: `${position}%`,
              transform: `translateX(-50%) ${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`
            }}
          >
            <img 
              src={getSprite()} 
              alt="Companion"
              className={`w-12 h-12 object-contain ${getCompanionFilter()}`}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          {/* Task Counter - Top Left */}
          {totalTasks > 0 && (
            <div className="absolute top-1 left-1 bg-gray-800/80 rounded px-1 border border-gray-600">
              <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.5rem' }}>
                {completedTasks}/{totalTasks}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === '1x8') {
    return (
      <div className="w-64 bg-gray-500 rounded-lg p-2 border-2 border-gray-600 flex flex-col gap-2">
        <div 
          className="w-full h-20 rounded border-2 border-gray-600 relative overflow-hidden"
          style={{ 
            backgroundImage: `url(${bgCyberpunk})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated'
          }}
        >
          <div 
            className="absolute transition-all duration-100 ease-linear top-1/2 -translate-y-1/2"
            style={{ 
              left: `${position}%`,
              transform: `translate(-50%, -50%) ${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`
            }}
          >
            <img 
              src={getSprite()} 
              alt="Companion"
              className={`w-14 h-14 object-contain ${getCompanionFilter()}`}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          {/* Task Counter - Top Left */}
          {totalTasks > 0 && (
            <div className="absolute top-1 left-1 bg-gray-800/80 rounded px-1.5 py-0.5 border border-gray-600">
              <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.5rem' }}>
                {completedTasks}/{totalTasks}
              </span>
            </div>
          )}
        </div>
        <div className="w-full bg-white rounded px-2 py-1.5 border border-gray-800">
          <p className="text-gray-800" style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>
            {message || "It's good to have you around!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-500 rounded-lg p-3 border-2 border-gray-600 flex flex-col gap-2">
      <div 
        className="w-full h-32 rounded border-2 border-gray-600 relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${bgCyberpunk})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated'
        }}
      >
        {/* Task Counter - Top Left */}
        {totalTasks > 0 && (
          <div className="absolute top-1 left-1 bg-gray-800/80 rounded px-1.5 py-0.5 border border-gray-600 z-10">
            <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>
              {completedTasks}/{totalTasks}
            </span>
          </div>
        )}
        <div 
          className="absolute top-1/2 transition-all duration-100 ease-linear"
          style={{ 
            left: `${position}%`,
            transform: `translate(-50%, -50%) ${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`
          }}
        >
          <img 
            src={getSprite()} 
            alt="Companion"
            className={`w-16 h-16 object-contain ${getCompanionFilter()}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      <div className="w-full bg-white rounded px-3 py-2 border-2 border-gray-800">
        <p className="text-gray-800 text-center" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {message || "It's good to have you around!"}
        </p>
      </div>
    </div>
  );
}
