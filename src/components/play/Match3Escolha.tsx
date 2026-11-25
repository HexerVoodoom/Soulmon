import { useEffect, useMemo, useState } from 'react';
import { EscolhaLinha, SortearNovos, escolhaCardStyle } from '../ui/EscolhaLinha';
import { MiniGlass } from '../ui/MiniGlass';
import { RewardPreview } from '../ui/RewardPreview';
import { EstagioMarca } from '../ui/EstagioMarca';
import { Icon } from '../ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { getOpponents } from '../../utils/community';
import { opponentIcon, opponentSprite } from '../../utils/opponentArt';
import { elementIcon } from '../../utils/elementIconArt';
import { BOSS_SHARD_ART } from '../../utils/itemArt';
import { M3_MAX_BITS } from '../../utils/match3';
import { pvpRewards, tileElementName } from '../../utils/match3Pvp';
import {
  M3_CHOICES, M3_REDRAWS_PER_VISIT, adventureChoices, pvpChoices,
  type M3Choice, type M3OpponentLike, type M3PvpChoice,
} from '../../utils/match3Escolha';
import type { Language } from '../../utils/i18n';

/**
 * ELEMENTAL FUSION — a LISTA DE 3 embaixo dos botões de modo (pedido do dono, 18/11/2026, REGISTRO §488). Mesma tabelinha do Torneio
 * (`EscolhaLinha`) e o mesmo "Sortear 3 novos" no fim. Aventura: 3 ELEMENTOS (o time de 4 só aparece na partida). PvP: até 3 JOGADORES da
 * rota `opponents` (reais ou simulados do servidor), nunca demo, monstro ou jogador inventado no cliente; boss decidido antes = só a linha "Boss".
 * Mora no `MinigameModeGate` (Salão) e dentro do jogo (o "De novo" volta para cá).
 */
const freshSeed = () => Math.floor(Math.random() * 2 ** 31);
type ArtSrc = Parameters<typeof opponentSprite>[0];
const artOf = (o: M3OpponentLike) => ({ sprite: opponentSprite(o as ArtSrc), icon: opponentIcon(o as ArtSrc, 64) });

