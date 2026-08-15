import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import iconSwords from '../assets/soulmon/icons/games/icon-game-dungeon.png';
import iconTrophy from '../assets/soulmon/icons/games/icon-game-tournament.png';
import { getSpriteForStage } from '../utils/sprites';
import { getStageLevel } from '../types/progression';
import { getOpponents, playMatch, getRank, type Opponent, type MatchResult, type RankRow } from '../utils/community';
import tournamentBg from '../assets/soulmon/bg/tournament.png';
import { EMBLEMS_PER_WIN, EMBLEMS_PER_LOSS, emblemStyle } from '../utils/currencies';
import { getTierStanding } from '../utils/tournamentTiers';
import { getTournamentWindow, tournamentWindowLabel } from '../utils/tournamentSeason';
import { PixelButton, PixelChip, PixelMeter, PixelSwitch, PixelTabs, PixelTag, type PixelTabItem } from './pixel/PixelKit';
import iconCalendar from '../assets/soulmon/icons/icon-clock.png';

/**
 * Torneio — PvP assincrono.
 *
 * --- Rodada 2 do alinhamento visual (G4/G8/G9) ---------------------------
 * Era a tela citada como prova do gap: cards brancos com sombra suave, abas
 * `sm-btn` com fundo translucido, capsula-pilula branca de Emblemas, toggle
 * do PvP em pill+bolinha do Material e barra de faixa arredondada.
 *
 * Duas decisoes que valem registro:
 *
 * 1. **A tela inteira e peca escura nos dois temas, de proposito.** Ela pinta
 *    o proprio fundo (`bg/tournament.png`), entao NAO usa `--sm-surface`: e um
 *    gabinete de arcade, nao uma pagina do app. Isso NAO e o forasteiro do G8
 *    (o dock de chat) — a diferenca e que la a peca escura ficava sobre a
 *    pagina clara sem motivo, e aqui a arte de fundo e o motivo. O que mudou e
 *    a FORMA (chanfro de cobre) e a fonte de rotulo/numero.
 * 2. **`PixelTabs` no lugar das duas `sm-btn`.** A aba inativa era uma `sm-btn`
 *    com `background: rgba(255,255,255,0.12)` — mais clara que a pagina, mais
 *    pesada que a ativa em certos fundos: exatamente o G9. Agora a selecao e o
 *    preenchimento solido.
 */

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
}

const PLACE_COLOR: Record<1 | 2 | 3, string> = { 1: '#e8c96a', 2: '#c7cad4', 3: '#c98a52' };

