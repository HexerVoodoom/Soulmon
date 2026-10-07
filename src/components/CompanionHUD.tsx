import { useState, useEffect, useLayoutEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { aiFetch } from '../utils/aiClient';
import { getSpriteForStage, demoTintFilter } from '../utils/sprites';
import { petVoiceLine, type PetVoiceKind } from '../utils/petVoice';
import { welcomeBackLine } from '../utils/welcomeBack';
import { PixelIcon } from './ui/PixelIcon';
import { Icon } from './ui/Icon';
import { UI_ICON_ART } from '../assets/soulmon/icones-ui';
import { Viewport, usePrefersReducedMotion, useVarreduraDeSintonia } from './ui/Viewport';
import { NEST_ART, DEFAULT_NEST } from './nestArt';
import { ITEM_ART } from '../utils/itemArt';
import { FX_ART } from '../utils/fxArt';
import { ANIM_ART } from '../utils/animArt';
import { SpriteAnim } from './pixel/SpriteAnim';
import { EvolveButton, EVOLVE_BTN_H } from './pixel/EvolveButton';
import { type SlotId, PET_TOP_OFFSET, PET_LIFT, PET_BOX, PET_RENDER, STAGE_HEIGHT } from '../utils/petStage';
import { PetStageDecor } from './PetStageDecor';
import { PET_BACKGROUNDS, isDarkBackground } from '../utils/backgrounds';
import { statTip, type StatTipKind } from './home/statTips';

/** C3 — o cenário pintado quando nenhum está equipado: o Quarto grátis,
 *  pré-possuído por todo save (`utils/shop.ts`, preço 0). */
export const DEFAULT_PET_BACKGROUND = 'bg-room';
import { CareSystem, CareEvent } from './CareSystem';
import { ChatBox } from './ChatBox';
import { Language } from '../utils/i18n';
import { playShower, playVisorTune, playPresence } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readFlag, writeFlag } from '../utils/safeStorage';
import { SM2_SHADOW_CARD } from './form/FormKit';
import { Mochila } from './home/Mochila';

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
/* minimal-ui F2 (abordagem B): a Home virou uma FAIXA DE CENÁRIO de ponta a
   ponta (`.sm3-cena`, index.css) — o `Viewport` continua sendo a tela (`role=
   "img"`, escala inteira), mas sem o anel de cobre em volta. Sem anel, a
   folga que a geometria descontava é zero. */
const RING_PX = 0;
/* A altura da faixa vem do token `--sm3-cena-h` (330 na referência de 390×844
   do mock aprovado; encolhe em tela baixa). Este é só o fallback do jsdom. */
const STAGE_FALLBACK_H = 330;
const STAGE_FALLBACK_W = 320;
/* O PET GRANDE da abordagem B. O sprite continua renderizado em `PET_RENDER`
   (a escala inteira da fonte, guardada pelo teste de render); o que cresce é o
   GRUPO do pet (berço, sprite, corações, comida), com origem na linha de baixo
   do sprite — os pés não saem do chão. 1,5 × 128 = 192 CSS, o que o mock pede
   (220 num aparelho de 390) sem cortar a cabeça numa faixa de 280. A decoração
   do palco NÃO cresce: os espaços têm posição em % e sairiam da tela. */
const CENA_ZOOM = 1.5;
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
const BUBBLE_GAP = 6;
/* ⚰️ O BALÃO NÃO COBRE A CRIATURA (X2) — revogado em 01/10/2026 (C5 do
   dono): a composição não desce mais sob a fala; o balão é overlay. */
/* FX do `animArt` DENTRO do vidro a 2× (célula 64 → 128 CSS, D-H4): mesma
   grade lógica 64 × `VIEW_SCALE` do `Viewport`. Ancorados ACIMA da cabeça
   (X8), nunca sobre o rosto. */
const FX_PX = 64 * VIEW_SCALE;

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
  eggType?: 'ignar' | 'lumel' | 'serah';
  /** Modo demo (utils/monetization.ts): personagem pré-pronto escolhido — sobrepõe eggType no sprite. */
  demoCharacterId?: string;
  /** Sprite PRÓPRIO da forma atual, quando existe **e já foi adotado**
   *  (`utils/spriteLibrary.ts`). Ausente = arte de reserva, que é o piso e
   *  nunca um erro: o visor não tem estado de carregamento nem de erro
   *  (`spec-geracao-incremental.md` §2.1). */
  ownSpriteUrl?: string;
  healthPoints: number;
  maxHealthPoints: number;
  dominantBranch: 'power' | 'harmony' | 'benevolence' | 'balanced';
  currentXP: number;
  nextLevelXP: number;
  triggerMessage?: number; // Prop to trigger message from outside
  energyPoints?: number; // Version B: energy gauge, fills only via feeding
  maxEnergyPoints?: number; // energy bars = the stage's daily task requirement
  fullSignal?: number; // bumped when a feed is refused → pet says it's full
  healCapSignal?: number; // bumped when rubbing can't heal (daily cap reached)
  /** WP3.2 — fala nos momentos que eram mudos. Mesmo padrão de `fullSignal`:
   *  um contador que só cresce, e o `kind` diz QUAL frase. As frases vivem em
   *  `utils/petVoice.ts` (o teste de tom varre lá, não aqui). */
  speakSignal?: { n: number; kind: PetVoiceKind };
  /** WP3.3 — o nome do pet. B1 (02/10/2026): NÃO é mais desenhado sob o pet
   *  (mora no header da Home, `HomeHud`); só rotula a Mochila. */
  petDisplayName?: string;
  /** WP4.19 — marca cosmética da recuperação, e só quando o jogador escolheu
   *  exibi-la (`showRedeemed`). Nunca é marca de queda. */
  redeemedMark?: boolean;
  /** WP1.12 — tonalidade escolhida no modo demo (0 = original). COSMÉTICO:
   *  nenhuma regra, atributo ou preço olha para isto. */
  demoTint?: number;
  /** WP3.1 — nível do Vínculo, para o chat saber há quanto tempo estão
   *  juntos. Derivado de `totalXP` por quem chama; nunca persistido. */
  bondLevel?: number;
  /** WP3.10 — traço de nascimento (`utils/passives.ts`), para a voz. */
  petPassive?: string;
  /** Fase 3 do Oráculo — o talento dominante da ficha do estágio
   *  (`ficha/manifestacao.ts`): vira traço de personalidade na fala
   *  (`utils/talentoVoice.ts`), a `TALENTO_VOICE_RATE` das falas de ócio. */
  talento?: string | null;
  /** WP2.7 — dias fora, de `lastDayReport.daysAway`. 0 = não houve ausência. */
  daysAway?: number;
  /** WP3.1 — humor do check-in de hoje (`MoodValue` 1..5), ou `null`. O chat
   *  normaliza para 0..4 antes de enviar. **Nunca vira pontuação**: entra só
   *  para o pet não responder animado a quem disse que o dia foi ruim. */
  moodToday?: number | null;
  /** WP3.2 — há tarefa assombrada na lista? O sprite VIRA O OLHAR enquanto
   *  houver. É o "o pet olha" que o `CLAUDE.md` prometia e não existia. */
  hauntedWatching?: boolean;
  /** 🧭 O palco "passeando" (30/09/2026, Passeio): nome da região de destino
   *  (≠ casa), já no idioma. Vira um marcador pequeno e SEM TEXTO perto do pet —
   *  diegético, sem bloquear gesto nenhum de cuidado. `null` = em casa. */
  walkingTo?: string | null;
  equippedBackground?: string | null; // shop backdrop id for the pet box
  /** Decoração equipada por espaço do palco (utils/petStage.ts). */
  equippedDecor?: Partial<Record<SlotId, string>>;
  /** Troféus de season ganhos no Torneio — exibidos na vitrine, se houver uma. */
  trophies?: Array<{ season: string; place: 1 | 2 | 3 }>;
  perfectDays?: number; // Dias perfeitos acumulados
  /* ⚰️ WP4.17 — `digivolutionSegments`, `digivolutionSegmentsNeeded` e
     `requiredDays` SAÍRAM daqui (03/09/2026). Os três eram props declaradas,
     recebidas e **nunca lidas no corpo deste componente**: o HUD tinha três
     fontes para o mesmo número e não desenhava nenhuma. Duas delas vinham do
     save (`digivolutionSegments*`, cujo valor `handleEvolve` ainda escreve e
     ninguém lê) e a terceira do gate real. Não reintroduza: quem precisa do
     gate chama `FORM_REQUIREMENTS[…].required`, que é o que `handleEvolve` e
     `canEvolve` leem. */
  onEvolve?: () => void;
  /** Evolução manual: botão sobre o pet quando a barra está cheia. */
  canEvolve?: boolean;
  onEvolveRequest?: () => void;
  careEvent?: CareEvent | null;
  onCareEventComplete?: () => void;
  useAI: boolean;
  aiSettings?: any;
  onCreateActivity?: (activity: {
    name: string;
    category: string;
    points: { power: number; harmony: number; benevolence: number };
  }) => void;
  language: Language;
  foodInventory?: Record<string, number>;
  /** Materiais de aprimoramento, só leitura na Mochila. */
  materials?: Partial<Record<string, number>>;
  /** O "Ir lá" do material na Mochila (o App navega). */
  onGoToBuilding?: (building: import('../utils/gates').BuildingId) => void;
  /** DEMO LOCAL: repassado à Mochila para o "Ir lá" respeitar os prédios bloqueados. */
  demoMode?: boolean;
  onFeed?: (foodEmoji: string) => void;
  onShower?: () => void;
  /** A mochila abriu: o ponto de "item novo" do botão pode apagar. Quem guarda
   *  o sinal é o App (`newItemsReady`). */
  onBackpackSeen?: () => void;
  onSleep?: () => void;
  isSleeping?: boolean;
  onPet?: () => void;
  hasNewItems?: boolean;
  /**
   * BRINCAR como 5ª célula do deck (canvas Home, PlayEstados / E1+E2): é um
   * gesto de CUIDADO, ao lado de banho/dormir/itens — não um card. As três
   * situações têm três respostas, e a regra é única (PetDeckEstados, r3):
   *  · `available` falso (antes da 1ª conclusão) ou `playedToday` → célula
   *    INERTE (`aria-disabled`, tracejado, o rótulo diz o porquê): a ação
   *    não existe agora por regra;
   *  · `canPlay` falso com a célula viva (sem energia) → a criatura RECUSA
   *    no balão. Nunca toast para recusa de cuidado (02 §13).
   * `onPlay` só é chamado quando a oferta existe de verdade.
   */
  play?: { available: boolean; canPlay: boolean; playedToday: boolean; onPlay: () => void };
  evolutionFlash?: boolean;
  feedAnim?: { emoji: string; n: number } | null;
}

