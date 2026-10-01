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
 *    "Faltam 4 dias completos" / "Pronto para evoluir" — a frase que responde à
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
import { getSpriteForStage } from '../utils/sprites';
import { canManualRetry, cardState, displaySprite, emptySpriteLibrary, type SpriteCardState, type SpriteLibrary } from '../utils/spriteLibrary';
import { spriteFailText, spriteText } from '../utils/spriteCopy';
import { pointsToEvolve } from '../utils/spriteTrigger';
import { creatureFormId, type CreatureStage, type LText } from '../utils/oracle';
import { AVAILABLE_BRANCHES, clampBranch, canReachUltra, ULTRA_PATIENCE_DAYS } from '../types/progression';
import { ALIGN_TO_ATTR, ATTR_LABEL } from '../types/attributes';
/* A varredura de 400 ms mudou de casa: o dono dela é o dono do visor
   (`ui/Viewport.tsx`), porque a spec pede a MESMA sintonia em dois call-sites
   — esta página e o visor da Home (`CompanionHUD`). Hook duplicado com um
   número que tem gêmeo no CSS é como os dois lados divergem em silêncio. */
import { Viewport, usePrefersReducedMotion, useVarreduraDeSintonia } from './ui/Viewport';
import { auraForElement } from '../utils/attackFxArt';
import { PLACEHOLDER_ART } from '../utils/placeholderArt';
import { ANIM_ART } from '../utils/animArt';
import { HUD_ART } from '../utils/hudArt';
import { PixelSegmentedBar } from './pixel/PixelKit';
import { RitualDialog } from './ritual/RitualKit';
/* `useIsOnline` já é o dono da leitura de rede neste app (o selo "SEM SINAL").
   O card `OFFLINE` da spec (§2.2) precisa da MESMA resposta — um segundo
   `navigator.onLine` aqui seria a cópia do footgun 9 na sua forma mais boba. */
