import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { aiFetch } from '../utils/aiClient';
import { getSpriteForStage } from '../utils/sprites';
import { PixelButton } from './pixel/PixelKit';
import iconItems from '../assets/soulmon/icons/icon-items.png';
import { NEST_ART, DEFAULT_NEST } from './nestArt';
import iconBath from '../assets/soulmon/icons/icon-bath.png';
import iconSleep from '../assets/soulmon/icons/icon-sleep.png';
import iconWake from '../assets/soulmon/icons/icon-wake.png';
import { type SlotId, BASE_SLOTS, PET_TOP_OFFSET, PET_BOX, STAGE_HEIGHT } from '../utils/petStage';
import { PetStageDecor } from './PetStageDecor';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { CareSystem, CareEvent } from './CareSystem';
import { ChatBox } from './ChatBox';
import { Language } from '../utils/i18n';
import { playShower } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readFlag, writeFlag } from '../utils/safeStorage';

interface CompanionHUDProps {
  companionMood: 'idle' | 'happy' | 'tired';
  energyLevel: number;
  message: string;
  currentStage: string;
  evolutionStage: string;
  /** Linha genérica de sprite (fallback visual até a Fase 2 assumir) — ver utils/sprites.ts. */
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  /** Modo demo (utils/monetization.ts): personagem pré-pronto escolhido — sobrepõe eggType no sprite. */
  demoCharacterId?: string;
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
  /** Decoração equipada por espaço do palco (utils/petStage.ts). */
  equippedDecor?: Partial<Record<SlotId, string>>;
  /** Troféus de season ganhos no Torneio — exibidos na vitrine, se houver uma. */
  trophies?: Array<{ season: string; place: 1 | 2 | 3 }>;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  perfectDays?: number; // Dias perfeitos acumulados
  requiredDays?: number; // Dias necessários para evolução
  onEvolve?: () => void;
  /** Evolução manual: botão sobre o pet quando a barra está cheia. */
  canEvolve?: boolean;
  onEvolveRequest?: () => void;
  careEvent?: CareEvent | null;
  onCareEventComplete?: () => void;
  useAI: boolean;
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
  demoCharacterId,
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
  equippedDecor = {},
  trophies = [],
  digivolutionSegments,
  digivolutionSegmentsNeeded,
  perfectDays = 0,
  requiredDays = 1,
  onEvolve,
  canEvolve = false,
  onEvolveRequest,
  careEvent,
  onCareEventComplete,
  useAI,
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
  // Energy bars = the stage's daily task requirement (falls back to HP max for
  // older callers that don't pass it).
  const maxEnergy = maxEnergyPoints ?? maxHealthPoints;
  // Parado no centro — o passeio lateral saiu da Home (o dono pediu o pet
  // parado ali) e agora só existe na tela de Evolução (WalkingPetStrip).
  const [position] = useState(50);
  const [direction] = useState<'right' | 'left'>('right');
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
    if (readFlag(STORAGE_KEYS.RUB_HINT_SHOWN)) return;
    // "já mostrei a dica": no pior caso a dica reaparece. Cosmético.
    writeFlag(STORAGE_KEYS.RUB_HINT_SHOWN, true, { silent: true });
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
        ? pick(['Não me sinto bem...', 'Preciso de cuidados!', 'HP baixo...'])
        : pick(['Not feeling great...', 'Need some care!', 'My HP is low...']);
      if (ratio >= 1) return isPt
        ? pick(['Cheio de energia!', 'Pronto para tudo!', 'Totalmente carregado!'])
        : pick(['Full power!', 'Ready for anything!', 'Fully charged!']);
      if (ratio >= 0.6) return isPt
        ? pick(['Me sentindo bem!', 'Tudo certo!', 'Energia boa!'])
        : pick(['Feeling great!', 'All good!', 'Good energy!']);
      if (ratio >= 0.35) return isPt
        ? pick(['Podia comer algo...', 'Como está seu dia?', 'Vamos completar tarefas!'])
        : pick(['Could use a snack...', "How's your day?", "Let's complete tasks!"]);
      if (ratio >= 0.1) return isPt
        ? pick(['Ficando com fome...', 'Preciso de comida!', 'Pouca energia...'])
        : pick(['Getting hungry...', 'Need food!', 'Low energy...']);
      return isPt
        ? pick(['Com muita fome...', 'Me alimenta por favor!', 'Estômago vazio...'])
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
      aiFetch('/api/chat', { message: contextMsg, petName: p.currentStage, mood: p.companionMood, evolutionStage: p.evolutionStage, dominantBranch: p.dominantBranch, language: p.language, aiSettings: p.aiSettings })
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