export function Match3Escolha({ language, mode, saveId, playerLevel = 1, onFight }: {
  language: Language;
  mode: 'adventure' | 'pvp';
  /** A conta (a rota `opponents` exige). Sem ela o PvP mostra o estado vazio. */
  saveId?: string;
  playerLevel?: number;
  onFight: (choice: M3Choice) => void;
}) {
  const isPt = language === 'pt-BR';
  const lang = isPt ? 'pt-BR' : 'en-US';
  const [screenSeed, setScreenSeed] = useState(freshSeed);
  const [redraws, setRedraws] = useState(0);
  const [opps, setOpps] = useState<M3OpponentLike[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pvp = mode === 'pvp';
  const bossFirst = useMemo(() => pvp && pvpChoices(screenSeed, [], playerLevel, () => ({}))[0]?.boss === true, [pvp, screenSeed, playerLevel]);

  useEffect(() => {
    if (!pvp || bossFirst || !saveId) return undefined;
    let alive = true;
    setOpps(null); setFailed(false);
    // Sem `reroll=1`: o servidor sorteia de novo a cada pedido e o refresh do Torneio ranqueado NÃO é gasto aqui.
    getOpponents(saveId)
      .then(r => { if (alive) setOpps(r.opponents ?? []); })
      .catch(() => { if (alive) { setOpps([]); setFailed(true); } });
    return () => { alive = false; };
  }, [pvp, bossFirst, saveId, screenSeed, attempt]);

  const choices: M3Choice[] = pvp
    ? (bossFirst ? pvpChoices(screenSeed, [], playerLevel, () => ({})) : opps ? pvpChoices(screenSeed, opps, playerLevel, artOf) : [])
    : adventureChoices(screenSeed);
  const loading = pvp && !bossFirst && !!saveId && opps === null;
  const canRedraw = redraws < M3_REDRAWS_PER_VISIT && !loading && !failed;
  const redraw = () => { if (!canRedraw) return; setRedraws(n => n + 1); setScreenSeed(freshSeed()); };
  const fightLabel = isPt ? 'Jogar' : 'Play';

  const glass = (src: string | undefined, px: number) => (
    <MiniGlass size={64}>
      {src && <img src={src} alt="" width={px} height={px} style={{ width: px, height: px, imageRendering: 'pixelated', display: 'block' }} />}
    </MiniGlass>
  );

  const linha = (c: M3Choice, i: number) => {
    if (c.mode === 'adventure') {
      const nome = tileElementName(c.element, isPt);
      return (
        <EscolhaLinha
          key={`${c.element}-${c.seed}`}
          rowProps={{ 'data-m3-escolha-opcao': i, 'data-m3-escolha-elemento': c.element, role: 'listitem' }}
          lead={glass(elementIcon(c.element), 48)}
          title={nome}
          sub={isPt ? 'Time de 4 da fenda' : 'Rift team of 4'}
          reward={<RewardPreview mode="before" language={lang} size={14} items={[{ kind: 'bits', max: M3_MAX_BITS }]} />}
          onAction={() => onFight(c)}
          actionLabel={fightLabel}
          actionAriaLabel={isPt ? `Jogar contra o time de ${nome}` : `Play — ${nome} team`}
          actionProps={{ 'data-m3-escolha-lutar': i }}
        />
      );
    }
    return c.boss ? linhaBoss(c, i) : linhaJogador(c, i);
  };

  const linhaBoss = (c: M3PvpChoice, i: number) => (
    <EscolhaLinha
      key={`boss-${c.seed}`}
      rowProps={{ 'data-m3-escolha-opcao': i, 'data-m3-escolha-boss': true, role: 'listitem' }}
      lead={glass(BOSS_SHARD_ART, 48)}
      title={<span data-m3-escolha-boss-tag>Boss</span>}
      sub={isPt ? 'Vencer rende 1 Fragmento de Boss' : 'A win gives 1 Boss Shard'}
      onAction={() => onFight(c)}
      actionLabel={fightLabel}
      actionAriaLabel={isPt ? 'Jogar contra o Boss' : 'Play — the Boss'}
      actionProps={{ 'data-m3-escolha-lutar': i }}
    />
  );

  const linhaJogador = (c: M3PvpChoice, i: number) => {
    const level = c.foe?.level ?? playerLevel;
    // §473: nome de pessoa e número de ranking nunca chegam ao Match-3; só o Soulmon e o level.
    const titulo = isPt ? `Jogador nv ${level}` : `Player Lv ${level}`;
    const r = pvpRewards(true);
    return (
      <EscolhaLinha
        key={`${c.opponentId}-${c.seed}`}
        rowProps={{ 'data-m3-escolha-opcao': i, 'data-m3-escolha-jogador': c.opponentId, role: 'listitem' }}
        lead={glass(c.icon ?? c.foe?.sprite, 64)}
        title={titulo}
        sub={<><EstagioMarca forma={c.stage} isPt={isPt} />{c.petName ?? ''}</>}
        reward={<RewardPreview mode="before" language={lang} size={14} items={[{ kind: 'bits', max: r.bits }, { kind: 'honor', max: r.honor }]} />}
        onAction={() => onFight(c)}
        actionLabel={fightLabel}
        actionAriaLabel={isPt ? `Jogar contra ${titulo}` : `Play — ${titulo}`}
        actionProps={{ 'data-m3-escolha-lutar': i }}
      />
    );
  };

  return (
    <div data-m3-escolha={mode} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {loading && (
        <p role="status" data-m3-escolha-carregando style={{ ...sm2Hint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', margin: 0 }}>
          <Icon name="sync" size={24} tone="primary" className="animate-spin" />
          {isPt ? 'Procurando jogadores…' : 'Looking for players…'}
        </p>
      )}
      {failed && (
        <div role="status" data-m3-escolha-erro style={{ ...escolhaCardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: 12 }}>
          <Icon name="cloud_off" size={24} tone="muted" />
          <p style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Não deu para carregar os jogadores.' : "Couldn't load the players."}</p>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Pode ser a sua conexão.' : 'It may be your connection.'}</p>
          <button type="button" data-m3-escolha-retry onClick={() => setAttempt(n => n + 1)} style={{ ...sm2Button('outline'), width: '100%', maxWidth: 200 }}>
            {isPt ? 'Tentar de novo' : 'Try again'}
          </button>
        </div>
      )}
      {pvp && !loading && !failed && choices.length === 0 && (
        <p data-m3-escolha-vazio style={{ ...sm2Hint, textAlign: 'center', padding: '12px 0', margin: 0 }}>
          {saveId
            ? (isPt ? 'Nenhum jogador para enfrentar agora. Tente de novo daqui a pouco.' : 'No players to face right now. Try again in a little while.')
            : (isPt ? 'O PvP precisa de uma conta conectada.' : 'PvP needs a signed-in account.')}
        </p>
      )}
      {choices.length > 0 && (
        <div role="list" aria-label={pvp ? (isPt ? 'Escolha um jogador' : 'Choose a player') : (isPt ? 'Escolha um elemento' : 'Choose an element')} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {choices.map(linha)}
        </div>
      )}
      {canRedraw && (pvp ? !!saveId : true) && (
        <SortearNovos
          buttonProps={{ 'data-m3-escolha-sortear': true }}
          onClick={redraw}
          label={isPt ? `Sortear outros ${M3_CHOICES}` : `Draw ${M3_CHOICES} new opponents`}
        />
      )}
    </div>
  );
}
