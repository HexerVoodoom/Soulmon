/**
 * EVOLUÇÃO — a árvore, e a criatura como heroína dela.
 * ===================================================
 *
 * REVAMP. Três coisas mudaram de APRESENTAÇÃO (nenhuma regra mudou):
 *
 * 1. **A criatura abre a tela**, dentro do `<Viewport>` — o elemento de marca —
 *    em escala inteira, e a ação dominante da página (o CADEADO de evolução)
 *    mora logo abaixo dela, como um botão de verdade com 44px. O cadeado
 *    continua também no nó ATUAL do grafo, que é o gesto que a regra descreve
 *    ("tocar na criatura atual alterna `evolutionLocked`"); o botão é o mesmo
 *    estado, dito em palavras, para quem não descobre o gesto.
 *
 * 2. **O progresso virou PALAVRA.** Era `3/7 dias` numa barra. Agora é
 *    "Faltam 4 dias perfeitos" / "Pronto para evoluir" — a frase que responde à
 *    única pergunta que o jogador faz nesta tela. A barra ficou como apoio
 *    visual, não como o portador do dado.
 *
 * 3. **Os atributos tinham DOIS desenhos na mesma tela** (PNG pixel-art no
 *    "alinhamento atual" e SVG inline no seletor de galho — o achado do
 *    inventário, `docs/PLANO-DESIGN.md` §4.3). Unificado no SVG inline de
 *    `AlignmentIcons`: é arte nossa, é vetor e RECOLORE, que é justamente o
 *    que o PNG não fazia quando o botão ativo pinta o fundo com a cor do
 *    atributo.
 *
 * PRESERVADO integralmente: a árvore por galho, o tronco rookie compartilhado,
 * o Ultra atrás dos 3 megas, o cadeado `evolutionLocked`, a degeneração com
 * dupla confirmação, o spoiler-guard das formas futuras, o galho previsto e o
 * desempate por ritmo de cuidado, e a situação de cada nó dita em PALAVRAS no
 * `aria-label` (WCAG 1.4.1: cor e posição nunca são o único portador).
 */
import { useState, useMemo, useEffect, useRef, type CSSProperties } from 'react';
import { SoulNode, type SoulNodeVisual } from './evolution/SoulNode';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { getSpriteForStage } from '../utils/sprites';
import { canManualRetry, cardState, displaySprite, emptySpriteLibrary, type SpriteCardState, type SpriteLibrary } from '../utils/spriteLibrary';
import { spriteFailText, spriteText } from '../utils/spriteCopy';
import { pointsToEvolve } from '../utils/spriteTrigger';
import { creatureFormId, type CreatureStage, type LText } from '../utils/oracle';
import { AVAILABLE_BRANCHES, clampBranch } from '../types/progression';
import { ALIGN_TO_ATTR, ATTR_COLOR, ATTR_INK, ATTR_LABEL, ATTR_ON_FILL_INK } from '../types/attributes';
/* A varredura de 400 ms mudou de casa: o dono dela é o dono do visor
   (`ui/Viewport.tsx`), porque a spec pede a MESMA sintonia em dois call-sites
   — esta página e o visor da Home (`CompanionHUD`). Hook duplicado com um
   número que tem gêmeo no CSS é como os dois lados divergem em silêncio. */
import { Viewport, usePrefersReducedMotion, useVarreduraDeSintonia } from './ui/Viewport';
/* `useIsOnline` já é o dono da leitura de rede neste app (o selo "SEM SINAL").
   O card `OFFLINE` da spec (§2.2) precisa da MESMA resposta — um segundo
   `navigator.onLine` aqui seria a cópia do footgun 9 na sua forma mais boba. */
import { useIsOnline } from './ui/OfflineSeal';
import { Icon } from './ui/Icon';
import { playVisorTune } from '../utils/sounds';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';

type Attr = 'virus' | 'data' | 'vaccine';
// ALIGN_TO_ATTR mudou para types/attributes.ts quando o EvoTrail da Home
// passou a precisar do mesmo mapa (footgun 9: cópia diverge em silêncio).
const ATTR_ORDER: Attr[] = ['virus', 'data', 'vaccine'];

/**
 * UM jogo de ícone de atributo, e só um. Antes eram dois na mesma tela (PNG
 * pixel-art + SVG inline). Ganhou o SVG: ele herda a cor, então serve tanto
 * sobre superfície neutra (tinta do atributo) quanto sobre o preenchimento do
 * botão ativo (tinta escura por cima do fill) — um PNG ciano/cobre sobre
 * verde/azul/laranja simplesmente não tinha como ficar legível.
 * O RÓTULO não é duplicado aqui: vem de `types/attributes.ts`.
 */
const ATTR_GLYPH: Record<Attr, typeof PowerIcon> = { virus: PowerIcon, data: HarmonyIcon, vaccine: BenevolenceIcon };

interface EvolutionPathProps {
  /** Id da forma atual ('rookie' | 'champion-virus' | ... | 'ultra'). */
  currentStageId: string;
  currentBranch: Attr;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  onDegenerate?: (targetStageId: string) => void;
  /** As 11 formas ÚNICAS do jogador (utils/oracle.ts). */
  stages: CreatureStage[];
  /** Linha de sprite genérica (fallback visual — ver utils/sprites.ts). */
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  /** Modo demo (utils/monetization.ts): personagem pré-pronto escolhido — sobrepõe eggType no sprite. */
  demoCharacterId?: string;
  unlockedEvolutions?: string[];
  /** Evolution padlock: tapping the CURRENT Soulmon toggles it. */
  evolutionLocked?: boolean;
  onToggleEvolutionLock?: () => void;
  language?: 'pt-BR' | 'en-US';
  /** Ritmo de cuidado — desempata o galho quando os atributos empatam. */
  carePattern?: { emoji: string; namePt: string; nameEn: string } | null;
  /** Galho que a próxima evolução vai seguir, já resolvido. */
  forecastBranch?: Attr;
  /** Acervo de sprites gerados (`utils/spriteLibrary.ts`). Ausente = tudo na
   *  arte de reserva, que é o piso e nunca é erro. */
  spriteLibrary?: SpriteLibrary;
  /** "Sintonizar o Visor" — a adoção do sprite próprio é gesto do JOGADOR. */
  onTuneVisor?: (formId: string) => void;
  /** "Voltar ao traço antigo" — devolve a reserva sem apagar o sprite pago. */
  onRevertVisor?: (formId: string) => void;
  /** O jogador chegou a ver o selo `NOVO` desta forma (X-3). */
  onSeenTune?: (formId: string) => void;
  /** "Tentar de novo" da forma atual. Ausente = o botao nao aparece. */
  onRetrySprite?: (formId: string) => void;
  /**
   * Formas com lote VIVO agora (`useSpriteGeneration().generating`). É o que
   * torna o card `GERANDO` (§2.2) alcançável: sem esta prop ele existia na
   * copy e em `cardState` e não aparecia em runtime — o mesmo defeito X-3 que
   * o selo `NOVO` teve.
   *
   * **202 do servidor não chega aqui como falha**: `spriteRunner` trata
   * `pending` como "outro aparelho está desenhando", sem gravar falha nenhuma
   * — então a forma continua em `RESERVA`, nunca em erro (Invariante nº 1).
   */
  generatingSprites?: readonly string[];
}

