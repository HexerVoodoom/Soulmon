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
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  getGuild, createGuild, joinGuild, guildThread, guildGesture, leaveGuild, renameGuild, newGuildCode,
  hitGuildRaid, getGuildRewards, claimGuildReward,
  GuildError, type GuildErrorKind, type GuildView, type GuildGoal, type GuildRaid, type GuildRewards,
} from '../../utils/community';
import { playerDayKey, type PlayerDayAnchor } from '../../utils/playerDay';
import {
  guildText, guildInviteRoom, GUILD_ERROR_KEY, groveStageName, groveStageLine, guildGestureName,
  guildGestureSent, guildGestureReceived, tideSizeName, type GuildKey,
} from '../../utils/guildCopy';
import {
  GUILD_NAME_MAX, GUILD_CODE_LENGTH, GUILD_PRESENCE_NOMINAL_MAX, GUILD_GESTURES, GROVE_STAGES,
  RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, normalizeGuildCode, type GuildGesture,
} from '../../utils/guildRules';
import { hasClaimedReceipt, rememberClaimedReceipt } from '../../utils/guildClaimLocal';
import {
  observeGuildView, readGroveLocal, permanenceBand, formatDayLabel,
} from '../../utils/groveLocal';
import { track } from '../../utils/telemetry';
import { getSpriteForStage } from '../../utils/sprites';
// ⚠️ Todo `name` de ícone tem de estar no inventário de `icon_names` de
// `src/styles/tokens.md`: a fonte é SUBSETADA, e um nome fora dele renderiza um
// <span> VAZIO — sem erro e sem aparecer em teste nenhum.
import { Icon } from '../ui/Icon';
import { Field } from '../form/FormKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { GroveVisor } from './GroveVisor';
import { FeiraVisor } from './FeiraVisor';
import type { Language } from '../../utils/i18n';

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
  room?: 'salao' | 'feira';
  /** O resgate da Feira foi confirmado pelo servidor: soma os Emblemas pelo MESMO caminho do Torneio
   *  e, se veio a Concha da Maré, a põe em `ownedFurniture`. A folha só chama UMA vez por recibo. */
  onClaimed?: (claim: { emblems: number; trophyId: string | null }) => void;
  /** Cenários `bg-guild-*` que o servidor já liberou (ficam com quem sai — G12). */
  onScenes?: (ids: string[]) => void;
}

/** `guild_raid` 1/2 (viu dissipada / viu recuou): UMA vez por semana e estado, por execução do app. */
const raidVista = new Set<string>();
/** Só para teste: a memória acima é do módulo. */
export const resetRaidTelemetryForTests = () => raidVista.clear();

type Load =
  | { status: 'loading' }
  | { status: 'error'; kind: GuildErrorKind }
  | { status: 'ready'; guild: GuildView | null; day: string };

const kindOf = (e: unknown): GuildErrorKind => (e instanceof GuildError ? e.kind : 'server');