export function TournamentPage({ saveId, petStage, pvpEnabled, onTogglePvp, trophies, language, emblems, onEarnEmblems }: TournamentPageProps) {
  const isPt = language === 'pt-BR';
  const [opponents, setOpponents] = useState<Opponent[] | null>(null);
  /** `null` = o servidor não disse quantas sobraram (offline ou resposta velha). */
  const [matchesLeft, setMatchesLeft] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [rank, setRank] = useState<RankRow[] | null>(null);
  const [fighting, setFighting] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  // Pontos do próprio jogador, lidos da linha dele no ranking.
  const myPoints = rank?.find(r => r.id === saveId)?.points ?? 0;
  const standing = rank === null ? null : getTierStanding(myPoints);
  const round = getTournamentWindow();
  const [tab, setTab] = useState<'arena' | 'rank'>('arena');
  const TABS: readonly PixelTabItem<'arena' | 'rank'>[] = [
    { key: 'arena', icon: iconSwords, label: 'Arena' },
    { key: 'rank', icon: iconTrophy, label: 'Rank' },
  ];

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
    if (tab === 'rank' && !rank) getRank().then(r => setRank(r.rank)).catch(() => setRank([]));
  }, [tab, rank]);

  const fight = async (opp: Opponent) => {
    setFighting(opp.id);
    try {
      const r = await playMatch(saveId, opp.id);
      setResult(r);
      // `?? matchesLeft`: resposta sem o campo não pode zerar o contador nem
      // virar `undefined` na tela (ver a nota do estado de carregamento).
      setMatchesLeft(typeof r.matchesLeft === 'number' ? r.matchesLeft : matchesLeft);
      // Emblemas: moeda EXCLUSIVA do torneio (utils/currencies.ts). Perder
      // também rende algo — a partida diária não pode virar tempo perdido.
      onEarnEmblems(r.won ? EMBLEMS_PER_WIN : EMBLEMS_PER_LOSS);
    } catch (err) {
      setResult(null);
      alert(err instanceof Error ? err.message : 'error');
    } finally {
      setFighting(null);
    }
  };

  return (
    /* `sm-px-dark-ctx`: esta tela é uma peça ESCURA nos dois temas (ela pinta
       o próprio fundo). Sem declarar o contexto, a aba não selecionada herdava
       a tinta escura da página clara e sumia sobre o painel — medido na
       verificação. O chanfro substitui o `borderRadius: 20` do sistema antigo. */
    <div
      className="sm-px-dark-ctx"
      style={{
        position: 'relative', overflow: 'hidden', minHeight: 420,
        clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tournamentBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* B4 — véu de legibilidade. A "decoração desenhada por cima do texto"
          nunca esteve por cima: o anel dourado é parte da ARTE DE FUNDO
          (`tournamentBg`), e é o título que estava por cima dele, sem placa.
          Um `z-index` menor não resolveria nada (o fundo já é o de baixo);
          o que faltava era separar as duas camadas por contraste.

          O véu é um gradiente vertical: forte onde mora o texto (topo, onde
          o anel cruza "TORNEIO" e a linha de PvP) e some no meio da peça,
          para a arte continuar aparecendo onde ela não disputa leitura.
          Zero arte nova, e vale nos dois temas — o painel é escuro em ambos,
          então o véu não pode inverter. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(20,10,40,0.82) 0%, rgba(20,10,40,0.72) 26%, rgba(20,10,40,0.18) 52%, rgba(20,10,40,0.10) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 16px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <img src={iconSwords} alt="" width={24} height={24} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          <h1 className="sm-px-heading" style={{ fontSize: 16, margin: 0, color: 'var(--sm-px-ink)' }}>{isPt ? 'Torneio' : 'Tournament'}</h1>
          {/* Emblemas mantem a serifa dourada dentro da capsula do kit — as
              tres moedas continuam impossiveis de confundir. */}
          <PixelChip
            style={{ marginLeft: 'auto' }}
            label={isPt ? 'Emblemas' : 'Emblems'}
            title={isPt ? 'Emblemas — só compram itens da aba Torneio na loja' : 'Emblems — only buy Tournament items in the shop'}
            value={<span style={{ ...emblemStyle, color: 'color-mix(in srgb, var(--sm-gold) 40%, white)', fontSize: 13.5 }}>{emblems}</span>}
          />
        </div>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px' }}>
          {isPt ? 'PvP assíncrono — desafie os pets de outros jogadores.' : 'Asynchronous PvP — challenge other players\' pets.'}
        </p>

        {/* Troféus */}
        {trophies.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {trophies.map((t, i) => (
              <PixelTag key={i} title={`${t.season} — ${isPt ? 'lugar' : 'place'} ${t.place}`} style={{ color: PLACE_COLOR[t.place], borderColor: PLACE_COLOR[t.place] }}>
                <img src={iconTrophy} alt="" width={14} height={14} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                {t.season}
              </PixelTag>
            ))}
          </div>
        )}

        {/* Opt-in */}
        <div className="sm-px-arcade-bar" style={{ padding: '12px 14px', marginBottom: 16, justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>{isPt ? 'Participar do PvP' : 'Join PvP'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>
              {isPt ? 'Seu pet fica disponível como oponente de outros jogadores.' : 'Your pet becomes available as an opponent for other players.'}
            </p>
          </div>
          <PixelSwitch
            checked={pvpEnabled}
            onToggle={() => onTogglePvp(!pvpEnabled)}
            ariaLabel={isPt ? 'Participar do PvP' : 'Join PvP'}
          />
        </div>

        {/* A rodada semanal é RITUAL, não tranca: fora dela o Torneio continua
            inteiro disponível. Trancar conteúdo fora de um horário é o erro dos
            Remote Raid Passes de 2023 — quem não consegue estar lá na hora
            combinada não se esforça mais, sai. Ver utils/tournamentSeason.ts. */}
        {/* Os dois emojis (circo/calendario) sairam: eram emoji do SISTEMA em
            conteudo, o que o portao T2 conta. O icone do kit diz a mesma
            coisa, e a distincao aberto/fechado passou para a borda + a tinta. */}
        <div
          className="sm-px-arcade-bar"
          style={{
            marginBottom: 12, padding: '9px 12px', gap: 9,
            borderColor: round.isOpen ? '#facc15' : 'var(--sm-px-copper)',
          }}
        >
          <img src={iconCalendar} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.45, color: round.isOpen ? '#facc15' : 'rgba(255,255,255,0.78)' }}>
            {tournamentWindowLabel(round, isPt ? 'pt-BR' : 'en-US')}
          </p>
        </div>

        {/* Abas — G9: quem carrega a selecao e o preenchimento. */}
        <PixelTabs
          items={TABS}
          value={tab}
          onChange={setTab}
          ariaLabel={isPt ? 'Secoes do torneio' : 'Tournament sections'}
          style={{ marginBottom: 14 }}
        />

        {tab === 'arena' && !pvpEnabled && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '30px 0' }}>
            {isPt ? 'Ative o PvP acima para desafiar oponentes.' : 'Enable PvP above to challenge opponents.'}
          </p>
        )}

        {tab === 'arena' && pvpEnabled && (
          <>
            <p className="sm-px-arcade-label" style={{ marginBottom: 10 }}>
              {matchesLeft === null
                ? (isPt ? 'Partidas de hoje: não deu para consultar' : "Today's matches: couldn't check")
                : (isPt ? `${matchesLeft} partida(s) restante(s) hoje` : `${matchesLeft} match(es) left today`)}
            </p>
            {opponents === null && <Loader2 className="animate-spin" size={24} style={{ margin: '20px auto', display: 'block' }} />}
            {/* VAZIO e ERRO são coisas diferentes, e o app dizia a mesma frase
                para os dois: "nenhum oponente disponível" quando na verdade a
                rede caiu esconde do usuário que existe algo a tentar de novo. */}
            {opponents?.length === 0 && !loadFailed && (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)', padding: '20px 0' }}>
                {isPt ? 'Nenhum oponente disponível agora.' : 'No opponents available right now.'}
              </p>
            )}
            {loadFailed && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>
                  {isPt ? 'Não foi possível carregar os oponentes. Você está offline?' : "Couldn't load opponents. Are you offline?"}
                </p>
                <PixelButton size="sm" onClick={loadOpponents}>{isPt ? 'Tentar de novo' : 'Try again'}</PixelButton>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {opponents?.map(o => (
                <div key={o.id} className="sm-px-arcade-bar" style={{ padding: '10px 12px', gap: 12 }}>
                  <img src={getSpriteForStage(o.stage)} alt="" style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{o.petName || o.stage} · {getStageLevel(o.stage)}</p>
                  </div>
                  <PixelButton size="sm" variant="primary" disabled={matchesLeft === 0 || fighting === o.id} onClick={() => fight(o)}>
                    {fighting === o.id ? <Loader2 className="animate-spin" size={16} /> : (isPt ? 'Desafiar' : 'Fight')}
                  </PixelButton>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'rank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rank === null && <Loader2 className="animate-spin" size={24} style={{ margin: '20px auto', display: 'block' }} />}

            {/* A FAIXA vem primeiro e o ranking global depois, de propósito: a
                posição absoluta é a leitura que a pesquisa associa a comparação
                tóxica, e a faixa mede o jogador contra ele mesmo — ela sobe com
                o que ele acumula e nunca desce porque outra pessoa jogou mais. */}
            {standing && (
              <div className="sm-px-arcade-bar" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '14px 16px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* O emoji da faixa e o SIMBOLO dela no modelo
                      (utils/tournamentTiers.ts) e ainda nao tem par no kit —
                      fica registrado como divida de arte no relatorio, e nao
                      removido as cegas: apaga-lo deixaria a faixa sem marca. */}
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{standing.tier.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="sm-px-arcade-label" style={{ margin: 0 }}>
                      {isPt ? 'Sua faixa' : 'Your tier'}
                    </p>
                    <p className="sm-px-arcade-value" style={{ margin: '1px 0 0', fontSize: 15 }}>
                      {isPt ? standing.tier.namePt : standing.tier.nameEn}
                    </p>
                  </div>
                  <span className="sm-px-arcade-value" style={{ fontSize: 12 }}>{myPoints} pts</span>
                </div>
                <PixelMeter
                  ratio={standing.progress}
                  tone="gold"
                  height={10}
                  style={{ marginTop: 10 }}
                  label={isPt ? 'Progresso na faixa' : 'Tier progress'}
                />
                <p style={{ margin: '7px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
                  {standing.next
                    ? (isPt
                        ? `Faltam ${standing.pointsToNext} pts para ${standing.next.namePt}. Sua faixa só sobe — ninguém te tira dela.`
                        : `${standing.pointsToNext} pts to ${standing.next.nameEn}. Your tier only climbs — nobody can knock you down.`)
                    : (isPt ? 'Faixa máxima. Daqui é só jogar por gosto.' : 'Top tier. From here it’s just for the love of it.')}
                </p>
              </div>
            )}

            {rank && rank.length > 0 && (
              <p className="sm-px-arcade-label" style={{ margin: '8px 0 2px' }}>
                {isPt ? 'Ranking da season' : 'Season ranking'}
              </p>
            )}
            {rank?.map((r, i) => (
              <div key={r.id} className="sm-px-arcade-bar" style={{ padding: '8px 12px', gap: 10 }}>
                <span className="sm-px-arcade-value" style={{ width: 24, textAlign: 'center', color: i < 3 ? PLACE_COLOR[(i + 1) as 1 | 2 | 3] : undefined }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span className="sm-px-arcade-value" style={{ fontSize: 12 }}>{r.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(8,5,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="sm-px-card" style={{ maxWidth: 340, width: '100%', padding: 24, textAlign: 'center' }}>
            <p className="sm-px-label" style={{ margin: 0 }}>
              {result.won ? (isPt ? 'Vitória' : 'Victory') : (isPt ? 'Derrota' : 'Defeat')}
            </p>
            <h2 className="sm-px-value" style={{ fontSize: 24, margin: '6px 0 14px', color: result.won ? '#3fae5a' : '#d9534f' }}>
              {result.myScore} × {result.oppScore}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--sm-ink)', margin: '0 0 6px' }}>
              {isPt ? `Contra ${result.opponent.name}` : `Against ${result.opponent.name}`} · {result.points} pts
            </p>
            {/* Perder também rende Emblemas, mas a UI nunca dizia isso — a
                partida virava tempo perdido aos olhos de quem perdeu. */}
            <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 18px', ...emblemStyle }}>
              +{result.won ? EMBLEMS_PER_WIN : EMBLEMS_PER_LOSS} {isPt ? 'Emblemas' : 'Emblems'}
            </p>
            <PixelButton size="lg" variant="primary" onClick={() => { setResult(null); loadOpponents(); }}>
              {isPt ? 'Continuar' : 'Continue'}
            </PixelButton>
          </div>
        </div>
      )}
    </div>
  );
}
