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
 * sprite do oponente solto a 44 → **mini-visor 64** (0,25×); as abas em
 * botões → `PixelTabs` com sublinhado (SIS-04); o `role=alert` sem filete →
 * filete `gold-ink` 3px, tinta `ink` (nunca vermelho); o ranking com
 * mini-visor 32 (0,125× com filtro — TRANSIÇÃO condicionada aos ícones 32²
 * da `squad-arte`, D-J13); o switch travado inerte por FORMA (tracejado,
 * `aria-disabled`, fora do Tab — nunca opacidade, D-J14); a faixa em Fredoka
 * 16 (Silkscreen só dentro do vidro); o resultado num `RitualDialog` com o
 * visor 288×112 da arena e as duas criaturas a 64 na vitória.
 */
import { useEffect, useState } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { getStageLevel } from '../types/progression';
import { getOpponents, playMatch, getRank, type Opponent, type MatchResult, type RankRow } from '../utils/community';
import { EMBLEMS_PER_WIN, EMBLEMS_PER_LOSS, emblemStyle } from '../utils/currencies';
import { getTierStanding } from '../utils/tournamentTiers';
import { getTournamentWindow, tournamentWindowLabel } from '../utils/tournamentSeason';
import { Icon } from './ui/Icon';
import { MiniGlass } from './ui/MiniGlass';
import { PixelMeter, PixelTabs } from './pixel/PixelKit';
import { RitualDialog } from './ritual/RitualKit';
import { GameVisor, VisorSprite, DIALOG_VISOR_W } from './games/GameKit';
import { sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { sm2Tag } from './TaskMeta';
import { bondLevelFor, meetsPvpBond, xpToPvpBond, BOND_PVP_MIN_LEVEL } from '../utils/bond';
import tournamentFinal from '../assets/soulmon/bg/tournament-final.png';

interface TournamentPageProps {
  saveId: string;
  petStage: string;
  pvpEnabled: boolean;
  onTogglePvp: (enabled: boolean) => void;
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

/** Alternador do PvP. `role="switch"` de verdade, alvo de 44px. */
function Switch({ checked, onToggle, label, disabled = false }: {
  checked: boolean; onToggle: () => void; label: string; disabled?: boolean;
}) {
  /* Travado = inerte por FORMA (D-J14): borda tracejada `muted`, botão
     `muted`, `aria-disabled`, fora da ordem de foco — nunca `opacity`, que
     derruba o contraste do que ainda precisa ser lido. Host 52×44. */
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? undefined : onToggle}
      style={{
        flexShrink: 0,
        width: 52, height: 44, padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        style={{
          width: 52, height: 32, borderRadius: 999, boxSizing: 'border-box', position: 'relative',
          backgroundColor: checked ? 'var(--sm2-primary-fill)' : disabled ? 'transparent' : 'var(--sm2-surface-2)',
          border: checked ? '2px solid var(--sm2-primary-fill)' : `2px ${disabled ? 'dashed' : 'solid'} var(--sm2-muted)`,
          transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 4, width: 20, height: 20, borderRadius: '50%',
            left: checked ? 24 : 4,
            backgroundColor: checked ? 'var(--sm2-on-primary)' : 'var(--sm2-muted)',
            transition: 'left var(--sm2-dur-tap) var(--sm2-ease)',
          }}
        />
      </span>
    </button>
  );
}

export function TournamentPage({ saveId, petStage, pvpEnabled, onTogglePvp, trophies, language, emblems, onEarnEmblems, totalXP, onMatchPlayed }: TournamentPageProps) {
  const isPt = language === 'pt-BR';
  const [opponents, setOpponents] = useState<Opponent[] | null>(null);
  /** `null` = o servidor não disse quantas sobraram (offline ou resposta velha). */
  const [matchesLeft, setMatchesLeft] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [rank, setRank] = useState<RankRow[] | null>(null);
  const [rankFailed, setRankFailed] = useState(false);
  const [fighting, setFighting] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
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
  const [tab, setTab] = useState<'arena' | 'rank'>('arena');

  const loadOpponents = () => {
    if (!pvpEnabled) return;
    setLoadFailed(false);
    getOpponents(saveId)
      .then(r => {
        setOpponents(r.opponents ?? []);
        // A API já devolveu resposta SEM `matchesLeft`, e a tela imprimia
        // "undefined partida(s) restante(s) hoje" — literalmente a palavra
        // `undefined` para o usuário. Número desconhecido vira `null` e a UI
        // diz isso em português, em vez de vazar o valor cru do JavaScript.
        setMatchesLeft(typeof r.matchesLeft === 'number' ? r.matchesLeft : null);
      })
      .catch(() => { setOpponents([]); setLoadFailed(true); });
  };

  useEffect(() => { loadOpponents(); }, [pvpEnabled, saveId]);
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

  const fight = async (opp: Opponent) => {
    setFighting(opp.id);
    setFightError(null);
    try {
      const r = await playMatch(saveId, opp.id);
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
    }
  };

  const TABS = [
    { key: 'arena' as const, icon: 'swords', label: isPt ? 'Arena' : 'Arena' },
    { key: 'rank' as const, icon: 'leaderboard', label: isPt ? 'Ranking' : 'Ranking' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-xl)',
              fontWeight: 600,
              lineHeight: 'var(--sm2-leading-title)',
              color: 'var(--sm2-ink)',
              margin: 0,
            }}
          >
            {isPt ? 'Torneio' : 'Tournament'}
          </h1>
          <p style={{ ...sm2Hint, marginTop: 4 }}>
            {isPt ? 'Desafie os pets de outros jogadores.' : "Challenge other players' pets."}
          </p>
        </div>
        {/* Emblemas: ícone em ouro + número com serifa. As três moedas
            continuam impossíveis de confundir. */}
        <span
          title={isPt ? 'Emblemas — só compram itens da aba Torneio na loja' : 'Emblems — only buy Tournament items in the shop'}
          aria-label={`${isPt ? 'Emblemas' : 'Emblems'}: ${emblems}`}
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

      {/* Opt-in do PvP — o rótulo inteiro descreve o que muda no mundo.
          Duas coisas moram aqui, e nenhuma é decoração:

          1. O GATE DE VÍNCULO (nível 5, `utils/bond.ts`). Aqui ele é
             EXPERIÊNCIA, não trava: a trava inforjável é a do servidor
             (`functions/api/community.js`), porque `POST profile` aceita
             `pvpEnabled` do cliente. O que o cliente faz é não oferecer o que
             não está disponível — e DIZER o que falta, em vez de aceitar o
             toque e desfazer em silêncio.
          2. O AVISO DO NICK. Ligar o PvP põe o nome numa lista pública
             (`action=players` responde `name` para qualquer um). Consentimento
             sem informação não é consentimento, então o aviso fica ANTES do
             gesto — não num termo.

          ⚠️ Quem JÁ ligou nunca fica preso: o gate vale para LIGAR. Com o PvP
          ativo o interruptor continua disponível, em qualquer nível, para a
          pessoa poder sair.

          📝 Copy FUNCIONAL — diz a coisa certa, mas não passou pelo redator.
          A voz é pendente do `alpha-redator-ux`. */}
      {(() => {
        const liberado = meetsPvpBond(totalXP);
        const podeMexer = liberado || pvpEnabled;
        const faltam = xpToPvpBond(totalXP);
        return (
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{isPt ? 'Participar do PvP' : 'Join PvP'}</p>
                <p style={{ ...sm2Hint, marginTop: 2 }}>
                  {isPt ? 'Seu pet fica disponível como oponente de outros jogadores.' : 'Your pet becomes available as an opponent for other players.'}
                </p>
              </div>
              <Switch
                checked={pvpEnabled}
                onToggle={() => onTogglePvp(!pvpEnabled)}
                label={isPt ? 'Participar do PvP' : 'Join PvP'}
                disabled={!podeMexer}
              />
            </div>

            {/* O aviso do nick público. Fica visível SEMPRE que o interruptor
                pode ser ligado — é a informação que torna o gesto um
                consentimento. */}
            <p style={{ ...sm2Hint, display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }}>
              <Icon name="visibility" size={20} tone="muted" />
              <span>
                {isPt
                  ? 'Ao ligar, seu apelido e seu pet passam a aparecer numa lista pública de jogadores. Dá para desligar quando quiser.'
                  : 'Once on, your nickname and your pet show up on a public list of players. You can turn it off any time.'}
              </span>
            </p>

            {/* O que falta, dito como progresso — nunca como dívida. */}
            {!podeMexer && (
              <p style={{ ...sm2Hint, display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }}>
                <Icon name="link" size={20} tone="muted" />
                <span>
                  {isPt
                    ? `O PvP abre no Vínculo ${BOND_PVP_MIN_LEVEL}. Você está no ${bondLevelFor(totalXP)} — faltam ${faltam} XP, que vêm do que você já faz aqui.`
                    : `PvP opens at Bond ${BOND_PVP_MIN_LEVEL}. You're at ${bondLevelFor(totalXP)} — ${faltam} XP to go, earned by what you already do here.`}
                </span>
              </p>
            )}
          </div>
        );
      })()}

      {/* A rodada semanal é RITUAL, não tranca: fora dela o Torneio continua
          inteiro disponível. Trancar conteúdo fora de um horário é o erro dos
          Remote Raid Passes de 2023 — quem não consegue estar lá na hora
          combinada não se esforça mais, sai. Ver utils/tournamentSeason.ts.
          Aberto × fechado é dito pela TINTA e pelo ícone, nunca por um
          `#facc15` cravado nem por emoji do sistema. */}
      <p style={sm2Hint}>{tournamentWindowLabel(round, isPt ? 'pt-BR' : 'en-US')}</p>

      {/* Duas abas com sublinhado ciano (SIS-04, como a Ficha) — a mesma
          pista da nav: uma barra não é uma caixa. */}
      <PixelTabs
        items={TABS.map(t => ({ key: t.key, iconName: t.icon, label: t.label }))}
        value={tab}
        onChange={setTab}
        ariaLabel={isPt ? 'Seções do torneio' : 'Tournament sections'}
      />

      {tab === 'arena' && !pvpEnabled && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 12 }}>
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt ? 'Ative o PvP acima para desafiar oponentes.' : 'Enable PvP above to challenge opponents.'}
          </p>
        </div>
      )}

      {tab === 'arena' && pvpEnabled && (
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
                {/* A criatura do amigo no estágio REAL, num mini-visor 64
                    (0,25×) — sem faixa, sem rank (J1, veto 3b). */}
                <MiniGlass size={64}>
                  <img src={getSpriteForStage(o.stage)} alt="" width={64} height={64} style={{ width: 64, height: 64, imageRendering: 'pixelated', display: 'block' }} />
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
                <Icon name={TIER_ICON[standing.tier.id] ?? 'military_tech'} size={32} tone="gold" fill={1} />
                {/* O nome da faixa em Fredoka 16 (canvas): a Silkscreen é a voz
                    do APARELHO e só vive dentro do vidro (HANDOFF §1). */}
                <p style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-md)', lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)' }}>
                  {isPt ? standing.tier.namePt : standing.tier.nameEn}
                </p>
              </div>

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
              a criatura num mini-visor 32 (0,125× com FILTRO — D-J13, transição
              até os ícones 32² da `squad-arte`; a linha se identifica pelo
              NOME), nome 14, pontos 12. A linha "you" em `primary-soft` + anel
              `primary-ink` — o idioma de seleção, não um pódio (sem ouro no
              top 3). */}
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
                      <img src={getSpriteForStage(r.stage)} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: 'auto', display: 'block' }} />
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

      {result && (
        <ResultDialog
          result={result}
          isPt={isPt}
          petStage={petStage}
          onClose={() => { setResult(null); loadOpponents(); }}
        />
      )}
    </div>
  );
}