  // Handle Soulmon click — show preset phrase immediately, then fire API update
  const handlePetClick = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const ratio = maxEnergy > 0 ? energyPoints / maxEnergy : 0;
    const hpRatio = maxHealthPoints > 0 ? healthPoints / maxHealthPoints : 0;
    const isPt = language === 'pt-BR';
    let fallback: string;
    if (careEvent?.type === 'poop') fallback = isPt ? pick(['Preciso de banho!', 'Estou sujo!', 'Me limpa!']) : pick(['Need a shower!', 'I made a mess!', 'Clean me!']);
    else if (careEvent?.type === 'food') fallback = isPt ? pick(['Estou com fome!', 'Me alimenta!', 'Com fome!']) : pick(["I'm hungry!", 'Feed me!', 'So hungry!']);
    else if (hpRatio <= 0.25) fallback = isPt ? pick(['Não me sinto bem...', 'Preciso de cuidados!', 'HP baixo...']) : pick(['Not feeling great...', 'Need some care!', 'My HP is low...']);
    else if (ratio >= 1) fallback = isPt ? pick(['Cheio de energia!', 'Pronto para tudo!', 'Totalmente carregado!']) : pick(['Full power!', 'Ready for anything!', 'Fully charged!']);
    else if (ratio >= 0.6) fallback = isPt ? pick(['Me sentindo bem!', 'Tudo certo!', 'Energia boa!']) : pick(['Feeling great!', 'All good!', 'Good energy!']);
    else if (ratio >= 0.35) fallback = isPt ? pick(['Podia comer algo...', 'Como está seu dia?', 'Vamos completar tarefas!']) : pick(['Could use a snack...', "How's your day?", "Let's complete tasks!"]);
    else if (ratio >= 0.1) fallback = isPt ? pick(['Ficando com fome...', 'Preciso de comida!', 'Pouca energia...']) : pick(['Getting hungry...', 'Need food!', 'Low energy...']);
    else fallback = isPt ? pick(['Com muita fome...', 'Me alimenta por favor!', 'Estômago vazio...']) : pick(['So hungry...', 'Please feed me!', 'Empty stomach...']);
    speak(fallback, 4000);

    if (!useAI) return;

    const contextMsg = language === 'pt-BR'
      ? `[TOQUE] O usuário tocou em você. Energia: ${Math.round(ratio * 100)}%, HP: ${healthPoints}/${maxHealthPoints}. Responda como ${currentStage} com 1 frase curta e fofa (máx 15 palavras).`
      : `[TOUCH] User tapped you. Energy: ${Math.round(ratio * 100)}%, HP: ${healthPoints}/${maxHealthPoints}. Reply as ${currentStage} with 1 short cute sentence (max 15 words).`;

