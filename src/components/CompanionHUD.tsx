import { useState, useEffect, useCallback, useRef, memo } from 'react';
import imgHeartSprite from "figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png";
import bgCyberpunk from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import { getSpriteForStage, LEFT_FACING_STAGES } from '../utils/sprites';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { EnergyBar } from './EnergyBar';
import { CareSystem, CareEvent } from './CareSystem';
import { ChatBox } from './ChatBox';
import { Language } from '../utils/i18n';
import { playShower } from '../utils/sounds';
import { getStageLevel } from '../types/progression';

interface CompanionHUDProps {
  companionMood: 'idle' | 'happy' | 'tired';
  energyLevel: number;
  message: string;
  currentStage: string;
  evolutionStage: string;
  /** Linha genérica de sprite (fallback visual até a Fase 2 assumir) — ver utils/sprites.ts. */
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  healthPoints: number;
  maxHealthPoints: number;
  dominantBranch: 'virus' | 'data' | 'vaccine' | 'balanced';
  currentXP: number;
  nextLevelXP: number;
  triggerMessage?: number; // Prop to trigger message from outside
  energyPoints?: number; // Version B: energy gauge, fills only via feeding
  maxEnergyPoints?: number; // energy bars = the stage's daily task requirement
  fullSignal?: number; // bumped when a feed is refused → pet says it's full
  healCapSignal?: number; // bumped when rubbing can't heal (daily cap reached)
  equippedBackground?: string | null; // shop backdrop id for the pet box
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
  onShower?: () => void;
  onOpenItems?: () => void;
  onSleep?: () => void;
  isSleeping?: boolean;
  onPet?: () => void;
  hasNewItems?: boolean;
  evolutionFlash?: boolean;
  feedAnim?: { emoji: string; n: number } | null;
}

