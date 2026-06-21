import { useState, useEffect, memo } from 'react';
import imgHeartSprite from "figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png";
import bgCyberpunk from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import digiEggSprite from 'figma:asset/6479b687e03b8292ee02a4453bff2eb1a76cfecb.png';
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
import { EnergyBar } from './EnergyBar';
import { CareSystem, CareEvent } from './CareSystem';
import { ChatBox } from './ChatBox';
import { Language } from '../utils/i18n';

interface CompanionHUDProps {
  companionMood: 'idle' | 'happy' | 'tired';
  energyLevel: number;
  message: string;
  currentStage: string;
  evolutionStage: 'digiegg' | 'pichimon' | 'pukamon' | 'tapirmon' | 'tuskmon' | 'monochromon' | 'bakemon' | 'gigadramon' | 'triceramon' | 'digitamamon' | 'gaioumon' | 'ultimatebrachiomon' | 'titamon' | 'gaioumon-itto' | string;
  healthPoints: number;
  maxHealthPoints: number;
  timeUntilReset: string;
  dominantBranch: 'virus' | 'data' | 'vaccine' | 'balanced';
  currentXP: number;
  nextLevelXP: number;
  triggerMessage?: number; // Prop to trigger message from outside
  totalSteps: number;
  completedSteps: number;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  perfectDays?: number; // Dias perfeitos acumulados
  requiredDays?: number; // Dias necessários para evolução
  onDigivolve?: () => void;
  careEvent?: CareEvent | null;
  onCareEventComplete?: () => void;
  useAI: boolean;
  theme?: 'default' | 'win98' | 'glitch';
  aiSettings?: any;
  onOpenAISettings?: () => void;
  onCreateActivity?: (activity: {
    name: string;
    category: string;
    points: { virus: number; data: number; vaccine: number };
  }) => void;
  language: Language;
  foodInventory?: Record<string, number>;
  onFeed?: (foodEmoji: string) => void;
}

