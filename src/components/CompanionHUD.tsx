import { useState, useEffect, useLayoutEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { aiFetch } from '../utils/aiClient';
import { getSpriteForStage } from '../utils/sprites';
import { PixelButton } from './pixel/PixelKit';
import { HomeHud } from './pixel/HomeHud';
import { Icon } from './ui/Icon';
import { Viewport, usePrefersReducedMotion, useVarreduraDeSintonia } from './ui/Viewport';
import { NEST_ART, DEFAULT_NEST } from './nestArt';
// O fundo do CORPO do aparelho (27/08/2026, pedido do dono: "dentro do box,
// na área que o Soulmon fica"). Vive FORA do `Viewport` (que é pixel-art
// estrito, escala inteira) — ver `.sm2-device` no index.css.
import homeSceneBg from '../assets/backgrounds/home-scene-1547.png';
import { ITEM_ART } from '../utils/itemArt';
import { FX_ART } from '../utils/fxArt';
import { type SlotId, BASE_SLOTS, PET_TOP_OFFSET, PET_BOX, PET_RENDER, STAGE_HEIGHT } from '../utils/petStage';
import { PetStageDecor } from './PetStageDecor';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { CareSystem, CareEvent } from './CareSystem';
import { ChatBox } from './ChatBox';
import { Language } from '../utils/i18n';
import { playShower, playVisorTune } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readFlag, writeFlag } from '../utils/safeStorage';
import { ModalSheet, sm2Hint, sm2Text } from './form/FormKit';
import { isSpecialItem } from '../utils/shop';
import { FOOD_BY_CATEGORY } from '../constants/labels';

/* ── Escala INTEIRA do sprite ──────────────────────────────────────────────
   Os PNGs das linhas (`src/assets/soulmon/lines/*`) são 256×256 (53 arquivos)
   ou 384×384 (10) — MEDIDO no cabeçalho de cada arquivo, não suposto.
   Renderizados em `PET_BOX` (152px) davam fator 0,594× e 0,396×: escala
   fracionária, exatamente a causa nº 1 de pixel art parecer borrada
   (tokens.md §7). Pior: com `image-rendering: pixelated` o navegador não
   borra — ele DERRUBA linhas de forma desigual, então o traço do pet ficava
   com espessura variável de uma parte do corpo para a outra.

   128 é o maior divisor comum útil dos dois tamanhos: 256 → 128 é 2:1 e
   384 → 128 é 3:1, os dois INTEIROS. Cada pixel de origem vira exatamente um
   bloco de destino em todo o roster, e o `pixelated` passa a ser uma decisão
   em vez de um remendo. Há guard mecânico no teste de render — sprite novo com
   lado que não seja múltiplo de `PET_RENDER` reabre o buraco em silêncio.

   A linha do chão NÃO se mexe: `PET_BOX - PET_RENDER` é somado ao
   `PET_TOP_OFFSET` para que a BORDA DE BAIXO da caixa do sprite continue no
   mesmo pixel de antes. `GROUND_Y` e a caixa do berço em `utils/petStage.ts`
   não se mexem — o pet fica 24px menor e sentado no mesmo berço, que tem 148px
   de largura e passa a abraçá-lo em vez de sumir atrás dele. */
/* `PET_RENDER` mudou de casa: vive em `utils/petStage.ts`, o dono declarado da
   geometria do palco (e de onde `PET_BOX` já vinha). Reexportado aqui para não
   quebrar quem importava daqui — mas NÃO redeclare o número neste arquivo:
   número copiado é número que diverge (footgun 9). */
export { PET_RENDER } from '../utils/petStage';
const PET_GROUND_KEEP = PET_BOX - PET_RENDER;

/* ── O VISOR TEM MEDIDA, e a medida é INTEIRA ──────────────────────────────
   O contrato do `Viewport` (`width`/`height`/`scale` → tela de `width*scale`)
   estava sendo anulado aqui: passava-se 64/64/2 e logo em seguida
   `screenStyle={{width:'100%', height:'var(--sm-petstage-h)'}}` sobrescrevia
   as duas medidas. A regra de escala inteira — a justificativa inteira do
   componente — não agia em lugar nenhum.

   Agora a tela é MEDIDA e quantizada: a largura útil do corpo e a janela do
   palco (`--sm-petstage-h`, que encolhe em tela baixa) são divididas por
   `VIEW_SCALE` e arredondadas PARA BAIXO, e o resultado volta como `width`/
   `height` lógicos. A tela sai sempre num múltiplo exato de 2 device px, o
   passo do pet cai na mesma grade, e sobra no máximo 1px — centrado.

   A composição por dentro não muda: ela continua ancorada ao FUNDO com
   `STAGE_HEIGHT`, então `GROUND_Y`, o berço e a decoração ficam onde estavam;
   quem corta (pelo topo, onde era ar) é a janela. */
const VIEW_SCALE = 2 as const;
const RING_PX = 4;          // o anel de cobre do Viewport (padding real)
const STAGE_FALLBACK_H = 215;
const STAGE_FALLBACK_W = 320;
/* Distância dos pés do sprite até o fundo da composição — derivada, nunca
   digitada: é o que permite pendurar o ALVO DO CARINHO exatamente sobre o
   pet sem duplicar a regra do palco. */
const PET_BOTTOM_IN_STAGE =
  STAGE_HEIGHT - (STAGE_HEIGHT / 2 + PET_TOP_OFFSET + PET_GROUND_KEEP) - PET_RENDER;

/* ── O BALÃO NÃO PODE COMER O ÚNICO CTA DO JOGO ────────────────────────────
   BLOQUEADOR medido, não suposto — histórico, e ainda parcialmente vivo.
   Até 27/08/2026 os DOIS controles eram `position:absolute` dentro da MESMA
   caixa (`.sm2-device-stage`), ancorados no MESMO rodapé: "Evoluir"
   (`bottom: 10`, 44px de altura → ocupa 10–54px) e o balão de fala
   (`bottom: 6` → ocupa ~6–45px). As faixas se cruzavam em 35px de altura, e
   o balão (zIndex 45, `pointer-events: auto`) comia o clique do botão —
   a fala idle dispara a cada 3min e travava o único caminho de progresso do
   jogo por até 5s.

   O dono pediu o balão no TOPO da janela (nunca sobre o corpo do pet, que
   ocupa a base do palco) — isso by-construction tira o balão da faixa do
   botão, que continua ancorado no rodapé. O que SOBREVIVE da correção
   antiga, e continua necessário: a faixa de largura total do balão é
   `pointer-events: none`, e só a CAIXA de fala (não as sobras
   transparentes ao lado, que cobrem o palco inteiro) aceita o clique. */