export const CompanionHUD = memo(function CompanionHUD({
  companionMood, 
  energyLevel, 
  message, 
  currentStage,
  evolutionStage,
  eggType = 'ignar',
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
  speakSignal,
  hauntedWatching = false,
  walkingTo = null,
  daysAway = 0,
  petPassive,
  talento = null,
  bondLevel,
  moodToday,
  demoTint,
  petDisplayName,
  redeemedMark = false,
  equippedBackground = null,
  equippedDecor = {},
  trophies = [],
  perfectDays = 0,
  onEvolve,
  canEvolve = false,
  onEvolveRequest,
  careEvent,
  onCareEventComplete,
  useAI,
  aiSettings,
  onCreateActivity,
  language,
  foodInventory = {},
  materials,
  onGoToBuilding,
  demoMode,
  onFeed,
  onShower,
  onBackpackSeen,
  onSleep,
  isSleeping = false,
  onPet,
  hasNewItems = false,
  play,
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
     e antes do `CornerLink` do Mapa (irmão do `<main>`; a `BottomNav` que
     ocupava esse lugar saiu na minimal-ui F1). A ordem de foco passa a ser a ordem visual, ponto a ponto.

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
  /* F4 (01/10/2026): no banho o balão mostra o CHUVEIRINHO aprovado (o mesmo do
     botão de banho), não as mãozinhas do abraço — que ficam para a comida. */
  const [balloonKind, setBalloonKind] = useState<'hug' | 'bath'>('hug');
  /* C5 (navegação do dono, 01/10/2026): o balão é OVERLAY e não empurra
     nada. Até aqui a composição DESCIA 22/40px quando a fala aparecia (X2 do
     canvas Home) — o dono leu isso como "a área do pet muda ao tocar no
     Soulmon". A altura da faixa é fixa (`--sm3-cena-h`) e o balão flutua por
     cima; o `ref` continua para quem mede a caixa de fala. */
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const stageDrop = 0;
  /* B3: com o "Evoluir" centralizado no alto, o balão desce abaixo dele. */
  const bubbleTop = canEvolve && !isSleeping ? BUBBLE_GAP + EVOLVE_BTN_H + 16 : BUBBLE_GAP;
  /* C13 — qual dica de leitura está aberta (coração ou energia). Fecha com
     novo toque no mesmo ícone, toque na própria dica, toque fora ou Esc. */
  const [statAberto, setStatAberto] = useState<StatTipKind | null>(null);
  useEffect(() => {
    if (!statAberto) return;
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Element | null;
      if (alvo?.closest?.('[data-cena-stats], #sm3-stat-tip')) return;
      setStatAberto(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setStatAberto(null); };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc); };
  }, [statAberto]);
  /* ── ALIMENTAR É CONTROLE DE PRIMEIRA CLASSE ─────────────────────────────
     O deck tinha Itens / Banho / Dormir e a ação que DEFINE o gênero v-pet
     estava enterrada dentro do `ItemsWindow`, atrás de "Itens" — um rótulo
     que não promete comida. Tamagotchi Uni, Vital Bracelet e Pokémon Sleep
     põem alimentar na primeira fileira; aqui ele voltou para lá.

     O que NÃO muda: a escolha da comida continua existindo (v-pet sem escolha
     de comida é um botão de +1), e a REGRA continua inteira em `onFeed`
     (`handleFeed` no App) — teto por hora, recusa quando cheio, pontos de
     atributo. Este botão só encurta o caminho até ela. */
  /* minimal-ui F2: a escolha da comida virou a MOCHILA (`home/Mochila.tsx`),
     que junta a folha de Alimentar e a pastinha de Itens. A regra continua
     inteira no `onFeed` (`handleFeed` do App). */
  const [mochilaOpen, setMochilaOpen] = useState(false);
  /** O item está sendo arrastado SOBRE o pet — o alvo acende. */
  const [petIsTarget, setPetIsTarget] = useState(false);
  /** O "+1" que sobe do pet quando ele come (mock aprovado). */
  const [plusOne, setPlusOne] = useState(0);
  const rubBtnRef = useRef<HTMLButtonElement | null>(null);

  // Always-current snapshot of props for stable intervals
  const propsRef = useRef({ useAI, language, currentStage, companionMood, evolutionStage, dominantBranch, aiSettings, healthPoints, energyPoints, maxEnergy, maxHealthPoints, careEvent, isSleeping, daysAway });
  propsRef.current = { useAI, language, currentStage, companionMood, evolutionStage, dominantBranch, aiSettings, healthPoints, energyPoints, maxEnergy, maxHealthPoints, careEvent, isSleeping, daysAway };

  /* Fase 3 do Oráculo — a fala do TALENTO. A tabela (65 pares PT+EN,
     `utils/talentoVoice.ts`) entra por import DINÂMICO: no bundle de entrada
     ela custava ~9 KB contra o orçamento de bytes (decisão #31), para uma
     frase que só existe com perfil. Resolvida uma vez por (talento, idioma);
     até chegar, a escada genérica fala — nunca um vazio. */
  const talentoRef = useRef<{ fala: string; taxa: number } | null>(null);
  useEffect(() => {
    talentoRef.current = null;
    if (!talento) return;
    let vivo = true;
    import('../utils/talentoVoice').then(({ talentoLine, TALENTO_VOICE_RATE }) => {
      if (!vivo) return;
      const fala = talentoLine(talento, language === 'pt-BR');
      talentoRef.current = fala ? { fala, taxa: TALENTO_VOICE_RATE } : null;
    }).catch(() => { /* sem o traço — a escada genérica já funcionava sozinha */ });
    return () => { vivo = false; };
  }, [talento, language]);
  const falaDoTalento = (): string | undefined => {
    const t = talentoRef.current;
    return t && Math.random() < t.taxa ? t.fala : undefined;
  };

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

  const showHug = (kind: 'hug' | 'bath' = 'hug') => {
    setBalloonKind(kind);
    setHugBalloon(true);
    setTimeout(() => setHugBalloon(false), 2000);
  };

  // Chat message from ChatBox — strip emojis, show for 5s
  const handleChatMessage = useCallback((response: string) => {
    speak(response, 5000);
  }, [speak]);

  /**
   * WP3.8 — O CANAL DE REAÇÃO DO PET, que existia e estava desligado.
   *
   * O `App.tsx` incrementa `messageTrigger` em **treze** pontos (concluir
   * tarefa, alimentar, limpar cocô, brincar, evoluir, degenerar, editar, o
   * `useCareSystem` inteiro…) e calcula `getCompanionMessage()` a cada render.
   * As duas props chegavam aqui, eram desestruturadas e **nenhuma era lida**:
   * todo sinal de "o pet deveria dizer alguma coisa agora" caía no chão, e o
   * bicho só falava no relógio dele, nunca sobre o que você acabou de fazer.
   *
   * Um companheiro que não reage não é companheiro, é papel de parede animado —
   * e o `triggerMessage` sozinho, sem consumidor, é a assinatura desse defeito.
   *
   * **A dependência é SÓ o pulso, e isso é a metade importante.** `message` é
   * derivado do estado e muda o tempo todo (vida, energia, sono, progresso do
   * dia); se ele entrasse nas deps, o pet falaria a cada mudança de estado — e
   * bicho que fala sozinho o tempo todo é exatamente o bipe que fez as escolas
   * banirem o Tamagotchi. Por isso o texto vem de um ref: fala quando ALGO
   * ACONTECEU, com o que for verdade naquele instante.
   */
  const mensagemAtualRef = useRef(message);
  mensagemAtualRef.current = message;
  useEffect(() => {
    // 0 é a montagem: ninguém fez nada ainda, e abrir o app não é um evento.
    if (!triggerMessage) return;
    speak(mensagemAtualRef.current);
  }, [triggerMessage, speak]);

  useEffect(() => {
    if (!feedAnim) return;
    setEatingEmoji(feedAnim.emoji);
    setEatKey(k => k + 1);
    setIsMunching(true);
    showHug();
    /* O "+1" flutuante do mock no lugar do balão `+1⚡`: o balão é a VOZ do
       pet, e um número não é fala. Sai do DOM sozinho (1s). */
    setPlusOne(n => n + 1);
    setTimeout(() => setEatingEmoji(null), 1500);
    setTimeout(() => setIsMunching(false), 600);
  }, [feedAnim?.n, speakRaw]);

  // A recusa de comida (teto da hora) e o teto de carinho do dia. As frases
  // moravam AQUI, inline, desde antes do WP3.2 — fora do alcance do teste de
  // tom de `petVoice.ts`. Em 21/09/2026 (copy §1.2 e §1.9) viraram os kinds
  // `full` e `healCap` do dono único, `PET_VOICE_LINES`.
  useEffect(() => {
    if (!fullSignal) return;
    speak(petVoiceLine('full', language === 'pt-BR', Math.random(), petPassive), 3500);
  }, [fullSignal]);

  useEffect(() => {
    if (!healCapSignal) return;
    speak(petVoiceLine('healCap', language === 'pt-BR', Math.random(), petPassive), 3500);
  }, [healCapSignal]);

  // WP3.2 — os quatro gestos mudos ganham voz. Um efeito só, chaveado pelo
  // contador: a fala é do gesto, e o `kind` escolhe a tabela.
  useEffect(() => {
    if (!speakSignal?.n) return;
    // WP3.10 — o traço entra aqui, lido do ESTADO (nunca por parâmetro que
    // quem chama possa esquecer). Sem traço, ou sem fala para este gesto, cai
    // na genérica.
    speak(petVoiceLine(speakSignal.kind, language === 'pt-BR', Math.random(), petPassive), 3500);
    // `kind` fora das deps de propósito: quem dispara é a mudança do CONTADOR.
    // Com `kind` na lista, trocar de idioma ou remontar repetiria a fala.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakSignal?.n]);

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
      const janela = parseFloat(raiz?.getPropertyValue('--sm3-cena-h') || '') || STAGE_FALLBACK_H;
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

  /* O PASSEIO. ⚰️ O protótipo `WalkingPetStrip.tsx` foi apagado em
     07/09/2026: esta menção era a ÚNICA ocorrência dele no repositório
     inteiro — um componente de 63 linhas que já tinha sido absorvido aqui e
     sobrevivia por ser citado num comentário. Junto foi o `EnergyBar.tsx`,
     que não era citado nem em comentário (zero referências); a barra viva é
     a segmentada deste arquivo.
     O passo aqui é em
     pixel inteiro e o pet ALTERNA andar e parar, com pausas de duração
     irregular: andar sem parar lê como carrossel, e é o que faz um sprite
     parecer um GIF em vez de um bicho. Ele vira ao bater na parede e às
     vezes só porque mudou de ideia.
     Não anda dormindo, não anda com a aba escondida (ninguém vê, e o timer
     ainda custa bateria) e não anda em `prefers-reduced-motion`. */
  useEffect(() => {
    if (reducedMotion || isSleeping) return;
    /* O grupo do pet cresce `CENA_ZOOM` a partir do centro: cada passo lógico
       anda `CENA_ZOOM` na tela, então o alcance lógico encolhe na mesma razão. */
    const alcance = telaW / 2 / CENA_ZOOM - PET_RENDER / 2 - 6;
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
  /** WP3.5 — o som de presença toca UMA vez por sessão. */
  const presencaTocadaRef = useRef(false);
  useEffect(() => {
    const isPt = language === 'pt-BR';
    const saudar = () => {
      if (document.hidden || propsRef.current.isSleeping) return;
      ultimaSaudacaoRef.current = Date.now();
      if (!reducedMotion) {
        setIsGreeting(true);
        setTimeout(() => setIsGreeting(false), 800);
      }
      /* WP2.7 — o reencontro é por DIAS. A mesma frase servia para quem
         voltou 11 minutos depois e para quem sumiu três semanas, e as duas
         coisas não são a mesma: uma é continuar, a outra é voltar.
         A regra do perdão por ausência já existia do lado do DADO
         (`ABSENCE_FORGIVENESS_DAYS`) e nunca tinha chegado à VOZ. */
      speak(welcomeBackLine(propsRef.current.daysAway ?? 0, isPt, Math.random()), 3500);
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
      const p = propsRef.current;
      const ratio = p.maxEnergy > 0 ? p.energyPoints / p.maxEnergy : 0;
      const hpRatio = p.maxHealthPoints > 0 ? p.healthPoints / p.maxHealthPoints : 0;
      const isPt = p.language === 'pt-BR';
      // 22/09/2026 — a escada inteira mora em `utils/petVoice.ts` (QA R2 `07`
      // §2.9): `'Me limpa!'`/`'Me alimenta por favor!'` eram pedido imperativo
      // fora da régua de tom. Aqui só se escolhe o `kind`.
      if (p.careEvent?.type === 'poop') return petVoiceLine('dirty', isPt, Math.random());
      if (p.careEvent?.type === 'food') return petVoiceLine('hungry', isPt, Math.random());
      if (hpRatio <= 0.25) return isPt
        // A voz mora no DONO (`utils/petVoice.ts`), onde o teste de palavras
        // de cobrança varre. Estas três frases ('HP baixo...' entre elas) eram
        // o pet lendo a própria UI — ver o cabeçalho do kind `lowHp`.
        ? petVoiceLine('lowHp', true, Math.random())
        : petVoiceLine('lowHp', false, Math.random());
      if (ratio >= 1) return petVoiceLine('energized', isPt, Math.random());
      // Fase 3 do Oráculo: nos degraus sem urgência ('fine'/'idle'), o TALENTO
      // da ficha fala às vezes — o traço de personalidade que o class-system
      // manifesta sem nunca mostrar a ficha (`utils/talentoVoice.ts`).
      if (ratio >= 0.35) {
        const traco = falaDoTalento();
        if (traco) return traco;
      }
      if (ratio >= 0.6) return petVoiceLine('fine', isPt, Math.random());
      if (ratio >= 0.35) return isPt
        ? petVoiceLine('idle', true, Math.random())
        : petVoiceLine('idle', false, Math.random());
      if (ratio >= 0.1) return petVoiceLine('peckish', isPt, Math.random());
      return petVoiceLine('starving', isPt, Math.random());
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
    /* WP3.5 (decisão D11) — O SOM DE PRESENÇA.
       Uma vez por sessão, e SÓ em resposta a um gesto. Som que sai sozinho
       não é presença, é alarme — foi o bipe do Tamagotchi que fez as escolas
       banirem o bicho. Por isso ele mora aqui, no toque, e não no ciclo idle;
       e por isso o `document.hidden` também barra (aba em segundo plano é
       exatamente o caso em que "tem alguém aqui" seria um susto). */
    if (!presencaTocadaRef.current && !document.hidden) {
      presencaTocadaRef.current = true;
      playPresence();
    }
    const ratio = maxEnergy > 0 ? energyPoints / maxEnergy : 0;
    const hpRatio = maxHealthPoints > 0 ? healthPoints / maxHealthPoints : 0;
    const isPt = language === 'pt-BR';
    let fallback: string;
    // o mesmo traço do ócio, no toque (Fase 3 do Oráculo) — só nos degraus sem urgência
    const traco = ratio >= 0.35 ? falaDoTalento() : undefined;
    // 22/09/2026 — mesma escada do ócio; as frases moram em `utils/petVoice.ts`.
    if (careEvent?.type === 'poop') fallback = petVoiceLine('dirty', isPt, Math.random());
    else if (careEvent?.type === 'food') fallback = petVoiceLine('hungry', isPt, Math.random());
    else if (hpRatio <= 0.25) fallback = petVoiceLine('lowHp', isPt, Math.random());
    else if (ratio >= 1) fallback = petVoiceLine('energized', isPt, Math.random());
    else if (traco) fallback = traco;
    else if (ratio >= 0.6) fallback = petVoiceLine('fine', isPt, Math.random());
    else if (ratio >= 0.35) fallback = petVoiceLine('idle', isPt, Math.random());
    else if (ratio >= 0.1) fallback = petVoiceLine('peckish', isPt, Math.random());
    else fallback = petVoiceLine('starving', isPt, Math.random());
    speak(fallback, 4000);

    if (!useAI) return;

    const contextMsg = language === 'pt-BR'
      ? `[TOQUE] O usuário tocou em você. Energia: ${Math.round(ratio * 100)}%, HP: ${healthPoints}/${maxHealthPoints}. Responda como ${currentStage} com 1 frase curta e fofa (máx 15 palavras).`
      : `[TOUCH] User tapped you. Energy: ${Math.round(ratio * 100)}%, HP: ${healthPoints}/${maxHealthPoints}. Reply as ${currentStage} with 1 short cute sentence (max 15 words).`;

    /* WP3.1 — o CONTEXTO vai junto, e é só INTEIRO.
       O prompt não recebia nada do estado: o pet respondia igual no dia em que
       a pessoa voltou depois de duas semanas e no dia em que ela fechou tudo.
       Nada de texto aqui — `soulGoal`/`soulStruggle` não passam por rota de IA
       (decisão D8), e o servidor descarta o bloco inteiro se vier prop
       desconhecida ou valor fora da faixa. */
    aiFetch('/api/chat', {
      message: contextMsg, petName: currentStage, mood: companionMood,
      evolutionStage, dominantBranch, language, aiSettings,
      context: {
        hp: Math.max(0, Math.min(4, Math.round(hpRatio * 4))),
        energy: Math.max(0, Math.min(4, Math.round(ratio * 4))),
        ...(bondLevel ? { bond: Math.max(1, Math.min(31, bondLevel)) } : {}),
        ...(daysAway ? { daysAway: Math.max(0, Math.min(3, daysAway)) } : {}),
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.response) speak(data.response, 5000); })
      .catch(() => {});
  };

  // O visor mostra a criatura, e só isso. Sprite próprio quando adotado; senão
  // a arte de reserva, imediatamente, sem placeholder e sem spinner.
  /* E2 (QA rodada 2): o sprite próprio é uma URL de rede (acervo). Offline,
     ou com o cache do provedor fora, o `<img>` falhava e o visor ficava
     QUEBRADO — sem `onError`, nada caía na arte de reserva. Guarda a URL que
     falhou; uma URL nova (regeneração) tenta de novo. */
  const [spriteQuebrado, setSpriteQuebrado] = useState<string | null>(null);
  const sprite = (ownSpriteUrl && ownSpriteUrl !== spriteQuebrado ? ownSpriteUrl : undefined)
    ?? getSpriteForStage(evolutionStage, demoCharacterId);

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
      case 'power':
        return 'rgba(233, 79, 79, 0.6)'; // Red
      case 'harmony':
        return 'rgba(79, 128, 233, 0.6)'; // Blue
      case 'benevolence':
        return 'rgba(102, 233, 79, 0.6)'; // Green
      default:
        return 'rgba(156, 163, 175, 0.6)'; // Gray
    }
  };

  /* Usar um item da MOCHILA — por arrasto até o pet ou pelo botão "Usar" (a
     alternativa acessível). NÃO reimplementa regra nenhuma: chama o mesmo
     `onFeed` que a pastinha antiga chamava. Quem decide teto por hora, recusa
     por barriga cheia, cura do coraçãozinho, teto diário do Glitchtama e pontos
     de atributo é o `handleFeed` do App (→ `careRules` / `specialItemUse`). A
     animação de comer e o "+1" voltam por `feedAnim`, só quando o App aceitou —
     recusa não anima. */
  const handleUseItem = useCallback((emoji: string) => {
    setMochilaOpen(false);
    setPetIsTarget(false);
    onFeed?.(emoji);
  }, [onFeed]);

  const openMochila = () => {
    setMochilaOpen(true);
    onBackpackSeen?.();
  };

  /* Brincar pelo deck. Célula inerte nem chega aqui (o botão não chama). Sem
     energia = a criatura recusa NO BALÃO — os dois toasts 🎈 do `handlePlay`
     saíram (canvas Home, E7): recusa de cuidado é fala do pet, não aviso do
     sistema. */
  const handleDeckPlay = () => {
    if (!play || !play.available || play.playedToday) return;
    if (!play.canPlay) {
      speak(language === 'pt-BR'
        ? 'Brincar pede 1 de energia — dá pra deixar pra depois de uma comidinha.'
        : 'Playing takes 1 energy — it can wait until after a snack.', 3500);
      return;
    }
    play.onPlay();
  };

  // Shower: always available (cleans poop anytime), 5s cooldown
  const handleShowerClick = () => {
    if (isShowering || showerCooldown) return;
    setIsShowering(true);
    setShowerCooldown(true);
    onShower?.();
    playShower();
    showHug('bath');
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
    /* WP1.12 — a tonalidade escolhida no modo demo. Entra AQUI, junto do
       resto do filtro, e não numa camada nova: `filter` não se acumula entre
       regras, e uma segunda declaração apagaria a aura e a piscada (é o mesmo
       erro que as duas tentativas anteriores de animar `filter` cometeram —
       ver a nota grande abaixo). Some sozinha quando não há tint. */
    const tint = demoTintFilter(demoTint);
    const comTint0 = tint ? `${base} ${tint}` : base;
    const comTint = isSleeping ? `${comTint0} brightness(.55) saturate(.6)` : comTint0;
    return isBlinking ? `${comTint} brightness(.86)` : comTint;
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
  /* C3 (navegação do dono, 01/10/2026): o pet não fica mais numa "caixa de
     gradiente" (o céu do ciclo diurno). Sem cenário equipado, a área do pet
     pinta o cenário PADRÃO — `bg-room`, o Quarto grátis que todo save já
     possui (`utils/shop.ts`). Só a PINTURA muda: a decoração continua lendo o
     `equippedBackground` real (`PetStageDecor`), então nenhuma regra de
     mobília × cenário muda por baixo. */
  const cenarioId = equippedBackground && PET_BACKGROUNDS[equippedBackground]
    ? equippedBackground
    : DEFAULT_PET_BACKGROUND;
  const cenario = PET_BACKGROUNDS[cenarioId]?.css;
  /** Cor atrás da arte no visor — só cenário pintado declara (ver backgrounds.ts). */
  const cenarioBase = PET_BACKGROUNDS[cenarioId]?.baseColor;

  /* WP3.1 — o contexto do chat, montado AQUI porque é aqui que os números já
     existem. Duas cautelas, e as duas vêm do contrato do servidor
     (`sanitizeChatContext`): ele descarta o bloco INTEIRO se qualquer valor
     não for inteiro finito ou sair da faixa — então (a) chave ausente não
     entra como `undefined`, ela simplesmente não entra, e (b) tudo é preso na
     faixa. A energia é o caso real: as barras são o requisito do estágio e
     chegam a 6, contra o teto 4 do schema — sem o clamp, um mega derrubaria
     todo o contexto e ninguém veria erro nenhum. */
  const chatContext = (() => {
    const faixa = (n: number, min: number, max: number) => Math.min(Math.max(Math.round(n), min), max);
    const ctx: Record<string, number> = {};
    if (typeof healthPoints === 'number') ctx.hp = faixa(healthPoints, 0, 4);
    if (typeof energyPoints === 'number') ctx.energy = faixa(energyPoints, 0, 4);
    if (typeof bondLevel === 'number') ctx.bond = faixa(bondLevel, 1, 31);
    if (typeof daysAway === 'number') ctx.daysAway = faixa(daysAway, 0, 3);
    if (typeof moodToday === 'number') ctx.moodToday = faixa(moodToday - 1, 0, 4);
    return ctx;
  })();

  const chatDock = (
    <div className="sm-chat-fixed sm3-dock">
      <ChatBox
        petName={currentStage}
        mood={companionMood}
        evolutionStage={evolutionStage}
        dominantBranch={dominantBranch}
        useAI={useAI}
        onSendMessage={handleChatMessage}
        aiSettings={aiSettings}
        onCreateActivity={onCreateActivity}
        chatContext={chatContext}
        language={language}
      />
    </div>
  );

  return (
    <div className="relative sm-pet-sticky sm3-home-sticky">
      {/* ── O CORPO DO APARELHO = A PÁGINA (canvas Home, D-H1 / SIS-01) ─────
          Até 16/09/2026 o palco vivia num card com borda de cobre
          (`.sm2-device`, 16px de bisel + foto atrás) e a barra DOM de
          HP/energia (`HomeHud compact`) sentava em cima dele — o jogador lia
          o mesmo número duas vezes (achado 1 do canvas). Agora: só o ANEL
          (`Viewport`, 4px de cobre) + o VIDRO; nome e deck sobre `--sm2-bg`,
          que é o corpo. A leitura de HP/energia mora no vidro, em pixel
          (`VisorBar` sobre a placa de D-H3), uma vez só. */}
      <div className="relative">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="sm2-home-pet">
        {/* A janela do palco: ancora os CONTROLES que ficam por cima da tela
            (evoluir, balão, alvo do carinho) e é a caixa que dá a largura
            medida para a escala inteira do visor. */}
        <div className="sm2-device-stage sm3-cena" ref={stageRef}>
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
          className="sm3-cena-viewport"
          breathing={false}
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
        {/* A leitura de HP/EN saiu do vidro (a placa pixel `VisorBar`) e foi
            para o canto inferior ESQUERDO da faixa, em vetor (`.sm3-stats`,
            fora do `role="img"`), como no mock aprovado da abordagem B. */}
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
            /* X2: a criatura desce sob o balão (22 / 40px), nunca fica embaixo
               dele. `transform` para não reflow; a transição é o token. */
            transform: stageDrop ? `translateY(${stageDrop}px)` : undefined,
            transition: 'transform var(--sm2-dur-tap) var(--sm2-ease)',
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
              {/* L1 (QA rodada 2): `#2dd4bf` sobre branco/70 dava ~1,6:1. O
                  flash é sobre o VIDRO (escuro nos dois temas), então a tinta
                  é a do visor e o véu é o próprio fundo do visor pulsando. */}
              <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--sm2-viewport-bg)', opacity: .7 }} />
              <span className="relative font-bold drop-shadow-lg text-center" style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--sm2-viewport-ink)', textShadow: '0 0 12px var(--sm2-viewport-ink)' }}>
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

          {/* O VÉU DA NOITE (mock `dormindo`): escurece a cena INTEIRA — sobe
              além do topo da composição para cobrir o céu da faixa — e fica
              ANTES do grupo do pet no DOM: o Z do sono pinta aceso por cima
              dele, e quem escurece o pet e o berço é o filtro deles. */}
          {isSleeping && (
            <div
              aria-hidden="true"
              data-sleep-veil
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: -400, pointerEvents: 'none', background: 'rgba(4, 10, 24, .55)' }}
            />
          )}

          {/* Soulmon Sprite - Centered with walking animation.
              O GRUPO do pet cresce `CENA_ZOOM` (abordagem B, "pet grande") com
              origem na linha de baixo do sprite: os pés ficam no chão e a
              decoração, fora deste grupo, não se mexe. */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            data-pet-group
            style={{
              transform: `scale(${CENA_ZOOM})`,
              transformOrigin: `50% ${STAGE_HEIGHT - PET_BOTTOM_IN_STAGE}px`,
            }}
          >
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
                {/* Coração quadro a quadro (entrega 4): nasce → cresce → cheio → faíscas,
                    UMA vez, enquanto o wrapper irradia. Antes eram 3 PNGs estáticos. */}
                {/* 2× (célula 64 → 128 CSS, D-H4) e ACIMA da cabeça (X8) — o
                    wrapper irradia a partir do topo do sprite, não do rosto. */}
                <SpriteAnim sheet={ANIM_ART.heartBurst} size={Math.round(h.size * 32)} durationMs={640} style={{ marginTop: -PET_RENDER / 2 }} />
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
                  <img src={balloonKind === 'bath' ? UI_ICON_ART.banho : FX_ART['🤗']} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'inline-block', verticalAlign: 'middle' }} />
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
            {/* Migalhas (entrega 4): a comida sobe, as migalhas caem — uma vez por mordida. */}
            {eatingEmoji && (
              <SpriteAnim
                key={`crumbs-${eatKey}`}
                sheet={ANIM_ART.eatCrumbs}
                size={36}
                durationMs={600}
                style={{ position: 'absolute', left: `${position}%`, top: 'calc(50% + 34px)', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}
              />
            )}


            {/* H8 (02/10/2026): o BERÇO/ninho saiu de vez (pedido do dono) — o Soulmon
                pousa direto no cenário. `BASE_SLOTS.nest` e `nestArt.ts` seguem
                no repo só como contrato de arte; nada aqui os desenha. */}

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
              {/* WP3.6 — a SOMBRA DE CONTATO.
                  Convergência de cinco apps do gênero, e ausente aqui: sem
                  ela o sprite FLUTUA sobre o cenário em vez de pousar nele —
                  o pet e o fundo lêem como duas imagens sobrepostas por
                  acaso. É uma elipse borrada, ancorada nos PÉS (a mesma linha
                  de chão de `petStage.ts`), sem animação: nada a cortar em
                  movimento reduzido. `pointerEvents: none` porque o gesto de
                  esfregar é do sprite, não dela. */}
              <span
                aria-hidden="true"
                className="sm2-pet-shadow"
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: PET_GROUND_KEEP + PET_LIFT,
                  transform: 'translateX(-50%)',
                  width: Math.round(PET_RENDER * 0.52),
                  height: Math.round(PET_RENDER * 0.12),
                  pointerEvents: 'none',
                }}
              />
              {/* 🧭 PASSEANDO (30/09/2026). A mochila ao pé do pet diz, sem
                  palavra, que hoje ele sai para a região escolhida no Passeio.
                  `pointerEvents: none`: nunca rouba o toque de comer, banho,
                  dormir ou carinho. Sem animação, sem som (R-NOVA). O nome vai
                  só para o leitor de tela. */}
              {walkingTo && (
                <span
                  role="img"
                  data-pet-passeando
                  aria-label={language === 'pt-BR' ? `Saiu para passear: ${walkingTo}` : `Out on a stroll to ${walkingTo}`}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${Math.round(PET_RENDER * 0.22)}px)`,
                    bottom: PET_GROUND_KEEP + PET_LIFT + Math.round(PET_RENDER * 0.28), // nas COSTAS do pet: anda e vira com ele, e nunca cai sobre os botões de ação, que moram no chão
                    lineHeight: 0,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  {/* Arte da rodada 3 (32², 30/09/2026) no lugar do emoji 🎒 —
                      desenhada a 1× (20 px é o tamanho que o emoji ocupava). */}
                  <img src={UI_ICON_ART.mochila} alt="" aria-hidden="true" draggable={false} width={20} height={20} style={{ display: 'block', imageRendering: 'pixelated' }} />
                </span>
              )}
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
                  /* WP3.2 — o OLHAR. Enquanto houver tarefa assombrada na
                     lista, o sprite se inclina para ela (`sm-pet-haunted`,
                     index.css). É o "o pet olha" que o CLAUDE.md prometia e
                     que não existia em lugar nenhum deste arquivo. É gesto,
                     não cobrança: nenhum texto acompanha, nada fica vermelho
                     e a inclinação some sozinha quando a pilha esvazia. */
                  className={`object-contain sm-visor-swap${hauntedWatching ? ' sm-pet-haunted' : ''}${petIsTarget ? ' sm3-pet-alvo' : ''}`}
                  key={sprite}
                  onError={() => { if (ownSpriteUrl && sprite === ownSpriteUrl) setSpriteQuebrado(ownSpriteUrl); }}
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
                        animation: `shower-drop 1.1s linear ${i * 0.12}s infinite`,
                      }}
                    >
                      <img src={FX_ART['💧']} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated', opacity: 1 }} />
                    </span>
                  ))}
                  <span
                    className="absolute text-xl"
                    style={{ left: '50%', top: '-26px', transform: 'translateX(-50%)' }}
                  >
                    <img src={FX_ART['🚿']} alt="" width={26} height={26} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  </span>
                  {/* Respingo nos pés (entrega 4), em loop enquanto o banho dura. */}
                  <SpriteAnim
                    sheet={ANIM_ART.showerSplash}
                    size={40}
                    durationMs={520}
                    loop
                    style={{ position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)' }}
                  />
                </div>
              )}
            </div>

            {/* O Z do sono mora DENTRO do grupo do pet: cresce e anda com ele.
                Quadro a quadro (entrega 4), acima e à direita da cabeça (X8). O
                `sleep-z` é teal escuro e some sobre `bg-room` — sobre cenário
                escuro (`isDarkBackground`) entra a folha clara `sleepZLight`. */}
            {isSleeping && (
                <SpriteAnim
                  sheet={isDarkBackground(cenarioId) ? ANIM_ART.sleepZLight : ANIM_ART.sleepZ}
                  size={FX_PX / 2}
                  durationMs={1800}
                  loop
                  /* Célula 64 a 1× DENTRO do grupo, que amplia `CENA_ZOOM`:
                     acima e à direita da cabeça (X8), nunca sobre o rosto. */
                  style={{ position: 'absolute', left: `calc(${position}% + 28px)`, top: `calc(50% + ${PET_TOP_OFFSET + PET_GROUND_KEEP + 16 - FX_PX / 2}px)` }}
                />
            )}
          </div>


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
          ref={rubBtnRef}
          className={`sm2-rub${healthPoints < maxHealthPoints ? ' sm2-rub-heal' : ''}`}
          data-pet-target
          aria-label={language === 'pt-BR'
            ? 'Fazer carinho no Soulmon (segure para curar)'
            : 'Pet your Soulmon (hold to heal)'}
          /* BRINCAR virou gesto sobre o pet (minimal-ui F2: "brincar e carinho
             seguem no gesto sobre o pet"): toque DUPLO no pet, ou a tecla P com
             o foco nele. A regra é a mesma de antes (`handleDeckPlay` →
             `play.onPlay`, que é o `handlePlay` do App); recusa é fala. */
          aria-keyshortcuts="P"
          style={{
            /* O grupo do pet cresce `CENA_ZOOM` a partir do centro e da linha
               dos pés — o alvo acompanha, derivado, nunca digitado. */
            left: `calc(50% + ${walkPx * CENA_ZOOM}px)`,
            bottom: PET_BOTTOM_IN_STAGE + RING_PX,
            width: PET_RENDER * CENA_ZOOM,
            height: PET_RENDER * CENA_ZOOM,
            transform: 'translateX(-50%)',
          }}
          onClick={() => { if (rubMovedRef.current) { rubMovedRef.current = false; return; } handlePetClick(); }}
          onDoubleClick={handleDeckPlay}
          onKeyDown={(e) => {
            if (e.key === 'p' || e.key === 'P') { e.preventDefault(); handleDeckPlay(); return; }
            handleRubKeyDown(e);
          }}
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
        {/* Faísca (entrega 4) sobre o pet enquanto a evolução está pronta — o
            sinal DENTRO do visor; o botão abaixo é o aparelho. */}
        {canEvolve && !isSleeping && (
          <SpriteAnim
            sheet={ANIM_ART.sparklePop}
            size={FX_PX}
            durationMs={900}
            loop
            /* 2× (D-H4), acima e à ESQUERDA da cabeça (X8): nunca sobre o rosto. */
            style={{ position: 'absolute', zIndex: 25, left: `calc(${50 + (position - 50) * CENA_ZOOM}% - 104px)`, top: 8 + stageDrop, pointerEvents: 'none' }}
          />
        )}
        {/* "EVOLVE" fala a língua do vidro (canvas Home, X3): UMA palavra em
            Silkscreen 14 caixa alta, dentro da moldura pixel do `hudArt`
            (`frame-pipe-vine-96` a ½×, slice 24 → 12px) sobre a placa de D-H3,
            alvo 44, no canto inferior direito do vidro — o LCD fala em LCD.
            Continua FORA do `Viewport` (`role="img"` engole botão) e ancorado
            no RODAPÉ (`bottom`), em ponta oposta ao balão (topo): as duas
            faixas não se cruzam por construção (`CompanionHUD.cta.test`).
            Sem "into X": o botão não diz a forma. */}
        {canEvolve && !isSleeping && (
          /* B3 (02/10/2026): CENTRALIZADO no ALTO da área do pet, com
             acabamento próprio (`EvolveButton`: moldura pixel dupla + brilho
             pulsante; arte do dono opcional em `assets/icons/evoluir-btn.png`).
             O balão de fala desce abaixo dele quando os dois existem (ver
             `bubbleTop`) — as faixas continuam sem se cruzar por construção. */
          <EvolveButton
            language={language === 'pt-BR' ? 'pt-BR' : 'en-US'}
            onClick={onEvolveRequest}
            reducedMotion={reducedMotion}
            style={{ position: 'absolute', zIndex: 30, left: '50%', top: BUBBLE_GAP, transform: 'translateX(-50%)' }}
          />
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
              top: bubbleTop,
              zIndex: 45,
              padding: '0 10px',
              /* A faixa é só posicionamento — ela cobre a largura inteira do
                 palco e não pode interceptar toque nenhum. Quem recebe clique
                 é a caixa de fala, logo abaixo. */
              pointerEvents: 'none',
            }}
          >
            <div
              ref={bubbleRef}
              data-pet-bubble
              className="relative pointer-events-auto"
              onClick={handleBubbleClick}
              style={{
                cursor: 'pointer',
                /* Overlay de HUD, não card (canvas Home, D-H5 / R6): SEM
                   borda (era `--sm2-line` a 1,3:1 sobre o vidro — invisível),
                   `--sm2-surface` sólida, raio `md`, padding 6/12, entrelinha
                   1,3 → 1 linha = 36px, 2 linhas = 54px (é isso que decide
                   quanto a criatura desce, X2). Sem `backdrop-filter`: blur
                   sobre fundo animado recompõe a região a cada frame. */
                background: 'var(--sm2-surface)',
                borderRadius: 'var(--sm2-radius-md)',
                padding: '6px 12px',
                boxShadow: SM2_SHADOW_CARD,
              }}
            >
              <p
                className="text-center break-words"
                style={{
                  margin: 0,
                  fontFamily: 'var(--sm2-font-text)',
                  fontSize: 'var(--sm2-text-sm)',
                  lineHeight: 1.3,
                  color: 'var(--sm2-ink)',
                }}
              >
                {bubbleText}
              </p>
              {/* Rabinho apontando para BAIXO, na direção do pet. */}
              <span
                className="absolute"
                style={{
                  bottom: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid var(--sm2-surface)',
                }}
              />
            </div>
          </div>
        )}

        {/* O "+1" do mock: sobe do pet quando o App ACEITOU a comida (vem por
            `feedAnim`, então recusa não pinta nada). Decorativo — a fala e o
            HP/EN já dizem o resultado em texto. */}
        {plusOne > 0 && (
          <span key={`mais-${plusOne}`} className="sm3-mais" aria-hidden="true">+1</span>
        )}

        {/* ── HP / EN — canto inferior ESQUERDO da faixa (abordagem B) ─────────
            Vetor, fora do `role="img"`: glifo autoral (`favorite`/`bolt`, 20)
            + número tabular. Sobre a CENA, que é escura nos dois temas — por
            isso os tons `viewport*`. O estado BAIXO (HP ≤ 1 ou energia 0) muda
            a TINTA do número e ganha a palavra no nome acessível; o aviso em
            texto continua sendo o da fila da Home (HP), nunca um segundo
            cartão aqui (filaDeAvisos). */}
        {(() => {
          const isPt = language === 'pt-BR';
          const fmt = (n: number) => (isPt ? String(n).replace('.', ',') : String(n));
          const hpBaixo = healthPoints <= 1;
          const enBaixo = energyPoints <= 0;
          return (
            <>
            <div className="sm3-stats" data-cena-stats>
              {/* C13 (01/10/2026): coração e energia são BOTÕES — o toque abre
                  uma dica curta de como sobe e como desce (`home/statTips.ts`,
                  números lidos das constantes das regras). */}
              <button
                type="button"
                className="sm3-stat"
                data-stat="hp"
                data-low={hpBaixo || undefined}
                aria-expanded={statAberto === 'hp'}
                aria-controls="sm3-stat-tip"
                onClick={() => setStatAberto(v => (v === 'hp' ? null : 'hp'))}
                aria-label={isPt
                  ? `Corações: ${fmt(healthPoints)} de ${maxHealthPoints}${hpBaixo ? ' (baixo)' : ''}`
                  : `Hearts: ${fmt(healthPoints)} of ${maxHealthPoints}${hpBaixo ? ' (low)' : ''}`}
              >
                <PixelIcon name="hp" size={20} />
                <span className="sm2-num" aria-hidden="true">{fmt(healthPoints)}/{maxHealthPoints}</span>
              </button>
              <button
                type="button"
                className="sm3-stat"
                data-stat="energy"
                data-low={enBaixo || undefined}
                aria-expanded={statAberto === 'energy'}
                aria-controls="sm3-stat-tip"
                onClick={() => setStatAberto(v => (v === 'energy' ? null : 'energy'))}
                aria-label={isPt
                  ? `Energia: ${energyPoints} de ${maxEnergy}${enBaixo ? ' (vazia)' : ''}`
                  : `Energy: ${energyPoints} of ${maxEnergy}${enBaixo ? ' (empty)' : ''}`}
              >
                <PixelIcon name="energia" size={20} />
                <span className="sm2-num" aria-hidden="true">{energyPoints}/{maxEnergy}</span>
              </button>
            </div>
            {statAberto && (() => {
              const tip = statTip(statAberto, isPt);
              return (
                <div
                  id="sm3-stat-tip"
                  role="tooltip"
                  className="sm3-stat-tip"
                  data-stat-tip={statAberto}
                  onClick={() => setStatAberto(null)}
                >
                  <p className="sm3-stat-tip-title">{tip.title}</p>
                  <p><b>{tip.upLabel}</b> {tip.up}</p>
                  <p><b>{tip.downLabel}</b> {tip.down}</p>
                </div>
              );
            })()}
            </>
          );
        })()}

        {/* ── OS TRÊS CUIDADOS — canto inferior DIREITO (abordagem B) ─────────
            Mochila · lua/sol (dormir) · banho. EXCEÇÃO D1 do dono (23/09/2026):
            estes três podem ter anel/fundo — é a única caixa em volta de ícone
            na Home. Ícone em pixel art do squad de arte (`itens`/`dormir`/`banho`,
            `assets/soulmon/icones-ui`), 24 (degrau `action`), alvo de 44 no botão.
            Carinho e brincar NÃO têm botão: são gesto sobre o pet.

            CÉLULA INERTE continua sendo `aria-disabled` + forma (tracejado),
            nunca opacidade: o banho em cooldown. */}
        <div
          className="sm3-cuidar"
          role="group"
          aria-label={language === 'pt-BR' ? 'Cuidar do pet' : 'Care for your pet'}
        >
          <button
            type="button"
            className="sm3-cuidado"
            data-cuidado="mochila"
            onClick={openMochila}
            aria-haspopup="dialog"
            aria-expanded={mochilaOpen}
            aria-label={language === 'pt-BR'
              ? (hasNewItems ? 'Mochila — item novo' : 'Mochila')
              : (hasNewItems ? 'Backpack — new item' : 'Backpack')}
          >
            {hasNewItems && <span className="sm2-deck-dot" aria-hidden="true" />}
            {/* 07/10/2026 (pedido do dono): o glifo vetorial `backpack` saiu — a MOCHILA é a arte pixel aprovada na rodada 3 (`UI_ICON_ART.mochila`), a mesma linguagem do dormir e do banho ao lado. */}
            <PixelIcon name="mochila" size={24} />
          </button>
          <button
            type="button"
            className="sm3-cuidado"
            data-cuidado="dormir"
            data-on={isSleeping || undefined}
            onClick={onSleep}
            aria-pressed={isSleeping}
            aria-label={language === 'pt-BR'
              ? (isSleeping ? 'Acordar' : 'Dormir')
              : (isSleeping ? 'Wake' : 'Sleep')}
          >
            {/* Dormindo, o botão vira "Acordar": o sol da rodada 3 (30/09/2026)
                substituiu o glifo `wb_sunny` que esperava a arte. */}
            {isSleeping
              ? <PixelIcon name="acordar" size={24} />
              : <PixelIcon name="dormir" size={24} />}
          </button>
          <button
            type="button"
            className={showerCooldown ? 'sm3-cuidado sm3-cuidado-inerte' : 'sm3-cuidado'}
            data-cuidado="banho"
            onClick={showerCooldown ? undefined : handleShowerClick}
            aria-disabled={showerCooldown || undefined}
            aria-label={language === 'pt-BR'
              ? (showerCooldown ? 'Banho — só um instante' : 'Banho')
              : (showerCooldown ? 'Bath — just a moment' : 'Bath')}
          >
            <PixelIcon name="banho" size={24} />
          </button>
        </div>
        </div>

        {/* WP3.3 — era NOME + TÍTULO DO VÍNCULO. B1 (02/10/2026): o nome foi
            para o header da Home (`HomeHud`, junto do logo) e o título
            ("Companheiro"…) saiu da Home; aqui sobra só a marca da volta. */}
        {redeemedMark && (
          <div className="sm2-home-nameline sm3-nameline">
            {/* WP4.19 — a marca da VOLTA. Lê como prestígio e nunca como queda.
                Aparece só se o jogador ligou (padrão desligado). */}
            {redeemedMark && (
              <p className="sm2-home-petsub" style={{ color: 'var(--sm2-gold-ink)' }}>
                {language === 'pt-BR' ? '✦ Voltou inteiro' : '✦ Came back whole'}
              </p>
            )}
          </div>
        )}
        </div>
      </div>

      </div>

      {/* A MOCHILA (minimal-ui F2). Portal para o `<body>` pelo mesmo motivo da
          folha de Alimentar que ela substitui: nascida dentro do
          `.sm-pet-sticky` (z 5) ela ficaria presa sob o dock de chat. Sem
          `document` (SSR) fica onde está. */}
      {(() => {
        const folha = (
          <Mochila
            open={mochilaOpen}
            onClose={() => { setMochilaOpen(false); setPetIsTarget(false); }}
            foodInventory={foodInventory}
            materials={materials}
            onGoToBuilding={onGoToBuilding}
            demo={demoMode}
            language={language}
            onUse={handleUseItem}
            petTargetRef={rubBtnRef}
            onTargetChange={setPetIsTarget}
            petName={petDisplayName || currentStage}
          />
        );
        return typeof document !== 'undefined' ? createPortal(folha, document.body) : folha;
      })()}

      {/* Chat Box — o TERMINAL fixo no rodapé (minimal-ui F2: sempre aberto,
          `>` + `_` piscando). Continua dentro do `<main>`: modais (irmãos do
          `<main>`, z maior) seguem por cima dele. O ponto de montagem é o
          ÚLTIMO filho do `<main>` — ver a nota de ORDEM DE FOCO lá em cima. */}
      {chatHost ? createPortal(chatDock, chatHost) : chatDock}
    </div>
  );
});