export const CompanionHUD = memo(function CompanionHUD({
  companionMood, 
  energyLevel, 
  message, 
  currentStage, 
  evolutionStage, 
  healthPoints, 
  maxHealthPoints, 
  timeUntilReset, 
  dominantBranch, 
  currentXP, 
  nextLevelXP,
  triggerMessage = 0,
  totalSteps,
  completedSteps,
  digivolutionSegments,
  digivolutionSegmentsNeeded,
  perfectDays = 0,
  requiredDays = 1,
  onDigivolve,
  careEvent,
  onCareEventComplete,
  useAI,
  theme = 'default',
  aiSettings,
  onOpenAISettings,
  onCreateActivity,
  language,
  foodInventory = {},
  onFeed,
}: CompanionHUDProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [position, setPosition] = useState(10);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [showBubble, setShowBubble] = useState(false);
  const [squashFrame, setSquashFrame] = useState(0);
  const [chatResponse, setChatResponse] = useState('');
  const [bubbleTimeoutId, setBubbleTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Walking animation
  useEffect(() => {
    const speed = companionMood === 'happy' ? 0.5 : companionMood === 'tired' ? 0.15 : 0.3;
    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = direction === 'right' ? prev + speed : prev - speed;
        
        // Reverse direction at boundaries (10 to 90 to prevent edge clipping)
        if (newPos >= 90) {
          setDirection('left');
          return 90;
        } else if (newPos <= 10) {
          setDirection('right');
          return 10;
        }
        
        return newPos;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction, companionMood]);

  // Squash and stretch animation (10% height variation)
  useEffect(() => {
    const squashInterval = setInterval(() => {
      setSquashFrame(prev => (prev + 1) % 2); // Alternate between 0 and 1
    }, 1200); // Change every 1200ms for slow breathing animation

    return () => clearInterval(squashInterval);
  }, []);

  // Random message bubble (exactly every 3 minutes)
  useEffect(() => {
    const showMessage = () => {
      setChatResponse(''); // Clear chat response to show random message
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
      }, 8000); // 8 seconds for random messages
    };

    // Show message every 3 minutes (180000ms)
    const interval = setInterval(() => {
      showMessage();
    }, 180000);

    return () => clearInterval(interval);
  }, []); // Run once on mount

  // Trigger message from outside (when activity is checked or new activity added)
  useEffect(() => {
    if (triggerMessage > 0) {
      setChatResponse(''); // Clear chat response to show random message
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
      }, 8000); // 8 seconds for trigger messages
    }
  }, [triggerMessage]);

  // Handle chat message response
  const handleChatMessage = (response: string) => {
    // Clear existing timeout if any
    if (bubbleTimeoutId) {
      clearTimeout(bubbleTimeoutId);
    }
    
    setChatResponse(response);
    setShowBubble(true);
    
    // Set new timeout for 7 seconds
    const timeoutId = setTimeout(() => {
      setShowBubble(false);
      setChatResponse('');
    }, 7000);
    
    setBubbleTimeoutId(timeoutId);
  };

  // Handle bubble click to dismiss
  const handleBubbleClick = () => {
    if (bubbleTimeoutId) {
      clearTimeout(bubbleTimeoutId);
    }
    setShowBubble(false);
    setChatResponse('');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimeoutId) {
        clearTimeout(bubbleTimeoutId);
      }
    };
  }, [bubbleTimeoutId]);

  // Handle digimon click - sends random emoji
  const handleDigimonClick = () => {
    const emojis = [
      '❤️', '💚', '💙', '💜', '✨', '⭐', '🌟', 
      '😊', '😄', '🥰', '😍', '🤗', '😎', '🤩',
      '💪', '👍', '✌️', '🙌', '👋', '🎮', '🎯',
      '🔥', '⚡', '💫', '🌈', '🎉', '🎊', '🚀'
    ];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    handleChatMessage(randomEmoji);
  };

  // Get sprite based on evolution stage
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
        return digiEggSprite; // Default to egg
    }
  };

  const sprite = getSprite();

  // Check if sprite should be flipped when walking left
  const shouldFlipOnLeft = () => {
    const noFlipStages = ['digiegg']; // Stages that look wrong when flipped
    return !noFlipStages.includes(evolutionStage.toLowerCase());
  };

  // Check if sprite is flipped by default and needs correction
  const isFlippedByDefault = () => {
    return evolutionStage.toLowerCase() === 'pichimon';
  };

  // Get the correct horizontal flip for the sprite
  const getHorizontalFlip = () => {
    const stage = evolutionStage.toLowerCase();
    
    // Pichimon is flipped by default, so we need to invert the logic
    if (isFlippedByDefault()) {
      return direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
    }
    
    // DigiEgg never flips
    if (stage === 'digiegg') {
      return 'scaleX(1)';
    }
    
    // All other sprites flip when going left
    return direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  };

  // Get squash/stretch scale (10% total variation: 90% to 100%)
  const getSquashScale = () => {
    return squashFrame === 0 ? 0.9 : 1.0; // 90% or 100% of original height
  };

  // Get branch aura color
  const getBranchAuraColor = () => {
    switch (dominantBranch) {
      case 'virus':
        return 'rgba(233, 79, 79, 0.6)'; // Red
      case 'data':
        return 'rgba(79, 128, 233, 0.6)'; // Blue
      case 'vaccine':
        return 'rgba(102, 233, 79, 0.6)'; // Green
      default:
        return 'rgba(156, 163, 175, 0.6)'; // Gray
    }
  };

  // Apply filters based on companion mood (without saturation reduction)
  const getCompanionFilter = () => {
    const auraColor = getBranchAuraColor();
    switch (companionMood) {
      case 'happy':
        return `brightness-110 drop-shadow-[0_0_12px_${auraColor}]`;
      case 'tired':
        return 'brightness-75';
      default:
        return `drop-shadow-[0_0_8px_${auraColor}]`;
    }
  };

  // Render pixel hearts for HP
  const renderHearts = () => {
    const hearts = [];
    const totalHearts = maxHealthPoints;
    
    for (let i = 0; i < totalHearts; i++) {
      const isFilled = i < healthPoints;
      
      hearts.push(
        <div key={i} className="relative h-[22px] w-[23px] flex-shrink-0">
          {isFilled ? (
            // Full heart (red)
            <img 
              alt="" 
              className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" 
              src={imgHeartSprite}
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            // Empty heart (black/dark)
            <img 
              alt="" 
              className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" 
              src={imgHeartSprite}
              style={{ 
                imageRendering: 'pixelated',
                filter: 'brightness(0.2) saturate(0)'
              }}
            />
          )}
        </div>
      );
    }
    
    return hearts;
  };

  // Render segmented Digivolution bar using perfect days
  const renderDigivolutionBar = () => {
    // Use new perfectDays/requiredDays system
    const totalSegments = requiredDays;
    const filledSegments = perfectDays;
    
    return (
      <div className="flex gap-[2px]">
        {Array.from({ length: totalSegments }, (_, i) => (
          <div
            key={i}
            className={`h-3 flex-1 transition-colors duration-300 ${
              isWin98 
                ? (i < filledSegments ? 'bg-[#000080]' : 'bg-[#808080]')
                : (i < filledSegments ? 'bg-gradient-to-r from-[#2bff95] to-teal-400' : 'bg-gray-600')
            }`}
            style={{ 
              minWidth: '8px',
              boxShadow: isWin98 
                ? (i < filledSegments 
                  ? 'inset 1px 1px 0 #000000, inset -1px -1px 0 #1084d0' 
                  : 'inset -1px -1px 0 #ffffff, inset 1px 1px 0 #808080')
                : (i < filledSegments ? '0 0 6px rgba(192, 132, 252, 0.6)' : 'none')
            }}
          />
        ))}
      </div>
    );
  };



  return (
    <div className={
      isGlitch 
        ? 'glitch-companion-window' 
        : isWin98 
          ? 'win98-companion-window' 
          : 'rounded-[10px] p-3 relative'
    }
    style={
      !isGlitch && !isWin98 
        ? { 
            backgroundColor: '#6A7282', 
            border: '1.1px solid #1F2A39',
            boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)'
          }
        : undefined
    }>
      {/* Win98 Title Bar */}
      {isWin98 && (
        <div className="win98-titlebar">
          <span className="win98-titlebar-text">{evolutionStage}.exe</span>
          <div className="win98-titlebar-buttons">
            <button className="win98-titlebar-button">_</button>
            <button className="win98-titlebar-button">✕</button>
          </div>
        </div>
      )}
      
      {/* Main Container with Companion Area and Energy Bar */}
      <div className={`flex gap-2 ${isWin98 ? 'p-2' : ''}`}>
        {/* Companion Display Area */}
        <div 
          className={`relative overflow-hidden p-3 flex-1 border ${ 
            isGlitch 
              ? 'border-2 border-[#00ffff]' 
              : isWin98 
                ? 'win98-lcd-screen crt-effect' 
                : 'border-[#596980]'
          }`}
          style={{ 
            height: '151px',
            backgroundImage: isWin98 ? 'none' : `url(${bgCyberpunk})`,
            backgroundColor: isWin98 ? '#9cbd90' : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated',
            borderWidth: '1.1px'
          }}
        >
          {isWin98 && <div className="scan-line" />}
          {/* HP Hearts - Top Left Corner */}
          <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap z-10">
            {renderHearts()}
          </div>

          {/* Message bubble - Fixed at top, full width, absolute positioning */}
          {showBubble && (
            <div className="absolute top-0 left-0 right-0 px-4 pt-2 z-20">
              <div 
                className={`px-4 py-2.5 animate-in fade-in slide-in-from-top-2 duration-300 cursor-pointer transition-all ${
                  isGlitch
                    ? 'glitch-activity-card'
                    : isWin98 
                      ? 'win98-activity-card'
                      : 'bg-white rounded-xl shadow-lg hover:shadow-xl'
                }`}
                onClick={handleBubbleClick}
              >
                <p 
                  className={isWin98 ? 'text-[#ffffff] text-center break-words' : 'text-gray-800 text-center break-words'}
                  style={{ 
                    fontFamily: isWin98 ? 'Courier New, monospace' : 'monospace', 
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                    textShadow: isWin98 ? '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.4)' : undefined
                  }}
                >
                  {chatResponse || message}
                </p>
              </div>
            </div>
          )}

          {/* Care Event Sprite */}
          {careEvent && <CareSystem careEvent={careEvent} onCareEventComplete={onCareEventComplete || (() => {})} />}

          {/* Digimon Sprite - Centered with walking animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Digimon Sprite with flip */}
            <div 
              className="absolute transition-all duration-100 ease-linear cursor-pointer hover:scale-110 active:scale-95"
              style={{ 
                left: `${position}%`,
                transform: getHorizontalFlip(),
                top: '50%',
                marginTop: '-40px',
                transition: 'left 0.1s ease-linear, transform 0.1s ease-linear'
              }}
              onClick={handleDigimonClick}
            >
              {sprite ? (
                <img 
                  src={sprite} 
                  alt={currentStage}
                  className={`w-20 h-20 object-contain ${getCompanionFilter()}`}
                  style={{ 
                    imageRendering: 'pixelated',
                    transform: `scaleY(${getSquashScale()})`,
                    transformOrigin: 'bottom'
                  }}
                />
              ) : (
                <div 
                  className="w-20 h-20 flex items-center justify-center bg-gray-700 rounded border-2 border-gray-600"
                  style={{ fontFamily: 'monospace' }}
                >
                  <span className="text-white" style={{ fontSize: '3rem', fontWeight: 'bold' }}>?</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Energy Bar - Vertical on Right Side */}
        <div 
          className={`flex flex-col-reverse items-center justify-end gap-1 rounded-[4px] ${
            isGlitch 
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]' 
              : isWin98 
                ? 'win98-lcd-screen' 
                : 'bg-[#1F2A39]'
          }`}
          style={{ height: '151px', width: '26px', padding: '11.998px 0' }}
        >
          <EnergyBar totalSteps={totalSteps} completedSteps={completedSteps} />
        </div>
      </div>

      {/* Version B: Food Inventory + Feed Panel */}
      {onFeed && (
        <div className={`mt-2 rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap ${
          isWin98 ? 'win98-button' : isGlitch ? 'bg-[#0a0a0a] border border-[#00ffff]' : 'bg-[#1F2A39]'
        }`}>
          {Object.keys(foodInventory).length === 0 ? (
            <p className="text-xs text-gray-500 flex-1" style={{ fontFamily: 'monospace' }}>
              Complete activities to earn food
            </p>
          ) : (
            <div className="flex gap-1.5 flex-wrap flex-1">
              {Object.entries(foodInventory).map(([emoji, count]) =>
                count > 0 ? (
                  <button
                    key={emoji}
                    onClick={() => onFeed(emoji)}
                    className="flex items-center gap-0.5 bg-[#0d1a2d] hover:bg-[#162840] active:scale-95 rounded-md px-1.5 py-0.5 transition-all border border-[#2a4060]"
                    title={`Feed ${emoji} (+1 HP)`}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{emoji}</span>
                    <span className="text-[#a0c0e0] text-[10px] font-bold" style={{ fontFamily: 'monospace' }}>×{count}</span>
                  </button>
                ) : null
              )}
            </div>
          )}
          <span className="text-[10px] text-gray-500 flex-shrink-0" style={{ fontFamily: 'monospace' }}>
            tap to feed +1❤️
          </span>
        </div>
      )}

      {/* Chat Box - Below Companion Area */}
      <div className="mt-2">
        <ChatBox 
          digimonName={currentStage}
          mood={companionMood}
          evolutionStage={evolutionStage}
          dominantBranch={dominantBranch}
          useAI={useAI}
          onSendMessage={handleChatMessage}
          theme={theme}
          aiSettings={aiSettings}
          onOpenAISettings={onOpenAISettings}
          onCreateActivity={onCreateActivity}
          language={language}
        />
      </div>
    </div>
  );
});