/**
 * Resultado da partida — um `RitualDialog` (trap, Escape, devolução do foco).
 * "Victory"/"Defeat" em Fredoka 20 na MESMA tinta; na vitória o visor 288×112
 * com a arena `tournament-final` e as duas criaturas a 64 frente a frente;
 * "Against ‹oponente› · N pts" 12 `muted` (N pts = poder da partida, 13.13);
 * "Emblems +N" com o número em serifa dourada 20; "Continue" primário nos
 * dois — a saída não muda de cor com o resultado (D-J8).
 */
function ResultDialog({ result, isPt, petStage, onClose }: { result: MatchResult; isPt: boolean; petStage: string; onClose: () => void }) {
  const title = result.won ? (isPt ? 'Vitória' : 'Victory') : (isPt ? 'Derrota' : 'Defeat');
  return (
    <RitualDialog label={title} onClose={onClose} zIndex={400} maxWidth={340} style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-lg)', lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)' }}>
        {title}
      </h2>
      {result.won && (
        <GameVisor width={DIALOG_VISOR_W} height={56} scene={`url(${tournamentFinal}) center/cover`}>
          <VisorSprite src={getSpriteForStage(petStage)} alt="" size={64} idle={false} style={{ left: 56, bottom: 8 }} data-visor-pet />
          <VisorSprite src={getSpriteForStage(result.opponent.stage)} alt="" size={64} idle={false} flip style={{ right: 56, bottom: 8 }} data-visor-enemy />
        </GameVisor>
      )}
      <p className="sm2-num" style={sm2Hint}>
        {isPt ? `Contra ${result.opponent.name}` : `Against ${result.opponent.name}`} · {result.points} pts
        {' · '}{result.myScore} × {result.oppScore}
      </p>
      {/* Perder também rende Emblemas, e a tela diz. */}
      <p style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, margin: 0 }}>
        <span style={sm2Hint}>{isPt ? 'Emblemas' : 'Emblems'}</span>
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