export function GuildSheet({ saveId, language, metaDoDiaCumprida, fioGoal, mySprite, playerDayTz, room = 'salao', onClaimed, onScenes }: GuildSheetProps) {
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

  const rootRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(false);
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
    return () => {
      vivo.current = false;
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
    if (obs?.firstSeenStage) track('guild_stage', { level: obs.firstSeenStage });
  }, [load]);

  // O RESGATE: pergunta ao abrir (Salão e Feira) e de novo quando o estado da Feira muda (a rodada
  // que dissipa o fenômeno abre o direito da semana corrente). Falha é SILÊNCIO: nada a colher é
  // o estado normal, e uma tela de erro por isso seria ruído.
  const chaveDaFeira = load.status === 'ready' && load.guild
    ? `${load.guild.id}|${load.guild.raid?.weekKey ?? ''}|${load.guild.raid?.state ?? ''}|${load.guild.raid?.lastWeek ?? ''}`
    : '';
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
   *  · 409 `already claimed` / 404 `nothing to claim` → SILÊNCIO (o direito some, sem frase);
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
    try {
      const c = await claimGuildReward(saveId, week, tz.current);
      const novo = !hasClaimedReceipt(c.receipt);
      if (novo) {
        onClaimedRef.current?.({ emblems: c.emblems, trophyId: c.trophy ? c.trophyId : null });
        rememberClaimedReceipt(c.receipt);
      }
      if (!vivo.current) return;
      tirar();
      if (novo) {
        setColhido({ n: c.emblems, trophy: c.trophy });
        setAnuncio(t('guild.feira.colhido', { n: c.emblems }));
      }
    } catch (e) {
      if (!vivo.current) return;
      const kind = kindOf(e);
      if (kind === 'alreadyClaimed' || kind === 'nothingToClaim') tirar();
      else if (kind === 'login') setLoad({ status: 'error', kind });
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
    corpo = (
      <div className="sm2-guild-sec">
        <p role="alert" className="sm2-lib-alert">{t(GUILD_ERROR_KEY[load.kind])}</p>
        {load.kind !== 'login' && (
          <button type="button" onClick={() => void carregar(false)} className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}>
            <Icon name="refresh" size={20} />
            {t('guild.erro.tentar')}
          </button>
        )}
      </div>
    );
  } else if (!load.guild) {
    const semNome = ocupado || !nome.trim();
    const semCodigo = ocupado || codigo.length < GUILD_CODE_LENGTH;
    corpo = (
      <>
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
          />
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
              />
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
    corpo = room === 'feira' ? (
      <>
        {alerta}
        <SalaFeira
          guild={g}
          t={t}
          language={language}
          ocupado={ocupado}
          reducedMotion={reducedMotion}
          resgate={resgate}
          onRodada={() => void agir(() => hitGuildRaid(saveId, tz.current), {
            anunciar: 'guild.feira.rodada.feita',
            depois: () => track('guild_raid', { outcome: 0 }),
          })}
        />
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
              >
                <Icon name="settings" size={24} fill={ajustes ? 1 : 0} tone={ajustes ? 'primary' : 'ink'} />
              </button>
            )}
          </div>

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

          <SalaBosque
            guild={g}
            t={t}
            language={language}
            metaDoDiaCumprida={metaDoDiaCumprida}
            ocupado={ocupado}
            mySprite={mySprite || getSpriteForStage('rookie')}
            reducedMotion={reducedMotion}
            onFio={() => void agir(() => guildThread(saveId, fioGoal, tz.current), {
              anunciar: 'guild.bosque.fio.toast',
              depois: () => track('guild_thread', { kind: 0 }),
            })}
          />

          <SalaRoda
            guild={g}
            t={t}
            language={language}
            nominal={nominal}
            ocupado={ocupado}
            onGesto={(k) => void agir(() => guildGesture(saveId, k, tz.current), {
              anunciar: `guild.gesto.${k}.enviado`,
            })}
          />

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

          <SalaMural guild={g} t={t} language={language} marcos={marcos} />

          {/* Saída limpa (LV-G5): um toque, sem diálogo de confirmação e sem
              penalidade. Um "tem certeza?" aqui seria o app negociando com quem
              quer sair. A nota é só o fato. `outline`, nunca `quiet`/`ghost` (D-S10). */}
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
          >
            {t('guild.sair.botao')}
          </button>
          <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.sair.nota')}</p>
        </div>
      </>
    );
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="sm2-guild" aria-label={t(room === 'feira' ? 'guild.feira.titulo' : 'guild.aria.salao')} data-guild-sheet data-guild-room-open={room}>
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
function SalaBosque({ guild, t, language, metaDoDiaCumprida, ocupado, mySprite, reducedMotion, onFio }: {
  guild: GuildView; t: T; language: Language; metaDoDiaCumprida: boolean; ocupado: boolean;
  mySprite: string; reducedMotion: boolean; onFio: () => void;
}) {
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
      <GroveVisor
        guild={guild}
        mySprite={mySprite}
        reducedMotion={reducedMotion}
        label={nomeDoEstagio ? t('guild.aria.bosque', { estagio: nomeDoEstagio }) : undefined}
      />
      {stage && (
        <>
          <h3 className="sm2-grove-stage" data-guild-stage>{nomeDoEstagio}</h3>
          <p className="sm2-grove-line">{groveStageLine(language, stage)}</p>
        </>
      )}
      {proximo && <p className="sm2-grove-line" data-guild-perto>{t('guild.bosque.perto', { estagio: proximo })}</p>}
      <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.bosque.regra')}</p>
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
function SalaRoda({ guild, t, language, nominal, ocupado, onGesto }: {
  guild: GuildView; t: T; language: Language; nominal: boolean; ocupado: boolean; onGesto: (k: GuildGesture) => void;
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
            {m.euMesmo && <span className="sm2-guild-you">{t('guild.roda.voce')}</span>}
            {nominal && m.apareceuHoje === true && <span className="sm2-guild-pres">{t('guild.roda.presente')}</span>}
          </li>
        ))}
      </ul>
      {guild.size >= 2 && (
        <div role="group" aria-label={t('guild.gesto.titulo')} className="sm2-grove-gestures" data-guild-gestos>
          {GUILD_GESTURES.map(k => {
            const enviado = guild.mine.gesturesSent.includes(k);
            const nome = guildGestureName(language, k);
            return (
              <button
                key={k}
                type="button"
                className="sm2-grove-gesto"
                data-gesto={k}
                disabled={ocupado || enviado}
                aria-disabled={ocupado || enviado ? true : undefined}
                aria-label={enviado ? t('guild.aria.gesto.enviado', { gesto: nome }) : t('guild.aria.gesto.enviar', { gesto: nome })}
                onClick={() => onGesto(k)}
              >
                <Icon name={GESTO_ICONE[k]} size={24} fill={enviado ? 1 : 0} tone={enviado ? 'primary' : 'ink'} />
                <span>{enviado ? guildGestureSent(language, k) : nome}</span>
              </button>
            );
          })}
        </div>
      )}
      {guild.gestures.length > 0 ? (
        <ul className="sm2-grove-list" data-guild-recebidos>
          {guild.gestures.map(k => <li key={k}>{guildGestureReceived(language, k)}</li>)}
        </ul>
      ) : guild.gestureReceived && (
        // Roda de 2: o servidor não manda o TIPO (B5) — só o fato de que chegou algo.
        <p className="sm2-lib-s" style={{ margin: 0 }} data-guild-recebidos>{t('guild.gesto.recebido.agregado')}</p>
      )}
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
  const estagios = GROVE_STAGES.slice(0, stageIndex);
  if (estagios.length === 0 && ornaments.length === 0) return null;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.aria.mural')} data-guild-room="mural">
      <h3 className="sm2-stats-lab">{t('guild.mural.titulo')}</h3>
      <ul className="sm2-grove-list">
        {estagios.map((id, i) => {
          const nome = groveStageName(language, id);
          const data = marcos[String(i + 1)] ? formatDayLabel(marcos[String(i + 1)], language) : '';
          return <li key={id} data-mural-marco={id}>{data ? t('guild.mural.marco', { estagio: nome, data }) : nome}</li>;
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
function SalaFeira({ guild, t, language, ocupado, reducedMotion, resgate, onRodada }: {
  guild: GuildView; t: T; language: Language; ocupado: boolean; reducedMotion: boolean;
  resgate: React.ReactNode; onRodada: () => void;
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
      <p className="sm2-stats-t" style={{ margin: 0 }} data-feira-cabecalho>
        {t(dissipada ? 'guild.feira.dissipado.mundo' : 'guild.feira.aberta.mundo')}
      </p>
      <FeiraVisor raid={raid} reducedMotion={reducedMotion} label={t('guild.aria.feira', { nome })} />
      <h3 className="sm2-grove-stage" data-feira-fenomeno>{nome}</h3>
      <p className="sm2-grove-line">{t(`guild.feira.fenomeno.${raid.phenomenon}.linha`)}</p>
      {!dissipada && raid.lastWeek && (
        <p className="sm2-lib-s" style={{ margin: 0 }} data-feira-semana-passada={raid.lastWeek}>
          {t(raid.lastWeek === 'dissipada' ? 'guild.feira.dissipado.mundo' : 'guild.feira.recuou.mundo')}
        </p>
      )}
      {!dissipada && (
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
      <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.feira.sobria', { cheio: RAID_EMBLEMS, piso: RAID_EMBLEMS_FLOOR })}</p>
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