import { useIsOnline } from './ui/OfflineSeal';
import { Icon } from './ui/Icon';
import { playVisorTune } from '../utils/sounds';
import { sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';

type Attr = 'power' | 'harmony' | 'benevolence';
// ALIGN_TO_ATTR mudou para types/attributes.ts quando o EvoTrail da Home
// passou a precisar do mesmo mapa (footgun 9: cópia diverge em silêncio).
const ATTR_ORDER: Attr[] = ['power', 'harmony', 'benevolence'];

interface EvolutionPathProps {
  /** Id da forma atual ('rookie' | 'champion-power' | ... | 'ultra'). */
  currentStageId: string;
  currentBranch: Attr;
  powerPoints: number;
  harmonyPoints: number;
  benevolencePoints: number;
  perfectDays: number;
  /** WP4.29 — a forma seguinte está incubando (D-G8c). Com a barra cheia e a
   *  incubação correndo, o toque NÃO evolui: a página tem de dizer por quê,
   *  senão repete o defeito que o `MANUAL_EVOLUTION` já custou uma vez — barra
   *  cheia, nada acontece, lê como defeito. */
  incubating?: boolean;
  gateDays: number;
  onDegenerate?: (targetStageId: string) => void;
  /** As 11 formas ÚNICAS do jogador (utils/oracle.ts). */
  stages: CreatureStage[];
  /** Linha de sprite genérica (fallback visual — ver utils/sprites.ts). */
  eggType?: 'ignar' | 'lumel' | 'serah';
  /** Modo demo (utils/monetization.ts): personagem pré-pronto escolhido — sobrepõe eggType no sprite. */
  demoCharacterId?: string;
  unlockedEvolutions?: string[];
  /** Evolution padlock: tapping the CURRENT Soulmon toggles it. */
  evolutionLocked?: boolean;
  onToggleEvolutionLock?: () => void;
  /**
   * O JOGADOR dispara a evolução tocando na criatura com a barra cheia
   * (regra 🔒 do CLAUDE.md, `MANUAL_EVOLUTION`). É o mesmo `handleEvolveRequest`
   * do HUD da Home; aqui o visor da forma atual é o gesto (V2). Ausente = o
   * visor só alterna o cadeado.
   */
  onEvolveRequest?: () => void;
  language?: 'pt-BR' | 'en-US';
  /** Ritmo de cuidado — desempata o galho quando os atributos empatam. */
  carePattern?: { emoji: string; namePt: string; nameEn: string } | null;
  /** Galho que a próxima evolução vai seguir, já resolvido. */
  forecastBranch?: Attr;
  /** Acervo de sprites gerados (`utils/spriteLibrary.ts`). Ausente = tudo na
   *  arte de reserva, que é o piso e nunca é erro. */
  spriteLibrary?: SpriteLibrary;
  /** Elemento dominante do oráculo (`soulmonMeta.dominantElement`): desenha a
   *  aura elemental atrás da criatura, dentro do visor (D9, 15/09/2026 — a
   *  primeira e única chamada da arte de `fx-ataque/`). Ausente = sem aura. */
  dominantElement?: string;
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
  boxShadow: SM2_SHADOW_CARD,
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

export function EvolutionPath({
  currentStageId,
  currentBranch,
  powerPoints,
  harmonyPoints,
  benevolencePoints,
  perfectDays,
  incubating = false,
  gateDays,
  onDegenerate,
  stages,
  demoCharacterId,
  unlockedEvolutions = [],
  evolutionLocked = false,
  onToggleEvolutionLock,
  onEvolveRequest,
  language = 'en-US',
  carePattern,
  forecastBranch,
  spriteLibrary,
  dominantElement,
  onTuneVisor,
  onRevertVisor,
  onSeenTune,
  onRetrySprite,
  generatingSprites,
}: EvolutionPathProps) {
  const isPt = language === 'pt-BR';
  // Empate = mais de um atributo no topo. É quando o ritmo de cuidado decide.
  const topAttr = Math.max(powerPoints, harmonyPoints, benevolencePoints);
  const isTie = topAttr > 0
    && [powerPoints, harmonyPoints, benevolencePoints].filter(v => v === topAttr).length > 1;
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
  /* WP4.2 (decisão D6) — o Ultra deixou de exigir que o jogador machucasse a
     criatura de propósito. São DOIS caminhos agora, e o cartão tem de mostrar
     os dois: coleção (as três megas) ou permanência (`ULTRA_PATIENCE_DAYS` dias
     perfeitos como mega). A regra é de `canReachUltra`, dona da árvore — aqui
     não se decide critério nenhum. */
  const podeChegarAoUltra = canReachUltra({ unlockedEvolutions, perfectDays });

  const branchPath = getBranchPath(selectedBranch);

  const formaAtual = stages.find(s => creatureFormId(s) === currentStageId);

  /**
   * A criatura ATUAL: sprite PRÓPRIO só quando ele já foi adotado. Enquanto o
   * jogador não sintoniza (ou depois de ele voltar ao traço antigo),
   * `displaySprite` devolve `null` e a arte de reserva assume — que é o piso do
   * Invariante nº 1, e nunca um erro.
   */
  const acervo = spriteLibrary ?? emptySpriteLibrary();
  /* E2 (QA rodada 2): URL própria que falhou ao carregar (offline, cache do
     provedor fora) cai na reserva em vez de deixar o vidro quebrado. */
  const [spriteQuebrado, setSpriteQuebrado] = useState<string | null>(null);
  const spriteProprioAtual = displaySprite(acervo, currentStageId)?.url;
  const spriteAtual = (spriteProprioAtual && spriteProprioAtual !== spriteQuebrado ? spriteProprioAtual : undefined)
    ?? getSpriteForStage(currentStageId, demoCharacterId);
  const auraElemental = auraForElement(dominantElement);
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
  // evolução manual leem. Desde 06/09/2026 a BARRA desta página também: a prop
  // se chama `gateDays` e recebe o mesmo `required`. Enquanto ela era alimentada
  // por `daysToEvolve` (o campo morto que o WP4.1 apagou), "iminente" e "faltam
  // N" mediam réguas diferentes na MESMA tela — o cartão dizia que a evolução
  // estava a um dia enquanto a barra dizia que faltavam seis.
  /* O lote vivo e a rede: os dois eram LITERAIS aqui (`[]` e `true`), e por
     isso `GERANDO` e `OFFLINE` — que existem na copy e em `cardState` desde o
     começo — nunca podiam aparecer. Nenhum estado novo foi inventado; o que
     faltava era a entrada verdadeira. */
  const gerando = generatingSprites ?? [];
  const online = useIsOnline();
  const estadoAtual = cardState(acervo, currentStageId, {
    generating: gerando,
    imminent: pointsToEvolve(currentStageId, perfectDays) <= 1,
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
  const faltam = Math.max(0, gateDays - perfectDays);
  const prontoParaEvoluir = faltam === 0;
  const ratio = gateDays > 0
    ? Math.min(1, perfectDays / gateDays)
    : 1;
  const fraseProgresso = prontoParaEvoluir && incubating
    /* INCUBAÇÃO (D-G8c). Vem ANTES do cadeado porque é o estado mais recente:
       a barra encheu agora e a forma está sendo feita. As três metades que o
       parecer R-N exige estão aqui — leva um tempo · volta quando quiser ·
       nada se perde —, e sem número nem unidade de tempo (R-I). */
    ? (isPt
        ? 'A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você.'
        : 'The next form is taking shape. It takes a while — come back whenever you like, it waits for you.')
    : prontoParaEvoluir
    ? (evolutionLocked
        /* Copy §3.3 (21/09/2026): a linha canônica da §5.7, verbatim. O "mas
           você segurou" que estava aqui punha a pessoa como causa de um MAS —
           o começo do caminho "você travou a evolução dele" (§13 ❌). */
        ? (isPt ? 'Ele espera. Esperar não tira nada dele.' : 'He waits. Waiting takes nothing from him.')
        /* ⚠️ Dizia "Pronto para evoluir na virada do dia" — FALSO desde que
           `MANUAL_EVOLUTION = true` (`types/progression.ts`): a virada NUNCA
           evolui sozinha, e o ramo que fazia isso em `utils/dailyReset.ts` está
           atrás do `!MANUAL_EVOLUTION`, morto. Quem espera a virada não vê
           nada acontecer — e a barra fica cheia, o que faz parecer defeito.
           Copy §3.1: "O padrão está pronto. Ele espera você encostar." — o
           padrão espera, não expira (nunca "não perca"). A 2ª oração continua
           ensinando o gesto: `evolucaoManual.contract.test.ts` exige. */
        : (isPt ? 'O padrão está pronto. Ele espera você encostar. Toque no seu Soulmon para evoluir.' : 'The pattern is ready. It waits for you to touch it. Tap your Soulmon to evolve.'))
    : (isPt
        // "completo", não "perfeito" (P5). O docblock deste arquivo já dizia
        // "Faltam 4 dias completos" — a renomeação passou pelo COMENTÁRIO e
        // não pela string, no mesmo arquivo. É a frase que responde "quanto
        // falta para meu bicho evoluir", ou seja, a mais lida da página.
        ? `Falta${faltam === 1 ? '' : 'm'} ${faltam} dia${faltam === 1 ? '' : 's'} completo${faltam === 1 ? '' : 's'}.`
        : `${faltam} complete day${faltam === 1 ? '' : 's'} to go.`);

  /* O TOQUE no visor (V2): com a barra cheia e o cadeado aberto, evolui; nos
     outros casos alterna o cadeado. O rótulo diz qual dos dois vai acontecer
     — "tap to lock" num visor que também evolui era o gesto duplo sem nome. */
  // `!incubating`: com a forma ainda tomando corpo o toque não evolui — e o
  // rótulo abaixo passa a dizer isso, em vez de prometer um gesto que o
  // `handleEvolve` vai recusar em silêncio.
  const evoluiNoToque = prontoParaEvoluir && !incubating && !evolutionLocked && Boolean(onEvolveRequest);
  const acaoDoVisor = evoluiNoToque ? onEvolveRequest : onToggleEvolutionLock;
  const nomeAtual = formaAtual?.name ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon');
  const rotuloDoVisor = `${nomeAtual}, ${isPt ? 'forma atual' : 'current form'}. ${
    prontoParaEvoluir && incubating
      ? (isPt ? 'A próxima forma está tomando corpo' : 'The next form is taking shape')
      : evoluiNoToque
      ? (isPt ? 'Pronto — toque para evoluir' : 'Ready — tap to evolve')
      : !onToggleEvolutionLock
        ? ''
        : evolutionLocked
          ? (isPt ? 'Evolução segurada, toque para liberar' : 'Evolution on hold, tap to release')
          : (isPt ? 'Evolução liberada, toque para segurar' : 'Evolution unlocked, tap to hold')
  }`.trim().replace(/\.$/, '');
  /* Copy §3.2/§3.3: o gesto tem nome próprio — "Encostar" é dizer "pode ir"
     (§5.7); "Segurar"/"Soltar" são o par do cadeado. Nunca "travar"/"lock" em
     texto de jogador: trancar implica custo, e §5.7 proíbe dizer que mudar de
     forma custa alguma coisa. */
  const tituloDoVisor = evoluiNoToque
    ? (isPt ? 'Encostar' : 'Touch it')
    : evolutionLocked ? (isPt ? 'Soltar' : 'Release') : (isPt ? 'Segurar' : 'Hold');
  /* A régua dos três atributos: o líder, com piso em 10 segmentos. */
  const reguaDosAtributos = Math.max(10, powerPoints, harmonyPoints, benevolencePoints);

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
         comunicar. Continua saindo de `pointsToEvolve`, que é o dono da conta
         contra `required`; hoje `gateDays` traz o mesmo número, mas quem manda
         é a função, não a prop (§3.1). */
      imminent: (isCurrent || isForecast) && pointsToEvolve(currentStageId, perfectDays) <= 1,
      reachable: teveOcasiao(stageId, isCurrent, isForecast),
      online,
      unseen: acervo.tunedUnseen.includes(stageId),
    });

  const estadoTexto: CSSProperties = { ...sm2Hint, margin: '4px 0 0' };

  /* D1 (15/09/2026): o pago recebe o rookie gerado e as formas seguintes sob
     demanda. Enquanto uma forma está GERANDO o visor mostra o cristal apagado (rookie) ou
     aceso (as demais); quando a geração parou de vez (`RESERVA_FINAL`) mostra
     o glitch. Só para quem NÃO é personagem pronto — o demo tem a arte da linha
     e ela é a identidade dele. Fora desses dois estados, a reserva continua
     sendo o piso (Invariante nº 1). */
  const placeholderDoNo = (stageId: string, estado: SpriteCardState): string | undefined => {
    if (demoCharacterId) return undefined;
    if (estado === 'GERANDO') return stageId === 'rookie' ? PLACEHOLDER_ART.dormant : PLACEHOLDER_ART.forming;
    if (estado === 'RESERVA_FINAL') return PLACEHOLDER_ART.glitch;
    return undefined;
  };

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
                style={{ ...sm2Button('outline'), marginTop: 8, minHeight: 44, minWidth: 200 }}
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
   * Um nó da árvore: UM card SIS-03 por forma (canvas Evolução, `EvoArvore`),
   * com o NÓ em SVG por token à esquerda (D-E3) e nome / estágio / tags /
   * linha de estado à direita.
   *
   * NÃO existe regra nova aqui — `isCurrent`, `isReached`, `hidden`,
   * `isPreviousStage` e o galho previsto são exatamente os mesmos cálculos que
   * a página sempre fez; o que mudou é a superfície (coluna com linhas → cards;
   * cristal PNG → anel vetor + vidro circular).
   *
   * O nó da forma ATUAL não é botão (como o wireframe aprovado): o gesto do
   * cadeado mora no VISOR lá em cima (`role=button`) e no botão de 44 — dois
   * alvos para a mesma regra já bastam; um terceiro no card seria ruído de
   * foco. O nó OCULTO continua botão ("Reveal (spoiler)").
   */
  const renderEvolutionCard = (evolution: CreatureStage, isLast: boolean) => {
    const stageId = creatureFormId(evolution);
    const isCurrent = stageId === currentStageId;
    const isUltra = evolution.stage === 'ultra';
    const isUltraMode = isUltra && !podeChegarAoUltra;
    const isRevealed = revealed.has(stageId);
    // "Reached" (shown) = the current form, an already-unlocked form, the
    // shared rookie trunk, or — for Ultra — once all 3 megas are unlocked.
    // Everything else is a spoiler-hidden future form.
    const isReached =
      isCurrent
      || unlockedSet.has(stageId)
      || evolution.stage === 'rookie'
      || (isUltra && podeChegarAoUltra);
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
    const estado = estadoDoNo(stageId, isCurrent, isForecast);

    // Situação em PALAVRAS: a cor e a posição do nó não podem ser o único
    // portador da informação (WCAG 1.4.1).
    const situacao = isCurrent
      ? (isPt ? 'forma atual' : 'current form')
      : isReached ? (isPt ? 'já alcançada' : 'already reached')
      : isForecast ? (isPt ? 'próxima prevista, ainda bloqueada' : 'next forecast, still locked')
      : (isPt ? 'bloqueada' : 'locked');
    const nome = hidden ? (isPt ? 'Evolução oculta' : 'Hidden evolution') : evolution.name;
    // V2: o rótulo diz o que o TOQUE faz — e só quando há toque.
    const nodeLabel = hidden
      ? `${nome} — ${situacao}. ${isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)'}`
      : `${nome} — ${situacao}`;

    /* A arte dentro do vidro do nó (256² a 64):
       · oculto: só a SILHUETA, e só de uma arte que É a forma que vem — o
         sprite PRÓPRIO adotado ou, no demo, a arte da linha (a árvore do demo
         É a linha kaelen/orrin/thalindra; ali a "reserva" é a identidade).
         A arte de reserva por hash de quem ainda não tem sprite NÃO entra:
         mostraria a silhueta de uma criatura que não é a que vem (WP4.21).
         Sem arte verdadeira, vidro vazio;
       · visível: o sprite próprio adotado, senão o placeholder v3 enquanto o
         Oráculo desenha (D-E9), senão a arte de reserva — o piso, nunca erro
         (Invariante nº 1). `displaySprite` é quem sabe a diferença. */
    const spriteProprio = displaySprite(acervo, stageId)?.url;
    const arteVerdadeira = spriteProprio ?? (demoCharacterId ? getSpriteForStage(stageId, demoCharacterId) : undefined);
    const arteDoNo = hidden
      ? arteVerdadeira
      : (spriteProprio
         ?? placeholderDoNo(stageId, estado)
         ?? getSpriteForStage(stageId, isCurrent ? demoCharacterId : undefined));

    /** A etiqueta de estado do nó (D-E10): Rubik 12/600, 24 de altura, pílula
     *  `surface-2` + `muted`; CURRENT em `primary-soft` + `primary-ink`;
     *  ZENITH em `gold-ink`. Uma palavra, caixa alta, nunca uma cor só. */
    const tag = (texto: string, tone: 'muted' | 'current' | 'gold' = 'muted') => (
      <span
        style={{
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-xs)',
          fontWeight: 600,
          letterSpacing: '.04em',
          lineHeight: 'var(--sm2-leading-body)',
          minHeight: 24,
          padding: '0 8px',
          borderRadius: 999,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: tone === 'current' ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
          color: tone === 'current' ? 'var(--sm2-primary-ink)' : tone === 'gold' ? 'var(--sm2-gold-ink)' : 'var(--sm2-muted)',
        }}
      >
        {texto}
      </span>
    );

    return (
      <article
        key={stageId}
        style={{ ...card, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: isLast ? 0 : 8 }}
        data-testid={`sm-no-${stageId}`}
      >
        <SoulNode
          visual={visual}
          sprite={arteDoNo}
          silhouette={hidden && Boolean(arteVerdadeira)}
          busy={estado === 'GERANDO'}
          label={nodeLabel}
          title={hidden ? (isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)') : nome}
          onClick={hidden ? () => setConfirmReveal(evolution) : undefined}
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ ...sm2Text, fontWeight: 500, margin: 0, color: isReached ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>
            {hidden ? '???' : evolution.name}
          </p>
          {!hidden && <p style={sm2Hint}>{L(evolution.stageName)}</p>}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {isCurrent && tag(isPt ? 'ATUAL' : 'CURRENT', 'current')}
            {isForecast && tag(isPt ? 'PREVISTA' : 'FORECAST')}
            {/* X3: o cadeado do jogador é "ON HOLD", nunca "LOCKED" — a
                coleção trancada é outra coisa (BLOQUEADA). */}
            {isCurrent && evolutionLocked && tag(isPt ? 'SEGURADA' : 'ON HOLD')}
            {isUltraMode && tag(isPt ? 'ZÊNITE' : 'ZENITH', 'gold')}
            {!isReached && tag(isPt ? 'BLOQUEADA' : 'LOCKED')}
          </div>
          {/* A espiada NÃO persiste (só a sessão), e o card diz isso. */}
          {isRevealed && !isReached && (
            <p style={sm2Hint}>{isPt ? 'revelada só nesta sessão' : 'revealed this session only'}</p>
          )}
          {/* O estado da ARTE desta forma (§2.2). */}
          {linhaDeEstado(stageId, estado, hidden)}

          {/* WP4.2 — os DOIS caminhos, ditos no lugar onde a pergunta nasce.

              Sem esta linha, quem olha o Ultra trancado conclui a mesma coisa
              que antes: "preciso das três megas", ou seja, "preciso descer".
              A ordem é deliberada — a PERMANÊNCIA vem primeiro, porque é o
              caminho que não pede nenhum ato de descuido. */}
          {isUltraMode && (
            <p style={{ ...sm2Hint, marginTop: 2 }}>
              {isPt
                ? `Dois caminhos chegam aqui: ${ULTRA_PATIENCE_DAYS} dias completos como mega, ou conhecer os três galhos. Nenhum é melhor — e nenhum pede que você desça.`
                : `Two paths reach this form: ${ULTRA_PATIENCE_DAYS} complete days as a mega, or knowing all three branches. Neither is better — and neither asks you to go back down.`}
            </p>
          )}

          {isPreviousStage && (
            <button
              type="button"
              onClick={() => handleDegenerateClick(evolution)}
              style={{ ...sm2Button('outline', false, 'sm'), alignSelf: 'flex-start', marginTop: 4 }}
            >
              {isPt ? 'Degenerar' : 'Degenerate'}
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>

      {/* Degeneração — dupla confirmação preservada, com foco preso e Escape
          (`RitualDialog`, o `.dlg` SIS-06 centrado do canvas `EvoEstados`).
          SEM primário e SEM vermelho (X8, D-E8): Cancel e Confirm `outline` —
          a ação é do jogador, pedida duas vezes; o app nunca cobra. */}
      {confirmDegenerate && (
        <RitualDialog
          label={confirmDegenerate.isSecondConfirm
            ? (isPt ? 'Aviso final' : 'Final warning')
            : (isPt ? 'Confirmar degeneração' : 'Confirm degeneration')}
          onClose={() => setConfirmDegenerate(null)}
          zIndex={120}
        >
          <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>
            {confirmDegenerate.isSecondConfirm
              ? (isPt ? 'Aviso final' : 'Final warning')
              : (isPt ? 'Confirmar degeneração' : 'Confirm degeneration')}
          </p>
          <p style={{ ...sm2Text, margin: 0 }}>
            {confirmDegenerate.isSecondConfirm
              ? (isPt
                  ? `Tem certeza absoluta que quer degenerar para ${confirmDegenerate.name}? Essa ação NÃO pode ser desfeita.`
                  : `Are you absolutely sure you want to degenerate to ${confirmDegenerate.name}? This action CANNOT be undone.`)
              : (isPt
                  ? `Quer degenerar para ${confirmDegenerate.name}? Você vai perder o progresso além deste estágio.`
                  : `Do you want to degenerate to ${confirmDegenerate.name}? You will lose all progress beyond this stage.`)}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setConfirmDegenerate(null)} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 12px' }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="button" onClick={handleDegenerateConfirm} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 12px' }}>
              {confirmDegenerate.isSecondConfirm
                ? (isPt ? 'Sim, degenerar' : 'Yes, degenerate')
                : (isPt ? 'Confirmar' : 'Confirm')}
            </button>
          </div>
        </RitualDialog>
      )}

      {/* Spoiler-guard das formas futuras — o primário fica aqui, que não
          perde nada. */}
      {confirmReveal && (
        <RitualDialog
          label={isPt ? 'Revelar essa evolução?' : 'Reveal this evolution?'}
          onClose={() => setConfirmReveal(null)}
          zIndex={120}
        >
          <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{isPt ? 'Revelar essa evolução?' : 'Reveal this evolution?'}</p>
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt
              ? 'Essa é uma evolução futura que você ainda não desbloqueou — espiar é spoiler. Ela aparece só nesta sessão e esconde de novo quando você sair dessa tela.'
              : "This is a future evolution you haven't unlocked yet — peeking is a spoiler. It shows up this session only, and hides again once you leave this screen."}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setConfirmReveal(null)} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 12px' }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="button" onClick={handleRevealConfirm} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 12px' }}>
              {isPt ? 'Sim, revelar' : 'Yes, reveal'}
            </button>
          </div>
        </RitualDialog>
      )}

      {/* ─────────── A HEROÍNA + A AÇÃO DOMINANTE ─────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        {/* O VISOR é o gesto (canvas Evolução D-E1/D-E4, regra 🔒 do
            CLAUDE.md: "tocar na criatura ATUAL alterna `evolutionLocked`";
            "destravado: o JOGADOR dispara, tocando na criatura com a barra
            cheia"). Um `<button>` de 200×200 em volta do `Viewport` decorativo
            (`aria-hidden`): o `Viewport` com `label` seria `role="img"`, e
            controle dentro de imagem some da árvore de acessibilidade. O
            rótulo diz o que o TOQUE faz (V2) — travar, destravar ou evoluir. */}
        <button
          type="button"
          data-visor-button
          onClick={acaoDoVisor}
          aria-pressed={evolutionLocked}
          aria-label={rotuloDoVisor}
          title={tituloDoVisor}
          style={{
            display: 'block', padding: 0, border: 'none', background: 'transparent',
            borderRadius: 'var(--sm2-radius-lg)', cursor: 'pointer',
          }}
        >
          <Viewport
            width={64}
            height={64}
            scale={3}
            screenStyle={{ position: 'relative' }}
          >
            {/* A aura elemental (`fx-ataque/`, 128² a 2× = 256) atrás da
                criatura, opacidade 1 com corte declarado (32 px de cada lado
                ficam fora — Pet D-P3). Só existe com oráculo: no demo
                `auraForElement` devolve `undefined` (X6). */}
            {auraElemental && (
              <img
                src={auraElemental}
                alt=""
                aria-hidden="true"
                data-aura
                style={{ position: 'absolute', left: -32, top: -32, width: 256, height: 256, maxWidth: 'none', imageRendering: 'pixelated' }}
              />
            )}
            {/* O sprite 256² a 128 CENTRADO (0,5× — P2 a, a MESMA escala da
                Home e da Ficha). Era esticado ao vidro (192 = 0,75×). */}
            <img
              src={spriteAtual}
              alt=""
              data-visor-sprite
              style={{ position: 'absolute', left: 32, top: 32, width: 128, height: 128, objectFit: 'contain', imageRendering: 'pixelated' }}
              /* Fade de 120 ms na troca reserva→próprio: reusa o token de
                 movimento que já existe (`--sm2-dur-tap`), e ele já respeita
                 `prefers-reduced-motion` no `index.css`. */
              className="sm-visor-swap"
              key={spriteAtual}
              onError={() => { if (spriteProprioAtual && spriteAtual === spriteProprioAtual) setSpriteQuebrado(spriteProprioAtual); }}
            />
            {/* A FAÍSCA da evolução pronta (X2): `anim-sparkle-pop` quadro 4
                (a dispersão), 64² a 2× = 128, no canto superior direito do
                vidro, FORA da criatura (0 px de sobreposição: alfa do quadro
                em x 164–220, sprite em 32–160). Quadro parado — o FX que a
                Home já liga na evolução pronta, sem loop. */}
            {prontoParaEvoluir && !evolutionLocked && (
              <span
                aria-hidden="true"
                data-visor-spark
                style={{
                  position: 'absolute', left: 128, top: 8, width: 128, height: 128,
                  backgroundImage: `url(${ANIM_ART.sparklePop.src})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${ANIM_ART.sparklePop.frames * 128}px 128px`,
                  backgroundPosition: `-${(ANIM_ART.sparklePop.frames - 1) * 128}px 0`,
                  imageRendering: 'pixelated', pointerEvents: 'none',
                }}
              />
            )}
            {/* "ON HOLD" na língua do vidro (D-E5): a MESMA peça do "EVOLVE"
                da Home (`.sm2-pxbtn` — Silkscreen 14 na moldura pixel a ½×
                sobre placa `viewport-bg` 78%), aqui como placa, não botão:
                o gesto é o visor inteiro, e o `aria-label` já diz "on hold". */}
            {evolutionLocked && (
              <span
                aria-hidden="true"
                data-onhold-plate
                className="sm2-pxbtn"
                style={{
                  position: 'absolute', right: 8, top: 8, zIndex: 5,
                  minHeight: 32, minWidth: 0, padding: '0 6px', cursor: 'inherit', pointerEvents: 'none',
                  borderImageSource: `url(${HUD_ART.frame})`,
                  borderImageSlice: HUD_ART.frameSlice,
                }}
              >
                {isPt ? 'SEGURADA' : 'ON HOLD'}
              </span>
            )}
            {/* A varredura de 400 ms que acompanha o fade — o par que a spec
                chama de "sintonia" (§2.1 e §2.3.1). Irmã do
                `.sm2-viewport-glass`: `position:absolute` recortada pela tela e
                `pointer-events:none`, para não roubar o gesto de esfregar o pet.
                `key` no sprite para a animação recomeçar do zero a cada troca. */}
            {varrendoSintonia && (
              <div className="sm-visor-scan" aria-hidden="true" key={`scan-${spriteAtual}`} />
            )}
          </Viewport>
        </button>

        {/* UM anúncio (§6), e num lugar só. Fica logo depois do visor porque é
            o visor que sintonizou, e a ordem de foco do §6 começa pela forma
            atual — a região não é focável e não desloca nada. */}
        {sintonizouAgora && (
          <p style={soParaLeitor} aria-live="polite" data-testid="sm-tune-anuncio">
            {spriteText('tuned', language)}
          </p>
        )}

        {/* O nome da forma, Cinzel 20, fora do vidro (aparelho). */}
        <h2
          style={{
            fontFamily: 'var(--sm2-font-display)',
            fontSize: 'var(--sm2-text-lg)',
            fontWeight: 600,
            lineHeight: 'var(--sm2-leading-title)',
            color: 'var(--sm2-ink)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {formaAtual?.name ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon')}
        </h2>

        {/* OFFLINE (D9): a geração de sprite é a única superfície de rede
            desta página, e o card diz que ela espera — sem âmbar, sem
            vermelho; a barra e o cadeado seguem vivos. Só para quem tem
            Oráculo: o demo cai sempre em `getSpriteForStage` e nunca gera. */}
        {!online && !demoCharacterId && (
          <div
            role="status"
            data-testid="sm-evo-offline"
            style={{ ...card, padding: 12, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}
          >
            <Icon name="wifi_off" size={24} tone="muted" />
            <p style={{ ...sm2Text, margin: 0 }}>{spriteText('offline', language)}</p>
          </div>
        )}

        {/* A barra de progresso é APARELHO (D-E2): `.meter` SIS-07 em vetor
            (12px, trilho `surface-2` + fronteira `muted`, fill
            `primary-fill`), `aria-valuemax = gateDays`; a frase 14 centrada. */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <div
            className="sm2-kit-meter"
            data-evo-meter
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={gateDays}
            aria-valuenow={Math.min(perfectDays, gateDays)}
            aria-label={isPt ? 'Progresso até a próxima evolução' : 'Progress to the next evolution'}
            style={{ height: 12, ['--sm2-kit-tone' as string]: 'var(--sm2-primary-fill)' } as CSSProperties}
          >
            <div className="sm2-kit-meter-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
          <p style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>{fraseProgresso}</p>
        </div>

        {/* O cadeado fala a língua da SELEÇÃO, não a do bloqueio (D-E4):
            aberto = `outline` 44 com `lock_open`; segurado = `primary-soft` +
            `primary-ink` + anel 1px (o idioma da sub-aba ativa e do chip do
            galho) com `lock` FILL 1. É o mesmo estado do visor, dito em
            palavras, para quem não descobre o gesto. */}
        {onToggleEvolutionLock && (
          <button
            type="button"
            data-lock-button
            onClick={onToggleEvolutionLock}
            aria-pressed={evolutionLocked}
            style={{
              ...sm2Button('outline', false, 'sm'),
              width: '100%', maxWidth: 240, marginTop: 4,
              ...(evolutionLocked
                ? { backgroundColor: 'var(--sm2-primary-soft)', color: 'var(--sm2-primary-ink)', border: '1px solid var(--sm2-primary-ink)' }
                : null),
            }}
          >
            <Icon name={evolutionLocked ? 'lock' : 'lock_open'} size={24} fill={evolutionLocked ? 1 : 0} tone="inherit" />
            {evolutionLocked
              ? (isPt ? 'Evolução segurada' : 'Evolution on hold')
              : (isPt ? 'Segurar evolução' : 'Hold evolution')}
          </button>
        )}
        {/* X4 (guarda 1c): segurar a forma NÃO protege da degeneração — e a
            superfície diz isso, em 12 `muted`, sem âmbar. Só no travado: o
            destravado já tem a frase da barra ("tap your Soulmon to evolve"). */}
        {evolutionLocked && (
          <p style={{ ...sm2Hint, textAlign: 'center', maxWidth: 340 }}>
            {/* Copy §3.3: a 2ª oração FICA (é regra que a pessoa precisa
                para decidir, L10); o que saiu é "nos dias difíceis", a única
                metade que avaliava o dia. */}
            {isPt
              ? 'Os dias completos continuam somando, mas a evolução está segurada. Segurar a forma não protege os corações.'
              : 'Complete days keep adding up, but evolution is on hold. Holding the form doesn’t shield the hearts.'}
          </p>
        )}

        {/* ── A SINTONIA (spec §2.3.1) ──────────────────────────────────────
            A criatura ATUAL é o único objeto do jogo cuja troca sempre teve
            ritual, então quem troca o rosto dela é o JOGADOR. O controle mora
            aqui, no card da forma atual — nenhum modal, nenhum push, nenhum
            toast: o Invariante nº 2 continua valendo e isto nunca interrompe o
            jogo. Os dois botões têm 44px de alvo real e **não** recebem foco
            automático: são alcançáveis, nunca impostos. */}
        {estadoAtual === 'A_SINTONIZAR' && onTuneVisor && (
          <div
            style={{ ...card, width: '100%', textAlign: 'center' }}
            role="status"
            data-testid="sm-tune-card"
          >
            <p style={{ ...sm2Text, margin: 0 }}>{spriteText('tuneReady', language)}</p>
            <button
              type="button"
              onClick={() => onTuneVisor(currentStageId)}
              style={{ ...sm2Button('primary'), marginTop: 12, minHeight: 48, width: '100%', maxWidth: 240 }}
            >
              <Icon name="tune" size={24} tone="inherit" />
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
            style={{ ...card, width: '100%', textAlign: 'center' }}
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
            style={{ ...card, width: '100%', textAlign: 'center' }}
            role="status"
            data-testid="sm-sprite-credencial"
          >
            <p style={{ ...sm2Text, margin: 0 }}>{avisoCredencial}</p>
            {podeRetentar && onRetrySprite && (
              <button
                type="button"
                onClick={() => onRetrySprite(currentStageId)}
                style={{ ...sm2Button('outline', false, 'sm'), marginTop: 12, width: '100%', maxWidth: 200 }}
              >
                <Icon name="refresh" size={24} tone="inherit" />
                {spriteText('retry', language)}
              </button>
            )}
          </div>
        )}

        {/* X-3: o aviso de que o Visor sintonizou SOZINHO. Quem nunca abre esta
            aba acordava com o rosto do bicho trocado sem nada dizendo nada.
            `auto_awesome` FILL 1 em `primary-ink` 20 + a linha 12 `muted`. */}
        {estadoAtual === 'NOVO' && (
          <p
            style={{ ...sm2Hint, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            data-testid="sm-tuned-badge"
          >
            <Icon name="auto_awesome" size={20} fill={1} tone="primary" />
            {spriteText('new', language)} · {spriteText('tuned', language)}
          </p>
        )}

        {/* Desfazer: o sprite próprio fica no save e pode ser sintonizado de
            novo a qualquer momento — re-sintonizar NÃO chama geração, logo não
            toca teto nenhum. Trocar o rosto do bicho sem saída é a versão
            educada do mesmo erro. */}
        {(estadoAtual === 'PROPRIO' || estadoAtual === 'NOVO') && onRevertVisor && (
          <button
            type="button"
            onClick={() => onRevertVisor(currentStageId)}
            style={{ ...sm2Button('outline', false, 'sm'), width: '100%', maxWidth: 240 }}
          >
            <Icon name="undo" size={24} tone="inherit" />
            {spriteText('revert', language)}
          </button>
        )}
        {acervo.reverted.includes(currentStageId) && onTuneVisor && (
          <button
            type="button"
            onClick={() => onTuneVisor(currentStageId)}
            style={{ ...sm2Button('outline', false, 'sm'), width: '100%', maxWidth: 240 }}
          >
            <Icon name="tune" size={24} tone="inherit" />
            {spriteText('tune', language)}
          </button>
        )}
      </section>

      {/* ─────────── Para onde ele está indo (D-E11) ─────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label={isPt ? 'Para onde seu Soulmon está indo' : 'Where they are heading'} data-evo-heading>
        <p style={sectionLabel}>{isPt ? 'Para onde seu Soulmon está indo' : 'Where they are heading'}</p>

        {/* A FRASE vem antes dos números: é ela que responde à pergunta. O
            galho previsto em `primary-ink` 500 dentro da frase — a resposta
            da tela (PRINCÍPIOS §6), nunca a cor do atributo. */}
        {forecastBranch ? (
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt ? 'Seguindo para ' : 'Heading toward '}
            <strong style={{ fontWeight: 500, color: 'var(--sm2-primary-ink)' }}>{L(ATTR_LABEL[forecastBranch])}</strong>
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
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt
              ? 'Ainda não dá para dizer. Conclua tarefas e o galho aparece aqui.'
              : 'Too early to tell. Finish tasks and the branch shows up here.'}
          </p>
        )}

        {/* Os três atributos em `.segb` de 10 segmentos (vetor, `role=progressbar`
            por atributo, rótulo 12 `muted` de 90px) — nenhum percentual, nenhum
            "N%" (02 §16). Os pontos não têm teto no jogo: a régua é o LÍDER
            (piso 10), então a leitura é "quem está na frente, e por quanto". */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {ATTR_ORDER.map(a => {
            const valor = a === 'power' ? powerPoints : a === 'harmony' ? harmonyPoints : benevolencePoints;
            return (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...sm2Hint, width: 90, flex: 'none' }}>{L(ATTR_LABEL[a])}</span>
                <PixelSegmentedBar
                  value={valor}
                  max={reguaDosAtributos}
                  segments={10}
                  label={L(ATTR_LABEL[a])}
                  style={{ flex: 1 }}
                />
              </div>
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

        {/* Seletor de galho — só os branches disponíveis (transição de arte).
            Chips de SELEÇÃO (`role=radio`, canvas `EvoArvore`): 44, pílula,
            `surface-2` + fronteira `muted`; selecionado `primary-soft` +
            `primary-ink` — o mesmo idioma da sub-aba ativa e do cadeado
            segurado. A cor do atributo saiu do botão: a informação é o
            RÓTULO, e o galho previsto é dito em palavras logo acima. */}
        <div role="radiogroup" aria-label={isPt ? 'Linha de evolução' : 'Evolution branch'} style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(AVAILABLE_BRANCHES as readonly Attr[]).map(b => {
            const active = selectedBranch === b;
            return (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedBranch(b)}
                className="sm2-form-chip"
                style={{
                  flex: 1, minWidth: 0, minHeight: 44, padding: '0 6px', borderRadius: 999,
                  boxSizing: 'border-box', cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
                  lineHeight: 'var(--sm2-leading-body)',
                  border: `1px solid ${active ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}`,
                  backgroundColor: active ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                  color: active ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
                }}
              >
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
                ? 'Cuide do seu Soulmon e conclua as tarefas do dia — as próximas formas aparecem aqui conforme seu Soulmon evolui.'
                : 'Care for your Soulmon and finish today’s tasks — the next forms show up here as it evolves.'}
            </p>
          </div>
        ) : (
          (() => {
            // Uma coluna de cards: tronco (rookie) → galho escolhido → ultra.
            const ordem = [rookie, ...branchPath, ultra].filter((s): s is CreatureStage => Boolean(s));
            return (
              <div style={{ display: 'flex', flexDirection: 'column' }} aria-label={isPt ? 'Árvore de evolução' : 'Evolution tree'}>
                {ordem.map((evolution, i) => renderEvolutionCard(evolution, i === ordem.length - 1))}
              </div>
            );
          })()
        )}
      </section>
    </div>
  );
}