const EVOLVE_BTN_BOTTOM = 10;
const BUBBLE_GAP = 6;

/** Passo do passeio: 2 device px = 1 pixel de origem do sprite (escala 2:1).
    Meio pixel aqui é o que transforma serrilhado em borrão. */
const WALK_STEP_PX = 4;
const WALK_TICK_MS = 200;

/** Períodos do dia — o ciclo diurno do interior do visor. */
function periodoDoDia(d = new Date()): 'dawn' | 'day' | 'dusk' | 'night' {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'dusk';
  return 'night';
}
const SKY_CLASS: Record<'dawn' | 'day' | 'dusk' | 'night', string> = {
  dawn: 'sm2-sky-dawn',
  day: 'sm2-sky-day',
  dusk: 'sm2-sky-dusk',
  night: 'sm2-sky-night',
};

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
  /** Sprite PRÓPRIO da forma atual, quando existe **e já foi adotado**
   *  (`utils/spriteLibrary.ts`). Ausente = arte de reserva, que é o piso e
   *  nunca um erro: o visor não tem estado de carregamento nem de erro
   *  (`spec-geracao-incremental.md` §2.1). */
  ownSpriteUrl?: string;
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
  ownSpriteUrl,
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
  const reducedMotion = usePrefersReducedMotion();

  /* ── O PET SE COMPORTA ───────────────────────────────────────────────────
     Antes: `const [position] = useState(50)` e `const [direction] = useState()`
     — sem setter. O bicho era um decalque no centro da tela, e a única
     animação era um salto de escala de 10% a cada 1200ms, que lê como tremor.
     Um v-pet que não faz nada é um app de tarefas com sprite.

     `walkPx` é o deslocamento em DEVICE PIXELS INTEIROS a partir do centro —
     não uma porcentagem contínua. A porcentagem é derivada dele, então o
     `left:%` cai sempre num pixel exato da tela medida. Sem `transition`:
     movimento dentro do visor é `steps()`, sempre. */
  const [walkPx, setWalkPx] = useState(0);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  const [periodo, setPeriodo] = useState(() => periodoDoDia());
  /** Tela medida e quantizada (ver o bloco de escala no topo do arquivo). */
  const [tela, setTela] = useState(() => ({
    w: Math.floor((STAGE_FALLBACK_W - RING_PX * 2) / VIEW_SCALE),
    h: Math.floor(STAGE_FALLBACK_H / VIEW_SCALE),
  }));
  const stageRef = useRef<HTMLDivElement | null>(null);

  /* ── ORDEM DE FOCO DO DOCK DE CHAT ───────────────────────────────────────
     Mesma classe de defeito da barra de navegação (que era percorrida ANTES
     do conteúdo): descasamento entre ordem do DOM e ordem VISUAL — WCAG 1.3.2
     e 2.4.3. O dock é `position: fixed` no rodapé (y≈770, o elemento mais
     baixo do conteúdo da Home), mas nasce aqui DENTRO do `CompanionHUD`, que
     é o primeiro bloco da Home. Resultado medido: o Tab chegava ao campo de
     chat ANTES da lista de atividades e do CTA "+ Nova atividade" (y 512–813).

     Não havia portal nenhum aqui — o dock era um `<div>` normal. E ao
     contrário da nav, reordenar o JSX não resolve: a peça inteira que
     precisaria descer é o `CompanionHUD`, e ele é o pet, que fica em cima.
     A correção é dar ao dock o PONTO DE MONTAGEM que a posição visual dele
     pede: ÚLTIMO filho do `<main id="conteudo">` — depois da lista e do CTA,
     e ainda antes da `BottomNav` (que é irmã do `<main>` e mora abaixo do
     chat na tela). A ordem de foco passa a ser a ordem visual, ponto a ponto.

     Por que NÃO muda um pixel:
      · `position: fixed` não depende da posição no documento;
      · o `<main>` JÁ era ancestral do dock (o `CompanionHUD` vive dentro
        dele), e o index.css declara explicitamente que nada em `<main>` pode
        virar bloco contenedor do `.sm-chat-fixed` — o contexto de
        posicionamento é exatamente o mesmo de antes;
      · empilhamento: o dock sai de dentro do `.sm-pet-sticky` (que cria
        contexto com `z-index: 5`) para o contexto do próprio `<main>`
        (`z-index: 1`). Nos dois casos ele pinta ACIMA do conteúdo da Home e
        ABAIXO da nav (`z-index: 45`) e dos modais — que são irmãos do
        `<main>` com z-index maior. O dock é fixo no rodapé e o pet é sticky
        no topo: não há sobreposição entre os dois para reordenar.

     `document` só existe depois da montagem, então o primeiro render cai no
     lugar antigo e o `useLayoutEffect` reancora ANTES da pintura (sem flash);
     sem hospedeiro (jsdom dos testes de render, SSR) o dock fica onde estava,
     que é o comportamento antigo e continua correto. */
  const [chatHost, setChatHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    setChatHost(document.getElementById('conteudo'));
  }, []);
  const dirRef = useRef<'right' | 'left'>('right');
  dirRef.current = direction;
  const telaW = tela.w * VIEW_SCALE;
  const position = 50 + (walkPx * 100) / telaW;
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
  /* ── ALIMENTAR É CONTROLE DE PRIMEIRA CLASSE ─────────────────────────────
     O deck tinha Itens / Banho / Dormir e a ação que DEFINE o gênero v-pet
     estava enterrada dentro do `ItemsWindow`, atrás de "Itens" — um rótulo
     que não promete comida. Tamagotchi Uni, Vital Bracelet e Pokémon Sleep
     põem alimentar na primeira fileira; aqui ele voltou para lá.

     O que NÃO muda: a escolha da comida continua existindo (v-pet sem escolha
     de comida é um botão de +1), e a REGRA continua inteira em `onFeed`
     (`handleFeed` no App) — teto por hora, recusa quando cheio, pontos de
     atributo. Este botão só encurta o caminho até ela. */
  const [feedOpen, setFeedOpen] = useState(false);

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




  /* Respiração. Era 0.9 ↔ 1.0 a cada 1200ms: 10% de salto sem easing, que lê
     como TREMOR, não como bicho respirando. Agora é 0.97 ↔ 1.0 (um pixel de
     origem, na escala 2:1) num ritmo mais lento. Continua em `prefers-
     reduced-motion`, e mais devagar ainda: respirar é CONTEÚDO — é o que diz
     que o bicho está vivo —, e o que para ali é o resto (passeio, piscada,
     saudação). */
  useEffect(() => {
    const squashInterval = setInterval(() => {
      if (document.hidden) return;
      setSquashFrame(prev => (prev + 1) % 2);
    }, reducedMotion ? 2600 : 1500);
    return () => clearInterval(squashInterval);
  }, [reducedMotion]);

  /* Mede a tela do visor e quantiza para múltiplo INTEIRO de `VIEW_SCALE`. */
  useEffect(() => {
    const medir = () => {
      const raiz = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement) : null;
      const janela = parseFloat(raiz?.getPropertyValue('--sm-petstage-h') || '') || STAGE_FALLBACK_H;
      const corpo = stageRef.current?.clientWidth || STAGE_FALLBACK_W;
      setTela({
        w: Math.max(16, Math.floor((corpo - RING_PX * 2) / VIEW_SCALE)),
        h: Math.max(24, Math.floor(janela / VIEW_SCALE)),
      });
    };
    medir();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', medir);
    return () => { ro?.disconnect(); window.removeEventListener('resize', medir); };
  }, []);

  /* O PASSEIO. O `WalkingPetStrip` já provava que dá — aqui o passo é em
     pixel inteiro e o pet ALTERNA andar e parar, com pausas de duração
     irregular: andar sem parar lê como carrossel, e é o que faz um sprite
     parecer um GIF em vez de um bicho. Ele vira ao bater na parede e às
     vezes só porque mudou de ideia.
     Não anda dormindo, não anda com a aba escondida (ninguém vê, e o timer
     ainda custa bateria) e não anda em `prefers-reduced-motion`. */
  useEffect(() => {
    if (reducedMotion || isSleeping) return;
    const alcance = telaW / 2 - PET_RENDER / 2 - 6;
    if (alcance < WALK_STEP_PX) return;
    let passos = 0;
    const id = setInterval(() => {
      if (document.hidden) return;
      if (passos <= 0) {
        // Parado: ~18% de chance por tique de começar a andar (≈1×/segundo).
        if (Math.random() < 0.18) {
          passos = 6 + Math.floor(Math.random() * 18);
          if (Math.random() < 0.35) setDirection(d => (d === 'right' ? 'left' : 'right'));
        }
        return;
      }
      passos -= 1;
      setWalkPx(prev => {
        const passo = dirRef.current === 'right' ? WALK_STEP_PX : -WALK_STEP_PX;
        const proximo = prev + passo;
        if (Math.abs(proximo) > alcance) {
          setDirection(dirRef.current === 'right' ? 'left' : 'right');
          return prev;
        }
        return proximo;
      });
    }, WALK_TICK_MS);
    return () => clearInterval(id);
  }, [reducedMotion, isSleeping, telaW]);

  /* A PISCADA, em intervalo irregular (2,6–7,8s). Regular seria pisca-pisca. */
  useEffect(() => {
    if (reducedMotion) return;
    let t: ReturnType<typeof setTimeout>;
    let fim: ReturnType<typeof setTimeout>;
    const agenda = () => {
      t = setTimeout(() => {
        if (!document.hidden && !isSleeping) {
          setIsBlinking(true);
          fim = setTimeout(() => setIsBlinking(false), 280);
        }
        agenda();
      }, 2600 + Math.random() * 5200);
    };
    agenda();
    return () => { clearTimeout(t); clearTimeout(fim); };
  }, [reducedMotion, isSleeping]);

  /* REAÇÃO À ABERTURA DO APP: o bicho pula e cumprimenta. É o gesto que
     transforma "abri um app" em "cheguei em casa" — e é o único momento em
     que o v-pet do gênero fala primeiro. Volta a acontecer quando a pessoa
     retorna à aba depois de ≥10 min; nem toda troca de aba é uma chegada. */
  const ultimaSaudacaoRef = useRef(0);
  useEffect(() => {
    const isPt = language === 'pt-BR';
    const linhas = isPt
      ? ['Você voltou!', 'Oi! Senti sua falta.', 'Que bom te ver!', 'Oi oi! Tudo bem?']
      : ['You came back!', 'Hi! I missed you.', 'Good to see you!', 'Hey hey! How are you?'];
    const saudar = () => {
      if (document.hidden || propsRef.current.isSleeping) return;
      ultimaSaudacaoRef.current = Date.now();
      if (!reducedMotion) {
        setIsGreeting(true);
        setTimeout(() => setIsGreeting(false), 800);
      }
      speak(linhas[Math.floor(Math.random() * linhas.length)], 3500);
    };
    const t = setTimeout(saudar, 700);
    const onVis = () => {
      if (document.hidden) return;
      if (Date.now() - ultimaSaudacaoRef.current < 10 * 60 * 1000) return;
      saudar();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis); };
  }, [speak, language, reducedMotion]);

  /* O céu do visor acompanha a hora. 10 min de resolução é de sobra para uma
     transição de período, e não é um relógio re-renderizando a Home. */
  useEffect(() => {
    const id = setInterval(() => setPeriodo(periodoDoDia()), 600000);
    const onVis = () => { if (!document.hidden) setPeriodo(periodoDoDia()); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
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

  // O visor mostra a criatura, e só isso. Sprite próprio quando adotado; senão
  // a arte de reserva, imediatamente, sem placeholder e sem spinner.
  const sprite = ownSpriteUrl ?? getSpriteForStage(evolutionStage, demoCharacterId);

  /* ── A SINTONIA, vista de dentro do visor (`spec` §2.1 e §2.3.1) ──────────
     A tabela do §2.1 é a tabela DESTA tela, e cobra a varredura de 400 ms nas
     duas ocasiões em que o sprite próprio assume: no nascimento (automático) e
     depois da cerimônia (quando o jogador sintoniza). O §2.3.1 diz onde a
     mesma transição acontece: "na página de Evolução E DEPOIS NO VISOR" — este
     aqui, que é o único que o jogador olha todo dia.

     Nada de estado novo: `sprite` acima já é `ownSpriteUrl ?? reserva`, então a
     chegada do traço próprio JÁ É uma troca de valor. A varredura só observa
     essa troca. Ela NÃO dispara na montagem: abrir a Home não é sintonizar. */
  const varrendoSintonia = useVarreduraDeSintonia(sprite, reducedMotion);

  /* O CHIADO CURTO da sintonia (spec §2.3.1) — o terceiro terço, ao lado da
     varredura e do fade. Irmão exato do efeito de mesmo nome no
     `EvolutionPath`, e é lá que mora o raciocínio completo: por que ele se
     pendura no `varrendoSintonia` em vez de na troca de `sprite`, e por que
     `prefers-reduced-motion` silencia o som junto com a imagem. Não copie o
     argumento para cá; regra copiada é regra que diverge em silêncio.

     A spec dizia que este chiado "a ocasião A já usa": não usava, e a
     divergência doc↔código nº 10 está registrada em `utils/sounds.ts`. */
  useEffect(() => {
    if (varrendoSintonia) playVisorTune();
  }, [varrendoSintonia]);


  // Sprites da nossa arte são desenhados olhando pra DIREITA — a única regra
  // de flip que restou é virar quando o pet anda pra esquerda. (Antes havia
  // exceções por espécie, todas de sprites emprestados que saíram do bundle.)
  const getHorizontalFlip = () => (direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)');

  /* Respiração: 3% (≈2 device px num sprite de 128 = 1 pixel de origem).
     Os 10% de antes eram um salto, não uma respiração. */
  const getSquashScale = () => (squashFrame === 0 ? 0.97 : 1.0);

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

  /* A comida do DECK. Só comida de verdade: chips de atributo, coraçãozinho e
     Glitchtama continuam na pastinha (`ItemsWindow`), que é onde se USA item —
     misturá-los aqui faria "Alimentar" gastar um consumível caro por engano.
     `isSpecialItem` é o dono dessa fronteira (utils/shop.ts). */
  const foodStock = Object.entries(foodInventory)
    .filter(([emoji, n]) => n > 0 && !isSpecialItem(emoji))
    .sort((a, b) => b[1] - a[1]);
  const FOOD_NAME_BY_EMOJI: Record<string, string> = Object.fromEntries(
    Object.values(FOOD_BY_CATEGORY).map(f => [f.emoji, f.name]),
  );

  /* Alimentar pelo deck NÃO reimplementa a regra: chama o mesmo `onFeed` do
     `ItemsWindow`. Quem decide teto por hora, recusa por estar cheio e pontos
     de atributo é o `handleFeed` do App — a animação volta por `feedAnim`,
     como no caminho antigo (animar aqui TAMBÉM daria dois "nhac" por comida). */
  const handleDeckFeed = (emoji: string) => {
    setFeedOpen(false);
    onFeed?.(emoji);
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

  /* CARINHO POR TECLADO. O gesto de esfregar é ponteiro puro: quem navega por
     teclado (ou por leitor de tela) ficava sem a ÚNICA cura de HP do jogo.
     Aqui, segurar Enter/Espaço no botão do pet faz um ciclo de carinho de 2s
     — exatamente o mesmo custo do gesto —, com os mesmos corações e a mesma
     chamada a `onPet`, que é quem aplica a regra (e o teto diário). Nada de
     atalho: uma tecla não cura mais rápido que uma mão. */
  const teclaRubRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRubKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.repeat || teclaRubRef.current) return;
    setIsRubbing(true);
    spawnRubHearts();
    teclaRubRef.current = setTimeout(() => {
      teclaRubRef.current = null;
      setIsRubbing(false);
      const p = propsRef.current;
      if (p.healthPoints < p.maxHealthPoints) onPetRef.current?.();
    }, 2000);
  };
  useEffect(() => () => { if (teclaRubRef.current) clearTimeout(teclaRubRef.current); }, []);

  /** Uma rajada de corações saindo do centro do pet. */
  const spawnRubHearts = () => {
    try { navigator.vibrate?.(20); } catch { /* noop */ }
    // Os três têm sprite em FX_ART; o antigo 💗 saiu da lista porque ele é
    // chave de ITEM (o coraçãozinho da pastinha) e aqui viraria a arte errada.
    const EMOJIS = ['❤️', '💕', '💖'];
    const burst = 2 + Math.floor(Math.random() * 2); // 2–3 corações de uma vez
    const spawned: { id: number; dx: number; dy: number; size: number; emoji: string }[] = [];
    for (let k = 0; k < burst; k++) {
      const id2 = ++rubHeartIdRef.current;
      const angle = Math.random() * Math.PI * 2;
      const dist = 32 + Math.random() * 46; // espalhamento moderado (32–78px)
      spawned.push({
        id: id2,
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist),
        size: 0.65 + Math.random() * 0.55,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      });
      setTimeout(() => setRubHearts(prev => prev.filter(h => h.id !== id2)), 1500);
    }
    setRubHearts(prev => [...prev, ...spawned]);
  };

  const rubTick = () => {
    const TICK = 100;
    {
      const now = Date.now();
      const active = rubPressedRef.current && now - rubLastMoveRef.current < 180;
      setIsRubbing(active);
      if (!active) return;
      // Every ~500ms emit a small BURST of hearts drifting out from the center.
      rubHeartTickRef.current += 1;
      if (rubHeartTickRef.current % 5 === 0) spawnRubHearts();
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

  /* ── A AURA DE HUMOR, agora de verdade ───────────────────────────────────
     Era `drop-shadow-[0_0_12px_${auraColor}]`: classe utilitária do Tailwind
     com valor arbitrário **E** montada por interpolação. Duas mortes de uma
     vez — não há plugin do Tailwind neste build (footgun 1), então classe que
     não está no `index.css` não aplica nada; e mesmo que houvesse, valor
     interpolado nunca é visto pelo extrator. Ou seja: a aura de galho, o
     `brightness` de "feliz" e o de "cansado" NUNCA renderizaram. Três anos de
     código morto passando por feature.

     Implementado: `filter` CSS de verdade, inline (que é o único caminho
     confiável aqui). É glow FORA da silhueta — não reamostra pixel nenhum,
     então não conflita com a regra do visor. */
  /* O degrau de brilho da PISCADA entra AQUI, como texto, nunca como
     `animation` CSS separada tocando `filter` — ver a nota grande em
     `sm2-pet-blink`, index.css. Duas tentativas anteriores (animar `filter`
     direto, depois uma custom property animada) as duas apagavam ou nunca
     aplicavam o resto do filtro (aura, humor). Isto aqui é só JS: `isBlinking`
     já é estado do componente, então o valor final de `filter` está sempre
     completo e nunca é substituído por baixo dos panos por uma animação. */
  const getCompanionFilter = (isBlinking: boolean): string => {
    const auraColor = getBranchAuraColor();
    const base = (() => {
      switch (companionMood) {
        case 'happy':
          return `brightness(1.1) drop-shadow(0 0 12px ${auraColor})`;
        case 'tired':
          return 'brightness(0.75)';
        default:
          return `drop-shadow(0 0 8px ${auraColor})`;
      }
    })();
    return isBlinking ? `${base} brightness(.86)` : base;
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
  /** Cor atrás da arte no visor — só cenário pintado declara (ver backgrounds.ts). */
  const cenarioBase = equippedBackground
    ? PET_BACKGROUNDS[equippedBackground]?.baseColor
    : undefined;

  const chatDock = (
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
  );

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
        {/* ── O CORPO DO APARELHO ──────────────────────────────────────────
            O achado da crítica: o "visor" era um card. `padding: 4px` +
            `border-radius: 20px` — os 20px eram RAIO, e o aparelho tinha 4px
            de corpo. Sem massa, não há onde os controles morarem, e a fileira
            de ações acabava flutuando no fundo da PÁGINA (`background:
            transparent; border: none`) em vez de estar cravada no bicho.

            Agora existe corpo: 16px de material em volta do anel de 4px = os
            20px de bisel do plano, e o deck de ações é uma ÁREA dele, com
            sulco de cobre entre a tela e os botões. */}
        <div
          className="sm2-device"
          /* `--sm2-device-photo`: consumida em index.css, empilhada ATRÁS
             dos gradientes de material do bisel (que continuam por cima,
             para o corpo do aparelho não virar um retângulo de foto plana).
             CSS puro não alcança um asset importado pelo Vite — por isso a
             variável, não uma classe. */
          style={{ '--sm2-device-photo': `url(${homeSceneBg})` } as React.CSSProperties}
        >
        {/* Vida/Energia — MIGRARAM para dentro do corpo do aparelho em
            27/08/2026 (pedido do dono: pet + rituais são a prioridade da
            Home, os medidores grandes acima do pet não). `hideBrand`: o
            `<h1>Soulmon</h1>` continua sozinho lá em cima, no `App.tsx`
            (`hideMeters`) — é o heading da página, e não pode sumir com os
            medidores. `compact`: ícone e trilho menores (ver index.css,
            `.sm2-hud--compact`). */}
        <HomeHud
          energyPoints={energyPoints}
          maxEnergyPoints={maxEnergy}
          healthPoints={healthPoints}
          maxHealthPoints={maxHealthPoints}
          language={language}
          hideBrand
          compact
        />
        {/* A janela do palco: ancora os CONTROLES que ficam por cima da tela
            (evoluir, balão, alvo do carinho) e é a caixa que dá a largura
            medida para a escala inteira do visor. */}
        <div className="sm2-device-stage" ref={stageRef}>
        {/* ── O VISOR — elemento de marca nº 1 ────────────────────────────────
            O palco deixa de ser um retângulo de raio 28 e passa a ser a TELA de
            um aparelho v-pet: bisel de cobre por fora, interior escuro nos dois
            temas, um único reflexo. É a fronteira declarada do plano — pixel
            art vive DENTRO do visor, e tudo fora dele é SVG limpo.

            A ESCALA INTEIRA AGE AQUI. Antes, `width`/`height`/`scale` eram
            passados e logo em seguida anulados por um `screenStyle` com
            `width:100%` e `height:var(--sm-petstage-h)` — o contrato inteiro do
            componente virava decoração justamente na única tela que importa.
            Agora a medida é tirada do DOM e quantizada (ver `VIEW_SCALE` no
            topo), então a tela é sempre `w*2 × h*2` device px exatos.

            O cenário comprado na loja passa a ser pintado DENTRO da tela e tem
            PRIORIDADE sobre o ciclo diurno: é item pago, não se pinta por cima
            dele. Só quando não há cenário equipado o céu do visor acompanha a
            hora (`.sm2-sky-*`). */}
        <Viewport
          width={tela.w}
          height={tela.h}
          scale={VIEW_SCALE}
          label={language === 'pt-BR' ? 'Seu Soulmon' : 'Your Soulmon'}
          screenClassName={cenario ? undefined : SKY_CLASS[periodo]}
          // Cenário PINTADO não é desenhado aqui: a arte tem a linha do chão
          // numa % da PRÓPRIA altura, e a tela do visor não tem a altura da
          // composição (ela corta pelo topo, ver a janela do palco acima).
          // Medir os 72% da arte contra a altura da JANELA e os 74% do
          // `GROUND_Y` contra os 250px da COMPOSIÇÃO é comparar duas réguas
          // diferentes — foi assim que a decoração ficou uns 13px acima do
          // piso desenhado. A arte desce para a caixa da composição (logo
          // abaixo), que é a régua certa; aqui fica só a cor de base, que
          // preenche a tela inteira.
          screenStyle={cenario ? (cenarioBase ? { backgroundColor: cenarioBase } : { background: cenario }) : undefined}
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
            // `auto 100%` + `center bottom`: a ALTURA da arte casa com a
            // altura da composição, que é a única régua em que `GROUND_Y`
            // significa alguma coisa. Sem esticar (o pixel não perdoa) e sem
            // `cover` (que numa caixa larga escala pela largura e joga o chão
            // para fora). O que sobra nas laterais é a `baseColor`.
            ...(cenarioBase ? { background: `${cenario} center bottom / auto 100% no-repeat` } : null),
          }}
        >
          {/* Os corações de HP saíram daqui (rodada 3 / B1): viraram cápsula
              emoldurada no HUD do topo, ao lado de ENERGIA. Eram o único
              medidor do app desenhado sem superfície — e o T1 os citava como
              "3 corações no ar". Ver components/pixel/HomeHud.tsx. */}

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
                {FX_ART[h.emoji]
                  ? <img src={FX_ART[h.emoji]} alt="" style={{ width: `${h.size}rem`, height: `${h.size}rem`, objectFit: 'contain', imageRendering: 'pixelated' }} />
                  : h.emoji}
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
                  <img src={FX_ART['🤗']} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'inline-block', verticalAlign: 'middle' }} />
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
                {ITEM_ART[eatingEmoji]
                  ? <img src={ITEM_ART[eatingEmoji]} alt="" width={30} height={30} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  : eatingEmoji}
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
                /* O berço é MOBÍLIA: ele fica onde está enquanto o pet passeia.
                   Antes os dois liam a mesma variável, então o "berço" andava
                   junto — o que só não aparecia porque nada andava. */
                left: '50%',
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
            {/* Sem `transition` e sem `hover:scale`: movimento DENTRO do visor é
                em passos (`steps()`), e um pixel deslizando em sub-pixel
                destrói o serrilhado que é a coisa inteira. O alvo de toque
                também não é mais esta `<div>` — é o `<button>` nomeado que
                fica por cima, fora do `role="img"` (ver adiante). */}
            <div
              className="absolute"
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
                /* `+ PET_GROUND_KEEP` mantém a BORDA DE BAIXO da caixa do
                   sprite no mesmo pixel de quando ela media `PET_BOX` — o pet
                   encolheu para a escala 2:1 exata e os pés não saíram do
                   chão. Ver o bloco de escala no topo do arquivo. */
                marginTop: PET_TOP_OFFSET + PET_GROUND_KEEP,
                zIndex: 1,
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
                  /* A OUTRA METADE DA SINTONIA (`spec-geracao-incremental.md`
                     §2.1 e §2.3.1). A varredura de 400 ms já passava por cima
                     deste sprite; a spec sempre pediu o PAR — "scanline de
                     400 ms + fade de 120 ms reserva→próprio" —, e sem o fade a
                     faixa anunciava uma troca que embaixo dela acontecia em
                     corte seco. `.sm-visor-swap` é a MESMA classe da aba
                     Evolução: nada novo no CSS, e o 120 ms continua sendo o
                     token `--sm2-dur-tap`, nunca um literal.

                     O `key` não é enfeite: sem ele o React reusa este `<img>`,
                     a animação já terminou na montagem e a troca fica sem fade
                     nenhum. Trocar a chave é o que faz o nó ser DESCARTADO e a
                     animação recomeçar — há caso de teste comparando a
                     referência do nó antes e depois, porque é a única forma
                     observável disso sem layout.

                     Movimento reduzido: o corte é a regra `.sm-visor-swap
                     { animation: none !important }` dentro do bloco
                     `SENTINELA-MOVIMENTO-REDUZIDO-CANONICO` do `index.css` —
                     aqui, ao contrário da varredura, não se corta em JS, porque
                     tirar a classe tiraria o elemento do alcance dessa regra. */
                  className="object-contain sm-visor-swap"
                  key={sprite}
                  style={{
                    width: PET_RENDER, height: PET_RENDER,
                    imageRendering: 'pixelated',
                    /* `isBlinking` entra AQUI, em JS — nunca via `animation`
                       CSS separada tocando `filter` (ver a nota grande em
                       `getCompanionFilter` e em `sm2-pet-blink`, index.css).
                       Duas tentativas anteriores erraram: animar `filter`
                       direto apagava o drop-shadow/humor a cada piscada; uma
                       custom property animada nunca aplicava (precisa de
                       `@property` registrado, que este projeto não tem). */
                    filter: getCompanionFilter(isBlinking),
                    transform: `scaleY(${getSquashScale()})`,
                    transformOrigin: 'bottom',
                    /* Prioridade: o que o USUÁRIO acabou de fazer vence o que o
                       bicho faz sozinho. Piscada e saudação são as últimas. */
                    animation: isRubbing
                      ? 'pet-rub 0.35s ease-in-out infinite'
                      : isShowering
                        ? 'pet-shower-shake 0.5s ease-in-out 3'
                        : isMunching
                          ? 'pet-munch 0.6s ease-out'
                          : isGreeting
                            ? 'sm2-pet-greet 0.8s steps(4, end)'
                            : isBlinking
                              ? 'sm2-pet-blink 0.28s steps(2, end)'
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
                      <img src={FX_ART['💧']} alt="" width={14} height={14} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                    </span>
                  ))}
                  <span
                    className="absolute text-xl"
                    style={{ left: '50%', top: '-26px', transform: 'translateX(-50%)' }}
                  >
                    <img src={FX_ART['🚿']} alt="" width={26} height={26} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
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

        </div>

        {/* A VARREDURA da sintonia — a faixa que atravessa a tela UMA vez
            quando o rosto do bicho troca, e sai do DOM aos 400 ms. Peça de CSS
            já existente (`.sm-visor-scan`, `index.css`), o mesmo call-site que
            a página de Evolução usa: aqui não nasceu regra nova.

            ÚLTIMA FILHA do visor de propósito — sem `z-index`. A ordem no DOM
            já a coloca por cima do palco inteiro, e um `z-index` novo aqui
            entraria numa disputa com os overlays do palco (flash de evolução,
            sono) que ninguém pediu.

            `pointer-events: none` vem da classe, e é o que garante que ela não
            engole o gesto de esfregar o pet — a ÚNICA cura de HP do jogo, e o
            controle mais importante desta tela. Há teste de comportamento, não
            só de estilo computado, em `CompanionHUD.scanline.render.test.tsx`.

            `key` no sprite para a animação recomeçar do zero a cada troca. */}
        {varrendoSintonia && (
          <div className="sm-visor-scan" aria-hidden="true" key={`scan-${sprite}`} />
        )}
        </Viewport>

        {/* ── O ALVO DO CARINHO — o controle mais importante do jogo ─────────
            BLOQUEADOR corrigido: o gesto de esfregar (a ÚNICA cura de HP)
            morava numa `<div>` sem role, sem tabIndex e sem nome acessível,
            DENTRO de um `role="img"` — subárvore que o leitor de tela ignora
            inteira. Ou seja: existia só para quem usa mouse/dedo e enxerga.

            Agora ele é um `<button>` nomeado, FORA do visor, sobreposto ao
            sprite: o desenho continua sendo o pet (o botão é transparente),
            mas ele é focável, tem nome em PT/EN e responde a Enter/Espaço com
            um ciclo de carinho de 2s — o mesmo custo do gesto, a mesma regra
            de cura, o mesmo teto diário (quem aplica é `onPet`).

            A geometria é DERIVADA do palco (`PET_BOTTOM_IN_STAGE` + o anel do
            visor), não digitada: se o berço ou o `GROUND_Y` mudarem, o alvo
            acompanha em vez de descolar em silêncio. */}
        <button
          type="button"
          /* A MIRA (`.sm2-rub::after`) é a affordance que faltava: o alvo era
             um botão transparente de 128×128 e ninguém que enxerga descobria
             que existe — sendo a ÚNICA cura de HP do jogo. Quatro cantos de
             cobre, discretos; quando há HP a recuperar eles trocam para a cor
             de alerta e piscam, porque é a hora em que o controle precisa ser
             encontrado. Nada de `title`: não existe hover no toque. */
          className={`sm2-rub${healthPoints < maxHealthPoints ? ' sm2-rub-heal' : ''}`}
          aria-label={language === 'pt-BR'
            ? 'Fazer carinho no Soulmon (segure para curar)'
            : 'Pet your Soulmon (hold to heal)'}
          style={{
            left: `calc(50% + ${walkPx}px)`,
            bottom: PET_BOTTOM_IN_STAGE + RING_PX,
            width: PET_RENDER,
            height: PET_RENDER,
            transform: 'translateX(-50%)',
          }}
          onClick={() => { if (rubMovedRef.current) { rubMovedRef.current = false; return; } handlePetClick(); }}
          onKeyDown={handleRubKeyDown}
          onPointerDown={startRub}
          onPointerMove={moveRub}
          onPointerUp={endRub}
          onPointerCancel={endRub}
        />

        {/* ── Os CONTROLES ficam FORA do visor ────────────────────────────────
            Não é preciosismo de composição, é acessibilidade: o `Viewport` é
            `role="img"` com nome acessível, e tudo dentro de um `role="img"` é
            ignorado pelo leitor de tela. Botão de evoluir e balão de fala
            DENTRO dele seriam invisíveis para quem usa leitor — e um botão
            focável dentro de subárvore ignorada é o defeito clássico.

            Então: o visor é a TELA (a imagem do pet, com nome próprio), e o que
            é controle vive no corpo do aparelho, por cima dela. Visualmente
            fica onde estava; a âncora agora é a janela do palco. */}

        {/* Evolução manual: botão aparece SÓ quando pode evoluir. `left`/
            `transform` seguem INLINE — `left-1/2` não existe no index.css
            pré-compilado (footgun 1). Ancorado no rodapé (rodada 4): a janela
            do palco corta pelo TOPO em tela baixa, e controle cortado é defeito
            funcional, não estético. */}
        {canEvolve && !isSleeping && (
          <PixelButton
            size="sm"
            variant="primary"
            onClick={onEvolveRequest}
            style={{ position: 'absolute', zIndex: 30, left: '50%', bottom: EVOLVE_BTN_BOTTOM, transform: 'translateX(-50%)', animation: 'evo-btn-pulse 1.6s ease-in-out infinite' }}
          >
            {language === 'pt-BR' ? 'Evoluir' : 'Evolve'}
          </PixelButton>
        )}

        {/* Balão de fala. Saiu do monospace a 0,68rem (≈11px, abaixo do piso
            absoluto de 12px da escala) para Rubik 14px em tokens `--sm2-*`: é o
            PET falando com a pessoa, texto de leitura, não voz de aparelho —
            Silkscreen aqui seria a fonte errada e o branco chapado de antes
            ignorava o tema.

            27/08/2026 (pedido do dono): mudou de baixo (deitava em cima do
            corpo do pet, que também ocupa a base do palco) para o TOPO da
            janela — o pet é centrado/base, então o topo é o único trecho da
            tela que nunca tem sprite embaixo dela. O rabinho virou de
            "aponta pra cima" (quando falava PARA o pet vindo de baixo) para
            "aponta pra baixo" (agora fala DE CIMA, e o pet está abaixo). O
            fundo ganhou transparência (era `--sm2-surface` opaco) pelo mesmo
            pedido. */}
        {showBubble && (
          <div
            className="absolute left-0 right-0"
            style={{
              top: BUBBLE_GAP,
              zIndex: 45,
              padding: '0 10px',
              /* A faixa é só posicionamento — ela cobre a largura inteira do
                 palco e não pode interceptar toque nenhum. Quem recebe clique
                 é a caixa de fala, logo abaixo. */
              pointerEvents: 'none',
            }}
          >
            <div
              className="relative pointer-events-auto"
              onClick={handleBubbleClick}
              style={{
                cursor: 'pointer',
                /* Só transparência, sem `backdrop-filter` — o blur atrás de
                   um fundo animado (respiração/passeio do pet, logo abaixo)
                   força o navegador a recompor a região toda a cada frame;
                   é caro em aparelho fraco e foi cortado por suspeita de
                   contribuir para o travamento relatado em 27/08/2026. */
                background: 'color-mix(in srgb, var(--sm2-surface) 78%, transparent)',
                border: '1px solid var(--sm2-line)',
                borderRadius: 14,
                padding: '8px 12px',
                boxShadow: '0 4px 14px rgba(0,0,0,.28)',
              }}
            >
              <p
                className="text-center break-words"
                style={{
                  margin: 0,
                  fontFamily: 'var(--sm2-font-text)',
                  fontSize: 'var(--sm2-text-sm)',
                  lineHeight: 'var(--sm2-leading-body)',
                  color: 'var(--sm2-ink)',
                }}
              >
                {bubbleText}
              </p>
              {/* Rabinho apontando para BAIXO, na direção do pet. */}
              <span
                className="absolute"
                style={{
                  bottom: -6, left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid color-mix(in srgb, var(--sm2-surface) 78%, transparent)',
                }}
              />
            </div>
          </div>
        )}
        </div>

        {/* ── O DECK — a fileira de ações CRAVADA no corpo do aparelho ───────
            Ela flutuava no fundo da página (`.sm-px-actionbar`: `background:
            transparent; border: none`), o que é o oposto do que Tamagotchi e
            Vital Bracelet fazem — lá os botões são do APARELHO, e é isso que
            torna o objeto um objeto. Agora ela é uma ÁREA do corpo: mesma
            superfície, separada da tela por um sulco de cobre, dentro do
            `.sm2-device`.

            O alvo de 60px de altura não mudou (WCAG 2.2 AA 2.5.8), o ícone
            continua pelado (regra do dono: ícone nunca dentro de box — quem
            ganha superfície ao toque é o BOTÃO), e o FILL segue carregando o
            estado. */}
        <div className="sm2-deck" role="group" aria-label={language === 'pt-BR' ? 'Cuidar do pet' : 'Care for your pet'}>
          {/* Os três PNGs saíram: as ações do pet são `Icon` (Material Symbols
              Rounded) a 42px, `weight 500` — o peso que faz o traço casar com a
              espessura do pixel do sprite. SEM MOLDURA: o alvo de toque de
              60px é do BOTÃO (`.sm-px-action`), nunca do ícone.

              O eixo FILL carrega o estado aqui também: `bedtime` preenchido
              enquanto o pet dorme, e o glifo troca para `wb_sunny` só porque a
              AÇÃO muda (acordar ≠ dormir), não porque o estado mudou. */}
          {([
            /* Alimentar PRIMEIRO: é a ação que define o gênero, e a leitura da
               fileira é da esquerda para a direita. */
            { key: 'feed', icon: 'restaurant', fill: 0, en: 'Feed', pt: 'Alimentar', onClick: () => setFeedOpen(true), disabled: false, badge: false },
            { key: 'items', icon: 'inventory_2', fill: hasNewItems ? 1 : 0, en: 'Items', pt: 'Itens', onClick: onOpenItems ?? (() => {}), disabled: false, badge: hasNewItems },
            { key: 'bath', icon: 'shower', fill: 0, en: 'Bath', pt: 'Banho', onClick: handleShowerClick, disabled: showerCooldown, badge: false },
            { key: 'sleep', icon: isSleeping ? 'wb_sunny' : 'bedtime', fill: isSleeping ? 1 : 0, en: isSleeping ? 'Wake' : 'Sleep', pt: isSleeping ? 'Acordar' : 'Dormir', onClick: onSleep ?? (() => {}), disabled: false, badge: false },
          ] as { key: string; icon: string; fill: number; en: string; pt: string; onClick: () => void; disabled: boolean; badge: boolean | undefined }[]).map(a => (
            <button
              key={a.key}
              type="button"
              /* "Banho" nunca fica realmente desabilitado: o `disabled` dele é
                 só um cooldown de 5s, e o handler já ignora o clique repetido.
                 Desabilitar de verdade tiraria o botão da ordem de tabulação
                 no meio do uso. */
              onClick={a.key === 'bath' ? a.onClick : (a.disabled ? undefined : a.onClick)}
              disabled={a.key !== 'bath' && a.disabled}
              className="sm2-deck-btn"
              aria-label={language === 'pt-BR' ? a.pt : a.en}
              style={{ opacity: a.disabled ? 0.45 : 1, cursor: a.disabled ? 'default' : 'pointer' }}
            >
              {a.badge && (
                <span
                  className="sm2-deck-dot"
                  aria-label={language === 'pt-BR' ? 'Novidade' : 'New'}
                  role="img"
                />
              )}
              {/* 24px (era 42px, degrau `deck`): o deck encolheu a pedido do
                  dono em 27/08/2026 — pet e lista de rituais são a
                  prioridade da Home, o deck de cuidado não. 24 é o degrau
                  `action` de tokens.md §6.1 (a escala é FECHADA a 20/24/32);
                  o deck passou a dividi-lo — ver a nota na tabela. O `opsz`
                  do `Icon` casa com o `size`, então o traço não afina ao
                  encolher. */}
              <Icon name={a.icon} size={24} fill={a.fill} weight={500} tone={a.fill ? 'primary' : 'ink'} />
              {/* Rótulo de AÇÃO em Rubik 12px, caixa mista. Era Silkscreen a
                  8px: abaixo do piso absoluto da escala, e a bitmap fecha os
                  contornos nesse tamanho. Silkscreen agora é a voz do aparelho
                  — só DENTRO do visor e em selos —, e esta fileira é o corpo
                  do aparelho, por fora. */}
              <span className="sm2-deck-label">
                {language === 'pt-BR' ? a.pt : a.en}
              </span>
            </button>
          ))}
        </div>
        </div>
      </div>

      </div>

      {/* A escolha da comida. Bottom sheet porque o polegar chega lá, e porque
          é a mesma superfície `--sm2-*` do resto do app fora do visor.
          Os TRÊS estados existem: com estoque (a grade), vazio (o que fazer
          para conseguir comida) e recusa (o pet fala, via `fullSignal`). */}
      <ModalSheet
        open={feedOpen}
        onClose={() => setFeedOpen(false)}
        title={language === 'pt-BR' ? 'Alimentar' : 'Feed'}
        language={language}
      >
        {foodStock.length === 0 ? (
          <p style={{ ...sm2Text, margin: 0 }}>
            {language === 'pt-BR'
              ? 'Sua pastinha está sem comida. Conclua uma tarefa ou hábito para ganhar comida — é assim que seu Soulmon come.'
              : "You're out of food. Complete a task or habit to earn some — that's how your Soulmon eats."}
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
              {foodStock.map(([emoji, n]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleDeckFeed(emoji)}
                  aria-label={`${FOOD_NAME_BY_EMOJI[emoji] ?? emoji} × ${n}`}
                  style={{
                    minHeight: 72,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    padding: 8,
                    borderRadius: 10,
                    border: '1px solid var(--sm2-line)',
                    backgroundColor: 'var(--sm2-surface-2)',
                    cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 34 }}>
                    {ITEM_ART[emoji]
                      ? <img src={ITEM_ART[emoji]} alt="" width={34} height={34} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                      : emoji}
                  </span>
                  <span className="sm2-num" style={{ fontSize: 'var(--sm2-text-xs)', color: 'var(--sm2-muted)' }}>×{n}</span>
                </button>
              ))}
            </div>
            <p style={sm2Hint}>
              {language === 'pt-BR'
                ? 'Cada comida dá +1 de energia e pontos de atributo. Se ele estiver cheio, vai avisar.'
                : 'Each food gives +1 energy and attribute points. If he is full, he will say so.'}
            </p>
          </>
        )}
      </ModalSheet>

      {/* Chat Box — fixo no rodapé da tela (não rola com o conteúdo), e ainda
          dentro do `<main>` do app: assim modais (z-index maior, irmãos do
          `<main>`) continuam corretamente acima dele, o que um portal para o
          `<body>` quebraria — foi por isso que o portal externo saiu daqui uma
          vez. O que muda agora é só o PONTO DE MONTAGEM dentro do `<main>`
          (último filho, depois da lista e do CTA): ver a nota de ORDEM DE FOCO
          lá em cima. */}
      {chatHost ? createPortal(chatDock, chatHost) : chatDock}
    </div>
  );
});
