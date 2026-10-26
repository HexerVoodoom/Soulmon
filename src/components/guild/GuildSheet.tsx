/**
 * A GUILDA (`docs/PLANO-GUILDA.md`, fatia A do cliente — 29/09/2026).
 *
 * É a folha que o Salão do Hall abre (e a construção da Arena, até a Feira ter
 * a sua): o cooperativo leve da Fase 4.3 com teto de 12, agora falando com
 * `/api/guild` (`utils/community.ts`) e lendo todo texto de `utils/guildCopy.ts`.
 *
 * O DESENHO DESTA TELA É A FEATURE. O item 4.2 do `docs/PLANO-EVOLUCAO.md`
 * registra que 31,3% relataram efeito psicológico negativo de comparação em
 * ambiente de leaderboard; um grupo que mostrasse quanto cada pessoa fez
 * reinventaria o leaderboard entre amigos, onde a comparação dói mais. Por isso:
 *
 *  - **nenhum número por pessoa, e nenhum número de progresso da semana** — a
 *    barra `progress/target` do CoopPanel saiu (`sanitizeGuildView` a descarta):
 *    uma meta com estado de "não bateu" é o oposto do Bosque, que só cresce;
 *  - presença NOMINAL só com até `GUILD_PRESENCE_NOMINAL_MAX` (4) membros, só do
 *    DIA corrente, **sem ordenar** e **sem estado para quem não veio** (nenhum
 *    ícone, nenhuma cor apagada, nenhum lugar vazio — LV-G2). Com 5 ou mais,
 *    ninguém tem estado; o agregado é UMA frase qualitativa, e só quando há fio
 *    (`threadedToday === true`) — com 0, silêncio, nunca "0" nem `{n}`;
 *  - **sair é um toque**, sem confirmação (LV-G5), e a nota diz só o fato;
 *  - "meta do dia ainda não cumprida" é SILÊNCIO: nada é desenhado (§3, linha
 *    `guild.bosque.fio.ainda`) — a frase de explicação do CoopPanel saiu;
 *  - falha de CARGA nunca vira "sem roda" (QA L1 #16): é uma tela de erro com
 *    "tentar de novo", e sem login (401) é um convite a entrar na conta, sem
 *    formulário morto.
 *
 * SALAS (`PLANO-GUILDA.md` §6): o Salão é UM scroll com seções — Bosque, Roda,
 * Mural. A FEIRA é a sala do lote da Arena (`room="feira"`, fatia B2): o fenômeno da
 * semana (`FeiraVisor`), UM botão de rodada por dia e o resgate. O Bosque tem o visor
 * (`GroveVisor`: cenário do estágio + as criaturas na linha do chão), o nome do
 * estágio, uma faixa `perto` BINÁRIA e o fio; a Roda tem os três gestos fixos e
 * anônimos; o Mural guarda os marcos e as peças de maré. **Vazio é SILÊNCIO**
 * (seção sem nada a dizer não desenha nem título — L6), e NADA tem número por
 * pessoa: o tipo `GuildView` nem tem onde carregar um.
 *
 * Nada da guilda vai para o `GameState`: o ponteiro é do servidor.
 */
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  getGuild, createGuild, joinGuild, guildThread, guildGesture, leaveGuild, renameGuild, newGuildCode,
  hitGuildRaid, getGuildRewards, claimGuildReward, donateToGuild, setGuildSlot, buyGuildShopItem, getGuildWar, seekGuildWar,
  type GuildWar,
  GuildError, type GuildErrorKind, type GuildView, type GuildGoal, type GuildRaid, type GuildRewards, type GuildClaim,
} from '../../utils/community';
import { playerDayKey, type PlayerDayAnchor } from '../../utils/playerDay';
import {
  guildText, guildInviteRoom, GUILD_ERROR_KEY, groveStageName, groveStageLine,
  guildGestureReceived, tideSizeName, type GuildKey,
} from '../../utils/guildCopy';
import {
  GUILD_NAME_MAX, GUILD_CODE_LENGTH, GUILD_PRESENCE_NOMINAL_MAX, GROVE_STAGES,
  RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, CASA_DOACOES, CASA_BITS_MIN, CASA_STAGES, normalizeGuildCode, type GuildGesture, type CasaStageId,
} from '../../utils/guildRules';
import { GuildLoja } from './GuildLoja';
import { donatableItems } from '../../utils/guildHouse';
import { isMissionAway, type GuildMissionState } from '../../utils/guildMission';
import { ALL_SHOP_ITEMS } from '../../utils/shop';
import { DECOR_ART } from '../../utils/decorArt';
import { hasClaimedReceipt, rememberClaimedReceipt, markClaimAttempt, hadClaimAttempt } from '../../utils/guildClaimLocal';
import {
  observeGuildView, readGroveLocal, permanenceBand, formatDayLabel, groveSceneIds, setGuildSheetOpen, trackGuildStageOnce,
} from '../../utils/groveLocal';
import { track } from '../../utils/telemetry';
import { UnlockNudge } from '../UnlockAccountModal';
import { getSpriteForStage } from '../../utils/sprites';
// ⚠️ Todo `name` de ícone tem de estar no inventário de `icon_names` de
// `src/styles/tokens.md`: a fonte é SUBSETADA, e um nome fora dele renderiza um
// <span> VAZIO — sem erro e sem aparecer em teste nenhum.
import { Icon } from '../ui/Icon';
import { InfoTip, ModalInfo } from '../ui/InfoTip';
import { Field } from '../form/FormKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
/** O panorama (D-32): só nasce aqui, pela porta do Hall, e sob demanda — panorama e árvores fora do chunk de entrada. */
import type { OnPlantio } from './GroveFolha';
import type { BosqueArvores } from '../../utils/bosqueArvores';
const GroveFolha = lazy(() => import('./GroveFolha'));
import { GroveCena } from './GroveCena';
import { GuerraVisor } from './GuerraVisor';
import { FeiraVisor } from './FeiraVisor';
import { SalaPraca } from './PracaVisor';
import { SalaPlantio } from './PlantioVisor';
import { SalaMisterio } from './MisterioVisor';
import type { ClaOnReward } from './claUi';
import type { Language } from '../../utils/i18n';
import { emitFeat } from '../../utils/feats';

interface GuildSheetProps {
  saveId: string;
  language: Language;
  /** `true` quando a pessoa já cumpriu a própria meta do dia — é o que autoriza
   *  "firmar meu fio": cada um tem a SUA meta, e é assim que uma roda com um
   *  ultra e um rookie não vira injustiça. */
  metaDoDiaCumprida: boolean;
  /** A meta como o servidor a confere (`done` × `heart`, em PESO de esforço). Sem ela, o servidor não confere. */
  fioGoal?: GuildGoal;
  /** A criatura de quem olha, no estágio dela (o App sabe; a folha não deriva estágio nenhum). */
  mySprite?: string | null;
  /** Âncora do DIA DO JOGADOR (`gameState.playerDayTz`); sem ela vale o do aparelho. */
  playerDayTz?: PlayerDayAnchor;
  /** Qual sala abre: o Salão (Bosque/Roda/Mural, o padrão — porta do Hall) ou a Feira (porta da Arena). */
  room?: 'salao' | 'feira' | 'guerra' | 'grove';
  /** O resgate da Feira foi confirmado pelo servidor: soma os Emblemas pelo MESMO caminho do Torneio
   *  e, se veio a Concha da Maré, a põe em `ownedFurniture`. A folha só chama UMA vez por recibo. */
  onClaimed?: (claim: { emblems: number; trophyId: string | null }) => void;
  /** Cenários `bg-guild-*` que o servidor já liberou (ficam com quem sai — G12). */
  onScenes?: (ids: string[]) => void;
  /** Sem conta (401): o tier decide se o convite é o de criar conta (`demo`) e `onUnlock` o abre. */
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** Leva à tela de entrar na conta (Configurações). Sem ele, o 401 fica só com o texto e "tentar de novo". */
  onLogin?: () => void;
  /**
   * A CASA (PR2): a ponte com o save. A folha não lê `GameState`; o App passa a carteira e o inventário e
   * recebe o que mudou. `onSpend` recebe SÓ o que o servidor aceitou; `onSlot` reconcilia o save ao slot que
   * o servidor diz (idempotente — `applyGuildSlot`), inclusive `null` quando a pessoa não tem mais guilda.
   */
  casa?: {
    bits: number;
    ownedFurniture: string[];
    equippedDecor: Record<string, string | undefined>;
    donatedItem: string | null;
    onSpend: (bits: number) => void;
    onSlot: (item: string | null) => void;
  };
  /** A MISSÃO (PR3, ex-Feira): o estado da ida do Solmon (no save) e o gesto de mandá-lo. */
  missao?: { state: GuildMissionState | null; onSend: () => void };
  /** Os PRÉDIOS DO CLÃ (Praça, Plantio, Mistério): a ponte do prêmio com o save. O App credita UMA vez por recibo (`utils/claCredit.ts`). */
  cla?: { onReward: ClaOnReward; /** As 4 árvores do Bosque no save (`bosqueArvores`). */ arvores?: BosqueArvores; /** Guarda o que o plantio mostrou (pico da árvore da estação). */ onPlantio?: OnPlantio };
}