export const CompanionHUD = memo(function CompanionHUD({
  companionMood, 
  energyLevel, 
  message, 
  currentStage,
  evolutionStage,
  eggType = 'tapirmon',
  healthPoints,
  maxHealthPoints, 
  dominantBranch, 
  currentXP, 
  nextLevelXP,
  triggerMessage = 0,
  energyPoints = 0,
  maxEnergyPoints,
  fullSignal = 0,
  healCapSignal = 0,
  equippedBackground = null,
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
  onShower,
  onOpenItems,
  onSleep,
  isSleeping = false,
  onPet,
  hasNewItems = false,
  evolutionFlash = false,
  feedAnim = null,
}: CompanionHUDProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  // Energy bars = the stage's daily task requirement (falls back to HP max for
  // older callers that don't pass it).
  const maxEnergy = maxEnergyPoints ?? maxHealthPoints;
  const [position, setPosition] = useState(10);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [showBubble, setShowBubble] = useState(false);
  const [squashFrame, setSquashFrame] = useState(0);
  const [bubbleText, setBubbleText] = useState('');
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eatingEmoji, setEatingEmoji] = useState<string | null>(null);
  const [eatKey, setEatKey] = useState(0);
  const [isMunching, setIsMunching] = useState(false);
  const [isRubbing, setIsRubbing] = useState(false);
  const [rubHearts, setRubHearts] = useState<{ id: number; dx: number; dy: number; size: number; emoji: string }[]>([]);
  const [isShowering, setIsShowering] = useState(false);
  // Rub-to-heal gesture bookkeeping (refs to avoid stale closures in the interval)
  const rubPressedRef = useRef(false);
  const rubMovedRef = useRef(false);
  const rubLastMoveRef = useRef(0);
  const rubAccumRef = useRef(0);
  const rubHeartTickRef = useRef(0);
  const rubHeartIdRef = useRef(0);
  const onPetRef = useRef<(() => void) | undefined>(undefined);
  onPetRef.current = onPet;
  const [showerCooldown, setShowerCooldown] = useState(false);
  const [hugBalloon, setHugBalloon] = useState(false);

  // Always-current snapshot of props for stable intervals
  const propsRef = useRef({ useAI, language, currentStage, companionMood, evolutionStage, dominantBranch, aiSettings, healthPoints, energyPoints, maxEnergy, maxHealthPoints, careEvent, isSleeping });
  propsRef.current = { useAI, language, currentStage, companionMood, evolutionStage, dominantBranch, aiSettings, healthPoints, energyPoints, maxEnergy, maxHealthPoints, careEvent, isSleeping };

  // speak: strips all emojis, shows bubble, auto-hides after durationMs
  const speak = useCallback((text: string, durationMs = 4000) => {
    const clean = (text || '').replace(/\p{Emoji_Presentation}|\p{Emoji}️/gu, '').replace(/\s{2,}/g, ' ').trim();
    if (!clean) return;
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    setBubbleText(clean);
    setShowBubble(true);
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
      setBubbleText('');
      bubbleTimeoutRef.current = null;
    }, durationMs);
  }, []);

  // speakRaw: no emoji stripping — only for the ❤️ feeding response
  const speakRaw = useCallback((text: string, durationMs = 3000) => {
    if (!text) return;
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    setBubbleText(text);
    setShowBubble(true);
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
      setBubbleText('');
      bubbleTimeoutRef.current = null;
    }, durationMs);
  }, []);

  const showHug = () => {
    setHugBalloon(true);
    setTimeout(() => setHugBalloon(false), 2000);
  };

  // Chat message from ChatBox — strip emojis, show for 5s
  const handleChatMessage = useCallback((response: string) => {
    speak(response, 5000);
  }, [speak]);

  useEffect(() => {
    if (!feedAnim) return;
    setEatingEmoji(feedAnim.emoji);
    setEatKey(k => k + 1);
    setIsMunching(true);
    showHug();
    speakRaw('+1⚡');
    setTimeout(() => setEatingEmoji(null), 1500);
    setTimeout(() => setIsMunching(false), 600);
  }, [feedAnim?.n, speakRaw]);

  // When a feed is refused (5/hour limit reached), the pet just says it's full
  // — with a hint that it can eat again in a little while.
  useEffect(() => {
    if (!fullSignal) return;
    const isPt = language === 'pt-BR';
    const lines = isPt
      ? ['Estou cheio! Me dá uma horinha...', 'Não aguento mais! Volta mais tarde.', 'Chega, obrigado! Daqui a pouco eu como de novo.']
      : ["I'm full! Give me an hour...", "I can't eat more! Come back later.", 'Enough, thanks! I can eat again in a bit.'];
    speak(lines[Math.floor(Math.random() * lines.length)], 3500);
  }, [fullSignal]);

  // When rubbing can't heal anymore today (daily cap), the pet says so.
  useEffect(() => {
    if (!healCapSignal) return;
    const isPt = language === 'pt-BR';
    const lines = isPt
      ? ['Já recebi muito carinho hoje! Hehe', 'Adoro carinho... mas já sarei o que dava por hoje!', 'Carinho é bom! Amanhã ele cura de novo.']
      : ['So much affection today! Hehe', 'I love it... but no more healing today!', 'Petting feels great! It heals again tomorrow.'];
    speak(lines[Math.floor(Math.random() * lines.length)], 3500);
  }, [healCapSignal]);

  // One-time coach mark: teach the rub-to-heal gesture the first time the pet
  // is hurt (it's the only way to heal, and gestures aren't discoverable).
  useEffect(() => {
    if (healthPoints >= maxHealthPoints) return;
    if (localStorage.getItem('digiapp-rub-hint-shown') === 'true') return;
    localStorage.setItem('digiapp-rub-hint-shown', 'true');
    const isPt = language === 'pt-BR';
    const t = setTimeout(() => {
      speak(
        isPt
          ? 'Estou machucado... faz carinho em mim! Segura e esfrega aqui que eu saro!'
          : "I'm hurt... pet me! Press and rub on me to heal me!",
        8000,
      );
    }, 1500);
    return () => clearTimeout(t);
  }, [healthPoints, maxHealthPoints]);


  const isEarlyStage = ['digiegg', 'baby-i'].includes(getStageLevel(evolutionStage));

  // Walking animation
  useEffect(() => {
    const speed = companionMood === 'happy' ? 0.5 : companionMood === 'tired' ? 0.15 : 0.3;
    const interval = setInterval(() => {
      if (isSleeping || isShowering || isMunching || isRubbing) return;
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
  }, [direction, companionMood, isSleeping, isShowering, isMunching, isRubbing]);

  // Squash and stretch animation (10% height variation)
  useEffect(() => {
    const squashInterval = setInterval(() => {
      setSquashFrame(prev => (prev + 1) % 2); // Alternate between 0 and 1
    }, 1200); // Change every 1200ms for slow breathing animation

    return () => clearInterval(squashInterval);
  }, []);

  // Random idle speech every 3 min — preset shown immediately, then API updates it
  useEffect(() => {
    const getIdlePhrase = (): string => {
      const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
      const p = propsRef.current;
      const ratio = p.maxEnergy > 0 ? p.energyPoints / p.maxEnergy : 0;
      const hpRatio = p.maxHealthPoints > 0 ? p.healthPoints / p.maxHealthPoints : 0;
      const isPt = p.language === 'pt-BR';
      if (p.careEvent?.type === 'poop') return isPt
        ? pick(['Preciso de banho!', 'Estou sujo!', 'Me limpa!'])
        : pick(['Need a shower!', 'I made a mess!', 'Clean me!']);
      if (p.careEvent?.type === 'food') return isPt
        ? pick(['Estou com fome!', 'Me alimenta!', 'Com fome!'])
        : pick(["I'm hungry!", 'Feed me!', 'So hungry!']);
      if (hpRatio <= 0.25) return isPt
        ? pick(['Nao me sinto bem...', 'Preciso de cuidados!', 'HP baixo...'])
        : pick(['Not feeling great...', 'Need some care!', 'My HP is low...']);
      if (ratio >= 1) return isPt
        ? pick(['Cheio de energia!', 'Pronto para tudo!', 'Totalmente carregado!'])
        : pick(['Full power!', 'Ready for anything!', 'Fully charged!']);
      if (ratio >= 0.6) return isPt
        ? pick(['Me sentindo bem!', 'Tudo certo!', 'Energia boa!'])
        : pick(['Feeling great!', 'All good!', 'Good energy!']);
      if (ratio >= 0.35) return isPt
        ? pick(['Podia comer algo...', 'Como esta seu dia?', 'Vamos completar tarefas!'])
        : pick(['Could use a snack...', "How's your day?", "Let's complete tasks!"]);
      if (ratio >= 0.1) return isPt
        ? pick(['Ficando com fome...', 'Preciso de comida!', 'Pouca energia...'])
        : pick(['Getting hungry...', 'Need food!', 'Low energy...']);
      return isPt
        ? pick(['Com muita fome...', 'Me alimenta por favor!', 'Estomago vazio...'])
        : pick(['So hungry...', 'Please feed me!', 'Empty stomach...']);
    };

    const interval = setInterval(() => {
      // Hidden tab: nobody sees the phrase — skip (and skip the paid AI call).
      if (document.hidden) return;
      const p = propsRef.current;
      if (p.isSleeping) return;
      speak(getIdlePhrase(), 5000);
      if (!p.useAI) return;
      const contextMsg = p.language === 'pt-BR'
        ? `[ALEATÓRIO] Diga algo espontâneo em primeira pessoa como ${p.currentStage}. Máx 12 palavras. Sem emojis.`
        : `[RANDOM] Say something spontaneous in first person as ${p.currentStage}. Max 12 words. No emojis.`;
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: contextMsg, digimonName: p.currentStage, mood: p.companionMood, evolutionStage: p.evolutionStage, dominantBranch: p.dominantBranch, language: p.language, aiSettings: p.aiSettings }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.response) speak(data.response, 5000); })
        .catch(() => {});
    }, 180000);

    return () => clearInterval(interval);
  }, [speak]);

  // Handle bubble click to dismiss
  const handleBubbleClick = () => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = null;
    setShowBubble(false);
    setBubbleText('');
  };

  // Handle digimon click — show preset phrase immediately, then fire API update
  const handleDigimonClick = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const ratio = maxEnergy > 0 ? energyPoints / maxEnergy : 0;
    const hpRatio = maxHealthPoints > 0 ? healthPoints / maxHealthPoints : 0;
    const isPt = language === 'pt-BR';
    let fallback: string;
    if (careEvent?.type === 'poop') fallback = isPt ? pick(['Preciso de banho!', 'Estou sujo!', 'Me limpa!']) : pick(['Need a shower!', 'I made a mess!', 'Clean me!']);
    else if (careEvent?.type === 'food') fallback = isPt ? pick(['Estou com fome!', 'Me alimenta!', 'Com fome!']) : pick(["I'm hungry!", 'Feed me!', 'So hungry!']);
    else if (hpRatio <= 0.25) fallback = isPt ? pick(['Nao me sinto bem...', 'Preciso de cuidados!', 'HP baixo...']) : pick(['Not feeling great...', 'Need some care!', 'My HP is low...']);
    else if (ratio >= 1) fallback = isPt ? pick(['Cheio de energia!', 'Pronto para tudo!', 'Totalmente carregado!']) : pick(['Full power!', 'Ready for anything!', 'Fully charged!']);
    else if (ratio >= 0.6) fallback = isPt ? pick(['Me sentindo bem!', 'Tudo otimo!', 'Energia boa!']) : pick(['Feeling great!', 'All good!', 'Good energy!']);
    else if (ratio >= 0.35) fallback = isPt ? pick(['Podia comer algo...', 'Como esta seu dia?', 'Vamos completar tarefas!']) : pick(['Could use a snack...', "How's your day?", "Let's complete tasks!"]);
    else if (ratio >= 0.1) fallback = isPt ? pick(['Ficando com fome...', 'Preciso de comida!', 'Pouca energia...']) : pick(['Getting hungry...', 'Need food!', 'Low energy...']);
    else fallback = isPt ? pick(['Com muita fome...', 'Me alimenta por favor!', 'Estomago vazio...']) : pick(['So hungry...', 'Please feed me!', 'Empty stomach...']);
    speak(fallback, 4000);

    if (!useAI) return;

    const contextMsg = language === 'pt-BR'
      ? `[TOQUE] O usuário tocou em você. Energia: ${Math.round(ratio * 100)}%, HP: ${healthPoints}/${maxHealthPoints}. Responda como ${currentStage} com 1 frase curta e fofa (máx 15 palavras).`
      : `[TOUCH] User tapped you. Energy: ${Math.round(ratio * 100)}%, HP: ${healthPoints}/${maxHealthPoints}. Reply as ${currentStage} with 1 short cute sentence (max 15 words).`;

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: contextMsg, digimonName: currentStage, mood: companionMood, evolutionStage, dominantBranch, language, aiSettings }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.response) speak(data.response, 5000); })
      .catch(() => {});
  };

  const sprite = getSpriteForStage(evolutionStage, eggType);


  // Check if sprite should be flipped when walking left
  const shouldFlipOnLeft = () => {
    const noFlipStages = ['digiegg']; // Stages that look wrong when flipped
    return !noFlipStages.includes(evolutionStage.toLowerCase());
  };

  // Check if sprite is flipped by default and needs correction
  const isFlippedByDefault = () => {
    return LEFT_FACING_STAGES.includes(evolutionStage.toLowerCase());
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
  const handleFeedWithAnimation = (emoji: string) => {
    setEatingEmoji(emoji);
    setEatKey(k => k + 1);
    setIsMunching(true);
    onFeed?.(emoji);
    showHug();
    setTimeout(() => setEatingEmoji(null), 1500);
    setTimeout(() => setIsMunching(false), 600);
  };

  // Shower: always available (cleans poop anytime), 5s cooldown
  const handleShowerClick = () => {
    if (isShowering || showerCooldown) return;
    setIsShowering(true);
    setShowerCooldown(true);
    onShower?.();
    playShower();
    showHug();
    setTimeout(() => setIsShowering(false), 1600);
    setTimeout(() => setShowerCooldown(false), 5000);
  };

  // Rub-to-heal ("carinho"): rub the pet (drag over it) to make little hearts
  // pop out; every ~2s of active rubbing restores half a heart (via onPet).
  // The 100ms ticker only exists while the pointer is down (battery-friendly).
  const rubIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRub = (e: React.PointerEvent) => {
    rubPressedRef.current = true;
    rubMovedRef.current = false;
    rubLastMoveRef.current = Date.now();
    rubAccumRef.current = 0;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ }
    if (!rubIntervalRef.current) rubIntervalRef.current = setInterval(rubTick, 100);
  };
  const moveRub = () => {
    if (rubPressedRef.current) {
      rubLastMoveRef.current = Date.now();
      rubMovedRef.current = true;
    }
  };
  const endRub = () => {
    rubPressedRef.current = false;
    rubAccumRef.current = 0;
    setIsRubbing(false);
    if (rubIntervalRef.current) {
      clearInterval(rubIntervalRef.current);
      rubIntervalRef.current = null;
    }
  };
  // Clear the ticker if the component unmounts mid-rub.
  useEffect(() => () => {
    if (rubIntervalRef.current) clearInterval(rubIntervalRef.current);
  }, []);

  const rubTick = () => {
    const TICK = 100;
    {
      const now = Date.now();
      const active = rubPressedRef.current && now - rubLastMoveRef.current < 180;
      setIsRubbing(active);
      if (!active) return;
      // Every ~500ms emit a small BURST of hearts drifting out from the center.
      rubHeartTickRef.current += 1;
      if (rubHeartTickRef.current % 5 === 0) {
        // Tactile feedback on devices that support it (Android)
        try { navigator.vibrate?.(20); } catch { /* noop */ }
        const EMOJIS = ['❤️', '💕', '💖', '💗'];
        const burst = 2 + Math.floor(Math.random() * 2); // 2–3 hearts at once
        const spawned: { id: number; dx: number; dy: number; size: number; emoji: string }[] = [];
        for (let k = 0; k < burst; k++) {
          const id2 = ++rubHeartIdRef.current;
          const angle = Math.random() * Math.PI * 2;
          const dist = 32 + Math.random() * 46; // moderate spread (32–78px)
          spawned.push({
            id: id2,
            dx: Math.round(Math.cos(angle) * dist),
            dy: Math.round(Math.sin(angle) * dist),
            size: 0.65 + Math.random() * 0.55, // varied heart sizes
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          });
          setTimeout(() => setRubHearts(prev => prev.filter(h => h.id !== id2)), 1500);
        }
        setRubHearts(prev => [...prev, ...spawned]);
      }
      // Accumulate heal time only while there's HP to restore
      const p = propsRef.current;
      if (p.healthPoints < p.maxHealthPoints) {
        rubAccumRef.current += TICK;
        if (rubAccumRef.current >= 2000) {
          rubAccumRef.current -= 2000;
          onPetRef.current?.();
        }
      } else {
        rubAccumRef.current = 0;
      }
    }
  };

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

  // Render pixel hearts for HP (supports half hearts from "carinho")
  const renderHearts = () => {
    const hearts = [];
    const totalHearts = maxHealthPoints;
    const fullHearts = Math.floor(healthPoints);
    const hasHalf = healthPoints - fullHearts >= 0.5;

    for (let i = 0; i < totalHearts; i++) {
      const isFull = i < fullHearts;
      const isHalf = i === fullHearts && hasHalf;

      hearts.push(
        <div key={i} className="relative h-[22px] w-[23px] flex-shrink-0">
          {/* Base heart: red when full, dark when empty/half */}
          <img
            alt=""
            className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
            src={imgHeartSprite}
            style={{
              imageRendering: 'pixelated',
              filter: isFull ? 'none' : 'brightness(0.2) saturate(0)',
            }}
          />
          {/* Half overlay: red left 50% over the dark base */}
          {isHalf && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: '50%' }}>
              <img
                alt=""
                className="max-w-none"
                src={imgHeartSprite}
                style={{ imageRendering: 'pixelated', width: '23px', height: '22px' }}
              />
            </div>
          )}
        </div>
      );
    }

    return hearts;
  };

  // Render segmented Digivolution bar using perfect days
  const renderDigivolutionBar = () => {
    const totalSegments = requiredDays;
    const filledSegments = perfectDays;
    const isPt = language === 'pt-BR';

    return (
      <div title={isPt ? `${filledSegments}/${totalSegments} dias perfeitos para digivolução` : `${filledSegments}/${totalSegments} perfect days to digivolve`}>
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
        <p className={`text-[9px] mt-0.5 text-right ${isWin98 ? 'text-[#000080]' : 'text-gray-300'}`} style={{ fontFamily: 'monospace' }}>
          {filledSegments}/{totalSegments} {isPt ? 'dias' : 'days'}
        </p>
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
      <div className="relative">
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
            height: '185px',
            backgroundImage: isWin98
              ? 'none'
              : (equippedBackground && PET_BACKGROUNDS[equippedBackground]?.css) || `url(${bgCyberpunk})`,
            backgroundColor: isWin98 ? '#9cbd90' : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated',
            borderWidth: '1.1px'
          }}
        >
          {isWin98 && <div className="scan-line" />}
          {/* HP Hearts - Top Left Corner */}
          <div
            className="absolute top-2 left-2 flex items-center gap-1 flex-wrap z-10"
            title={language === 'pt-BR' ? `HP: ${healthPoints}/${maxHealthPoints} — cai quando você perde cuidados` : `HP: ${healthPoints}/${maxHealthPoints} — drops when care events are missed`}
          >
            {renderHearts()}
          </div>

          {/* Evolution flash overlay */}
          {evolutionFlash && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
              <div className="absolute inset-0 bg-white/70 animate-pulse" />
              <span className="relative text-[#2bff95] font-bold drop-shadow-lg text-center" style={{ fontFamily: 'monospace', fontSize: '1rem', textShadow: '0 0 12px #2bff95' }}>
                {language === 'pt-BR' ? '✨ DIGIVOLUÇÃO! ✨' : '✨ DIGIVOLVE! ✨'}
              </span>
            </div>
          )}


          {/* Care Event Sprite */}
          {careEvent && <CareSystem careEvent={careEvent} onCareEventComplete={onCareEventComplete || (() => {})} />}

          {/* Digimon Sprite - Centered with walking animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Burst of hearts exploding from the pet center and radiating out */}
            {rubHearts.map(h => (
              <span
                key={h.id}
                className="absolute pointer-events-none z-30 select-none"
                style={{
                  left: `${position}%`,
                  top: 'calc(50% - 8px)',
                  fontSize: `${h.size}rem`,
                  ['--tx' as string]: `${h.dx}px`,
                  ['--ty' as string]: `${h.dy}px`,
                  animation: 'rub-heart 1.5s ease-out forwards',
                } as React.CSSProperties}
              >
                {h.emoji}
              </span>
            ))}

            {/* Hug balloon — follows pet position, shown after feed or shower */}
            {hugBalloon && (
              <div
                className="absolute z-25 pointer-events-none animate-in fade-in zoom-in-75 duration-150"
                style={{ left: `${position}%`, top: 'calc(50% - 78px)', transform: 'translateX(-50%)' }}
              >
                <div className="relative bg-white rounded-full px-2 py-0.5 shadow text-lg leading-none">
                  🤗
                  <span className="absolute left-1/2 -bottom-[5px] -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white" />
                </div>
              </div>
            )}

            {/* Floating food emoji when eating */}
            {eatingEmoji && (
              <span
                key={eatKey}
                className="absolute pointer-events-none z-20 text-2xl"
                style={{
                  left: `${position}%`,
                  top: '50%',
                  animation: 'float-up 1.5s ease-out forwards',
                }}
              >
                {eatingEmoji}
              </span>
            )}

            {/* Digimon Sprite with flip */}
            <div
              className="absolute transition-all duration-100 ease-linear cursor-pointer hover:scale-110 active:scale-95"
              style={{
                left: `${position}%`,
                transform: getHorizontalFlip(),
                top: '50%',
                marginTop: '-20px',
                transition: 'left 0.1s ease-linear, transform 0.1s ease-linear',
                touchAction: 'none', // let the rub gesture own the pointer
              }}
              onClick={() => { if (rubMovedRef.current) { rubMovedRef.current = false; return; } handleDigimonClick(); }}
              onPointerDown={startRub}
              onPointerMove={moveRub}
              onPointerUp={endRub}
              onPointerCancel={endRub}
            >
              {sprite ? (
                <img
                  src={sprite}
                  alt={currentStage}
                  className={`w-20 h-20 object-contain ${getCompanionFilter()}`}
                  style={{
                    imageRendering: 'pixelated',
                    transform: `scaleY(${getSquashScale()})`,
                    transformOrigin: 'bottom',
                    animation: isRubbing
                      ? 'pet-rub 0.35s ease-in-out infinite'
                      : isShowering
                        ? 'pet-shower-shake 0.5s ease-in-out 3'
                        : isMunching
                          ? 'pet-munch 0.6s ease-out'
                          : undefined,
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

              {/* Shower water droplets */}
              {isShowering && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <span
                      key={i}
                      className="absolute text-sm"
                      style={{
                        left: `${10 + i * 14}%`,
                        top: '-10px',
                        animation: `shower-drop 0.9s linear ${i * 0.12}s infinite`,
                      }}
                    >
                      💧
                    </span>
                  ))}
                  <span
                    className="absolute text-xl"
                    style={{ left: '50%', top: '-26px', transform: 'translateX(-50%)' }}
                  >
                    🚿
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sleeping overlay */}
          {isSleeping && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="absolute text-white font-bold"
                  style={{
                    left: `${56 + i * 9}%`,
                    top: `${42 - i * 13}%`,
                    fontSize: `${0.65 + i * 0.18}rem`,
                    fontFamily: 'monospace',
                    animation: `float-up 2s ease-out ${i * 0.9}s infinite`,
                  }}
                >
                  Z
                </span>
              ))}
            </div>
          )}

          {/* Speech bubble — anchored to bottom of pet area */}
          {showBubble && (
            <div
              className="absolute bottom-0 left-0 right-0 z-[45] px-2 pb-1 pointer-events-auto"
              onClick={handleBubbleClick}
            >
              <div
                className={`relative px-3 py-1.5 cursor-pointer ${
                  isGlitch
                    ? 'glitch-activity-card'
                    : isWin98
                      ? 'win98-activity-card'
                      : 'bg-white rounded-xl shadow-lg'
                }`}
              >
                <p
                  className={isWin98 ? 'text-white text-center break-words' : 'text-gray-800 text-center break-words'}
                  style={{
                    fontFamily: isWin98 ? 'Courier New, monospace' : 'monospace',
                    fontSize: '0.68rem',
                    lineHeight: '1.3',
                    textShadow: isWin98 ? '0 0 10px rgba(0,255,255,0.8)' : undefined,
                  }}
                >
                  {bubbleText}
                </p>
                {/* Bubble tail pointing up */}
                <span
                  className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: isWin98 ? '6px solid #003' : '6px solid white',
                  }}
                />
              </div>
            </div>
          )}

          {/* Desktop icons — top-right of pet area */}
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 30, display: 'flex', gap: '2px' }}>
            {([
              !isEarlyStage && { key: 'items', icon: '📁', en: 'Items', pt: 'Itens', onClick: onOpenItems ?? (() => {}), disabled: false, badge: hasNewItems },
              !isEarlyStage && { key: 'bath', icon: '🚿', en: 'Bath', pt: 'Banho', onClick: handleShowerClick, disabled: showerCooldown, badge: false },
              { key: 'sleep', icon: isSleeping ? '☀️' : '💤', en: isSleeping ? 'Wake' : 'Sleep', pt: isSleeping ? 'Acordar' : 'Dormir', onClick: onSleep ?? (() => {}), disabled: false, badge: false },
            ].filter(Boolean) as { key: string; icon: string; en: string; pt: string; onClick: () => void; disabled: boolean; badge: boolean | undefined; sub?: string }[]).map(a => (
              <button
                key={a.key}
                onClick={a.key === 'bath' ? a.onClick : (a.disabled ? undefined : a.onClick)}
                disabled={a.key !== 'bath' && a.disabled}
                title={language === 'pt-BR' ? a.pt : a.en}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '4px 8px 5px',
                  cursor: a.disabled ? 'default' : 'pointer',
                  opacity: a.disabled ? 0.4 : 1,
                  background: 'transparent',
                  border: 'none',
                  userSelect: 'none',
                }}
              >
                {a.badge && (
                  <span style={{
                    position: 'absolute',
                    top: 0, right: 2,
                    width: 8, height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    border: '1px solid #000',
                    zIndex: 10,
                  }} />
                )}
                <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{a.icon}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap' }}>
                  {language === 'pt-BR' ? a.pt : a.en}
                </span>
                {a.sub && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#ffd27f', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap', lineHeight: 1 }}>
                    {a.sub}
                  </span>
                )}
              </button>
            ))}
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
          style={{ height: '185px', width: '26px', padding: '11.998px 0', cursor: 'pointer' }}
          title={language === 'pt-BR'
            ? `Energia: ${energyPoints}/${maxEnergy} — sobe comendo; cheia no fim do dia = ponto de evolução`
            : `Energy: ${energyPoints}/${maxEnergy} — fills by eating; full at day's end = evolution point`}
          onClick={() => speak(
            language === 'pt-BR'
              ? `Minha energia: ${energyPoints}/${maxEnergy}! Enche comendo — se estiver cheia no fim do dia, o dia conta pra evolução!`
              : `My energy: ${energyPoints}/${maxEnergy}! Fills by eating — full at day's end makes the day count for evolution!`,
            5000,
          )}
        >
          <EnergyBar totalSegments={maxEnergy} filledSegments={energyPoints} />
        </div>
      </div>

      </div>

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