    aiFetch('/api/chat', { message: contextMsg, petName: currentStage, mood: companionMood, evolutionStage, dominantBranch, language, aiSettings })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.response) speak(data.response, 5000); })
      .catch(() => {});
  };

  const sprite = getSpriteForStage(evolutionStage, demoCharacterId);


  // Sprites da nossa arte são desenhados olhando pra DIREITA — a única regra
  // de flip que restou é virar quando o pet anda pra esquerda. (Antes havia
  // exceções por espécie, todas de sprites emprestados que saíram do bundle.)
  const getHorizontalFlip = () => (direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)');

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




  /* RODADA 4 — a área do pet é FIXA (direção do dono).
     Ela rolava junto com a lista e sumia quando o jogador descia; o pet tem
     que estar sempre visível.

     É `position: sticky` (regra `.sm-pet-sticky`), não `position: fixed`, e a
     diferença importa:
      · sticky continua NO FLUXO, então a lista não precisa de nenhum
        `padding-top` mágico para não nascer embaixo do pet;
      · o elemento gruda no topo do scroller, e a lista rola POR BAIXO dele.
     Para o sticky funcionar, este `<div>` precisa ser filho DIRETO do
     contêiner que tem a altura toda do conteúdo (o `.space-y-4` da Home): um
     sticky só viaja dentro da caixa do pai. Se alguém envolver o
     `<CompanionHUD/>` num wrapper de altura própria, o pet volta a rolar
     embora nada quebre — é o footgun desta mudança.

     O fundo: a Home pinta um cenário `position: fixed` cobrindo a tela
     (App.tsx). A área fixa repete esse mesmo fundo com
     `background-attachment: fixed`, que ancora no viewport — assim ela é
     opaca (a lista não aparece por trás) e casa pixel a pixel com o cenário
     de baixo, em vez de virar uma tarja de cor chapada por cima dele. */
  const cenario = equippedBackground && PET_BACKGROUNDS[equippedBackground]
    ? PET_BACKGROUNDS[equippedBackground].css
    : undefined;

  return (
    <div className="relative sm-pet-sticky" style={{ '--sm-pet-scene': cenario ?? 'none' } as React.CSSProperties}>
      {/* Main Container with Companion Area and Energy Bar */}
      <div className="relative">
      {/* O fundo de cenário equipado agora é pintado em App.tsx, cobrindo a
          Home inteira (era só esse retângulo, do tamanho do CompanionHUD —
          o dono pediu o fundo "no todo", não restrito a essa caixa). */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* RODADA 4 — a JANELA do palco.
            Com a área do pet fixa, cada pixel do palco é um pixel a menos de
            lista, e o palco de 250px tinha ~87px de ar acima do sprite. Mas
            encolher o palco NÃO pode ser encolher a composição: tudo lá dentro
            (sprite, berço, decoração, `GROUND_Y`) é ancorado no centro dos
            250px, então um palco de 158px cortava o pet pelos pés — medido em
            412×700 antes desta janela existir.

            Então: a COMPOSIÇÃO continua com `STAGE_HEIGHT` (250px) e é ancorada
            ao FUNDO; quem encolhe é a janela por cima dela, que corta pelo
            TOPO — exatamente onde estava o ar. Nada em `utils/petStage.ts`
            muda, e o pet nunca aparece cortado. */}
        <div
          className="relative overflow-hidden"
          style={{ height: 'var(--sm-petstage-h)', borderRadius: 28 }}
        >
        <div
          className="p-3"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: STAGE_HEIGHT,
            imageRendering: 'pixelated',
            borderWidth: 0,
          }}
        >
          {/* Os corações de HP saíram daqui (rodada 3 / B1): viraram cápsula
              emoldurada no HUD do topo, ao lado de ENERGIA. Eram o único
              medidor do app desenhado sem superfície — e o T1 os citava como
              "3 corações no ar". Ver components/pixel/HomeHud.tsx. */}

          {/* Evolução manual: botão aparece SÓ quando pode evoluir */}
          {canEvolve && !isSleeping && (
            /* Botão do kit pixel (moldura de cobre, miolo aceso em ciano).
               `left`/`transform` seguem INLINE: `left-1/2` não existe no
               index.css pré-compilado (footgun 1) e sem ele o botão caía na
               posição estática, fora do centro do palco.

               RODADA 4 — `bottom: 6`, não `top: 10`. A janela do palco corta
               pelo TOPO em tela baixa, e CONTROLE cortado é defeito funcional,
               não estético: em 412×700 o botão de evoluir sumiria da tela.
               Ancorado no rodapé ele existe em qualquer altura de janela — e
               de quebra deixa de disputar a faixa acima do pet com o balão de
               abraço (que era o motivo do `top` variável do balão, abaixo). */
            <PixelButton
              size="sm"
              variant="primary"
              onClick={onEvolveRequest}
              style={{ position: 'absolute', zIndex: 30, left: '50%', bottom: 6, transform: 'translateX(-50%)', animation: 'evo-btn-pulse 1.6s ease-in-out infinite' }}
            >
              {language === 'pt-BR' ? 'Evoluir' : 'Evolve'}
            </PixelButton>
          )}

          {/* Evolution flash overlay */}
          {evolutionFlash && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
              <div className="absolute inset-0 bg-white/70 animate-pulse" />
              <span className="relative font-bold drop-shadow-lg text-center" style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#2dd4bf', textShadow: '0 0 12px #2dd4bf' }}>
                {language === 'pt-BR' ? '✨ EVOLUÇÃO! ✨' : '✨ EVOLVE! ✨'}
              </span>
            </div>
          )}


          {/* As partículas ambiente (✦ ✦ ♥ ♥ em glifo do sistema) saíram na
              rodada 3: eram o SEXTO grupo solto do T1 da Home e os dois
              únicos caracteres de emoji que sobravam na tela. O que dá vida
              ao palco é o pet (respiração, carinho, banho) e a decoração
              equipada — não confete tipográfico. */}

          {/* Decoração do palco — apoiada na MESMA linha de chão dos pés do pet
              (utils/petStage.ts). Vem antes do sprite no DOM de propósito: é
              cenário, o pet anda na frente. */}
          <PetStageDecor
            equippedDecor={equippedDecor}
            equippedBackground={equippedBackground ?? null}
            trophies={trophies}
            language={language}
          />

          {/* Care Event Sprite */}
          {careEvent && <CareSystem careEvent={careEvent} onCareEventComplete={onCareEventComplete || (() => {})} language={language} />}

          {/* Soulmon Sprite - Centered with walking animation */}
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
                /* O botão "Evoluir" mora em `top: 10` no centro do palco: com o
                   balão a -78px do meio os dois se sobrepunham e o 🤗 ficava
                   ESCONDIDO atrás do botão (visto no screenshot da rodada 3).
                   Quando o botão está na tela, o balão desce. */
                style={{ left: `${position}%`, top: canEvolve && !isSleeping ? 'calc(50% - 46px)' : 'calc(50% - 78px)', transform: 'translateX(-50%)' }}
              >
                <div className="relative bg-white rounded-full px-2 py-0.5 shadow text-lg leading-none">
                  🤗
                  {/* Rabinho do balão: geometria de peça única (triângulo por
                      borda), toda inline — nenhuma dessas classes existe no
                      index.css pré-compilado e não vale virar utilitário. */}
                  <span
                    className="absolute"
                    style={{
                      left: '50%', bottom: -5, transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid #fff',
                    }}
                  />
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

            {/* Berço — mobília BASE do espaço `nest` (utils/petStage.ts).
                A caixa vem do palco e a arte vem de `nestArt.ts`: aqui não há
                import de PNG nem número mágico, é o mesmo contrato do
                `nodeArt.tsx`. Trocar a peça é mudar o id pedido abaixo. */}
            <img
              src={NEST_ART[DEFAULT_NEST]}
              alt=""
              aria-hidden="true"
              data-nest
              style={{
                position: 'absolute',
                left: `${position}%`,
                top: '50%',
                marginTop: BASE_SLOTS.nest.yPx,
                width: BASE_SLOTS.nest.w, height: BASE_SLOTS.nest.h,
                /* `translateX(-50%)` centra a caixa no MESMO eixo do pet —
                   ver a nota do sprite logo abaixo. */
                transform: 'translateX(-50%)',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                pointerEvents: 'none',
                /* RODADA 5, tentado e revertido: aro na frente (zIndex 2)
                   esconde o corpo do pet — o berço de 148px cobre o meio do
                   sprite de 200px. O "sentado na bacia" da Ref C precisa de
                   ARTE (berço mais largo/raso), não de z-index — item no
                   BACKLOG-ARTE-GERAR. */
                zIndex: 0,
              }}
            />

            {/* Soulmon Sprite with flip */}
            <div
              className="absolute transition-all duration-100 ease-linear cursor-pointer hover:scale-110 active:scale-95"
              style={{
                left: `${position}%`,
                /* O `translateX(-50%)` é o que CENTRA o pet no berço. Sem ele
                   o sprite começava no eixo (borda esquerda em 50%) enquanto o
                   berço ficava centrado nele — 62px de desencontro, que era o
                   "duas imagens sobrepostas por acaso". A ordem importa: o
                   translate antes do `scaleX(-1)` do espelhamento, senão virar
                   para a esquerda joga o pet para fora do berço. */
                transform: `translateX(-50%) ${getHorizontalFlip()}`,
                top: '50%',
                marginTop: PET_TOP_OFFSET,
                zIndex: 1,
                transition: 'left 0.1s ease-linear, transform 0.1s ease-linear',
                touchAction: 'none', // let the rub gesture own the pointer
              }}
              onClick={() => { if (rubMovedRef.current) { rubMovedRef.current = false; return; } handlePetClick(); }}
              onPointerDown={startRub}
              onPointerMove={moveRub}
              onPointerUp={endRub}
              onPointerCancel={endRub}
            >
              {sprite ? (
                <img
                  src={sprite}
                  alt={currentStage}
                  className={`object-contain ${getCompanionFilter()}`}
                  style={{
                    width: PET_BOX, height: PET_BOX,
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
                  className="flex items-center justify-center bg-gray-700 rounded border-2 border-gray-600"
                  style={{ width: 152, height: 152, fontFamily: 'monospace' }}
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
              <div className="relative px-3 py-1.5 cursor-pointer bg-white rounded-xl shadow-lg">
                <p
                  className="text-gray-800 text-center break-words"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    lineHeight: '1.3',
                  }}
                >
                  {bubbleText}
                </p>
                {/* Bubble tail pointing up */}
                <span
                  className="absolute"
                  style={{
                    top: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid white',
                  }}
                />
              </div>
            </div>
          )}

        </div>
        </div>

        {/* ── B1: fileira EMOLDURADA de ações, rente ao palco ────────────────
            A barra vertical de energia que morava aqui à direita foi REMOVIDA:
            ela era um segundo desenho do MESMO número que a cápsula ENERGIA do
            HUD já mostra (`HomeHud`), 26px de largura colados na margem, sem
            rótulo — o T1 a citava como "barra vertical vazia". Duplicar um
            medidor em duas linguagens é pior que não ter a segunda.

            No lugar entra o padrão do gênero (Tamagotchi, Neko Atsume,
            Habitica): o cuidado do pet mora numa fileira de ações ancorada
            embaixo do palco. Zero arte nova — os mesmos três ícones do kit,
            os mesmos três rótulos, agora dentro de uma superfície com alvo
            visível de 60px de altura. */}
        <div className="sm-px-actionbar" role="group" aria-label={language === 'pt-BR' ? 'Cuidar do pet' : 'Care for your pet'}>
          {([
            { key: 'items', icon: iconItems, en: 'Items', pt: 'Itens', onClick: onOpenItems ?? (() => {}), disabled: false, badge: hasNewItems },
            { key: 'bath', icon: iconBath, en: 'Bath', pt: 'Banho', onClick: handleShowerClick, disabled: showerCooldown, badge: false },
            { key: 'sleep', icon: isSleeping ? iconWake : iconSleep, en: isSleeping ? 'Wake' : 'Sleep', pt: isSleeping ? 'Acordar' : 'Dormir', onClick: onSleep ?? (() => {}), disabled: false, badge: false },
          ] as { key: string; icon: string; en: string; pt: string; onClick: () => void; disabled: boolean; badge: boolean | undefined }[]).map(a => (
            <button
              key={a.key}
              type="button"
              /* "Banho" nunca fica realmente desabilitado: o `disabled` dele é
                 só um cooldown de 5s, e o handler já ignora o clique repetido.
                 Desabilitar de verdade tiraria o botão da ordem de tabulação
                 no meio do uso. */
              onClick={a.key === 'bath' ? a.onClick : (a.disabled ? undefined : a.onClick)}
              disabled={a.key !== 'bath' && a.disabled}
              className="sm-px-action"
              aria-label={language === 'pt-BR' ? a.pt : a.en}
              style={{ opacity: a.disabled ? 0.45 : 1, cursor: a.disabled ? 'default' : 'pointer' }}
            >
              {a.badge && (
                <span
                  className="sm-px-action-dot"
                  aria-label={language === 'pt-BR' ? 'Novidade' : 'New'}
                  role="img"
                />
              )}
              <img src={a.icon} alt="" width={30} height={30} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              {/* Rótulo curto de AÇÃO — cabe na bitmap sem prejuízo de
                  leitura (é uma palavra, não frase). "Acordar"/"Dormir" não
                  têm acento; se um dia tiverem, o subset latin da Silkscreen
                  cobre (conferido no cmap). */}
              <span className="sm-px-action-label">
                {language === 'pt-BR' ? a.pt : a.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      </div>

      {/* Chat Box — fixo no rodapé da tela (não rola com o conteúdo), mas dentro
          da mesma árvore/stacking context do app: assim modais (z-index maior)
          conseguem ficar corretamente acima dela em vez de um portal externo
          que sempre pintava por cima de tudo, modais inclusive. */}
      <div className="sm-chat-fixed">
        <ChatBox
          petName={currentStage}
          mood={companionMood}
          evolutionStage={evolutionStage}
          dominantBranch={dominantBranch}
          useAI={useAI}
          onSendMessage={handleChatMessage}
          aiSettings={aiSettings}
          onOpenAISettings={onOpenAISettings}
          onCreateActivity={onCreateActivity}
          language={language}
        />
      </div>
    </div>
  );
});
