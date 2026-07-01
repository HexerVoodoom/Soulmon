import { useState, useEffect, useCallback, useRef, memo } from 'react';
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
// Veemon line sprites
import chicomonSprite from 'figma:asset/4d2fa6b5f39afed1e868edf4c8faf3c4888ecc84.png';
import chibimonSprite from 'figma:asset/3b47f9d0035dbc50ffa6a78567bf904fc56834d6.png';
import veemonSprite from 'figma:asset/17701dd96050e16b1fac593a32079ae86e5bd531.png';
import exVeemonSprite from 'figma:asset/136cb8d464cc8d648c7de82119ca05f5c5396af5.png';
import paildramonSprite from 'figma:asset/bfde95df2c77e342ddcf05bd6a8480711ea5a740.png';
import imperialdramonSprite from 'figma:asset/701f6bc49c8ab4166c27d7c362af3194b202a330.png';
import veedramonSprite from 'figma:asset/dcf2429f06e823eb567e0018e2d2de9887b5c034.png';
import aeroVeedramonSprite from 'figma:asset/e276464f1870730b1e5cb5dfbed9d586df28d609.png';
import ulforceVeedramonSprite from 'figma:asset/7bdcafe95cc603bba49f20349fe242e981ddf8ec.png';
import flamedramonSprite from 'figma:asset/b75ac337773a9cbda275e4994894104282fe9943.png';
import raidramonSprite from 'figma:asset/4fc596d119266f4125b18733231e3f326f163b28.png';
import magnamonSprite from 'figma:asset/46ea13627a0da430619fa9e993f7d14bb613d5f8.png';
import imperialdramonPaladinSprite from 'figma:asset/8ad9573c77b42ea0708b5b29032a7489c7616571.png';
// Salamon line sprites
import yukimibotamonSprite from 'figma:asset/eb90dd429719211430c96bfff0ab33ce4263dc33.png';
import nyaromonSprite from 'figma:asset/21c7ddc9f28cb93fb5e301b2bfb797ade7767403.png';
import plotmonSprite from 'figma:asset/acf058298d9eb6312c16c5f296a808c2f4edc163.png';
import gatomonSprite from 'figma:asset/cd6cdea0aaf4dea528d69cb4812333fe7980f034.png';
import angewomonSprite from 'figma:asset/91def178d3bb589f11cf012e72a30ed12f14ed5a.png';
import ophanimonSprite from 'figma:asset/0523e198a779637515f03904bb4baa992fdf837e.png';
import blackGatomonSprite from 'figma:asset/6597e8c17a1647c444bdc1d375da54f07b1e8d45.png';
import ladyDevimonSprite from 'figma:asset/6e5b9d1d2d1c049b40fcb76d3e31d0ed15713538.png';
import lilithmonSprite from 'figma:asset/4834d54b968cbf6223b91134a426afc867a9138a.png';
import mikemonSprite from 'figma:asset/79da08e63a9021eed7f83f46fafd43e36f1e30dd.png';
import nefertimonSprite from 'figma:asset/750c493568ac7846d39b203e8be583d896133c60.png';
import holyDramonSprite from 'figma:asset/829e91e67710908cd0cecd99b5b12163536d3926.png';
import mastemonSprite from 'figma:asset/a036d6071a61f5a7cde8ca604f58cd0267141481.png';
import { EnergyBar } from './EnergyBar';
import { CareSystem, CareEvent } from './CareSystem';
import { ChatBox } from './ChatBox';
import { Language } from '../utils/i18n';
import { playShower } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import { satietyBars, SATIETY_BARS } from '../utils/hunger';

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
  energyPoints?: number; // Version B: energy gauge, fills only via feeding
  satiety?: number; // Hunger meter, 0..1 — separate horizontal indicator
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
  affectionRemainingMs?: number;
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
  healthPoints, 
  maxHealthPoints, 
  timeUntilReset, 
  dominantBranch, 
  currentXP, 
  nextLevelXP,
  triggerMessage = 0,
  energyPoints = 0,
  satiety = 1,
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
  affectionRemainingMs = 0,
  hasNewItems = false,
  evolutionFlash = false,
  feedAnim = null,
}: CompanionHUDProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [position, setPosition] = useState(10);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [showBubble, setShowBubble] = useState(false);
  const [squashFrame, setSquashFrame] = useState(0);
  const [bubbleText, setBubbleText] = useState('');
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eatingEmoji, setEatingEmoji] = useState<string | null>(null);
  const [eatKey, setEatKey] = useState(0);
  const [isMunching, setIsMunching] = useState(false);
  const [isShowering, setIsShowering] = useState(false);
  const [showerCooldown, setShowerCooldown] = useState(false);
  const [hugBalloon, setHugBalloon] = useState(false);

  // Always-current snapshot of props for stable intervals
  const propsRef = useRef({ useAI, language, currentStage, companionMood, evolutionStage, dominantBranch, aiSettings, healthPoints, energyPoints, maxHealthPoints, careEvent, isSleeping, satiety });
  propsRef.current = { useAI, language, currentStage, companionMood, evolutionStage, dominantBranch, aiSettings, healthPoints, energyPoints, maxHealthPoints, careEvent, isSleeping, satiety };

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
    speakRaw('+1❤️');
    setTimeout(() => setEatingEmoji(null), 1500);
    setTimeout(() => setIsMunching(false), 600);
  }, [feedAnim?.n, speakRaw]);

  // Energy is full when the gauge reaches the stage's max HP (its capacity)
  const energyFull = energyPoints >= maxHealthPoints && maxHealthPoints > 0;

  const isEarlyStage = ['digiegg', 'baby-i'].includes(getStageLevel(evolutionStage));

  // Walking animation
  useEffect(() => {
    const speed = companionMood === 'happy' ? 0.5 : companionMood === 'tired' ? 0.15 : 0.3;
    const interval = setInterval(() => {
      if (isSleeping || isShowering || isMunching) return;
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
  }, [direction, companionMood, isSleeping, isShowering, isMunching]);

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
      const ratio = p.maxHealthPoints > 0 ? p.energyPoints / p.maxHealthPoints : 0;
      const hpRatio = p.maxHealthPoints > 0 ? p.healthPoints / p.maxHealthPoints : 0;
      const isPt = p.language === 'pt-BR';
      if (p.careEvent?.type === 'poop') return isPt
        ? pick(['Preciso de banho!', 'Estou sujo!', 'Me limpa!'])
        : pick(['Need a shower!', 'I made a mess!', 'Clean me!']);
      if (p.careEvent?.type === 'food') return isPt
        ? pick(['Estou com fome!', 'Me alimenta!', 'Com fome!'])
        : pick(["I'm hungry!", 'Feed me!', 'So hungry!']);
      // Empty hunger meter → always say it's hungry, whatever the energy level.
      // (Skipped for egg/baby-i, which have no hunger mechanic.)
      if (!['digiegg', 'baby-i'].includes(getStageLevel(p.evolutionStage)) && satietyBars(p.satiety ?? 1) <= 0) return isPt
        ? pick(['Estou faminto!', 'Preciso comer!', 'Que fome!', 'Meu estomago ronca...'])
        : pick(["I'm starving!", 'I need to eat!', 'So hungry!', 'My tummy rumbles...']);
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
    const ratio = maxHealthPoints > 0 ? energyPoints / maxHealthPoints : 0;
    const hpRatio = maxHealthPoints > 0 ? healthPoints / maxHealthPoints : 0;
    const isPt = language === 'pt-BR';
    let fallback: string;
    if (careEvent?.type === 'poop') fallback = isPt ? pick(['Preciso de banho!', 'Estou sujo!', 'Me limpa!']) : pick(['Need a shower!', 'I made a mess!', 'Clean me!']);
    else if (careEvent?.type === 'food') fallback = isPt ? pick(['Estou com fome!', 'Me alimenta!', 'Com fome!']) : pick(["I'm hungry!", 'Feed me!', 'So hungry!']);
    else if (!['digiegg', 'baby-i'].includes(getStageLevel(evolutionStage)) && satietyBars(satiety) <= 0) fallback = isPt ? pick(['Estou faminto!', 'Preciso comer!', 'Que fome!', 'Meu estomago ronca...']) : pick(["I'm starving!", 'I need to eat!', 'So hungry!', 'My tummy rumbles...']);
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
      // Veemon line
      case 'chicomon':
        return chicomonSprite;
      case 'chibimon':
        return chibimonSprite;
      case 'veemon':
        return veemonSprite;
      case 'exveemon':
        return exVeemonSprite;
      case 'paildramon':
        return paildramonSprite;
      case 'imperialdramon':
        return imperialdramonSprite;
      case 'veedramon':
        return veedramonSprite;
      case 'aeroveedramon':
        return aeroVeedramonSprite;
      case 'ulforceveedramon':
        return ulforceVeedramonSprite;
      case 'flamedramon':
        return flamedramonSprite;
      case 'raidramon':
        return raidramonSprite;
      case 'magnamon':
        return magnamonSprite;
      case 'imperialdramon-paladin':
        return imperialdramonPaladinSprite;
      // Salamon line
      case 'yukimibotamon':
        return yukimibotamonSprite;
      case 'nyaromon':
        return nyaromonSprite;
      case 'plotmon':
        return plotmonSprite;
      case 'gatomon':
        return gatomonSprite;
      case 'angewomon':
        return angewomonSprite;
      case 'ophanimon':
        return ophanimonSprite;
      case 'gatomon-black':
        return blackGatomonSprite;
      case 'ladydevimon':
        return ladyDevimonSprite;
      case 'lilithmon':
        return lilithmonSprite;
      case 'mikemon':
        return mikemonSprite;
      case 'nefertimon':
        return nefertimonSprite;
      case 'holydramon':
        return holyDramonSprite;
      case 'mastemon':
        return mastemonSprite;
      default:
        return digiEggSprite;
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
    return ['pichimon', 'chicomon', 'yukimibotamon', 'pukamon', 'tapirmon'].includes(evolutionStage.toLowerCase());
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

  // Shower: only while energy is full, free (no energy cost), 5s cooldown
  const handleShowerClick = () => {
    if (isShowering || showerCooldown) return;
    if (!energyFull) {
      speak(
        language === 'pt-BR'
          ? 'Preciso de energia cheia para o banho! Come mais primeiro.'
          : 'Need full energy for a shower! Eat something first.',
        4000
      );
      return;
    }
    setIsShowering(true);
    setShowerCooldown(true);
    onShower?.();
    playShower();
    showHug();
    setTimeout(() => setIsShowering(false), 1600);
    setTimeout(() => setShowerCooldown(false), 5000);
  };

  // Affection ("carinho"): hug animation + delegate HP/cooldown logic to parent.
  const affectionReady = affectionRemainingMs <= 0;
  const handlePetClick = () => {
    onPet?.();
    if (affectionReady) showHug();
  };
  // mm:ss remaining until affection is usable again
  const formatCooldown = (ms: number) => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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

  // Discreet horizontal hunger meter: a pixel food icon + 5 bars that grow in
  // height from the icon outward. Bars are BASE-aligned (grow upward). Empty =
  // white, filling with a discreet reddish-orange. Dark pill so both read well.
  const renderHungerMeter = () => {
    // Hunger isn't a mechanic for egg/baby-i (same stages poop skips).
    if (['digiegg', 'baby-i'].includes(getStageLevel(evolutionStage))) return null;
    const lit = satietyBars(satiety);
    const isPt = language === 'pt-BR';
    const barHeight = (i: number) => 5 + i * 2; // 5,7,9,11,13 — grow upward
    const fillColor = '#d9663f';  // discreet reddish-orange (filled)
    const emptyColor = '#ffffff'; // white (empty)
    return (
      <div
        className="z-10 flex rounded-[3px]"
        style={{
          position: 'absolute', bottom: 8, left: 8,
          alignItems: 'flex-end', // base-aligned so bars grow UP
          gap: 2, padding: '3px 5px',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(1px)',
        }}
        title={isPt ? `Fome: ${lit}/${SATIETY_BARS}` : `Hunger: ${lit}/${SATIETY_BARS}`}
      >
        {/* Pixelated food icon (apple), light so it reads on the dark pill */}
        <svg
          width="11" height="11" viewBox="0 0 10 10"
          shapeRendering="crispEdges"
          style={{ imageRendering: 'pixelated', alignSelf: 'center', marginRight: 1 }}
        >
          <g fill="#ffffff">
            <rect x="5" y="0" width="1" height="2" />
            <rect x="6" y="1" width="2" height="1" />
            <rect x="2" y="2" width="6" height="1" />
            <rect x="1" y="3" width="8" height="4" />
            <rect x="2" y="7" width="6" height="1" />
            <rect x="3" y="8" width="4" height="1" />
          </g>
        </svg>
        {Array.from({ length: SATIETY_BARS }, (_, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${barHeight(i)}px`,
              backgroundColor: i < lit ? fillColor : emptyColor,
              imageRendering: 'pixelated',
            }}
          />
        ))}
      </div>
    );
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
          <div
            className="absolute top-2 left-2 flex items-center gap-1 flex-wrap z-10"
            title={language === 'pt-BR' ? `HP: ${healthPoints}/${maxHealthPoints} — cai quando você perde cuidados` : `HP: ${healthPoints}/${maxHealthPoints} — drops when care events are missed`}
          >
            {renderHearts()}
          </div>

          {/* Hunger meter - Bottom Left Corner (discreet) */}
          {renderHungerMeter()}


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
                    transformOrigin: 'bottom',
                    animation: isShowering
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
              !isEarlyStage && { key: 'bath', icon: '🚿', en: 'Bath', pt: 'Banho', onClick: handleShowerClick, disabled: !energyFull || showerCooldown, badge: false },
              { key: 'pet', icon: '🫶', en: 'Pet', pt: 'Carinho', onClick: handlePetClick, disabled: !affectionReady, badge: false, sub: affectionReady ? undefined : formatCooldown(affectionRemainingMs) },
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
                  padding: '2px 6px 3px',
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
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{a.icon}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.5rem', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap' }}>
                  {language === 'pt-BR' ? a.pt : a.en}
                </span>
                {a.sub && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.5rem', color: '#ffd27f', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap', lineHeight: 1 }}>
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
          style={{ height: '185px', width: '26px', padding: '11.998px 0' }}
          title={language === 'pt-BR'
            ? `Energia: ${energyPoints}/${maxHealthPoints} — sobe comendo, necessária para o banho`
            : `Energy: ${energyPoints}/${maxHealthPoints} — fills by eating, needed for shower`}
        >
          <EnergyBar totalSegments={maxHealthPoints} filledSegments={energyPoints} />
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
