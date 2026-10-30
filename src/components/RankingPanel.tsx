import { useEffect, useRef, useState } from 'react';
import type { Language } from '../utils/i18n';
import { ModalSheet } from './form/FormKit';
import { RankingList, RANKING_LIST_SIZE } from './RankingList';
import {
  fetchRanking, submitScore, RANKING_TIER_NAMES, isTimeRanked, formatRankTime,
  type RankedGame, type RankingBoard, type RankingPeriod,
} from '../utils/rankings';

/**
 * Ranking de um jogo. A FAIXA vem antes da lista (a posição absoluta é leitura de comparação;
 * a faixa mede o jogador contra ele mesmo). Com `score`, envia o resultado ao montar (uma vez).
 * Falha de rede é silenciosa: ranking nunca atrapalha o fim da partida.
 */
export function RankingPanel({ game, saveId, language, score = null, period = 'weekly' }: {
  game: RankedGame;
  saveId?: string;
  language: Language;
  score?: number | null;
  period?: RankingPeriod;
}) {
  const isPt = language === 'pt-BR';
  const [board, setBoard] = useState<RankingBoard | null>(null);
  const [open, setOpen] = useState(false);
  const sent = useRef(false);

  useEffect(() => {
    if (!saveId || sent.current) return;
    sent.current = true;
    const run = score !== null ? submitScore(game, saveId, score, period) : fetchRanking(game, saveId, period, RANKING_LIST_SIZE);
    run.then(setBoard).catch(() => { /* sem rede: o painel some */ });
  }, [game, saveId, score, period]);

  if (!saveId || !board) return null;
  const timed = isTimeRanked(game);
  const fmt = (n: number) => (timed ? formatRankTime(n) : String(n));
  const tier = board.me?.tier ? RANKING_TIER_NAMES[board.me.tier] : null;
  return (
    <div data-ranking-panel={game} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {timed && board.me && (
        <p data-ranking-best style={{ margin: 0 }}>
          {isPt ? `Seu melhor tempo na semana: ${formatRankTime(board.me.score)}` : `Your best time this week: ${formatRankTime(board.me.score)}`}
        </p>
      )}
      {board.me && board.me.tier && tier && (
        <p data-ranking-tier={board.me.tier} style={{ margin: 0 }}>
          {isPt ? `Sua faixa ${period === 'monthly' ? 'no mês' : 'na semana'}: ${tier.pt}` : `Your tier this ${period === 'monthly' ? 'month' : 'week'}: ${tier.en}`}
        </p>
      )}
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? (isPt ? 'Esconder ranking' : 'Hide ranking') : (isPt ? (period === 'monthly' ? 'Ver ranking do mês' : 'Ver ranking da semana') : (period === 'monthly' ? 'See monthly ranking' : 'See weekly ranking'))}
      </button>
      <ModalSheet
        open={open} onClose={() => setOpen(false)} language={language} placement="center"
        title={period === 'monthly' ? (isPt ? 'Ranking do mês' : 'Monthly ranking') : (isPt ? 'Ranking da semana' : 'Weekly ranking')}
      >
        <RankingList rows={board.top} meRank={board.me?.rank ?? null} meScore={board.me?.score ?? null} language={language} format={fmt} />
      </ModalSheet>
    </div>
  );
}
