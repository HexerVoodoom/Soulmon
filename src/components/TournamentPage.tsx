/**
 * TORNEIO — PvP assíncrono.
 *
 * REVAMP: a MOLDURA saiu do fliperama. Saíram os 3 PNGs de ícone, o
 * `lucide-react`, o `sm-px-*` (barra de arcade, chanfro, `sm-px-card`), o
 * `PixelKit` inteiro e as cores cruas (`#fff`, `rgba(255,255,255,…)`,
 * `#facc15`, os três hexes de pódio). Tudo vive em `--sm2-*` + `<Icon>`.
 *
 * ─── ONDE EU TRACEI A FRONTEIRA RETRÔ ──────────────────────────────────────
 *
 * O `PLANO-DESIGN` §3.1 deixa no território retrô "só a cena de arena" desta
 * tela. **Cena de arena, aqui, não existe**: a partida é resolvida no servidor
 * (`playMatch`) e volta como placar — não há um único frame de combate neste
 * arquivo. O que existia era um GABINETE: a arte `bg/tournament.png` pintada no
 * fundo da página inteira, girada 265° de matiz em tempo real porque saiu roxa
 * do gerador, mais um véu de legibilidade por cima dela. Isso não é cena, é
 * moldura — e moldura migra. Ela saiu inteira, e com ela some a razão de a tela
 * ser escura no tema claro e de todo texto daqui ser branco cru.
 *
 * O que **fica** pixel, porque é conteúdo do visor e não interface: os sprites
 * dos oponentes (`getSpriteForStage`, `image-rendering: pixelated`). E fica
 * reservado: se um dia a partida ganhar animação, ela nasce dentro de um
 * `<Viewport>` — a fronteira é o vidro, não o arquivo.
 *
 * ─── O QUE NÃO PODE SER "SIMPLIFICADO" DAQUI (correções de tom) ────────────
 *
 * 1. **A FAIXA vem ANTES do ranking.** Posição absoluta é a leitura que a
 *    pesquisa associa a comparação tóxica; a faixa mede o jogador contra ele
 *    mesmo e só sobe. Inverter a ordem desfaz a tese.
 * 2. **O ranking é uma JANELA de ±3 posições** em volta do jogador, com a
 *    season inteira a UM toque. A lista completa transformava a tela num
 *    placar absoluto ("você é o 47º"), que é exatamente o que a faixa existe
 *    para substituir.
 * 3. **O placar de derrota é tinta NEUTRA**, nunca vermelho — perder uma
 *    partida não é um erro do usuário. Só a vitória ganha cor.
 * 4. **Perder também rende Emblemas, e a tela diz isso.**
 *
 * Nomes de ícone conferidos um a um contra o inventário de `tokens.md`.
 *
 * ─── CANVAS JOGOS (DECISÕES §25, D-J12…D-J14) ──────────────────────────────
 *
 * O canvas replica o que esta tela já fazia bem (Emblemas em serifa, faixa
 * antes do ranking, `TIER_ICON`, janela de ±3, `cloud_off`) e corrige: o
 * sprite do oponente solto a 44 → **mini-visor 64** (ícone-ficha 64² da
 * linha, rodada 2 — ou o sprite a 0,25×); as abas em botões → `PixelTabs`
 * com sublinhado (SIS-04); o `role=alert` sem filete → filete `gold-ink`
 * 3px, tinta `ink` (nunca vermelho); o ranking com mini-visor 32 (ícone-ficha
 * 32² a 1× — D-J13 cumprida em 21/09/2026; sprite a 0,125× com filtro só
 * quando o estágio não é de linha); o switch travado inerte por FORMA (tracejado,
 * `aria-disabled`, fora do Tab — nunca opacidade, D-J14); a faixa em Cinzel
 * 16 (Silkscreen só dentro do vidro); o resultado num `RitualDialog` com o
 * visor 288×112 da arena e as duas criaturas a 64 na vitória.
 */