/** `guild_raid` 1/2 (viu dissipada / viu recuou): UMA vez por semana e estado, por execução do app. */
const raidVista = new Set<string>();
/** Só para teste: a memória acima é do módulo. */
export const resetRaidTelemetryForTests = () => raidVista.clear();

type Load =
  | { status: 'loading' }
  | { status: 'error'; kind: GuildErrorKind }
  | { status: 'ready'; guild: GuildView | null; day: string };

type PredioId = 'praca' | 'plantio' | 'misterio';

const kindOf = (e: unknown): GuildErrorKind => (e instanceof GuildError ? e.kind : 'server');

export function GuildSheet({ saveId, language, metaDoDiaCumprida, fioGoal, mySprite, playerDayTz, room = 'salao', onClaimed, onScenes, accountTier, onUnlock, onLogin, casa, missao, cla }: GuildSheetProps) {
  const t = useCallback((k: GuildKey, vars?: Record<string, string | number>) => guildText(language, k, vars), [language]);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [aviso, setAviso] = useState<GuildKey | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [ajustes, setAjustes] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [copiado, setCopiado] = useState(false);
  /** Dia (do jogador) em que ESTE aparelho viu cada estágio — só para o Mural. Memória de UI, não do save. */
  const [marcos, setMarcos] = useState<Record<string, string>>({});
  /** O que há para colher (Feira). `null` = ainda não perguntado / falhou em silêncio. */
  const [rewards, setRewards] = useState<GuildRewards | null>(null);
  const [colhido, setColhido] = useState<{ n: number; trophy: boolean } | null>(null);
  const [colherErro, setColherErro] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  /** A guerra da guilda (PR4). `null` = ainda não perguntado / indisponível (a sala só aparece com o estado). */
  const [war, setWar] = useState<GuildWar | null>(null);
  /** O prédio do clã aberto (Praça, Plantio, Mistério): um por vez, e só o aberto fala com o servidor. */
  const [predio, setPredio] = useState<PredioId | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(false);
  const lojaOps = useRef(new Map<string, string>()); // itemId → opId da compra em andamento (idempotência no reenvio)
  const busy = useRef(false);            // trava SÍNCRONA: `disabled` só vale depois do re-render
  const seq = useRef(0);                 // resposta velha nunca sobrescreve a nova
  const tz = useRef(playerDayTz);
  tz.current = playerDayTz;
  const copiadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardsKey = useRef('');
  const onClaimedRef = useRef(onClaimed);
  onClaimedRef.current = onClaimed;
  const onScenesRef = useRef(onScenes);
  onScenesRef.current = onScenes;
  const foco = useRef<HTMLElement | null | 'raiz'>(null);
  const ajustesId = useId();

  useEffect(() => {
    vivo.current = true;
    // Enquanto a folha está montada, é ELA que consulta ao voltar ao app (o `useGroveWatch` fica quieto).
    setGuildSheetOpen(true);
    return () => {
      vivo.current = false;
      setGuildSheetOpen(false);
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current);
    };
  }, []);

  const carregar = useCallback(async (silencioso: boolean) => {
    const meu = ++seq.current;
    if (!silencioso) setLoad({ status: 'loading' });
    try {
      const guild = await getGuild(saveId, tz.current);
      if (!vivo.current || meu !== seq.current) return;
      setLoad({ status: 'ready', guild, day: playerDayKey(new Date(), tz.current) });
    } catch (e) {
      if (!vivo.current || meu !== seq.current) return;
      // Recarga silenciosa que falha NÃO derruba uma tela boa: fica a que já estava.
      if (!silencioso) setLoad({ status: 'error', kind: kindOf(e) });
    }
  }, [saveId]);

  useEffect(() => { void carregar(false); }, [carregar]);

  // Toda vista que chega passa pela memória do aparelho: é ela que decide se há
  // marco por celebrar (o App a lê) e que datou o estágio para o Mural. Fora do
  // `agir` de propósito — inclui a carga inicial e a recarga silenciosa. Sem
  // roda, a memória acaba (o que foi ganho já está no save).
  useEffect(() => {
    if (load.status !== 'ready') return;
    const obs = observeGuildView(load.guild, load.day);
    setMarcos(load.guild ? (readGroveLocal()?.marks ?? {}) : {});
    trackGuildStageOnce(obs?.firstSeenStage);
    // Cenário do Bosque só com a confirmação do servidor (`mine.groveScenes`) — ficam com quem sai (G12).
    if (load.guild?.mine.groveScenes) onScenesRef.current?.(groveSceneIds(load.guild.bosque.stageIndex));
  }, [load]);

  // A MISSÃO voltou (o App encerrou a ida): relê a vista para mostrar o fenômeno já atualizado.
  const missaoAtiva = !!missao?.state;
  const missaoAntes = useRef(missaoAtiva);
  useEffect(() => {
    if (missaoAntes.current && !missaoAtiva) void carregar(true);
    missaoAntes.current = missaoAtiva;
  }, [missaoAtiva, carregar]);

  // A GUERRA: pergunta ao abrir o lote da Arena (D-107: o Salão não a mostra mais; 2 leituras no servidor). Falha é SILÊNCIO: a sala some.
  const guildaId = load.status === 'ready' ? load.guild?.id ?? null : null;
  useEffect(() => {
    if (!guildaId || room !== 'guerra') { setWar(null); return; }
    let vivoLocal = true;
    getGuildWar(saveId, tz.current).then(w => { if (vivoLocal && vivo.current) setWar(w); }).catch(() => { if (vivoLocal) setWar(null); });
    return () => { vivoLocal = false; };
  }, [guildaId, saveId, room]);

  // A CASA: o save acompanha o slot que o SERVIDOR diz (item em uso na guilda não vale no cenário pessoal).
  // Sem roda, o slot acabou e o item volta. Idempotente — pode rodar a cada vista.
  const casaRef = useRef(casa);
  casaRef.current = casa;
  useEffect(() => {
    if (load.status !== 'ready') return;
    casaRef.current?.onSlot(load.guild ? (load.guild.casa?.mine.slot ?? null) : null);
  }, [load]);

  // O RESGATE: pergunta ao abrir (Salão e Feira) e de novo quando o estado da Feira muda (a rodada
  // que dissipa o fenômeno abre o direito da semana corrente). Falha é SILÊNCIO: nada a colher é
  // o estado normal, e uma tela de erro por isso seria ruído.
  // O DIREITO É DA PESSOA, não da roda (L3-conformidade A-1): quem saiu ainda colhe, então "sem roda"
  // também pergunta (`sem-roda`) — a folha, o Salão e a Feira mostram o resgate pendente sem guilda.
  const chaveDaFeira = load.status !== 'ready' ? ''
    : load.guild
      ? `${load.guild.id}|${load.guild.raid?.weekKey ?? ''}|${load.guild.raid?.state ?? ''}|${load.guild.raid?.lastWeek ?? ''}`
      : 'sem-roda';
  useEffect(() => {
    if (!chaveDaFeira || rewardsKey.current === chaveDaFeira) return;
    rewardsKey.current = chaveDaFeira;
    getGuildRewards(saveId, tz.current).then(r => {
      if (!vivo.current) return;
      setRewards(r);
      if (r.scenes.length > 0) onScenesRef.current?.(r.scenes);
    }).catch(() => { if (rewardsKey.current === chaveDaFeira) rewardsKey.current = ''; });
  }, [chaveDaFeira, saveId]);

  // Abrir o campo de código leva o foco a ele (o botão que abriu sumiu).
  useEffect(() => { if (entrando) document.getElementById(`${ajustesId}-codigo`)?.focus(); }, [entrando, ajustesId]);

  // Voltar ao app (aba, APK): os fios dos outros e a virada do dia não aparecem
  // sozinhos. Sem timer — só o evento, e só com a página visível.
  useEffect(() => {
    const aoVoltar = () => { if (!document.hidden && !busy.current) void carregar(true); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, [carregar]);

  // Foco (QA L1 #24b): quando o botão apertado some (criar, sair, firmar o fio),
  // o foco iria para o `<body>` e, dentro de um diálogo modal, o teclado se perde.
  useEffect(() => {
    const alvo = foco.current;
    if (!alvo) return;
    foco.current = null;
    const raiz = rootRef.current;
    if (!raiz) return;
    if (raiz.contains(document.activeElement) && document.activeElement !== raiz) return;
    if (alvo !== 'raiz' && alvo.isConnected && !(alvo as HTMLButtonElement).disabled && raiz.contains(alvo)) alvo.focus();
    else raiz.focus({ preventScroll: true });
  });

  const aplicar = (guild: GuildView | null, anunciar?: GuildKey) => {
    seq.current++;
    setLoad({ status: 'ready', guild, day: playerDayKey(new Date(), tz.current) });
    setAviso(null);
    if (anunciar) setAnuncio(t(anunciar));
  };

  /** Toda ação passa por aqui: um só lugar trava o duplo toque, traduz o erro e cuida do foco. */
  const agir = async (fn: () => Promise<GuildView | null>, opts: { anunciar?: GuildKey; depois?: (guild: GuildView | null) => void } = {}) => {
    if (busy.current) return;
    busy.current = true;
    const abriu = document.activeElement as HTMLElement | null;
    setOcupado(true);
    setAviso(null);
    setAnuncio('');
    try {
      const guild = await fn();
      if (!vivo.current) return;
      aplicar(guild, opts.anunciar);
      opts.depois?.(guild);
    } catch (e) {
      if (!vivo.current) return;
      const kind = kindOf(e);
      if (kind === 'login') {
        setLoad({ status: 'error', kind });
      } else if (kind === 'alreadyIn') {
        // #10: mostra a roda que a pessoa JÁ tem (e, nela, a saída), em vez de um beco.
        if (e instanceof GuildError && e.guild) aplicar(e.guild);
        else void carregar(true);
        setAviso('guild.erro.jaEmOutra');
      } else if (kind === 'noGuild') {
        aplicar(null);
        setAviso('guild.esvaziada.mundo');
      } else if (kind === 'dailyLimit' || kind === 'goalNotMet' || kind === 'raidClosed') {
        // O gesto do dia já saiu (talvez de outro aparelho) ou a meta de coração
        // ainda não bateu: NENHUM dos dois é frase de tela. Relê e o botão certo aparece.
        void carregar(true);
      } else {
        if (kind === 'notHost') void carregar(true);
        setAviso(GUILD_ERROR_KEY[kind]);
      }
    } finally {
      busy.current = false;
      foco.current = abriu ?? 'raiz';
      if (vivo.current) setOcupado(false);
    }
  };

  /**
   * COLHER: uma semana por vez. O crédito é da FOLHA só até o `onClaimed` (o App soma no save):
   *  · rede caindo → NADA é creditado, o cartão fica e dá para tentar de novo;
   *  · 404 `nothing to claim` → SILÊNCIO (o direito some, sem frase);
   *  · 409 `already claimed` → o servidor JÁ gravou. Se este aparelho TENTOU antes e não guardou o
   *    recibo (a resposta do 200 se perdeu na rede), o 409 traz o `claimed` e é ele que credita;
   *    sem tentativa aqui (outro aparelho colheu) ou com recibo já guardado → SILÊNCIO (L3 A1);
   *  · o recibo já creditado por este aparelho NÃO credita de novo (o KV é eventualmente consistente).
   * O crédito acontece mesmo se a folha fechar no meio do pedido (`onClaimed` é do App).
   */
  const colher = async (week: string) => {
    if (busy.current) return;
    busy.current = true;
    setOcupado(true);
    setColherErro(false);
    const abriu = document.activeElement as HTMLElement | null;
    const tirar = () => setRewards(r => (r ? { ...r, pending: r.pending.filter(p => p.week !== week) } : r));
    /** Credita UMA vez por recibo; devolve `true` se creditou (quem chama mostra o fato). */
    const creditar = (c: GuildClaim): boolean => {
      if (hasClaimedReceipt(c.receipt)) return false;
      onClaimedRef.current?.({ emblems: c.emblems, trophyId: c.trophy ? c.trophyId : null });
      rememberClaimedReceipt(c.receipt);
      return true;
    };
    try {
      markClaimAttempt(week);
      const c = await claimGuildReward(saveId, week, tz.current);
      const novo = creditar(c);
      if (!vivo.current) return;
      tirar();
      if (novo) {
        setColhido({ n: c.emblems, trophy: c.trophy });
        setAnuncio(t('guild.feira.colhido', { n: c.emblems }));
      }
    } catch (e) {
      const kind = kindOf(e);
      // A resposta do 200 se perdeu: o direito está gravado e o 409 devolve o resgate — credita por ele.
      const c409 = kind === 'alreadyClaimed' && e instanceof GuildError && e.claim && e.claim.week === week && hadClaimAttempt(week)
        ? e.claim : null;
      const novo = c409 ? creditar(c409) : false;
      if (!vivo.current) return;
      if (kind === 'alreadyClaimed' || kind === 'nothingToClaim') {
        tirar();
        if (novo && c409) {
          setColhido({ n: c409.emblems, trophy: c409.trophy });
          setAnuncio(t('guild.feira.colhido', { n: c409.emblems }));
        }
      } else if (kind === 'login') setLoad({ status: 'error', kind });
      else setColherErro(true);
    } finally {
      busy.current = false;
      foco.current = abriu ?? 'raiz';
      if (vivo.current) setOcupado(false);
    }
  };

  const copiar = async (code: string) => {
    try {
      await navigator.clipboard?.writeText(code);
      if (!navigator.clipboard || !vivo.current) return;
      setCopiado(true);
      setAnuncio(t('guild.codigo.copiado'));
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current);
      copiadoTimer.current = setTimeout(() => { if (vivo.current) setCopiado(false); }, 2000);
    } catch {
      // `clipboard` falha em WebView antigo/contexto não seguro. O código está
      // escrito na tela do lado, então falhar não tira nada de ninguém.
    }
  };

  const compartilhar = async (g: GuildView) => {
    try { await navigator.share({ title: g.name, text: g.code }); } catch { /* cancelou */ }
  };

  const alerta = aviso && <p role="alert" className="sm2-lib-alert">{t(aviso)}</p>;
  const resgate = (
    <ResgateFeira
      t={t}
      pending={rewards?.pending[0] ?? null}
      colhido={colhido}
      erro={colherErro}
      ocupado={ocupado}
      onColher={colher}
    />
  );
  const btn = 'sm2-kit-btn sm2-kit-btn-md';

  let corpo: React.ReactNode;
  if (load.status === 'loading') {
    corpo = (
      <p className="sm2-lib-busy" aria-busy="true">
        <Icon name="sync" size={24} tone="muted" className="animate-spin" />
        {t('guild.salao.carregando')}
      </p>
    );
  } else if (load.status === 'error') {
    // QA L1 #16: falha de leitura NÃO é "sem roda". Só o aviso e — salvo sem
    // login, onde tentar de novo não muda nada — o botão de tentar de novo.
    // Sem conta (401) NUNCA é beco (QA L3 A1): o texto, o convite (`UnlockNudge` para o demo, o
    // caminho até Entrar para quem tem `onLogin`) e "tentar de novo" — que serve a quem acabou de entrar.
    const semConta = load.kind === 'login';
    const demo = semConta && accountTier === 'demo';
    corpo = (
      <div className="sm2-guild-sec">
        <p role="alert" className="sm2-lib-alert">{t(demo ? 'guild.erro.demo' : GUILD_ERROR_KEY[load.kind])}</p>
        {demo && onUnlock && (
          <div style={{ maxWidth: 280 }} data-guild-unlock>
            <UnlockNudge language={language} reason="shop" onOpen={onUnlock} />
          </div>
        )}
        {semConta && onLogin && (
          <button type="button" onClick={onLogin} data-guild-entrar className={`${btn} sm2-kit-btn-primary sm2-guild-btn`}>
            <Icon name="lock_open" size={20} />
            {t('guild.erro.entrar')}
          </button>
        )}
        <button type="button" onClick={() => void carregar(false)} className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}>
          <Icon name="refresh" size={20} />
          {t('guild.erro.tentar')}
        </button>
      </div>
    );
  } else if (!load.guild && room === 'guerra') {
    // D-73: a Guerra é do clã; sem clã a folha da Arena só diz isso (criar/entrar mora no Salão).
    corpo = <p className="sm2-stats-t" data-guerra-semcla>{t('guild.guerra.semcla')}</p>;
  } else if (!load.guild) {
    const semNome = ocupado || !nome.trim();
    const semCodigo = ocupado || codigo.length < GUILD_CODE_LENGTH;
    corpo = (
      <>
        {/* O RESGATE é da pessoa, não da roda: quem saiu ainda colhe (L3-conformidade A-1). */}
        {resgate}
        {room === 'feira' && <p className="sm2-grove-line" data-guild-feira-convite>{t('guild.feira.semroda')}</p>}
        <p className="sm2-stats-t">{t('guild.salao.vazio.corpo')}</p>
        {alerta}
        <div className="sm2-stats-card">
          <label className="sm2-lib-s" style={{ fontWeight: 500 }} htmlFor={`${ajustesId}-nome`}>{t('guild.criar.nome.label')}</label>
          <Field
            id={`${ajustesId}-nome`}
            value={nome}
            maxLength={GUILD_NAME_MAX}
            onChange={e => setNome(e.target.value)}
            placeholder={t('guild.criar.nome.placeholder')}
            aria-describedby={semNome && !ocupado ? `${ajustesId}-nome-dica` : undefined}
          />
          {semNome && !ocupado && <span id={`${ajustesId}-nome-dica`} className="sm2-guild-sr">{t('guild.criar.nome.dica')}</span>}
          <button
            type="button"
            disabled={semNome}
            aria-disabled={semNome ? true : undefined}
            aria-busy={ocupado ? true : undefined}
            onClick={() => void agir(() => createGuild(saveId, nome.trim(), tz.current), { depois: () => track('guild_create') })}
            className={`${btn} sm2-kit-btn-primary sm2-guild-btn`}
          >
            <Icon name={ocupado ? 'sync' : 'add'} size={20} className={ocupado ? 'animate-spin' : undefined} />
            {t('guild.criar.botao')}
          </button>
        </div>
        <div className="sm2-stats-card">
          {!entrando ? (
            <button
              type="button"
              onClick={() => setEntrando(true)}
              className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
            >
              <Icon name="arrow_forward" size={20} />
              {t('guild.entrar.botao.abrir')}
            </button>
          ) : (
            <>
              <label className="sm2-lib-s" style={{ fontWeight: 500 }} htmlFor={`${ajustesId}-codigo`}>{t('guild.entrar.codigo.label')}</label>
              {/* Entra-se por CÓDIGO, nunca por busca: roda achável é raide de
                  estranho. O campo só aceita o alfabeto do código (sem 0/O/1/I). */}
              <Field
                id={`${ajustesId}-codigo`}
                value={codigo}
                maxLength={GUILD_CODE_LENGTH}
                autoCapitalize="characters"
                autoComplete="off"
                inputMode="text"
                onChange={e => setCodigo(normalizeGuildCode(e.target.value))}
                placeholder="ABCD2345"
                style={{ letterSpacing: '0.12em' }}
                aria-describedby={`${ajustesId}-codigo-dica`}
              />
              {/* Por que o botão está inerte com menos caracteres (QA L1 #7): a dica fica escrita, não só no leitor. */}
              <span id={`${ajustesId}-codigo-dica`} className="sm2-lib-s" style={{ margin: 0 }}>
                {t('guild.entrar.codigo.dica', { n: GUILD_CODE_LENGTH })}
              </span>
              <button
                type="button"
                disabled={semCodigo}
                aria-disabled={semCodigo ? true : undefined}
                aria-busy={ocupado ? true : undefined}
                onClick={() => void agir(() => joinGuild(saveId, codigo, tz.current), { depois: g => { if (g) track('guild_join', { size: Math.min(12, Math.max(2, g.size)) }); } })}
                className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
              >
                <Icon name={ocupado ? 'sync' : 'arrow_forward'} size={20} className={ocupado ? 'animate-spin' : undefined} />
                {t('guild.entrar.botao')}
              </button>
            </>
          )}
        </div>
      </>
    );
  } else {
    const g = load.guild;
    // Presença nominal: só ≤4, só do dia corrente (a vista veio do MESMO dia do
    // jogador que vale agora) e só o que o servidor mandou.
    const nominal = g.size <= GUILD_PRESENCE_NOMINAL_MAX && load.day === playerDayKey(new Date(), tz.current);
    const semNovoNome = ocupado || !novoNome.trim() || novoNome.trim() === g.name;
  const buscarGuerra = () => {
    if (busy.current) return;
    busy.current = true;
    setOcupado(true);
    setAviso(null);
    seekGuildWar(saveId, tz.current)
      .then(r => { if (vivo.current) { setWar(r.war); if (r.state === 'done') { void carregar(true); setAnuncio(t(`guild.guerra.resultado.${r.war.last?.outcome ?? 'draw'}`, { nome: r.war.last?.enemy ?? '' })); } } })
      .catch(e => { if (vivo.current) setAviso(GUILD_ERROR_KEY[kindOf(e)]); })
      .finally(() => { busy.current = false; if (vivo.current) setOcupado(false); });
  };
    const salaGuerra = war && (
      <SalaGuerra
        guild={g}
        t={t}
        language={language}
        war={war}
        hoje={load.day}
        ocupado={ocupado}
        mySprite={mySprite || getSpriteForStage('rookie')}
        reducedMotion={reducedMotion}
        onBuscar={buscarGuerra}
      />
    );
    // D-50: o bosque é a mesma sala no Salão do Clã (junto do resto) e no prédio Grove (sozinha).
    const salaBosque = (
        <SalaBosque
          guild={g}
          t={t}
          language={language}
          metaDoDiaCumprida={metaDoDiaCumprida}
          ocupado={ocupado}
          mySprite={mySprite || getSpriteForStage('rookie')}
          reducedMotion={reducedMotion}
          saveId={saveId}
          tz={tz.current}
          arvores={cla?.arvores ?? {}}
          onPlantio={cla?.onPlantio}
          onFio={() => void agir(() => guildThread(saveId, fioGoal, tz.current), {
            anunciar: 'guild.bosque.fio.toast',
            depois: () => track('guild_thread', { kind: 0 }),
          })}
        />
    );
    const renderPredio = (id: PredioId) => {
      const comum = {
        saveId, language, t, guild: g, tz: tz.current, reducedMotion, mySprite: mySprite || getSpriteForStage('rookie'),
        onReward: cla!.onReward, onAnnounce: setAnuncio,
      };
      if (id === 'praca') return <SalaPraca {...comum} itens={casa ? { ownedFurniture: casa.ownedFurniture, equippedDecor: casa.equippedDecor } : undefined} />;
      if (id === 'plantio') return <SalaPlantio {...comum} />;
      return <SalaMisterio {...comum} />;
    };
    corpo = room === 'guerra' ? (
      <>
        {alerta}
        {salaGuerra}
      </>
    ) : room === 'grove' ? (
      <>
        {alerta}
        {resgate}
        <div className="sm2-stats-card">{salaBosque}</div>
        {/* W14b: o gesto (fio/gestos) e o PLANTIO do Bosque moram só aqui; o Clan Hall é informativo. O MISTÉRIO é da Feira (dono, 20/10: "o mistério é da feira"). */}
        {/* L5-D2: sem Aceno/Luz/Descanso e sem 'Entrar'/'Fechar' do predio: o jardim abre direto. */}
        {cla && (
          <div className="sm2-stats-card" data-guild-card="plantio">
            {renderPredio('plantio')}
          </div>
        )}
      </>
    ) : room === 'feira' ? (
      <>
        {alerta}
        <SalaFeira
          guild={g}
          t={t}
          language={language}
          ocupado={ocupado}
          reducedMotion={reducedMotion}
          resgate={resgate}
          resgateAberto={!!(rewards?.pending[0] || colhido)}
          missao={missao}
          onRodada={() => void agir(() => hitGuildRaid(saveId, tz.current), {
            anunciar: 'guild.feira.rodada.feita',
            depois: () => track('guild_raid', { outcome: 0 }),
          })}
        />
        {/* O MISTÉRIO mora aqui, junto da missão e da rodada (dono, 20/10/2026); sai do Grove. */}
        {cla && (
          <div className="sm2-stats-card" data-guild-card="misterio">
            <SalaPredios t={t} ids={['misterio']} titulo="guild.feira.predios.titulo" aberto={predio} onAbrir={setPredio} render={renderPredio} />
          </div>
        )}
      </>
    ) : (
      <>
        {alerta}
        {resgate}
        <div className="sm2-stats-card">
          <div className="sm2-guild-hd">
            {/* O nome quebra em qualquer ponto (QA #4) e é o alvo do foco depois de uma ação. */}
            <h2 className="sm2-lib-h2 sm2-guild-name">{g.name}</h2>
            {g.isHost && (
              <button
                type="button"
                className="sm2-lib-act"
                aria-label={t('guild.ajustes.aria')}
                title={t('guild.ajustes.aria')}
                aria-expanded={ajustes}
                aria-controls={ajustesId}
                onClick={() => { setAjustes(a => !a); setNovoNome(g.name); }}
                style={{ width: 'auto', padding: '0 12px', gap: 6, fontSize: 'var(--sm2-text-sm)' }}
              >
                <Icon name="settings" size={24} fill={ajustes ? 1 : 0} tone={ajustes ? 'primary' : 'ink'} />
                <span>{t('guild.ajustes.rotulo')}</span>
              </button>
            )}
          </div>

          {/* D-09: a FICHA do clã, claramente rotulada — nome (acima), quantas pessoas e o nível. É o que já
              existe, só nomeado: não duplica a Roda (que traz os nomes) nem a Casa (que traz a linha do estágio). */}
          <section className="sm2-guild-info" aria-label={t('guild.info.titulo')} data-guild-room="info" data-cla-info>
            <h3 className="sm2-stats-lab" style={{ margin: 0 }}>{t('guild.info.titulo')}</h3>
            <p className="sm2-lib-s" style={{ margin: 0 }} data-cla-info-membros>{t('guild.info.membros')}{': '}<span className="sm2-num">{g.size}</span></p>
            {g.casa && <p className="sm2-lib-s" style={{ margin: 0 }} data-cla-info-nivel>{t('guild.info.nivel', { estagio: casaStageName(t, g.casa.nivel) })}</p>}
          </section>

          {g.isHost && ajustes && (
            <section id={ajustesId} className="sm2-guild-sec" aria-label={t('guild.ajustes.titulo')}>
              <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.ajustes.somenteAbriu')}</p>
              <label className="sm2-lib-s" style={{ fontWeight: 500 }} htmlFor={`${ajustesId}-renomear`}>{t('guild.ajustes.renomear')}</label>
              <Field
                id={`${ajustesId}-renomear`}
                value={novoNome}
                maxLength={GUILD_NAME_MAX}
                onChange={e => setNovoNome(e.target.value)}
              />
              <button
                type="button"
                disabled={semNovoNome}
                aria-disabled={semNovoNome ? true : undefined}
                onClick={() => void agir(() => renameGuild(saveId, novoNome.trim(), tz.current))}
                className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
              >
                {t('guild.ajustes.renomear.salvar')}
              </button>
              <button
                type="button"
                disabled={ocupado}
                aria-disabled={ocupado ? true : undefined}
                onClick={() => void agir(() => newGuildCode(saveId, tz.current))}
                className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
              >
                {t('guild.ajustes.codigoNovo')}
              </button>
              <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.ajustes.codigoNovo.nota')}</p>
            </section>
          )}

          <SalaRoda guild={g} t={t} nominal={nominal} />

          <div className="sm2-coop-code">
            <span className="sm2-lib-s">{t('guild.codigo.label')}</span>
            <code className="sm2-coop-cd sm2-num">{g.code}</code>
            <button
              type="button"
              onClick={() => void copiar(g.code)}
              className="sm2-lib-act"
              aria-label={t('guild.aria.codigo.copiar')}
              title={t('guild.codigo.copiar')}
            >
              <Icon name={copiado ? 'check' : 'content_copy'} size={24} fill={copiado ? 1 : 0} tone={copiado ? 'primary' : 'ink'} />
            </button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={() => void compartilhar(g)}
                className="sm2-lib-act"
                aria-label={t('guild.criar.compartilhar')}
                title={t('guild.criar.compartilhar')}
              >
                <Icon name="share" size={24} tone="ink" />
              </button>
            )}
            {copiado && <span className="sm2-lib-s" aria-hidden="true">{t('guild.codigo.copiado')}</span>}
          </div>
          {g.size <= 1 && <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.criar.codigo.corpo', { n: guildInviteRoom() })}</p>}

        </div>

        {/* D-57/D-107: o Clan Hall é ADMINISTRATIVO (nome, ficha, membros, código acima; Casa, Prédios e Mural abaixo). O Bosque, a Feira e a Guerra moram nos prédios próprios (Hall e Arena). */}
        {g.casa && (
        <div className="sm2-stats-card" data-guild-card="casa">
            <SalaCasa
              guild={g}
              t={t}
              language={language}
              ocupado={ocupado}
              casa={casa}
              onDoar={(bits) => void agir(async () => {
                const r = await donateToGuild(saveId, bits, tz.current);
                if (r.accepted > 0) casaRef.current?.onSpend(r.accepted);
                return r.guild;
              }, { anunciar: 'guild.casa.doar.ok' })}
              onSlot={(item) => void agir(async () => {
                const v = await setGuildSlot(saveId, item, tz.current);
                casaRef.current?.onSlot(v?.casa ? v.casa.mine.slot : item);
                return v;
              }, { anunciar: item ? 'guild.casa.slot.ok' : 'guild.casa.slot.volta' })}
            />
            <GuildLoja
              casa={g.casa}
              language={language}
              ocupado={ocupado}
              onComprar={(itemId) => void agir(async () => {
                // O `opId` vale por tentativa: se a rede cair e a pessoa tocar de novo, vai o MESMO (o servidor não cobra duas vezes).
                const opId = lojaOps.current.get(itemId) ?? `op-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
                lojaOps.current.set(itemId, opId);
                try {
                  const v = await buyGuildShopItem(saveId, itemId, opId, tz.current);
                  lojaOps.current.delete(itemId);
                  emitFeat('clanShopBuys');
                  return v;
                } catch (e) {
                  // 409 (saldo mudou / já é do clã): não é frase de tela; relê e o estado verdadeiro aparece.
                  if (e instanceof GuildError && e.status === 409) { lojaOps.current.delete(itemId); return await getGuild(saveId, tz.current); }
                  throw e;
                }
              })}
            />
        </div>
        )}

        {MOSTRAR_ITEM_E_PREDIOS && cla && (
        <div className="sm2-stats-card" data-guild-card="predios">
            <SalaPredios t={t} ids={['praca']} aberto={predio} onAbrir={setPredio} render={renderPredio} />
        </div>
        )}

        <div className="sm2-stats-card" data-guild-card="mural">
          <SalaMural guild={g} t={t} language={language} marcos={marcos} />
        </div>
        {/* Saída limpa (LV-G5): um toque, sem diálogo de confirmação e sem penalidade — e SEMPRE ao
            alcance (QA L3 M5): fixa no rodapé da folha, porque uma roda de 12 põe a saída a três telas
            de rolagem. Um "tem certeza?" aqui seria o app negociando com quem quer sair. A nota é só o
            fato. `outline`, nunca `quiet`/`ghost` (D-S10). */}
        <div className="sm2-guild-foot" data-guild-foot>
          <button
            type="button"
            disabled={ocupado}
            aria-disabled={ocupado ? true : undefined}
            onClick={() => {
              // A faixa de permanência sai da memória do aparelho ANTES de a saída a apagar.
              const local = readGroveLocal();
              const weeks = local ? permanenceBand(local.joinedDay, load.day) : 0;
              void agir(async () => { await leaveGuild(saveId); return null; }, {
                depois: () => track('guild_leave', { size: Math.max(0, Math.min(11, g.size - 1)), weeks }),
              });
            }}
            className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
            // D1: sair é vermelho (cor e borda), com o ícone de saída antes do texto.
            style={{ color: 'var(--sm2-danger-ink)', borderColor: 'var(--sm2-danger-ink)' }}
            data-guild-sair
          >
            <Icon name="logout" size={20} />
            {t('guild.sair.botao')}
          </button>
          <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.sair.nota')}</p>
        </div>
      </>
    );
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="sm2-guild" aria-label={t(room === 'feira' ? 'guild.feira.titulo' : room === 'guerra' ? 'guild.guerra.titulo' : room === 'grove' ? 'guild.bosque.titulo' : 'guild.aria.salao')} data-guild-sheet data-guild-room-open={room}>
      {/* Região viva SEMPRE montada (QA L1 BAIXO-3): o texto entra depois, e é
          assim que o leitor de tela anuncia — uma região que nasce preenchida não é lida. */}
      <div role="status" aria-live="polite" className="sm2-guild-sr" data-guild-status>{anuncio}</div>
      {corpo}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALAS — o Salão é um scroll com seções (`PLANO-GUILDA.md` §6). Cada uma é uma
// função para que a fatia B encaixe o visor, os gestos e o Mural sem reabrir
// esta tela.

type T = (k: GuildKey, vars?: Record<string, string | number>) => string;

/**
 * BOSQUE (topo): o visor (cenário do estágio + criaturas na linha do chão), o
 * nome do estágio e a linha dele, a faixa `perto` — UMA frase BINÁRIA, nunca
 * razão, contagem nem tempo estimado —, a regra sóbria e o fio.
 *
 * O fio ainda não firmado é SILÊNCIO (`guild.bosque.fio.ainda`): sem a meta
 * própria cumprida nem botão nem frase de explicação. O agregado (5+) só existe
 * com fio hoje e nunca leva número.
 */
function SalaBosque({ guild, t, language, metaDoDiaCumprida, ocupado, mySprite, reducedMotion, onFio, saveId, tz, arvores, onPlantio }: {
  guild: GuildView; t: T; language: Language; metaDoDiaCumprida: boolean; ocupado: boolean;
  mySprite: string; reducedMotion: boolean; onFio: () => void;
  saveId: string; tz: PlayerDayAnchor | undefined; arvores: BosqueArvores; onPlantio?: OnPlantio;
}) {
  const [panorama, setPanorama] = useState(false);
  const { stage, stageIndex, perto } = guild.bosque;
  const fioHoje = guild.mine.threadToday;
  const podeFirmar = !fioHoje && metaDoDiaCumprida;
  // 5+: UMA frase qualitativa, só com fio; nunca número, nunca `{n}`.
  const agregado = guild.threadedToday === true;
  const nomeDoEstagio = stage ? groveStageName(language, stage) : null;
  // "Perto de …" aponta para o PRÓXIMO estágio (o índice é a ordem; sem próximo, sem faixa).
  const proximo = perto && stageIndex < GROVE_STAGES.length ? groveStageName(language, GROVE_STAGES[stageIndex]) : null;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.bosque.titulo')} data-guild-room="bosque">
      {/* D-49/D-55/D-56: o Bosque é UM cenário; aqui a janela dele (membros andando), no lugar do antigo visor vetorial da Casa. */}
      <div style={{ position: 'relative' }}>
        <GroveCena language={language} guild={guild} mySprite={mySprite} reducedMotion={reducedMotion} />
        {/* L5-D2: entrar e secundario e discreto, DENTRO do box do preview. */}
        <button type="button" data-guild-bosque-entrar onClick={() => setPanorama(true)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" style={{ position: 'absolute', right: 8, bottom: 8, opacity: 0.85 }}>
          <Icon name="eco" size={20} />
          {t('guild.bosque.entrar')}
        </button>
      </div>
      {/* D-32: o panorama do Bosque abre AQUI (Hall > Guilda), em tela cheia; não há visor embutido na folha. */}
      {panorama && (
        <Suspense fallback={null}>
          <GroveFolha saveId={saveId} language={language} guild={guild} mySprite={mySprite} tz={tz} reducedMotion={reducedMotion} arvores={arvores} onPlantio={onPlantio} onClose={() => setPanorama(false)} />
        </Suspense>
      )}
      {/* O que CHEGOU vem colado ao visor, no topo da folha (QA L3 M3/B7): antes ficava a 550 px, abaixo
          da dobra, e com o mesmo estilo de uma linha de membro — lia-se como gente. Só o tipo, em lote,
          sem quem e sem quantos; sem nada quando não veio nenhum. */}
      {guild.gestures.length > 0 ? (
        <ul className="sm2-grove-recv" data-guild-recebidos>
          {guild.gestures.map(k => (
            <li key={k}>
              <Icon name={GESTO_ICONE[k]} size={20} tone="primary" />
              <span>{guildGestureReceived(language, k)}</span>
            </li>
          ))}
        </ul>
      ) : guild.gestureReceived && (
        // Roda de 2: o servidor não manda o TIPO (B5) — só o fato de que chegou algo.
        <p className="sm2-grove-recv" data-guild-recebidos>{t('guild.gesto.recebido.agregado')}</p>
      )}
      {stage && (
        <>
          <h3 className="sm2-grove-stage" data-guild-stage>{nomeDoEstagio}</h3>
          <p className="sm2-grove-line">{groveStageLine(language, stage)}</p>
        </>
      )}
      {proximo && <p className="sm2-grove-line" data-guild-perto>{t('guild.bosque.perto', { estagio: proximo })}</p>}
      {/* K6 (04/10/2026): a regra do bosque mora atrás do "?". */}
      {/* D-106: o "i" do Grove mora na linha do título do modal (canto direito), não no corpo. */}
      <ModalInfo language={language} label={language === 'pt-BR' ? 'Como o bosque cresce' : 'How the grove grows'}>{t('guild.bosque.regra')}</ModalInfo>
      {fioHoje && <p className="sm2-stats-t" style={{ margin: 0 }}>{t('guild.bosque.fio.hoje')}</p>}
      {podeFirmar && (
        <button
          type="button"
          disabled={ocupado}
          aria-disabled={ocupado ? true : undefined}
          aria-busy={ocupado ? true : undefined}
          aria-label={t('guild.aria.fio')}
          onClick={onFio}
          className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn"
        >
          <Icon name={ocupado ? 'sync' : 'check_circle'} size={20} className={ocupado ? 'animate-spin' : undefined} />
          {t('guild.bosque.fio.botao')}
        </button>
      )}
      {agregado && <p className="sm2-lib-s" style={{ margin: 0 }} data-guild-agregado>{t('guild.bosque.agregado.um')}</p>}
    </section>
  );
}

/**
 * A GUERRA 4×4 (PR4): o visor do esquadrão contra silhuetas, o botão de procurar (pareia POR TAMANHO) e o
 * último resultado — como marcas por confronto, nunca números. Perder não custa nada e a casa recebe a seiva.
 */
function SalaGuerra({ guild, t, language, war, hoje, ocupado, mySprite, reducedMotion, onBuscar }: {
  guild: GuildView; t: T; language: Language; war: GuildWar; /** O dia do jogador (a âncora do save). */ hoje: string; ocupado: boolean; mySprite: string; reducedMotion: boolean; onBuscar: () => void;
}) {
  const isPt = language === 'pt-BR';
  const jaHoje = war.last?.day === hoje;
  const enemyCount = war.waiting?.size ?? war.last?.size ?? Math.min(4, Math.max(2, guild.size));
  const pequena = guild.size < 2;
  const ICONE = { win: 'check_circle', draw: 'do_not_disturb_on', loss: 'radio_button_unchecked' } as const;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.guerra.titulo')} data-guild-room="guerra">
      <GuerraVisor guild={guild} mySprite={mySprite} enemyCount={enemyCount} reducedMotion={reducedMotion} label={t('guild.aria.guerra')} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <h3 className="sm2-grove-stage" style={{ margin: 0 }}>{t('guild.guerra.titulo')}</h3>
        <InfoTip language={language} label={isPt ? 'Como funciona a guerra' : 'How the war works'} align="right" style={{ marginRight: -8 }}>{t('guild.guerra.regra')}</InfoTip>
      </div>
      {war.last && (
        <>
          <ul className="sm2-grove-recv" data-guerra-duelos style={{ display: 'flex', justifyContent: 'center', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
            {war.last.duels.map((d, i) => (
              <li key={i} aria-label={t(`guild.guerra.duelo.${d}`)} data-guerra-duelo={d}>
                <Icon name={ICONE[d]} size={24} tone={d === 'win' ? 'primary' : 'muted'} fill={d === 'win' ? 1 : 0} />
              </li>
            ))}
          </ul>
          <p className="sm2-stats-t" style={{ margin: 0 }} data-guerra-resultado={war.last.outcome}>
            {t(`guild.guerra.resultado.${war.last.outcome}`, { nome: war.last.enemy })}
          </p>
        </>
      )}
      {war.waiting ? (
        <p className="sm2-lib-s" style={{ margin: 0 }} data-guerra-esperando>{t('guild.guerra.esperando')}</p>
      ) : jaHoje ? (
        <p className="sm2-lib-s" style={{ margin: 0 }} data-guerra-hoje>{t('guild.guerra.hoje')}</p>
      ) : pequena ? (
        <p className="sm2-lib-s" style={{ margin: 0 }} data-guerra-pequena>{t('guild.guerra.pequena')}</p>
      ) : (
        <button type="button" data-guerra-buscar disabled={ocupado} aria-disabled={ocupado ? true : undefined} aria-busy={ocupado ? true : undefined} onClick={onBuscar} className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn">
          <Icon name={ocupado ? 'sync' : 'swords'} size={20} className={ocupado ? 'animate-spin' : undefined} />
          {t('guild.guerra.buscar')}
        </button>
      )}
    </section>
  );
}

const casaStageName = (t: T, nivel: CasaStageId): string => t(`guild.casa.nivel.${nivel}`);

const PREDIOS: ReadonlyArray<{ id: PredioId; titulo: GuildKey; icone: string }> = [
  { id: 'praca', titulo: 'guild.praca.titulo', icone: 'storefront' },
  { id: 'plantio', titulo: 'guild.plantio.titulo', icone: 'eco' },
  { id: 'misterio', titulo: 'guild.misterio.titulo', icone: 'search' },
];

/**
 * OS PRÉDIOS DO CLÃ: Praça, Plantio e Mistério. Três portas; abrir uma mostra o prédio por baixo e é SÓ então
 * que ele fala com o servidor (três leituras a mais ao abrir o Salão seriam peso à toa). Um aberto por vez;
 * tocar de novo na mesma porta (ou em "Fechar") a fecha.
 */
function SalaPredios({ t, ids, titulo = 'guild.predios.titulo', aberto, onAbrir, render }: {
  t: T; ids: ReadonlyArray<PredioId>; titulo?: GuildKey; aberto: PredioId | null; onAbrir: (id: PredioId | null) => void; render: (id: PredioId) => React.ReactNode;
}) {
  return (
    <section className="sm2-guild-sec" aria-label={t(titulo)} data-guild-room="predios">
      <h3 className="sm2-stats-lab">{t(titulo)}</h3>
      <div role="group" aria-label={t(titulo)} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PREDIOS.filter(p => ids.includes(p.id)).map(p => (
          <button
            key={p.id}
            type="button"
            data-predio={p.id}
            aria-pressed={aberto === p.id}
            onClick={() => onAbrir(aberto === p.id ? null : p.id)}
            className={`sm2-kit-btn sm2-kit-btn-md ${aberto === p.id ? 'sm2-kit-btn-primary' : 'sm2-kit-btn-outline'}`}
            style={{ flex: '1 1 0' }}
          >
            <Icon name={p.icone} size={20} fill={aberto === p.id ? 1 : 0} />
            {t(p.titulo)}
          </button>
        ))}
      </div>
      {aberto && render(aberto)}
      {aberto && (
        <button type="button" data-predio-fechar onClick={() => onAbrir(null)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline">
          <Icon name="close" size={20} />
          {t('guild.predios.fechar')}
        </button>
      )}
    </section>
  );
}

/**
 * A CASA (PR2): o nome do estágio, a linha, `perto` (binário), a doação de Bits e o SEU cantinho.
 * Nada aqui tem número por pessoa: a doação mostra só os botões e a constatação ("a casa recebeu o que
 * você trouxe"); o teto do dia é "é o bastante", nunca contagem. O visor mora no topo do Bosque.
 */
/** L5-D1: 'Place an Item' e 'Clan Buildings' ficam ocultos no Clan Hall (nao apagados). */
const MOSTRAR_ITEM_E_PREDIOS = false;

function SalaCasa({ guild, t, language, ocupado, casa, onDoar, onSlot }: {
  guild: GuildView; t: T; language: Language; ocupado: boolean;
  casa: GuildSheetProps['casa']; onDoar: (bits: number) => void; onSlot: (item: string | null) => void;
}) {
  const c = guild.casa!;
  const isPt = language === 'pt-BR';
  const [lista, setLista] = useState(false);
  const proximo = c.perto && c.nivelIndex < CASA_STAGES.length - 1 ? casaStageName(t, CASA_STAGES[c.nivelIndex + 1]) : null;
  const nome = (id: string) => { const it = ALL_SHOP_ITEMS.find(x => x.id === id); return it ? (isPt ? it.namePt : it.nameEn) : id; };
  const bits = casa?.bits ?? 0;
  const livres = casa ? donatableItems({ ownedFurniture: casa.ownedFurniture, equippedDecor: casa.equippedDecor as never }) : [];
  const meu = c.mine.slot;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.casa.titulo')} data-guild-room="casa">
      <h3 className="sm2-grove-stage" data-casa-nivel>{casaStageName(t, c.nivel)}</h3>
      <p className="sm2-grove-line">{t(`guild.casa.linha.${c.nivel}`)}</p>
      {proximo && <p className="sm2-grove-line" data-casa-perto>{t('guild.casa.perto', { estagio: proximo })}</p>}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <InfoTip language={language} label={isPt ? 'Como a casa cresce' : 'How the house grows'} style={{ minHeight: 28 }}>{t('guild.casa.regra')}</InfoTip>
      </div>

      {/* W14b: "Bring Bits" é a seção de Bits do clã: o TOTAL (um número do clã, nunca por pessoa) e, com carteira, o gesto de trazer. */}
      <p className="sm2-stats-t" style={{ margin: 0 }} data-casa-bits-titulo>{t('guild.casa.doar.titulo')}</p>
      {c.bitsTotal !== null && <p className="sm2-lib-s" style={{ margin: 0 }} data-casa-bits-total>{t('guild.casa.bits.total', { n: c.bitsTotal })}</p>}
      {casa && (
        <>
          {c.mine.capReached ? (
            <p className="sm2-lib-s" style={{ margin: 0 }} data-casa-teto>{t('guild.casa.doar.teto')}</p>
          ) : bits < CASA_BITS_MIN ? (
            <p className="sm2-lib-s" style={{ margin: 0 }} data-casa-sem-bits>{t('guild.casa.doar.semBits')}</p>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {CASA_DOACOES.map(d => (
                <button
                  key={d}
                  type="button"
                  data-casa-doar={d}
                  disabled={ocupado || bits < d}
                  aria-disabled={ocupado || bits < d ? true : undefined}
                  onClick={() => onDoar(d)}
                  className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline sm2-guild-btn"
                >
                  <Icon name="diamond" size={20} />
                  {t('guild.casa.doar.botao', { bits: d })}
                </button>
              ))}
            </div>
          )}

          {MOSTRAR_ITEM_E_PREDIOS && <>
          <p className="sm2-stats-t" style={{ margin: 0 }}>{t('guild.casa.slot.titulo')}</p>
          {meu ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-casa-meu-slot>
              {DECOR_ART[meu] && <img src={DECOR_ART[meu]} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
              <span className="sm2-lib-s" style={{ flex: 1, minWidth: 0, margin: 0 }}>{nome(meu)}</span>
              <button type="button" data-casa-tirar disabled={ocupado} aria-disabled={ocupado ? true : undefined} onClick={() => onSlot(null)} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline">
                <Icon name="undo" size={20} />
                {t('guild.casa.slot.tirar')}
              </button>
            </div>
          ) : (
            <>
              <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.casa.slot.vazio')}</p>
              {livres.length === 0 ? (
                <p className="sm2-lib-s" style={{ margin: 0 }} data-casa-sem-itens>{t('guild.casa.slot.nenhum')}</p>
              ) : !lista ? (
                <button type="button" data-casa-escolher disabled={ocupado} onClick={() => setLista(true)} className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline sm2-guild-btn">
                  <Icon name="inventory_2" size={20} />
                  {t('guild.casa.slot.escolher')}
                </button>
              ) : (
                <ul className="sm2-grove-list" data-casa-itens>
                  {livres.map(id => (
                    <li key={id}>
                      <button type="button" data-casa-item={id} disabled={ocupado} onClick={() => { setLista(false); onSlot(id); }} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        {DECOR_ART[id] && <img src={DECOR_ART[id]} alt="" width={24} height={24} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
                        {nome(id)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.casa.slot.aviso')}</p>
            </>
          )}
          </>}
        </>
      )}
    </section>
  );
}

/** Os três gestos e o que cada um pede ao `Icon`. Todos estão no inventário do subset (`tokens.md`). */
const GESTO_ICONE: Record<GuildGesture, string> = { aceno: 'pan_tool', luz: 'light_mode', descanso: 'bedtime' };

/**
 * RODA: nomes na ORDEM DE CHEGADA (a que o servidor manda — nunca reordenada).
 * ≤4: a marca "no bosque hoje" SÓ em quem veio; quem não veio fica sem marca,
 * sem ícone e sem cor apagada (LV-G2). 5+: só nomes, ninguém tem estado.
 *
 * GESTOS: três fixos, anônimos, para a RODA INTEIRA (nunca uma pessoa escolhida);
 * um de cada por dia — depois de mandado o botão diz "enviado" e não oferece de
 * novo (sem "amanhã pode"). Os recebidos chegam em LOTE: só o tipo, sem quem e
 * sem quantos, e sem nada quando não veio nenhum. Roda de uma pessoa só não tem
 * para quem gesticular: a fileira não é desenhada.
 */
function SalaRoda({ guild, t, nominal }: {
  guild: GuildView; t: T; nominal: boolean;
}) {
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.aria.roda')} data-guild-room="roda">
      <div className="sm2-guild-secHd">
        <h3 className="sm2-stats-lab">{t('guild.roda.titulo')}</h3>
        <span className="sm2-lib-s sm2-num">{t('guild.roda.contagem', { n: guild.size })}</span>
      </div>
      <ul className="sm2-coop-mem">
        {guild.members.map((m, i) => (
          <li key={m.id ?? `m${i}`}>
            <span className="t">{m.name ?? t('guild.roda.alguem')}</span>
            {m.euMesmo && (
              <span className="sm2-guild-you">
                {/* O ponto é enfeite: o leitor de tela lê só "você", não "ponto você". */}
                <span aria-hidden="true">{t('guild.roda.voce')}</span>
                <span className="sm2-guild-sr">{t('guild.roda.voce').replace(/^[·\s]+/, '')}</span>
              </span>
            )}
            {nominal && m.apareceuHoje === true && <span className="sm2-guild-pres">{t('guild.roda.presente')}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * MURAL: o que o bosque já virou — os marcos e as peças de maré colhidas. Só
 * FATOS e DATAS: nenhum número por pessoa, ninguém que chegou ou saiu, nenhum
 * "próximo marco em …". Vazio é SILÊNCIO — sem marco nem peça, nem o título é
 * desenhado. A data do marco é a que ESTE aparelho viu; quando o aparelho não a
 * conhece (a roda já era Copa quando ele chegou), a linha é só o nome.
 */
function SalaMural({ guild, t, language, marcos }: {
  guild: GuildView; t: T; language: Language; marcos: Record<string, string>;
}) {
  const { stageIndex, ornaments } = guild.bosque;
  // Estágio SEM data (este aparelho não o presenciou) é SILÊNCIO: uma palavra solta ao lado de outras
  // com data lê-se como lacuna — e "desde antes de você" seria uma frase nova sobre a ausência (QA L3 B3).
  const estagios = GROVE_STAGES.slice(0, stageIndex).filter((_, i) => !!(marcos[String(i + 1)] && formatDayLabel(marcos[String(i + 1)], language)));
  if (estagios.length === 0 && ornaments.length === 0) return null;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.aria.mural')} data-guild-room="mural">
      <h3 className="sm2-stats-lab">{t('guild.mural.titulo')}</h3>
      <ul className="sm2-grove-list">
        {estagios.map(id => {
          const i = GROVE_STAGES.indexOf(id);
          const nome = groveStageName(language, id);
          const data = formatDayLabel(marcos[String(i + 1)], language);
          return <li key={id} data-mural-marco={id}>{t('guild.mural.marco', { estagio: nome, data })}</li>;
        })}
        {ornaments.map((o, i) => {
          const data = formatDayLabel(o.day, language);
          return (
            <li key={`${o.tide}-${i}`} data-mural-mare={o.size}>
              <span className="n">{tideSizeName(language, o.size)}</span>
              {data ? <>{' · '}{t('guild.mural.mare', { data })}</> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * FEIRA: o fenômeno da semana e UM botão. O fenômeno é tempo da Malha (uma camada que não
 * assentou), nunca adversário com gente — e a tela NUNCA mostra HP, dano, contagem de rodadas
 * nem quem bateu (LV-G1): o servidor não os manda, e o único sinal do quanto já foi feito é o
 * BOOLEANO `ferido`, que só muda o desenho.
 *
 * "Rodada feita" é SILÊNCIO para quem não a fez: nenhum texto de cobrança ("faltam", "ainda não
 * fez", "volte amanhã"); depois de mandada, o mesmo botão fica desabilitado dizendo o fato
 * (`guild.feira.rodada.feita`). Semana dissipada não tem botão. O resultado da semana que fechou
 * (`lastWeek`) é um fato, nunca um veredito: `recuou` não culpa ninguém.
 */
function SalaFeira({ guild, t, language, ocupado, reducedMotion, resgate, resgateAberto, onRodada, missao }: {
  guild: GuildView; t: T; language: Language; ocupado: boolean; reducedMotion: boolean;
  resgate: React.ReactNode; resgateAberto: boolean; onRodada: () => void;
  /** No Salão (PR3) a rodada é a MISSÃO: mandar o Solmon, esperar a volta. Sem isto, a Feira antiga (rodada de um toque). */
  missao?: GuildSheetProps['missao'];
}) {
  const raid = guild.raid;
  // Telemetria de leitura (1 = viu dissipada, 2 = viu recuou): uma vez por semana e estado.
  const semana = raid?.weekKey ?? '';
  const estado = raid?.state;
  const passada = raid?.lastWeek ?? null;
  useEffect(() => {
    if (!raid) return;
    const marca = (chave: string, outcome: 1 | 2) => {
      if (raidVista.has(chave)) return;
      raidVista.add(chave);
      track('guild_raid', { outcome });
    };
    if (estado === 'dissipada') marca(`${semana}:atual:dissipada`, 1);
    else if (passada) marca(`${semana}:passada:${passada}`, passada === 'dissipada' ? 1 : 2);
  }, [raid, semana, estado, passada]);

  if (!raid) {
    // O servidor não mandou a Feira (versão antiga): nada a desenhar, e nada a explicar.
    return <section className="sm2-guild-sec" aria-label={t('guild.feira.titulo')} data-guild-room="feira">{resgate}</section>;
  }
  const nome = t(`guild.feira.fenomeno.${raid.phenomenon}.nome`);
  const dissipada = raid.state === 'dissipada';
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.feira.titulo')} data-guild-room="feira">
      {resgate}
      {/* O cartão do resgate já diz "se desfez diante da roda": dizer de novo, uma linha acima, é eco (QA L3 B2). */}
      {!(dissipada && resgateAberto) && (
        <p className="sm2-stats-t" style={{ margin: 0 }} data-feira-cabecalho>
          {t(dissipada ? 'guild.feira.dissipado.mundo' : 'guild.feira.aberta.mundo')}
        </p>
      )}
      <FeiraVisor raid={raid} reducedMotion={reducedMotion} label={t(dissipada ? 'guild.aria.feira.dissipado' : raid.ferido ? 'guild.aria.feira.ferido' : 'guild.aria.feira', { nome })} />
      {/* I9 (02/10/2026): "não sei como a Feira funciona" — a explicação (e a linha sóbria da
          Honra) saiu da sala e mora atrás do "?" ao lado do nome do fenômeno. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <h3 className="sm2-grove-stage" data-feira-fenomeno style={{ margin: 0 }}>{nome}</h3>
        <InfoTip language={language} label={missao ? (language === 'pt-BR' ? 'Como funciona a missão' : 'How the mission works') : (language === 'pt-BR' ? 'Como funciona a Feira' : 'How the Fair works')} align="right" style={{ marginRight: -8 }}>
          {missao && <span data-missao-regra style={{ display: 'block' }}>{t('guild.missao.regra')}</span>}
          <span data-feira-legenda style={{ display: 'block', marginTop: missao ? 6 : 0 }}>{t('guild.feira.legenda')}</span>
          {!missao && <span data-feira-como style={{ display: 'block', marginTop: 6 }}>{t('guild.feira.como')}</span>}
          <span data-feira-ganho style={{ display: 'block', marginTop: 6 }}>{t('guild.feira.ganho')}</span>
          <span style={{ display: 'block', marginTop: 6 }}>{t('guild.feira.sobria', { cheio: RAID_EMBLEMS, piso: RAID_EMBLEMS_FLOOR })}</span>
        </InfoTip>
      </div>
      <p className="sm2-grove-line">{t(`guild.feira.fenomeno.${raid.phenomenon}.linha`)}</p>
      {!dissipada && raid.lastWeek && !resgateAberto && (
        <p className="sm2-lib-s" style={{ margin: 0 }} data-feira-semana-passada={raid.lastWeek}>
          {t(raid.lastWeek === 'dissipada' ? 'guild.feira.dissipado.mundo' : 'guild.feira.recuou.mundo')}
        </p>
      )}
      {!dissipada && !missao && (
        <button
          type="button"
          data-feira-rodada
          disabled={ocupado || raid.hitToday}
          aria-disabled={ocupado || raid.hitToday ? true : undefined}
          aria-busy={ocupado ? true : undefined}
          aria-label={raid.hitToday ? t('guild.feira.rodada.feita') : t('guild.aria.rodada')}
          onClick={onRodada}
          className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn"
        >
          <Icon name={ocupado ? 'sync' : raid.hitToday ? 'check_circle' : 'arrow_forward'} size={20} className={ocupado ? 'animate-spin' : undefined} />
          {raid.hitToday ? t('guild.feira.rodada.feita') : t('guild.feira.rodada.botao')}
        </button>
      )}
      {!dissipada && missao && (() => {
        const fora = isMissionAway(missao.state, Date.now());
        const hora = missao.state ? new Date(missao.state.returnAt).toLocaleTimeString(language === 'pt-BR' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';
        if (fora) return <p className="sm2-stats-t" style={{ margin: 0 }} data-missao-fora>{t('guild.missao.fora', { hora })}</p>;
        if (raid.hitToday) return <p className="sm2-lib-s" style={{ margin: 0 }} data-missao-feita>{t('guild.missao.feita')}</p>;
        return (
          <button
            type="button"
            data-missao-mandar
            disabled={ocupado || !!missao.state}
            aria-disabled={ocupado || missao.state ? true : undefined}
            onClick={missao.onSend}
            className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn"
          >
            <Icon name="search" size={20} />
            {t('guild.missao.mandar')}
          </button>
        );
      })()}
    </section>
  );
}

/**
 * O RESGATE: um cartão sóbrio, sem cerimônia que se feche sozinha nem contagem regressiva. Só
 * aparece com direito pendente (ou logo depois de colher, com o fato). "Colher" é UM gesto; erro de
 * rede não credita e deixa tentar de novo. O texto da semana é o da própria Feira — nunca "você
 * ganhou/perdeu": dissipada e recuou pagam, e `recuou` continua sem culpa.
 */
function ResgateFeira({ t, pending, colhido, erro, ocupado, onColher }: {
  t: T; pending: GuildRewards['pending'][number] | null; colhido: { n: number; trophy: boolean } | null;
  erro: boolean; ocupado: boolean; onColher: (week: string) => void;
}) {
  if (!pending && !colhido) return null;
  return (
    <div className="sm2-stats-card sm-milestone-pop" data-feira-resgate>
      {pending && (
        <>
          <p className="sm2-stats-t" style={{ margin: 0 }}>{t(pending.outcome === 'dissipada' ? 'guild.feira.dissipado.mundo' : 'guild.feira.recuou.mundo')}</p>
          {erro && <p role="alert" className="sm2-lib-alert" data-feira-colher-erro>{t('guild.erro.semRede')}</p>}
          <button
            type="button"
            data-feira-colher
            disabled={ocupado}
            aria-disabled={ocupado ? true : undefined}
            aria-busy={ocupado ? true : undefined}
            onClick={() => onColher(pending.week)}
            className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn"
          >
            <Icon name={ocupado ? 'sync' : 'military_tech'} size={20} fill={ocupado ? 0 : 1} className={ocupado ? 'animate-spin' : undefined} />
            {t('guild.feira.colher.botao')}
          </button>
        </>
      )}
      {colhido && (
        <>
          <p className="sm2-stats-t" style={{ margin: 0 }} data-feira-colhido>{t('guild.feira.colhido', { n: colhido.n })}</p>
          {colhido.trophy && <p className="sm2-lib-s" style={{ margin: 0 }} data-feira-concha>{t('guild.concha.chegou')}</p>}
        </>
      )}
    </div>
  );
}