const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(4, 18, 20, .10), 0 4px 12px rgba(4, 18, 20, .10)',
  padding: 16,
};

/**
 * O ANUNCIO da sintonia — visivel so para leitor de tela.
 *
 * Nao ha classe utilitaria para isto no projeto (`index.css` e pre-compilado;
 * classe que nao existe la nao aplica nada — footgun 1), e abrir regra nova no
 * fim do arquivo e justamente o que a sentinela de movimento reduzido proibe.
 * Entao a caixa vem inline, que e a saida que o proprio footgun 1 recomenda.
 *
 * Nao usa `display:none` nem `visibility:hidden`: os dois TIRAM o no da arvore
 * de acessibilidade, e um `aria-live` fora da arvore nunca anuncia nada — e a
 * forma mais comum de um anuncio "existir" no DOM e nao existir no ouvido.
 */
const soParaLeitor: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const sectionLabel: CSSProperties = {
  ...sm2Hint,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
};

/** O sprite dentro do visor: escala inteira, sem suavização. */
const spriteInScreen: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  imageRendering: 'pixelated',
};

export function EvolutionPath({
  currentStageId,
  currentBranch,
  virusPoints,
  dataPoints,
  vaccinePoints,
  digivolutionSegments,
  digivolutionSegmentsNeeded,
  onDegenerate,
  stages,
  demoCharacterId,
  unlockedEvolutions = [],
  evolutionLocked = false,
  onToggleEvolutionLock,
  language = 'en-US',
  carePattern,
  forecastBranch,
  spriteLibrary,
  onTuneVisor,
  onRevertVisor,
  onSeenTune,
  onRetrySprite,
  generatingSprites,
}: EvolutionPathProps) {
  const isPt = language === 'pt-BR';
  // Empate = mais de um atributo no topo. É quando o ritmo de cuidado decide.
  const topAttr = Math.max(virusPoints, dataPoints, vaccinePoints);
  const isTie = topAttr > 0
    && [virusPoints, dataPoints, vaccinePoints].filter(v => v === topAttr).length > 1;
  const L = (t: LText) => (isPt ? t.pt : t.en);
  const unlockedSet = useMemo(() => new Set(unlockedEvolutions), [unlockedEvolutions]);
  const [selectedBranch, setSelectedBranch] = useState<Attr>(clampBranch(currentBranch));
  const [confirmDegenerate, setConfirmDegenerate] = useState<{ id: string; name: string; isSecondConfirm: boolean } | null>(null);
  // Locked evolutions are hidden behind a "?" (spoiler guard). The user can
  // reveal one (shown darkened) after confirming; this local set resets when
  // they leave the screen (the component unmounts on navigation).
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [confirmReveal, setConfirmReveal] = useState<CreatureStage | null>(null);

  const handleRevealConfirm = () => {
    if (confirmReveal) setRevealed(prev => new Set(prev).add(creatureFormId(confirmReveal)));
    setConfirmReveal(null);
  };

  const rookie = stages.find(s => s.stage === 'rookie');
  const ultra = stages.find(s => s.stage === 'ultra');
  const getBranchPath = (branch: Attr): CreatureStage[] =>
    stages.filter(s => s.branch && ALIGN_TO_ATTR[s.branch] === branch);

  const megaIds = ATTR_ORDER.map(a => `mega-${a}`);
  const areAllMegasUnlocked = megaIds.every(id => unlockedSet.has(id));

  const branchPath = getBranchPath(selectedBranch);
  const branchHex = ATTR_COLOR[selectedBranch];

  const formaAtual = stages.find(s => creatureFormId(s) === currentStageId);

  /**
   * A criatura ATUAL: sprite PRÓPRIO só quando ele já foi adotado. Enquanto o
   * jogador não sintoniza (ou depois de ele voltar ao traço antigo),
   * `displaySprite` devolve `null` e a arte de reserva assume — que é o piso do
   * Invariante nº 1, e nunca um erro.
   */
  const acervo = spriteLibrary ?? emptySpriteLibrary();
  const spriteAtual = displaySprite(acervo, currentStageId)?.url
    ?? getSpriteForStage(currentStageId, demoCharacterId);
  // A sintonia: o fade de 120ms vive na classe do `<img>`; a varredura de
  // 400ms precisa de um elemento próprio, que só existe enquanto ela passa.
  const movimentoReduzido = usePrefersReducedMotion();
  const varrendoSintonia = useVarreduraDeSintonia(spriteAtual, movimentoReduzido);

  /* ── O CHIADO CURTO da sintonia (spec §2.3.1) ────────────────────────────
     O terceiro terço da sintonia, ao lado da varredura de 400 ms e do fade de
     120 ms. A spec dizia que "a ocasião A já usa" este som; não usava — não
     existia som de sintonia nenhum no projeto. É a 10ª divergência doc↔código,
     registrada por extenso no JSDoc de `playVisorTune` (`utils/sounds.ts`).

     **Preso ao `varrendoSintonia`, e não à troca de `spriteAtual`.** Não é
     economia de linha: é o que ATA o som à imagem. `useVarreduraDeSintonia` já
     concentra as três regras da sintonia (só na troca, nunca na montagem; uma
     vez só; e nada sob movimento reduzido). Um segundo gatilho lendo o sprite
     por conta própria seria uma quarta cópia dessas regras, divergindo em
     silêncio (footgun 9) — e a primeira coisa a divergir seria justamente o
     caso de acessibilidade abaixo.

     **Movimento reduzido silencia o chiado — de propósito.** A WCAG 2.3.3 é
     sobre movimento, não sobre som, e nada na norma obriga a cortar áudio
     aqui. A decisão é de coerência diegética: este som não é um aviso, é o
     RUÍDO DO APARELHO sintonizando — a trilha sonora da faixa que atravessa a
     tela. Sob `prefers-reduced-motion` a faixa não chega a nascer, e um chiado
     sem a varredura correspondente vira um barulho órfão, sem nada na tela que
     o explique: o usuário que pediu menos movimento receberia MAIS ruído
     inexplicado, não menos. O outro caminho — tocar sempre, argumentando que
     som não é movimento — só faria sentido se o chiado carregasse informação
     que a imagem não carrega. Não carrega: o anúncio para leitor de tela
     ('Visor sintonizado', logo abaixo) é quem faz esse trabalho, e ele
     continua de pé nos dois casos. Nada de acessibilidade se perde no corte.

     O mudo (`STORAGE_KEYS.SOUND_MUTED`) é o outro gate, e mora no `play()` do
     `sounds.ts` — aqui não se pergunta por ele. */
  useEffect(() => {
    if (varrendoSintonia) playVisorTune();
  }, [varrendoSintonia]);
  // "Iminente" é contra `required` (4/5/5/6) — o número que os dois portões de
  // evolução manual leem — e NÃO contra `daysToEvolve`, que sobrevive só como
  // rótulo da barra desta página (`spec-geracao-incremental.md` §3.1).
  /* O lote vivo e a rede: os dois eram LITERAIS aqui (`[]` e `true`), e por
     isso `GERANDO` e `OFFLINE` — que existem na copy e em `cardState` desde o
     começo — nunca podiam aparecer. Nenhum estado novo foi inventado; o que
     faltava era a entrada verdadeira. */
  const gerando = generatingSprites ?? [];
  const online = useIsOnline();
  const estadoAtual = cardState(acervo, currentStageId, {
    generating: gerando,
    imminent: pointsToEvolve(currentStageId, digivolutionSegments) <= 1,
    reachable: true,
    online,
    // X-3: o selo `NOVO` existia na copy e em `cardState`, mas era INALCANÇÁVEL
    // em runtime — ninguém passava `unseen`, e nada no save marcava "visto".
    unseen: acervo.tunedUnseen.includes(currentStageId),
  });

  /**
   * O ANÚNCIO DA SINTONIA (§6, literal): "ao concluir, um `aria-live="polite"`
   * único anuncia 'Visor sintonizado' / 'Visor tuned'. (…) troca sem palavra
   * nenhuma é exatamente o que o X4 derrubou."
   *
   * **Por que o gatilho é a TRANSIÇÃO DE ESTADO, e não a troca do sprite.** A
   * varredura pode acompanhar qualquer troca de sprite — inclusive uma
   * evolução, em que o bicho vira outro bicho. Uma faixa de luz ali continua
   * lendo bem; a frase "Visor sintonizado" seria uma MENTIRA. `A_SINTONIZAR →
   * adotado` é o único caminho que o ato de sintonizar produz, e este
   * componente já o calcula — nenhum dono de estado novo foi inventado.
   *
   * Vale para os DOIS caminhos que a spec cita: o clique em "Sintonizar o
   * Visor" e a adoção automática do prazo, que chega aqui pelo mesmo estado.
   *
   * O anúncio nasce da conclusão OBSERVADA: abrir a página com a forma já
   * adotada não anuncia nada. Anúncio em toda montagem vira ruído ambiental, e
   * leitor de tela que vira ruído para de ser ouvido.
   */
  const estadoAnterior = useRef<SpriteCardState | null>(null);
  const [sintonizouAgora, setSintonizouAgora] = useState(false);
  useEffect(() => {
    const adotado = (e: SpriteCardState | null) => e === 'PROPRIO' || e === 'NOVO';
    const antes = estadoAnterior.current;
    estadoAnterior.current = estadoAtual;
    if (antes === 'A_SINTONIZAR' && adotado(estadoAtual)) setSintonizouAgora(true);
    // Sair da adoção (voltar ao traço antigo, ou um sprite novo chegando) apaga
    // a frase: `aria-live` só reanuncia quando o conteúdo MUDA, e uma frase que
    // nunca sai do DOM anunciaria uma vez e ficaria muda para sempre depois.
    else if (!adotado(estadoAtual)) setSintonizouAgora(false);
  }, [estadoAtual]);

  /* Ver o card É ter visto. A marca sai do save aqui, e não num toque: o
     achado é sobre quem NÃO age — exigir um clique para limpar deixaria o selo
     acumulado para sempre em quem só passa os olhos. */
  useEffect(() => {
    if (estadoAtual === 'NOVO') onSeenTune?.(currentStageId);
  }, [estadoAtual, currentStageId, onSeenTune]);


  /**
   * A FALHA DE CREDENCIAL (401 / 403), que ate 84209ded chegava aqui como
   * `error` generico e saia da tela como NADA: arte de reserva e silencio.
   *
   * **Por que isto NAO virou estado novo de `SpriteCardState`.** O enum
   * responde a uma pergunta so — em que estado esta a ARTE desta forma — e a
   * ordem das perguntas em `cardState` e a regra que faz o terminal calar o
   * "estou gerando". Credencial nao e um estado da arte: a arte esta em
   * RESERVA, exatamente como esta quando o lote simplesmente ainda nao rodou.
   * Um `CREDENCIAL_*` teria de ser inserido nessa ordem e, onde entrasse,
   * apagaria informacao verdadeira — antes de `RESERVA_VESPERA` engoliria a
   * vespera (que e quem promove o "Tentar de novo" a botao de texto real);
   * depois dela, nunca apareceria na vespera, que e justamente quando o
   * jogador mais precisa saber por que o traco nao veio. E seriam DOIS
   * estados que se comportam como RESERVA em todo o resto.
   *
   * O MOTIVO e um eixo ORTOGONAL ao estado, e `spriteFailText` ja o modela
   * assim: devolve `null` para tudo que ja tem card proprio ou que nao pede
   * gesto nenhum. Aqui ele so precisava de superficie.
   *
   * O portao e `RESERVA`/`RESERVA_VESPERA` de proposito: fora deles a falha
   * gravada esta VELHA (o sprite chegou, ou o teto fechou a forma) e repetir
   * "entre de novo" seria mentir em cima de um card que ja diz outra coisa.
   * E nenhum dos dois e terminal — a frase do RESERVA_FINAL nao entra aqui.
   */
  const avisoCredencial = (() => {
    if (estadoAtual !== 'RESERVA' && estadoAtual !== 'RESERVA_VESPERA') return null;
    const falha = acervo.failures[currentStageId];
    return falha ? spriteFailText(falha.kind, language) : null;
  })();
  // O botao vale para 401 e 403 (nenhum e terminal), mas continua obedecendo
  // cooldown e teto manual: quem decide e `canManualRetry`, nao esta tela.
  const podeRetentar = avisoCredencial != null && canManualRetry(acervo, currentStageId);

  /**
   * O nó que a página JÁ dizia em texto ("Seguindo para Harmonia"), agora
   * marcado também no grafo. Reapresentação: `forecastBranch` vem pronto de
   * quem chama; aqui só se acha o primeiro nó ainda não alcançado do galho
   * previsto — e só quando o galho exibido É o previsto.
   */
  const forecastStageId = forecastBranch && selectedBranch === forecastBranch
    ? (branchPath
        .map(s => creatureFormId(s))
        .find(id => id !== currentStageId && !unlockedSet.has(id)) ?? null)
    : null;

  const handleDegenerateClick = (evolution: CreatureStage) => {
    setConfirmDegenerate({ id: creatureFormId(evolution), name: evolution.name, isSecondConfirm: false });
  };

  const handleDegenerateConfirm = () => {
    if (confirmDegenerate?.isSecondConfirm) {
      onDegenerate?.(confirmDegenerate.id);
      setConfirmDegenerate(null);
    } else {
      setConfirmDegenerate({ ...confirmDegenerate!, isSecondConfirm: true });
    }
  };

  // ── O progresso, em PALAVRAS. `Math.max(0, …)` porque `perfectDays` pode
  //    passar do requisito enquanto a evolução está travada — e "faltam -2"
  //    seria um jeito criativo de dizer "pronto". ──
  const faltam = Math.max(0, digivolutionSegmentsNeeded - digivolutionSegments);
  const prontoParaEvoluir = faltam === 0;
  const ratio = digivolutionSegmentsNeeded > 0
    ? Math.min(1, digivolutionSegments / digivolutionSegmentsNeeded)
    : 1;
  const fraseProgresso = prontoParaEvoluir
    ? (evolutionLocked
        ? (isPt ? 'Pronto para evoluir — mas você segurou a evolução.' : 'Ready to evolve — but you are holding it back.')
        : (isPt ? 'Pronto para evoluir na virada do dia.' : 'Ready to evolve at the day’s turn.'))
    : (isPt
        ? `Falta${faltam === 1 ? '' : 'm'} ${faltam} dia${faltam === 1 ? '' : 's'} perfeito${faltam === 1 ? '' : 's'}.`
        : `${faltam} perfect day${faltam === 1 ? '' : 's'} to go.`);

  /* ── O ESTADO DA ARTE, forma por forma (§2.2) ──────────────────────────────
     Até aqui a página dizia o estado do sprite só da forma ATUAL. A spec põe o
     estado em CADA card da árvore — é a superfície onde "quem meu bicho vai
     ser" já mora, e a única que fala de falha (o visor não tem estado de erro,
     §2.1).

     `reachable` é a pergunta "esta forma já teve OCASIÃO?", e ela é literal:
     tem sprite, tem falha gravada, está gerando agora, é a atual ou é a
     próxima prevista. Sem isso, toda forma futura viraria `RESERVA` com um
     "Tentar de novo" ao lado — e a UI estaria oferecendo gerar a árvore
     inteira com um toque, que é exatamente a decisão do dono (geração
     incremental) revertida pela tela (§2.2, `DISTANTE` sem botão). */
  const teveOcasiao = (stageId: string, isCurrent: boolean, isForecast: boolean) =>
    isCurrent || isForecast
    || Boolean(acervo.sprites[stageId]) || Boolean(acervo.failures[stageId])
    || gerando.includes(stageId);

  const estadoDoNo = (stageId: string, isCurrent: boolean, isForecast: boolean): SpriteCardState =>
    cardState(acervo, stageId, {
      generating: gerando,
      /* A véspera promove o "Tentar de novo" a botão de texto real, e só na
         forma ATUAL e na próxima prevista — nas outras não há urgência a
         comunicar. Contra `required` (`pointsToEvolve`), nunca contra o
         `digivolutionSegmentsNeeded` desta página, que é rótulo de barra
         (`daysToEvolve`) e dispararia num limiar que o jogo nunca alcança
         antes de já ter evoluído (§3.1). */
      imminent: (isCurrent || isForecast) && pointsToEvolve(currentStageId, digivolutionSegments) <= 1,
      reachable: teveOcasiao(stageId, isCurrent, isForecast),
      online,
      unseen: acervo.tunedUnseen.includes(stageId),
    });

  const estadoTexto: CSSProperties = { ...sm2Hint, margin: '4px 0 0' };

  /* Os 3 pontos do `GERANDO`, FORA da moldura do nó (§2.2) e quadrados, não
     bolinhas — a regra do marcador de novidade deste projeto. Sob movimento
     reduzido eles ficam estáticos (§6), e a animação reusa o `@keyframes pulse`
     que o `index.css` já tem: nenhuma regra nova de CSS (footgun 1). */
  const pontosPulsando = (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 4, marginLeft: 6, verticalAlign: 'middle' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: 2,
            backgroundColor: 'var(--sm2-muted)',
            animation: movimentoReduzido ? undefined : `pulse 1.4s ${i * 0.18}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );

  /**
   * A linha de estado de um nó. `null` é a resposta da maioria — `PROPRIO` não
   * diz nada, porque um card que anuncia normalidade é ruído.
   *
   * O "Tentar de novo" nasce de `canManualRetry` (teto de 3 por forma, cooldown
   * de 60 s, terminais), nunca de "o card está em reserva": botão que sempre
   * falha é pior que botão ausente.
   */
  const linhaDeEstado = (stageId: string, estado: SpriteCardState, hidden: boolean) => {
    // O spoiler-guard esconde o NOME e a ARTE, não o fato de o Oráculo estar
    // trabalhando — a posição do nó já está na tela, então uma frase de estado
    // não entrega nada a mais. A exceção é `DISTANTE`: "Ainda não revelado"
    // embaixo de um card que já diz "???" e "BLOQUEADA" é a mesma coisa dita
    // três vezes.
    if (hidden && estado === 'DISTANTE') return null;
    /* "Tentar de novo" pede DUAS coisas, e a segunda é a que faltava: que algo
       tenha sido TENTADO. `canManualRetry` responde `true` para uma forma
       virgem (não há falha, não há teto, não há cooldown correndo) — e um
       botão de retentativa numa forma que nunca partiu não é retentativa, é o
       "gerar a árvore num toque" que o §2.2 proíbe. */
    const podeRetentarNó = Boolean(onRetrySprite)
      && Boolean(acervo.failures[stageId])
      && canManualRetry(acervo, stageId);
    const testid = `sm-estado-${stageId}`;
    switch (estado) {
      case 'PROPRIO':
        return null;
      case 'NOVO':
        return <p style={estadoTexto} data-testid={testid}>{spriteText('new', language)}</p>;
      case 'A_SINTONIZAR':
        // O BOTÃO mora num lugar só — o card da forma atual, logo abaixo do
        // visor. Aqui é só o mesmo recado, no nó a que ele pertence.
        return <p style={estadoTexto} data-testid={testid}>{spriteText('tuneReady', language)}</p>;
      case 'GERANDO':
        return (
          <p style={estadoTexto} data-testid={testid}>
            {spriteText('drawing', language)}
            {pontosPulsando}
          </p>
        );
      case 'OFFLINE':
        return <p style={estadoTexto} data-testid={testid}>{spriteText('offline', language)}</p>;
      case 'DISTANTE':
        return <p style={estadoTexto} data-testid={testid}>{spriteText('locked', language)}</p>;
      case 'RESERVA_FINAL':
        // Sem botão, de propósito, e o texto diz POR QUÊ: 402/409 indistinguível
        // de escolha de arte é o pagante não saber que falhou (X1).
        return <p style={estadoTexto} data-testid={testid} role="status">{spriteText('final', language)}</p>;
      case 'RESERVA_VESPERA':
        // Sem falha gravada, "ficou com o traço antigo" seria MENTIRA: nada
        // ficou, o lote ainda nem partiu. Card mudo é a resposta certa —
        // reserva não é erro, é o piso (Invariante nº 1).
        if (!acervo.failures[stageId]) return null;
        return (
          <div data-testid={testid}>
            <p style={estadoTexto}>{spriteText('kept', language)}</p>
            {podeRetentarNó && (
              <button
                type="button"
                onClick={() => onRetrySprite?.(stageId)}
                style={{ ...sm2Button('ghost'), marginTop: 8, minHeight: 44, minWidth: 200 }}
              >
                {spriteText('retry', language)}
              </button>
            )}
          </div>
        );
      case 'RESERVA':
        // Link DISCRETO (§2.2) — mas com 44 px de alvo real, que é o que o §6
        // cobra "mesmo sendo link de texto".
        return podeRetentarNó ? (
          <button
            type="button"
            data-testid={testid}
            onClick={() => onRetrySprite?.(stageId)}
            style={{
              ...sm2Hint,
              display: 'inline-flex', alignItems: 'center',
              background: 'none', border: 'none', padding: '0 8px',
              minHeight: 44, textDecoration: 'underline', cursor: 'pointer',
              color: 'var(--sm2-primary-ink)',
            }}
          >
            {spriteText('retry', language)}
          </button>
        ) : null;
    }
  };

  /**
   * Um nó do grafo: coluna vertical de nós ligados por uma linha.
   *
   * NÃO existe regra nova aqui — `isCurrent`, `isReached`, `hidden`,
   * `isPreviousStage` e o galho previsto são exatamente os mesmos cálculos que
   * a página já fazia; o que mudou é a superfície da placa (kit pixel → tokens).
   */
  const renderEvolutionCard = (evolution: CreatureStage, hex: string, index: number, pathLength: number) => {
    const stageId = creatureFormId(evolution);
    const isCurrent = stageId === currentStageId;
    const isUltra = evolution.stage === 'ultra';
    const isUltraMode = isUltra && !areAllMegasUnlocked;
    const isRevealed = revealed.has(stageId);
    // "Reached" (shown) = the current form, an already-unlocked form, the
    // shared rookie trunk, or — for Ultra — once all 3 megas are unlocked.
    // Everything else is a spoiler-hidden future form.
    const isReached =
      isCurrent
      || unlockedSet.has(stageId)
      || evolution.stage === 'rookie'
      || (isUltra && areAllMegasUnlocked);
    const hidden = !isReached && !isRevealed;
    // A stage the pet already passed through, on the branch it's CURRENTLY
    // on — offer to degenerate back to it.
    const isPreviousStage = isReached && !isCurrent && evolution.stage !== 'rookie' && evolution.branch
      ? ALIGN_TO_ATTR[evolution.branch] === currentBranch
      : false;

    const isForecast = !isReached && stageId === forecastStageId;
    const visual: SoulNodeVisual = isCurrent
      ? 'current'
      : isReached ? 'reached'
      : isForecast ? 'forecast'
      : 'locked';

    // Situação em PALAVRAS: a cor e a posição do nó não podem ser o único
    // portador da informação (WCAG 1.4.1).
    const situacao = isCurrent
      ? (isPt ? 'forma atual' : 'current form')
      : isReached ? (isPt ? 'já alcançada' : 'already reached')
      : isForecast ? (isPt ? 'próxima prevista, ainda bloqueada' : 'next forecast, still locked')
      : (isPt ? 'bloqueada' : 'locked');
    const nome = hidden ? (isPt ? 'Evolução oculta' : 'Hidden evolution') : evolution.name;
    const nodeLabel = hidden
      ? `${nome} — ${situacao}. ${isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)'}`
      : isCurrent && onToggleEvolutionLock
        ? `${nome} — ${situacao}. ${evolutionLocked
            ? (isPt ? 'Evolução travada, toque para destravar' : 'Evolution locked, tap to unlock')
            : (isPt ? 'Evolução destravada, toque para travar' : 'Evolution unlocked, tap to lock')}`
        : `${nome} — ${situacao}`;

    /** A etiqueta de estado do nó. Uma palavra, caixa alta, nunca uma cor só. */
    const tag = (texto: string, style: CSSProperties) => (
      <span
        style={{
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-xs)',
          fontWeight: 500,
          letterSpacing: '.04em',
          padding: '2px 8px',
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          ...style,
        }}
      >
        {texto}
      </span>
    );

    return (
      <div key={stageId} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Trilho do grafo: o nó e a linha que desce até o próximo. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <SoulNode
            visual={visual}
            size={48}
            tone={isReached && !isCurrent ? hex : undefined}
            ring={isCurrent}
            /* O sprite PRÓPRIO desta forma quando ele já existe e já foi
               adotado; senão a arte de reserva, que é o piso e nunca é erro
               (Invariante nº 1). `displaySprite` é quem sabe a diferença —
               nada de reperguntar `sprites[...]` aqui. */
            sprite={hidden
              ? undefined
              : (displaySprite(acervo, stageId)?.url
                 ?? getSpriteForStage(stageId, isCurrent ? demoCharacterId : undefined))}
            label={nodeLabel}
            title={hidden
              ? (isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)')
              : isCurrent && onToggleEvolutionLock
                ? (evolutionLocked ? (isPt ? 'Destravar evolução' : 'Unlock evolution') : (isPt ? 'Travar evolução' : 'Lock evolution'))
                : nome}
            onClick={hidden
              ? () => setConfirmReveal(evolution)
              : isCurrent && onToggleEvolutionLock ? onToggleEvolutionLock : undefined}
          />
          {index < pathLength - 1 && (
            <span
              aria-hidden="true"
              style={{
                width: 2,
                flex: 1,
                minHeight: 28,
                backgroundColor: isReached ? hex : 'var(--sm2-line)',
              }}
            />
          )}
        </div>

        {/* Placa do nó: nome, estágio e situação. */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: index < pathLength - 1 ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3
              style={{
                fontFamily: 'var(--sm2-font-display)',
                fontSize: 'var(--sm2-text-md)',
                fontWeight: 600,
                lineHeight: 'var(--sm2-leading-title)',
                color: isReached ? 'var(--sm2-ink)' : 'var(--sm2-muted)',
                margin: 0,
              }}
            >
              {hidden ? '???' : evolution.name}
            </h3>
            {!hidden && <span style={sm2Hint}>{L(evolution.stageName)}</span>}
            {isCurrent && tag(isPt ? 'ATUAL' : 'CURRENT', { backgroundColor: hex, color: ATTR_ON_FILL_INK })}
            {isForecast && tag(isPt ? 'PREVISTA' : 'FORECAST', {
              border: '1px solid var(--sm2-primary-ink)', color: 'var(--sm2-primary-ink)',
            })}
            {isCurrent && evolutionLocked && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', fontWeight: 500,
                  padding: '2px 8px', borderRadius: 999,
                  backgroundColor: 'var(--sm2-gold-fill)', color: 'var(--sm2-on-gold)',
                }}
              >
                <Icon name="lock" size={20} style={{ fontSize: 14, width: 14, height: 14 }} />
                {isPt ? 'TRAVADA' : 'LOCKED'}
              </span>
            )}
            {isUltraMode && tag(isPt ? 'ZÊNITE' : 'ZENITH', {
              backgroundColor: 'var(--sm2-gold-fill)', color: 'var(--sm2-on-gold)',
            })}
            {!isReached && tag(isPt ? 'BLOQUEADA' : 'LOCKED', {
              border: '1px solid var(--sm2-line)', color: 'var(--sm2-muted)',
            })}
          </div>
          {/* O estado da ARTE desta forma (§2.2). */}
          {linhaDeEstado(stageId, estadoDoNo(stageId, isCurrent, isForecast), hidden)}
          {isPreviousStage && (
            <button
              type="button"
              onClick={() => handleDegenerateClick(evolution)}
              style={{ ...sm2Button('quiet'), marginTop: 4, padding: '10px 0' }}
            >
              {isPt ? 'Degenerar' : 'Degenerate'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>

      {/* Degeneração — dupla confirmação preservada, agora com foco preso e
          Escape (o modal antigo não tinha nenhum dos dois). */}
      <ModalSheet
        open={!!confirmDegenerate}
        onClose={() => setConfirmDegenerate(null)}
        language={language}
        title={confirmDegenerate?.isSecondConfirm
          ? (isPt ? 'Aviso final' : 'Final warning')
          : (isPt ? 'Confirmar degeneração' : 'Confirm degeneration')}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setConfirmDegenerate(null)} style={{ ...sm2Button('ghost'), flex: 1 }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDegenerateConfirm}
              style={{
                ...sm2Button('primary'),
                flex: 1,
                ...(confirmDegenerate?.isSecondConfirm
                  ? { backgroundColor: 'var(--sm2-danger-fill)', color: 'var(--sm2-on-danger)' }
                  : null),
              }}
            >
              {confirmDegenerate?.isSecondConfirm
                ? (isPt ? 'Sim, degenerar' : 'Yes, degenerate')
                : (isPt ? 'Confirmar' : 'Confirm')}
            </button>
          </div>
        }
      >
        <p style={sm2Text}>
          {confirmDegenerate?.isSecondConfirm
            ? (isPt
                ? `Tem certeza absoluta que quer degenerar para ${confirmDegenerate?.name}? Essa ação NÃO pode ser desfeita.`
                : `Are you absolutely sure you want to degenerate to ${confirmDegenerate?.name}? This action CANNOT be undone.`)
            : (isPt
                ? `Quer degenerar para ${confirmDegenerate?.name}? Você vai perder o progresso além deste estágio.`
                : `Do you want to degenerate to ${confirmDegenerate?.name}? You will lose all progress beyond this stage.`)}
        </p>
      </ModalSheet>

      {/* Spoiler-guard das formas futuras. */}
      <ModalSheet
        open={!!confirmReveal}
        onClose={() => setConfirmReveal(null)}
        language={language}
        title={isPt ? 'Revelar essa evolução?' : 'Reveal this evolution?'}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setConfirmReveal(null)} style={{ ...sm2Button('ghost'), flex: 1 }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="button" onClick={handleRevealConfirm} style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Sim, revelar' : 'Yes, reveal'}
            </button>
          </div>
        }
      >
        <p style={sm2Text}>
          {isPt
            ? 'Essa é uma evolução futura que você ainda não desbloqueou — espiar é spoiler. Ela vai aparecer escurecida e esconder de novo quando você sair dessa tela.'
            : "This is a future evolution you haven't unlocked yet — peeking is a spoiler. It'll show up darkened, and hide again once you leave this screen."}
        </p>
      </ModalSheet>

      {/* ─────────── A HEROÍNA + A AÇÃO DOMINANTE ─────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Viewport
          width={64}
          height={64}
          scale={3}
          label={formaAtual
            ? (isPt ? `${formaAtual.name}, forma atual` : `${formaAtual.name}, current form`)
            : (isPt ? 'Seu Soulmon' : 'Your Soulmon')}
          screenStyle={{ position: 'relative' }}
        >
          <img
            src={spriteAtual}
            alt=""
            style={spriteInScreen}
            /* Fade de 120 ms na troca reserva→próprio: reusa o token de
               movimento que já existe (`--sm2-dur-tap`), e ele já respeita
               `prefers-reduced-motion` no `index.css`. */
            className="sm-visor-swap"
            key={spriteAtual}
          />
          {/* A varredura de 400 ms que acompanha o fade — o par que a spec
              chama de "sintonia" (§2.1 e §2.3.1). Irmã do
              `.sm2-viewport-glass`: `position:absolute` recortada pela tela e
              `pointer-events:none`, para não roubar o gesto de esfregar o pet.
              `key` no sprite para a animação recomeçar do zero a cada troca. */}
          {varrendoSintonia && (
            <div className="sm-visor-scan" aria-hidden="true" key={`scan-${spriteAtual}`} />
          )}
        </Viewport>

        {/* UM anúncio (§6), e num lugar só. Fica logo depois do visor porque é
            o visor que sintonizou, e a ordem de foco do §6 começa pela forma
            atual — a região não é focável e não desloca nada. */}
        {sintonizouAgora && (
          <p style={soParaLeitor} aria-live="polite" data-testid="sm-tune-anuncio">
            {spriteText('tuned', language)}
          </p>
        )}

        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <p
            style={{
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-lg)',
              fontWeight: 600,
              lineHeight: 'var(--sm2-leading-title)',
              color: 'var(--sm2-ink)',
              margin: 0,
            }}
          >
            {fraseProgresso}
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={digivolutionSegmentsNeeded}
            aria-valuenow={Math.min(digivolutionSegments, digivolutionSegmentsNeeded)}
            aria-label={isPt ? 'Progresso até a próxima evolução' : 'Progress to the next evolution'}
            style={{
              margin: '12px auto 0', width: 200, height: 8, borderRadius: 999,
              backgroundColor: 'var(--sm2-surface-2)', overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(ratio * 100)}%`, height: '100%',
                backgroundColor: 'var(--sm2-primary-fill)',
                transition: 'width var(--sm2-dur-enter) var(--sm2-ease)',
              }}
            />
          </div>
        </div>

        {/* A ÚNICA ação da tela. O gesto no nó do grafo continua valendo — este
            botão é o mesmo estado dito em palavras, e com alvo de 44px. */}
        {onToggleEvolutionLock && (
          <button
            type="button"
            onClick={onToggleEvolutionLock}
            aria-pressed={evolutionLocked}
            style={{
              ...sm2Button(evolutionLocked ? 'primary' : 'ghost'),
              minWidth: 220,
            }}
          >
            <Icon name={evolutionLocked ? 'lock' : 'lock_open'} size={20} fill={evolutionLocked ? 1 : 0} />
            {evolutionLocked
              ? (isPt ? 'Evolução segurada' : 'Evolution on hold')
              : (isPt ? 'Segurar evolução' : 'Hold evolution')}
          </button>
        )}
        <p style={{ ...sm2Hint, textAlign: 'center', maxWidth: 340 }}>
          {evolutionLocked
            ? (isPt
                ? 'Os dias perfeitos continuam somando. Ele só espera você dizer quando.'
                : 'Perfect days keep adding up. It just waits for your go-ahead.')
            : (isPt
                ? 'Ele vai evoluir sozinho assim que o dia virar.'
                : 'It will evolve on its own at the next day’s turn.')}
        </p>

        {/* ── A SINTONIA (spec §2.3.1) ──────────────────────────────────────
            A criatura ATUAL é o único objeto do jogo cuja troca sempre teve
            ritual, então quem troca o rosto dela é o JOGADOR. O controle mora
            aqui, no card da forma atual — nenhum modal, nenhum push, nenhum
            toast: o Invariante nº 2 continua valendo e isto nunca interrompe o
            jogo. Os dois botões têm 44px de alvo real e **não** recebem foco
            automático: são alcançáveis, nunca impostos. */}
        {estadoAtual === 'A_SINTONIZAR' && onTuneVisor && (
          <div
            style={{ ...card, width: '100%', maxWidth: 380, textAlign: 'center' }}
            data-testid="sm-tune-card"
          >
            <p style={{ ...sm2Text, margin: 0 }}>{spriteText('tuneReady', language)}</p>
            <button
              type="button"
              onClick={() => onTuneVisor(currentStageId)}
              style={{ ...sm2Button('primary'), marginTop: 12, minHeight: 44, minWidth: 220 }}
            >
              {spriteText('tune', language)}
            </button>
            {/* A troca deixa de ser silenciosa porque é ANUNCIADA ANTES. */}
            <p style={{ ...sm2Hint, marginTop: 8 }}>{spriteText('tuneAuto', language)}</p>
          </div>
        )}

        {/* ── RESERVA-FINAL (§2.2) ─────────────────────────────────────────
            O teto desta forma acabou (409 `form-cap`) ou o da conta inteira
            (402 `lifetime-cap`). **Sem botão**, e o texto diz por quê: um
            "Tentar de novo" aqui é um botão que sempre falha, e um card mudo
            deixa o pagante achando que a arte de reserva foi escolha de
            estilo (X1 — Nielsen 1 e 9).

            É a única superfície da forma ATUAL que fala de teto; a de credencial
            (401/403) fica logo abaixo e NUNCA se sobrepõe a esta, porque
            `avisoCredencial` só existe em `RESERVA`/`RESERVA_VESPERA`. */}
        {estadoAtual === 'RESERVA_FINAL' && (
          <div
            style={{ ...card, width: '100%', maxWidth: 380, textAlign: 'center' }}
            role="status"
            data-testid="sm-sprite-final"
          >
            <p style={{ ...sm2Text, margin: 0 }}>{spriteText('final', language)}</p>
          </div>
        )}

        {/* ── A FALHA DE CREDENCIAL ─────────────────────────────
            A SITUACAO EM PALAVRAS, e so em palavras: nao ha cor, icone nem
            posicao carregando o recado sozinho (WCAG 1.4.1). `role="status"`
            porque a frase pode NASCER com a pagina aberta — e um estado, nao
            um alerta, e nao rouba foco de ninguem.

            O texto NAO diz "ficou com a arte de reserva para sempre": esta e a
            frase do RESERVA_FINAL e aqui ela seria mentira — o teto nao foi
            atingido, quem falhou foi a credencial, e o traco ainda pode vir. */}
        {avisoCredencial && (
          <div
            style={{ ...card, width: '100%', maxWidth: 380, textAlign: 'center' }}
            role="status"
            data-testid="sm-sprite-credencial"
          >
            <p style={{ ...sm2Text, margin: 0 }}>{avisoCredencial}</p>
            {podeRetentar && onRetrySprite && (
              <button
                type="button"
                onClick={() => onRetrySprite(currentStageId)}
                style={{ ...sm2Button('ghost'), marginTop: 12, minHeight: 44, minWidth: 220 }}
              >
                {spriteText('retry', language)}
              </button>
            )}
          </div>
        )}

        {/* Desfazer: o sprite próprio fica no save e pode ser sintonizado de
            novo a qualquer momento — re-sintonizar NÃO chama geração, logo não
            toca teto nenhum. Trocar o rosto do bicho sem saída é a versão
            educada do mesmo erro. */}
        {/* X-3: o aviso de que o Visor sintonizou SOZINHO. Quem nunca abre esta
            aba acordava com o rosto do bicho trocado sem nada dizendo nada. */}
        {estadoAtual === 'NOVO' && (
          <p
            style={{ ...sm2Hint, margin: 0, fontWeight: 700, letterSpacing: '0.08em' }}
            data-testid="sm-tuned-badge"
          >
            {spriteText('new', language)} · {spriteText('tuned', language)}
          </p>
        )}

        {(estadoAtual === 'PROPRIO' || estadoAtual === 'NOVO') && onRevertVisor && (
          <button
            type="button"
            onClick={() => onRevertVisor(currentStageId)}
            style={{ ...sm2Button('ghost'), minHeight: 44, minWidth: 220 }}
          >
            {spriteText('revert', language)}
          </button>
        )}
        {acervo.reverted.includes(currentStageId) && onTuneVisor && (
          <button
            type="button"
            onClick={() => onTuneVisor(currentStageId)}
            style={{ ...sm2Button('ghost'), minHeight: 44, minWidth: 220 }}
          >
            {spriteText('tune', language)}
          </button>
        )}
      </section>

      {/* ─────────── Para onde ele está indo ─────────── */}
      <section style={card}>
        <p style={sectionLabel}>{isPt ? 'Para onde ele está indo' : 'Where they are heading'}</p>

        {/* A FRASE vem antes dos números: é ela que responde à pergunta. */}
        {forecastBranch ? (
          <p style={{ ...sm2Text, marginTop: 6 }}>
            {isPt ? 'Seguindo para ' : 'Heading toward '}
            <strong style={{ color: ATTR_INK[forecastBranch] }}>{L(ATTR_LABEL[forecastBranch])}</strong>
            {isTie
              ? (carePattern
                  ? (isPt
                      ? ` — empate nos atributos, e o seu ritmo ${carePattern.namePt} desempata.`
                      : ` — attributes are tied, and your ${carePattern.nameEn} rhythm breaks it.`)
                  : (isPt
                      ? ' — empate nos atributos; cumprir mais tarefas de uma categoria decide.'
                      : ' — attributes are tied; completing more tasks of one category decides.'))
              : (isPt
                  ? '. Muda cumprindo mais tarefas de outra categoria.'
                  : '. Change it by completing more tasks of another category.')}
          </p>
        ) : (
          <p style={{ ...sm2Text, marginTop: 6 }}>
            {isPt
              ? 'Ainda não dá para dizer. Conclua tarefas e o galho aparece aqui.'
              : 'Too early to tell. Finish tasks and the branch shows up here.'}
          </p>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
          {ATTR_ORDER.map(a => {
            const Glyph = ATTR_GLYPH[a];
            const valor = a === 'virus' ? virusPoints : a === 'data' ? dataPoints : vaccinePoints;
            return (
              <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph size={18} color={ATTR_COLOR[a]} strokeWidth={2.2} />
                <span style={sm2Hint}>{L(ATTR_LABEL[a])}</span>
                <span className="sm2-num" style={{ ...sm2Text, fontWeight: 500, color: ATTR_INK[a] }}>{valor}</span>
              </span>
            );
          })}
        </div>
      </section>

      {/* ─────────── A árvore ─────────── */}
      <section>
        <p style={{ ...sectionLabel, marginBottom: 10 }}>
          {isPt ? 'Linhas de evolução' : 'Evolution branches'}
        </p>

        {/* UM anúncio por LOTE, no container (§6) — nunca um por card, senão um
            empate triplo dispararia três anúncios. Os pontos de cada nó são
            `aria-hidden`: quem fala é esta região. */}
        <p style={soParaLeitor} aria-live="polite" data-testid="sm-gerando-anuncio">
          {gerando.length > 0 ? spriteText('drawing', language) : ''}
        </p>

        {/* O empate, dito onde os cards estão (§2.2): "Seu ritmo ainda pode
            decidir." Nenhum dos líderes é destacado como "o provável" —
            destacar seria mentir sobre uma disputa que está aberta. */}
        {isTie && (
          <p style={{ ...sm2Text, marginBottom: 10 }} data-testid="sm-sprite-empate">
            {spriteText('tie', language)}
          </p>
        )}

        {/* Seletor de galho — só os branches disponíveis (transição de arte). */}
        <div role="radiogroup" aria-label={isPt ? 'Linha de evolução' : 'Evolution branch'} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(AVAILABLE_BRANCHES as readonly Attr[]).map(b => {
            const hex = ATTR_COLOR[b];
            const active = selectedBranch === b;
            const Glyph = ATTR_GLYPH[b];
            return (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedBranch(b)}
                style={{
                  ...sm2Button(active ? 'primary' : 'ghost'),
                  flex: 1,
                  padding: '10px 8px',
                  // Branco sobre os três preenchimentos media 2,4–3,1:1 (medido);
                  // a tinta escura mede 5,4–7,0:1.
                  ...(active
                    ? { backgroundColor: hex, color: ATTR_ON_FILL_INK, borderColor: hex }
                    : { color: ATTR_INK[b] }),
                }}
              >
                <Glyph size={18} color={active ? ATTR_ON_FILL_INK : hex} strokeWidth={2.2} />
                {L(ATTR_LABEL[b])}
              </button>
            );
          })}
        </div>

        {branchPath.length === 0 && !ultra ? (
          // Sem a árvore do oráculo (save antigo ou incompleto) não há o que
          // desenhar. Antes ficava só um vazio enorme abaixo dos botões, e a
          // tela parecia quebrada.
          <div style={{ ...card, textAlign: 'center' }}>
            {/* `pets` e não `account_tree`: o inventário da fonte subsetada tem
                102 nomes e `account_tree` não está nele — nome fora do
                inventário renderiza VAZIO e não dá erro (tokens.md §5). */}
            <Icon name="pets" size={48} tone="muted" />
            <p style={{ ...sm2Text, fontWeight: 500, marginTop: 8 }}>
              {isPt ? 'Sua árvore ainda não foi revelada' : 'Your tree hasn’t been revealed yet'}
            </p>
            <p style={{ ...sm2Hint, marginTop: 6 }}>
              {isPt
                ? 'Cuide do seu Soulmon e conclua as tarefas do dia — as próximas formas aparecem aqui conforme ele evolui.'
                : 'Care for your Soulmon and finish today’s tasks — the next forms show up here as it evolves.'}
            </p>
          </div>
        ) : (
          (() => {
            // Uma coluna só: tronco (rookie) → galho escolhido → ultra.
            const total = (rookie ? 1 : 0) + branchPath.length + (ultra ? 1 : 0);
            let i = 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rookie && renderEvolutionCard(rookie, 'var(--sm2-primary-fill)', i++, total)}
                {branchPath.map(evolution => renderEvolutionCard(evolution, branchHex, i++, total))}
                {ultra && renderEvolutionCard(ultra, branchHex, i++, total)}
              </div>
            );
          })()
        )}
      </section>
    </div>
  );
}
