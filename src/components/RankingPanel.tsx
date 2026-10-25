import { useEffect, useRef, useState } from 'react';
import type { Language } from '../utils/i18n';
import {
  fetchRanking, submitScore, RANKING_TIER_NAMES,
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
    const run = score !== null ? submitScore(game, saveId, score, period) : fetchRanking(game, saveId, period);
    run.then(setBoard).catch(() => { /* sem rede: o painel some */ });
  }, [game, saveId, score, period]);

  if (!saveId || !board) return null;
  const tier = board.me ? RANKING_TIER_NAMES[board.me.tier] : null;
  return (
    <div data-ranking-panel={game} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {board.me && tier && (
        <p data-ranking-tier={board.me.tier} style={{ margin: 0 }}>
          {isPt ? `Sua faixa ${period === 'monthly' ? 'no mês' : 'na semana'}: ${tier.pt}` : `Your tier this ${period === 'monthly' ? 'month' : 'week'}: ${tier.en}`}
        </p>
      )}
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? (isPt ? 'Esconder ranking' : 'Hide ranking') : (isPt ? (period === 'monthly' ? 'Ver ranking do mês' : 'Ver ranking da semana') : (period === 'monthly' ? 'See monthly ranking' : 'See weekly ranking'))}
      </button>
      {open && (
        <ol data-ranking-list style={{ margin: 0, paddingLeft: 20 }}>
          {board.top.length === 0 && <li>{isPt ? 'Ninguém pontuou ainda.' : 'No scores yet.'}</li>}
          {board.top.map(r => (
            <li key={r.rank} data-ranking-me={r.me ? 'true' : undefined} style={{ fontWeight: r.me ? 700 : 400 }}>
              {r.name} · {r.score}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