import { useEffect, useState } from 'react';
import type { Language } from '../utils/i18n';
import { TOURNAMENT_TIERS } from '../utils/tournamentTiers';
import { tournamentShopItems } from '../utils/mercadoCatalog';
import type { WeeklyMission, WeeklyMissionId } from '../utils/weeklyMissions';
import {
  CurrencyBalance, ShopShelf, ShopStatus, WeeklyMissionList, useShopFlash,
  type ShopActions, type ShopOwnership,
} from './mercado/ShopShelf';
import { getSpriteForStage } from '../utils/sprites';
import { lineIconForStage } from '../utils/lineIcons';
import { getStageLevel } from '../types/progression';
import { DuelScreen } from './DuelScreen';
import type { DuelStats } from '../../functions/api/_duel.js';
import { getOpponents, playMatch, startDuel, getRank, type Opponent, type MatchResult, type RankRow } from '../utils/community';
import { EMBLEMS_PER_WIN, EMBLEMS_PER_LOSS, emblemStyle } from '../utils/currencies';
import { getTierStanding } from '../utils/tournamentTiers';
import { TIER_INSIGNIA_ART } from '../assets/soulmon/icones-ui';
import { getTournamentWindow, tournamentWindowLabel } from '../utils/tournamentSeason';
import { Icon } from './ui/Icon';
import { MiniGlass } from './ui/MiniGlass';
import { PixelMeter, PixelTabs } from './pixel/PixelKit';
import { RitualDialog } from './ritual/RitualKit';
import { GameVisor, VisorSprite, DIALOG_VISOR_W } from './games/GameKit';
import { sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { sm2Tag } from './TaskMeta';
import { bondLevelFor, meetsPvpBond, xpToPvpBond, xpForLevel, BOND_PVP_MIN_LEVEL } from '../utils/bond';
import tournamentFinal from '../assets/soulmon/bg/tournament-final.png';

interface TournamentPageProps {
  saveId: string;
  petStage: string;
  /** Linha de arte do pet (`spriteLineOf` — personagem pronto ou o corvinho). */
  petLine?: string;
  trophies: Array<{ season: string; place: 1 | 2 | 3 }>;
  language: string;
  /** Emblemas atuais (moeda do torneio) — só para exibir. */
  emblems: number;
  /** Chamado ao fim de cada partida com os Emblemas ganhos. */
  onEarnEmblems: (amount: number) => void;
  /** 🔗 XP acumulado do save — a ÚNICA entrada do Vínculo (o nível nunca é
   *  persistido; ver invariante 4 de `utils/bond.ts`). */
  totalXP: number;
  /** Chamado ao fim de cada partida, ganhando ou perdendo. Existe separado de
   *  `onEarnEmblems` porque XP de Vínculo e Emblemas são coisas diferentes:
   *  derrota rende XP igual (menos que a vitória, mas rende), e deduzir o
   *  resultado a partir do número de Emblemas seria regra copiada. */
  onMatchPlayed: (won: boolean) => void;
  /** WP4.7 — as 3 missões da semana + progresso, prontas (moram no save). */
  weeklyMissions?: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  /** Paga os Emblemas de uma missão pronta. Idempotente do outro lado. */
  onClaimWeekly?: (id: WeeklyMissionId) => void;
  /** A loja de Emblemas (minimal-ui F5: mora no Torneio, na Arena). A
   *  compra continua sendo do `handleShopBuy`; aqui só a prateleira. */
  shop?: { ownership: ShopOwnership; actions: ShopActions };
}

/** Emblemas: serifa de medalha (regra das três moedas) em ouro-TINTA. */
const emblemNum: React.CSSProperties = { ...emblemStyle, color: 'var(--sm2-gold-ink)' };

/** Card do sistema: mesma superfície da Biblioteca e da Loja. */
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
};

/**
 * Símbolo da faixa. O modelo (`utils/tournamentTiers.ts`) guarda um EMOJI, que
 * é arte do sistema operacional no meio de uma peça nossa — e `tournamentTiers`
 * não é meu arquivo nesta onda. O mapa mora aqui e cai em `military_tech` para
 * faixa nova: um `id` desconhecido não pode apagar a marca da faixa.
 */
const TIER_ICON: Record<string, string> = {
  semente: 'eco',
  broto: 'park',
  guardiao: 'military_tech',
  anciao: 'auto_awesome',
  lendario: 'emoji_events',
};

/**
 * A marca da faixa: a INSÍGNIA em pixel da rodada 3 (30/09/2026, `TIER_INSIGNIA_ART`),
 * no molde dos emblemas de conquista; sem arte, o glifo Material de antes. A faixa ainda
 * não alcançada sai apagada por FILTRO (dessaturada e escura), nunca por `opacity`.
 */
function TierMark({ id, size, state }: { id: string; size: 24 | 32; state: 'current' | 'passed' | 'next' }) {
  const art = TIER_INSIGNIA_ART[id];
  if (!art) {
    const name = TIER_ICON[id] ?? 'military_tech';
    const fill = state === 'next' ? 0 : 1;
    const tone = state === 'current' ? 'primary' : state === 'passed' ? 'gold' : 'muted';
    return size === 32
      ? <Icon name={name} size={32} fill={fill} tone={tone} />
      : <Icon name={name} size={24} fill={fill} tone={tone} />;
  }
  return (
    <img
      src={art}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-tier-insignia={id}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block', imageRendering: 'pixelated', filter: state === 'next' ? 'grayscale(1) brightness(0.55)' : undefined }}
    />
  );
}

export function TournamentPage({ saveId, petStage, petLine, trophies, language, emblems, onEarnEmblems, totalXP, onMatchPlayed, weeklyMissions, onClaimWeekly, shop }: TournamentPageProps) {
  const isPt = language === 'pt-BR';
  const lang: Language = isPt ? 'pt-BR' : 'en-US';
  const [opponents, setOpponents] = useState<Opponent[] | null>(null);
  /** `null` = o servidor não disse quantas sobraram (offline ou resposta velha). */
  const [matchesLeft, setMatchesLeft] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [rank, setRank] = useState<RankRow[] | null>(null);
  const [rankFailed, setRankFailed] = useState(false);
  const [fighting, setFighting] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  /** Duelo fantasma em andamento (a luta animada antes do servidor decidir). */
  const [duel, setDuel] = useState<{ opp: Opponent; seed: number; me: DuelStats; oppStats: DuelStats } | null>(null);
  const [myDuel, setMyDuel] = useState<DuelStats | null>(null);
  /** Erro de AÇÃO (a partida não foi). Era `alert()` — diálogo do sistema por
   *  cima de um app de bichinho, e sem par PT/EN garantido. */
  const [fightError, setFightError] = useState<string | null>(null);
  /* WP4.13 (achado E5) — a FAIXA lê o contador LIFETIME, não os pontos da
     season. Os pontos da season descem por três caminhos (derrota própria,
     ser sorteado como oponente e perder — sem jogar — e a virada de mês), e a
     regra escrita da faixa é que acumular NUNCA rebaixa. Ela media o jogador
     contra ele mesmo e caía por motivo que não era dele. `lifetime` só soma;
     `points` continua sendo o do ranking e do troféu da season. */
  const myLifetime = rank?.find(r => r.id === saveId)?.lifetime ?? 0;
  const standing = rank === null ? null : getTierStanding(myLifetime);
  const round = getTournamentWindow();
  /** Quantas posições aparecem ACIMA e ABAIXO do jogador na lista da season.
   *  A season inteira transformava a tela num placar absoluto: dois dedos de
   *  scroll e a pessoa se lê como "47º", que é justamente a leitura de
   *  comparação social que a faixa (mostrada antes) existe para substituir.
   *  A vizinhança é a comparação útil — e a lista inteira continua a UM toque. */
  const RANK_WINDOW = 3;
  const [rankExpanded, setRankExpanded] = useState(false);
  const myIndex = rank ? rank.findIndex(r => r.id === saveId) : -1;
  /** Linhas visíveis, carregando o índice ORIGINAL: a posição mostrada é
   *  sempre a real, nunca a posição dentro da fatia. */
  const rankRows: Array<{ row: RankRow; place: number }> = (rank ?? []).map((row, i) => ({ row, place: i + 1 }));
  const visibleRank = rankExpanded || myIndex < 0
    ? rankRows
    : rankRows.slice(Math.max(0, myIndex - RANK_WINDOW), myIndex + RANK_WINDOW + 1);
  /* minimal-ui F5 — a folha do Torneio abre na FAIXA (mock aprovado,
     `propostas/arena/mock.html`): é a leitura que mede o jogador contra ele
     mesmo, e por isso vem antes de desafiar e antes do ranking. */
  const [tab, setTab] = useState<'rank' | 'arena' | 'missions' | 'shop'>('rank');
  const { flash, say } = useShopFlash();

  /* H13 (02/10/2026): o interruptor "Participar do PvP" saiu — o personagem já
     nasce no PvP. O que sobra é o requisito de Vínculo (`BOND_PVP_MIN_LEVEL`,
     REGISTRO: o único destrave não-cosmético e social), e a tela o EXPLICA em
     vez de parecer quebrada. A trava inforjável continua sendo a do servidor. */
  const pvpAberto = meetsPvpBond(totalXP);

  const loadOpponents = () => {
    if (!pvpAberto) return;
    setLoadFailed(false);
    getOpponents(saveId)
      .then(r => {
        setOpponents(r.opponents ?? []);
        setMyDuel(r.me?.duel ?? null);
        // A API já devolveu resposta SEM `matchesLeft`, e a tela imprimia
        // "undefined partida(s) restante(s) hoje" — literalmente a palavra
        // `undefined` para o usuário. Número desconhecido vira `null` e a UI
        // diz isso em português, em vez de vazar o valor cru do JavaScript.
        setMatchesLeft(typeof r.matchesLeft === 'number' ? r.matchesLeft : null);
      })
      .catch(() => { setOpponents([]); setLoadFailed(true); });
  };

  useEffect(() => { loadOpponents(); }, [pvpAberto, saveId]);
  useEffect(() => {
    if (tab === 'rank' && !rank) {
      /* `?? []` é DEFESA, não redundância: se a resposta vier sem `rank`,
         gravar `undefined` deixaria `rank` falso, e os dois ramos de estado
         vazio/falha exigem `rank` verdadeiro — a área ficaria em branco e o
         `!rank` deste efeito o disparava de novo. A causa raiz foi fechada no
         `call()` de `utils/community.ts`; isto é o cinto. */
      getRank()
        .then(r => setRank(r.rank ?? []))
        .catch(() => { setRank([]); setRankFailed(true); });
    }
  }, [tab, rank]);

  /* Com servidor que manda a ficha de luta, o "Desafiar" abre o DUELO: o
     servidor gasta a partida e sorteia a semente (`startDuel`); os pets lutam
     sozinhos e o dono torce. Sair antes do fim é DERROTA (`leaveDuel`).
     Sem a ficha (servidor antigo), a partida segue direto como antes. */
  const fight = async (opp: Opponent) => {
    if (!(opp.duel && myDuel)) { void resolveMatch(opp, []); return; }
    setFighting(opp.id);
    setFightError(null);
    try {
      const r = await startDuel(saveId, opp.id);
      setMatchesLeft(typeof r.matchesLeft === 'number' ? r.matchesLeft : matchesLeft);
      setDuel({ opp, seed: r.seed, me: r.me, oppStats: r.opp });
    } catch (err) {
      setFightError(err instanceof Error && err.message
        ? err.message
        : (isPt ? 'A partida não aconteceu. Tente de novo.' : "The match didn't happen. Try again."));
    } finally {
      setFighting(null);
    }
  };

  /* Sair do duelo antes do fim = derrota, sem luta: o servidor já gastou a
     partida na abertura, e aqui ele só a fecha. Fechar o app tem o mesmo
     efeito (o duelo aberto vira derrota na próxima chamada). */
  const leaveDuel = (opp: Opponent) => { void resolveMatch(opp, [], true); };

  const resolveMatch = async (opp: Opponent, cheers: number[], forfeit = false) => {
    setFighting(opp.id);
    setFightError(null);
    try {
      const r = await playMatch(saveId, opp.id, cheers, forfeit);
      setResult(r);
      // `?? matchesLeft`: resposta sem o campo não pode zerar o contador nem
      // virar `undefined` na tela (ver a nota do estado de carregamento).
      setMatchesLeft(typeof r.matchesLeft === 'number' ? r.matchesLeft : matchesLeft);
      // Emblemas: moeda EXCLUSIVA do torneio (utils/currencies.ts). Perder
      // também rende algo — a partida diária não pode virar tempo perdido.
      onEarnEmblems(r.won ? EMBLEMS_PER_WIN : EMBLEMS_PER_LOSS);
      // 🔗 Vínculo: a partida rende XP dos dois lados do placar (`bondXP`), sob
      // o teto diário suave do torneio. Perder rende menos, nunca zero — falha
      // não pune, é a invariante 1 do módulo.
      onMatchPlayed(r.won);
    } catch (err) {
      setResult(null);
      setFightError(err instanceof Error && err.message
        ? err.message
        : (isPt ? 'A partida não aconteceu. Tente de novo.' : "The match didn't happen. Try again."));
    } finally {
      setFighting(null);
      setDuel(null);
      // A semente depende da partida do dia: a lista velha já não vale.
      loadOpponents();
    }
  };

  const TABS = [
    { key: 'rank' as const, label: isPt ? 'Faixa' : 'Tier' },
    { key: 'arena' as const, label: isPt ? 'Desafiar' : 'Challenge' },
    { key: 'missions' as const, label: isPt ? 'Missões' : 'Missions' },
    ...(shop ? [{ key: 'shop' as const, label: isPt ? 'Loja' : 'Shop' }] : []),
  ];


  if (duel) {
    return (
      <DuelScreen
        me={duel.me}
        opp={duel.oppStats}
        seed={duel.seed}
        petSprite={getSpriteForStage(petStage, petLine, 256)}
        oppSprite={getSpriteForStage(duel.opp.stage)}
        petName={isPt ? 'Você' : 'You'}
        oppName={duel.opp.petName || duel.opp.name}
        isPt={isPt}
        onDone={cheers => { void resolveMatch(duel.opp, cheers); }}
        onClose={() => leaveDuel(duel.opp)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      {/* minimal-ui F5 — o título "Torneio" é do `AreaSheet`; aqui fica a
          rodada da semana (RITUAL, não tranca — `utils/tournamentSeason.ts`)
          e os Emblemas, ícone em ouro + número com serifa: as três moedas
          continuam impossíveis de confundir. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ ...sm2Hint, flex: 1, minWidth: 0, margin: 0 }}>{tournamentWindowLabel(round, isPt ? 'pt-BR' : 'en-US')}</p>
        <span
          title={isPt ? 'Honra — só compra os prêmios do Torneio' : 'Honor — only buys Tournament rewards'}
          aria-label={`${isPt ? 'Honra' : 'Honor'}: ${emblems}`}
          style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, minHeight: 28 }}
        >
          <Icon name="military_tech" size={20} tone="gold" fill={1} />
          <span className="sm2-num" style={{ ...emblemNum, fontSize: 'var(--sm2-text-md)' }}>{emblems}</span>
        </span>
      </div>

      {/* Troféus de season — só existem se foram ganhos. Um selo por season,
          com o lugar dito em PALAVRA no `title`/`aria`, em vez de três hexes
          de pódio que ninguém decodifica sem legenda. */}
      {trophies.length > 0 && (
        <ul style={{ display: 'flex', gap: 8, flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
          {trophies.map((t, i) => (
            <li
              key={`${t.season}-${i}`}
              title={isPt ? `${t.season} — ${t.place}º lugar` : `${t.season} — place ${t.place}`}
              /* `.chip.tag.season` (canvas): etiqueta 28 em `surface-2`, troféu
                 `gold-ink` FILL, texto em `ink`. */
              style={{ ...sm2Tag, minHeight: 28, color: 'var(--sm2-ink)' }}
            >
              <Icon name="emoji_events" size={20} tone="gold" fill={1} />
              <span className="sm2-num">{t.season} · {t.place}º</span>
            </li>
          ))}
        </ul>
      )}

      <PixelTabs
        items={TABS.map(t => ({ key: t.key, label: t.label }))}
        value={tab}
        onChange={setTab}
        ariaLabel={isPt ? 'Seções do torneio' : 'Tournament sections'}
      />

      {/* Requisito do Torneio (H13): sem interruptor. Abaixo do Vínculo
          mínimo a aba diz POR QUE não abre e O QUE falta — progresso, nunca
          dívida. Aberto, só o aviso do apelido público (informação, não gesto). */}
      {tab === 'arena' && !pvpAberto && (
        <div data-torneio-requisito style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
          <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>
            {isPt ? `O Torneio abre no Vínculo ${BOND_PVP_MIN_LEVEL}` : `The Tournament opens at Bond ${BOND_PVP_MIN_LEVEL}`}
          </p>
          <PixelMeter
            ratio={totalXP / Math.max(1, xpForLevel(BOND_PVP_MIN_LEVEL))}
            tone="gold"
            height={10}
            label={isPt ? `Caminho até o Vínculo ${BOND_PVP_MIN_LEVEL}` : `Progress to Bond ${BOND_PVP_MIN_LEVEL}`}
          />
          <p style={{ ...sm2Hint, display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }}>
            <Icon name="link" size={20} tone="muted" />
            <span>
              {isPt
                ? `Você está no Vínculo ${bondLevelFor(totalXP)} — faltam ${xpToPvpBond(totalXP)} XP, que vêm do que você já faz por aqui. Sem pressa: seu Soulmon entra no Torneio sozinho quando chegar.`
                : `You're at Bond ${bondLevelFor(totalXP)} — ${xpToPvpBond(totalXP)} XP to go, earned by what you already do here. No rush: your Soulmon joins the Tournament on its own when you get there.`}
            </span>
          </p>
          <p style={{ ...sm2Hint, display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }}>
            <Icon name="visibility" size={20} tone="muted" />
            <span>
              {isPt
                ? `O Torneio é social: seu apelido e seu Soulmon aparecem numa lista pública de jogadores. Esperar até o Vínculo ${BOND_PVP_MIN_LEVEL} dá tempo de conhecer o app antes.`
                : `The Tournament is social: your nickname and your Soulmon show up on a public list of players. Waiting until Bond ${BOND_PVP_MIN_LEVEL} gives you time to get to know the app first.`}
            </span>
          </p>
        </div>
      )}

      {tab === 'arena' && pvpAberto && (
        <p style={{ ...sm2Hint, display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }} data-torneio-aviso-publico>
          <Icon name="visibility" size={20} tone="muted" />
          <span>
            {isPt
              ? 'Seu apelido e seu Soulmon aparecem numa lista pública de jogadores do Torneio.'
              : 'Your nickname and your Soulmon show up on a public list of Tournament players.'}
          </span>
        </p>
      )}

      {/* Torcida (02/10/2026, C2): o dono não via que o duelo do Torneio é de
          torcida — a linha aparece COM o PvP ligado ou não, antes de qualquer
          botão, e diz como a luta funciona. */}
      {tab === 'arena' && (
        <p style={sm2Hint} data-torcida-legenda>
          {isPt
            ? 'Os dois Soulmons lutam sozinhos. Você torce tocando na tela: o gauge cheio vira um golpe especial.'
            : 'The two Soulmons fight on their own. You cheer by tapping the screen: a full gauge becomes a special strike.'}
        </p>
      )}

      {tab === 'arena' && pvpAberto && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="sm2-num" style={sm2Hint}>
            {matchesLeft === null
              ? (isPt ? 'Partidas de hoje: não deu para consultar' : "Today's matches: couldn't check")
              : (isPt
                ? `${matchesLeft} ${matchesLeft === 1 ? 'partida restante' : 'partidas restantes'} hoje`
                : `${matchesLeft} ${matchesLeft === 1 ? 'match' : 'matches'} left today`)}
          </p>

          {/* O erro de AÇÃO: filete `gold-ink` 3px + tinta `ink` — informação,
              nunca vermelho (a partida não aconteceu; ninguém errou). */}
          {fightError && (
            <p role="alert" style={{ ...sm2Text, margin: 0, paddingLeft: 12, borderLeft: '3px solid var(--sm2-gold-ink)' }}>{fightError}</p>
          )}

          {/* ── Carregando ── */}
          {opponents === null && (
            <p role="status" style={{ ...sm2Hint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0' }}>
              <Icon name="sync" size={24} tone="primary" className="animate-spin" />
              {isPt ? 'Procurando oponentes…' : 'Looking for opponents…'}
            </p>
          )}

          {/* ── Vazio ── VAZIO e ERRO são coisas diferentes, e o app dizia a
              mesma frase para os dois: "nenhum oponente disponível" quando na
              verdade a rede caiu esconde que existe algo a tentar de novo. */}
          {opponents?.length === 0 && !loadFailed && (
            <p style={{ ...sm2Hint, textAlign: 'center', padding: '24px 0' }}>
              {isPt ? 'Nenhum oponente disponível agora. Volte mais tarde.' : 'No opponents available right now. Come back later.'}
            </p>
          )}

          {/* ── Erro / sem rede ── */}
          {loadFailed && (
            <div role="status" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: 12 }}>
              <Icon name="cloud_off" size={48} tone="muted" />
              <p style={{ ...sm2Text, margin: 0 }}>
                {isPt ? 'Não deu para carregar os oponentes.' : "Couldn't load the opponents."}
              </p>
              <p style={sm2Hint}>
                {isPt ? 'Pode ser a sua conexão.' : 'It may be your connection.'}
              </p>
              <button type="button" onClick={loadOpponents} style={{ ...sm2Button('outline'), width: '100%', maxWidth: 200 }}>
                {isPt ? 'Tentar de novo' : 'Try again'}
              </button>
            </div>
          )}

          {opponents?.map(o => {
            const busy = fighting === o.id;
            const blocked = matchesLeft === 0;
            return (
              <div key={o.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', minHeight: 56 }}>
                {/* A criatura do amigo no estágio REAL, num mini-visor 64 —
                    o ícone-ficha 64² da linha (rodada 2, D-J13) ou, quando o
                    estágio não é de linha, o sprite a 0,25× — sem faixa, sem
                    rank (J1, veto 3b). */}
                <MiniGlass size={64}>
                  <img src={lineIconForStage(o.stage, 64) ?? getSpriteForStage(o.stage)} alt="" width={64} height={64} style={{ width: 64, height: 64, imageRendering: 'pixelated', display: 'block' }} />
                </MiniGlass>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...sm2Text, margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.name}
                  </p>
                  <p className="sm2-num" style={{ ...sm2Hint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.petName || o.stage} · {getStageLevel(o.stage)}
                  </p>
                </div>
                {/* WCAG 2.5.3 (Label in Name): o texto visível "Fight" está
                    CONTIDO no nome acessível, que ainda nomeia o oponente
                    ("Fight — challenge Lu"); quem usa comando de voz diz
                    "Fight" e acerta. */}
                <button
                  type="button"
                  disabled={blocked || busy}
                  onClick={() => fight(o)}
                  aria-label={blocked
                    ? (isPt ? 'Desafiar — sem partidas restantes hoje' : 'Fight — no matches left today')
                    : (isPt ? `Desafiar ${o.name}` : `Fight — challenge ${o.name}`)}
                  style={{ ...sm2Button('primary', blocked || busy, 'sm'), flexShrink: 0, minWidth: 88 }}
                >
                  {busy && <Icon name="sync" size={20} className="animate-spin" />}
                  {isPt ? 'Desafiar' : 'Fight'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'rank' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rank === null && (
            <p role="status" style={{ ...sm2Hint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0' }}>
              <Icon name="sync" size={24} tone="primary" className="animate-spin" />
              {isPt ? 'Carregando o ranking…' : 'Loading the ranking…'}
            </p>
          )}

          {rankFailed && (
            <div role="status" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: 12 }}>
              <Icon name="cloud_off" size={48} tone="muted" />
              <p style={{ ...sm2Text, margin: 0 }}>
                {isPt ? 'Não deu para carregar o ranking.' : "Couldn't load the ranking."}
              </p>
              <button
                type="button"
                onClick={() => { setRank(null); setRankFailed(false); }}
                style={{ ...sm2Button('outline'), width: '100%', maxWidth: 200 }}
              >
                {isPt ? 'Tentar de novo' : 'Try again'}
              </button>
            </div>
          )}

          {/* A FAIXA vem primeiro e o ranking global depois, de propósito: a
              posição absoluta é a leitura que a pesquisa associa a comparação
              tóxica, e a faixa mede o jogador contra ele mesmo — ela sobe com
              o que ele acumula e nunca desce porque outra pessoa jogou mais. */}
          {standing && !rankFailed && (
            <div style={{ ...cardStyle, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={sm2Hint}>{isPt ? 'Sua faixa' : 'Your tier'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TierMark id={standing.tier.id} size={32} state="current" />
                {/* O nome da faixa em Cinzel 16 (canvas): a Silkscreen é a voz
                    do APARELHO e só vive dentro do vidro (HANDOFF §1). */}
                <p style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-md)', lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)' }}>
                  {isPt ? standing.tier.namePt : standing.tier.nameEn}
                </p>
              </div>

              {/* As cinco faixas em fila (mock aprovado): as já passadas em
                  ouro, a atual em ciano, as próximas em `muted`. Só sobe. */}
              <ol aria-label={isPt ? 'Faixas do Torneio' : 'Tournament tiers'} style={{ display: 'flex', justifyContent: 'space-between', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
                {TOURNAMENT_TIERS.map((t, mine) => {
                  const idx = TOURNAMENT_TIERS.findIndex(x => x.id === standing.tier.id);
                  const on = mine === idx;
                  const passed = mine < idx;
                  return (
                    <li
                      key={t.id}
                      data-tier={t.id}
                      data-tier-state={on ? 'current' : passed ? 'passed' : 'next'}
                      aria-current={on ? 'step' : undefined}
                      style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                    >
                      <TierMark id={t.id} size={24} state={on ? 'current' : passed ? 'passed' : 'next'} />
                      <span style={{ ...sm2Hint, fontSize: 'var(--sm2-text-xs)', fontWeight: on ? 600 : 400, color: on ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {isPt ? t.namePt : t.nameEn}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Progresso DENTRO da faixa, em `gold-fill` — só sobe. */}
              <PixelMeter ratio={standing.progress} tone="gold" height={12} label={isPt ? 'Progresso na faixa' : 'Tier progress'} />

              <p style={sm2Hint}>
                {standing.next
                  ? (isPt
                      ? `${standing.pointsToNext} pts até ${standing.next.namePt}. Sua faixa só sobe — ninguém te tira dela.`
                      : `${standing.pointsToNext} pts to ${standing.next.nameEn}. Your tier only climbs — nobody can knock you down.`)
                  : (isPt ? 'Faixa máxima. Daqui é só jogar por gosto.' : 'Top tier. From here it’s just for the love of it.')}
              </p>
            </div>
          )}

          {rank && rank.length > 0 && (
            <p style={{ ...sm2Hint, marginTop: 4, fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {isPt ? 'Ranking da season' : 'Season ranking'}
            </p>
          )}
          {rank && rank.length === 0 && !rankFailed && (
            <p style={{ ...sm2Hint, textAlign: 'center', padding: '24px 0' }}>
              {isPt ? 'A season ainda não tem placar. Jogue a primeira partida.' : 'The season has no scores yet. Play the first match.'}
            </p>
          )}

          {/* A janela de ±3 num card só, linhas de 36: posição `tabular-nums`,
              a criatura num mini-visor 32 — o ícone-ficha 32² (a cabeça, rodada
              2, D-J13) a 1×, ou o sprite a 0,125× com filtro quando o estágio
              não é de linha; a linha se identifica pelo NOME —, nome 14,
              pontos 12. A linha "you" em `primary-soft` + anel `primary-ink` —
              o idioma de seleção, não um pódio (sem ouro no top 3). */}
          {visibleRank.length > 0 && (
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 8px' }}>
              {visibleRank.map(({ row: r, place }) => {
                const isMe = r.id === saveId;
                return (
                  <div
                    key={r.id}
                    data-rank-row={isMe ? 'me' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, padding: '0 6px',
                      borderRadius: 'var(--sm2-radius-sm)',
                      backgroundColor: isMe ? 'var(--sm2-primary-soft)' : undefined,
                      boxShadow: isMe ? 'inset 0 0 0 1px var(--sm2-primary-ink)' : undefined,
                    }}
                  >
                    <span className="sm2-num" style={{ ...sm2Hint, width: 28, flexShrink: 0, color: isMe ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>
                      {place}
                    </span>
                    <MiniGlass size={32}>
                      {(() => {
                        const icon = lineIconForStage(r.stage, 32);
                        return <img src={icon ?? getSpriteForStage(r.stage)} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: icon ? 'pixelated' : 'auto', display: 'block' }} />;
                      })()}
                    </MiniGlass>
                    <span style={{ ...sm2Text, flex: 1, minWidth: 0, fontWeight: isMe ? 500 : 400, color: isMe ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.name}{isMe ? (isPt ? ' (você)' : ' (you)') : ''}
                    </span>
                    <span className="sm2-num" style={{ ...sm2Hint, flexShrink: 0, color: isMe ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>{r.points} pts</span>
                  </div>
                );
              })}
            </div>
          )}

          {rank && myIndex >= 0 && rank.length > visibleRank.length && !rankExpanded && (
            <button
              type="button"
              onClick={() => setRankExpanded(true)}
              style={{ ...sm2Button('outline'), width: '100%' }}
            >
              {isPt ? 'Ver a season inteira' : 'See the whole season'}
            </button>
          )}
        </div>
      )}

      {/* ─── AS MISSÕES DA SEMANA ──────────────────────────────────────────
          Pagas em Emblemas, e por isso moram aqui: a torneira e o ralo na
          mesma folha. Nenhuma premia CONTAGEM DE TAREFAS (há teste). */}
      {tab === 'missions' && (
        <WeeklyMissionList language={lang} weeklyMissions={weeklyMissions ?? []} onClaimWeekly={onClaimWeekly} />
      )}

      {/* ─── A LOJA DE EMBLEMAS ────────────────────────────────────────────
          Só cosmético (`tournamentShopItems` filtra; há teste), só Emblemas —
          saldo e preço na MESMA moeda, nenhuma outra aparece aqui. */}
      {tab === 'shop' && shop && (
        <div data-tournament-shop style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ShopStatus flash={flash} idle={isPt ? 'Honra só vem do Torneio — e só compra cosmético.' : 'Honor only comes from the Tournament — and only buys cosmetics.'} />
            </div>
            <CurrencyBalance currency="emblems" value={emblems} language={lang} />
          </div>
          <ShopShelf
            language={lang}
            items={tournamentShopItems()}
            currency="emblems"
            balance={emblems}
            ownership={shop.ownership}
            actions={shop.actions}
            say={say}
            flash={flash}
          />
        </div>
      )}

      {result && (
        <ResultDialog
          result={result}
          isPt={isPt}
          petStage={petStage}
          petLine={petLine}
          onClose={() => { setResult(null); loadOpponents(); }}
        />
      )}
    </div>
  );
}

/**
 * Resultado da partida — um `RitualDialog` (trap, Escape, devolução do foco).
 * "Victory"/"Defeat" em Cinzel 20 na MESMA tinta; na vitória o visor 288×112
 * com a arena `tournament-final` e as duas criaturas a 64 frente a frente;
 * "Against ‹oponente› · N pts" 12 `muted` (N pts = poder da partida, 13.13);
 * "Emblems +N" com o número em serifa dourada 20; "Continue" primário nos
 * dois — a saída não muda de cor com o resultado (D-J8).
 */
function ResultDialog({ result, isPt, petStage, petLine, onClose }: { result: MatchResult; isPt: boolean; petStage: string; petLine?: string; onClose: () => void }) {
  const title = result.won ? (isPt ? 'Vitória' : 'Victory') : (isPt ? 'Derrota' : 'Defeat');
  return (
    <RitualDialog label={title} onClose={onClose} zIndex={400} maxWidth={340} style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-lg)', lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)' }}>
        {title}
      </h2>
      {result.won && (
        <GameVisor width={DIALOG_VISOR_W} height={56} scene={`url(${tournamentFinal}) center/cover`}>
          <VisorSprite src={getSpriteForStage(petStage, petLine, 256)} alt="" size={64} idle={false} style={{ left: 56, bottom: 8 }} data-visor-pet />
          <VisorSprite src={getSpriteForStage(result.opponent.stage)} alt="" size={64} idle={false} flip style={{ right: 56, bottom: 8 }} data-visor-enemy />
        </GameVisor>
      )}
      <p className="sm2-num" style={sm2Hint}>
        {isPt ? `Contra ${result.opponent.name}` : `Against ${result.opponent.name}`} · {result.points} pts
        {' · '}{result.myScore} × {result.oppScore}
      </p>
      {/* Perder também rende Emblemas, e a tela diz. */}
      <p style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, margin: 0 }}>
        <span style={sm2Hint}>{isPt ? 'Honra' : 'Honor'}</span>
        <span className="sm2-num" style={{ ...emblemNum, fontSize: 'var(--sm2-text-lg)' }}>
          +{result.won ? EMBLEMS_PER_WIN : EMBLEMS_PER_LOSS}
        </span>
      </p>
      <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%', maxWidth: 260 }}>
        {isPt ? 'Continuar' : 'Continue'}
      </button>
    </RitualDialog>
  );
}
