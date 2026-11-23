import { useEffect, useRef, useState } from 'react';
import type { Language } from '../utils/i18n';
import { RankingModal } from './RankingModal';
import { BotaoEspecial } from './ui/BotaoEspecial';
import { RankingList, RANKING_LIST_SIZE } from './RankingList';
import {
  fetchRanking, submitScore, isTimeRanked, formatRankTime,
  type RankedGame, type RankingBoard, type RankingPeriod,
} from '../utils/rankings';

/**
 * Ranking de um jogo. A FAIXA vem antes da lista (a posição absoluta é leitura de comparação;
 * a faixa mede o jogador contra ele mesmo). Com `score`, envia o resultado ao montar (uma vez).
 * Falha de rede é silenciosa: ranking nunca atrapalha o fim da partida.
 */
export function RankingPanel({ game, saveId, language, score = null, period = 'weekly', inline = false }: {
  game: RankedGame;
  saveId?: string;
  language: Language;
  score?: number | null;
  period?: RankingPeriod;
  /** A tabela direto na tela (sem botão nem modal): a pergunta do Pipo antes do minijogo (30/10/2026). */
  inline?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const [board, setBoard] = useState<RankingBoard | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const sent = useRef(false);

  useEffect(() => {
    if (!saveId || sent.current) return;
    sent.current = true;
    const run = score !== null ? submitScore(game, saveId, score, period) : fetchRanking(game, saveId, period, RANKING_LIST_SIZE);
    run.then(setBoard).catch(() => { setFailed(true); /* sem rede: o painel some (inline mostra o aviso) */ });
  }, [game, saveId, score, period]);

  if (!saveId) return null;
  // Estados da lista (18/11/2026, mocks do dono): só a tabela inline (a pergunta do Pipo) mostra carregando/offline; no fim da partida o painel segue sumindo em silêncio.
  if (!board) {
    if (!inline) return null;
    return failed
      ? <p data-ranking-offline style={{ margin: 0, textAlign: 'center', color: 'var(--sm2-muted)' }}>{isPt ? 'Sem conexão: o ranking volta quando a rede voltar.' : 'Offline: the ranking returns when the network does.'}</p>
      : <p data-ranking-loading role="status" style={{ margin: 0, textAlign: 'center', color: 'var(--sm2-muted)' }}>{isPt ? 'Carregando o ranking…' : 'Loading the ranking…'}</p>;
  }
  const timed = isTimeRanked(game);
  const fmt = (n: number) => (timed ? formatRankTime(n) : String(n));
  return (
    <div data-ranking-panel={game} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {timed && board.me && (
        <p data-ranking-best style={{ margin: 0 }}>
          {isPt ? `Seu melhor tempo na semana: ${formatRankTime(board.me.score)}` : `Your best time this week: ${formatRankTime(board.me.score)}`}
        </p>
      )}
      {inline ? (
        <RankingList rows={board.top} meRank={board.me?.rank ?? null} meScore={board.me?.score ?? null} language={language} format={fmt} />
      ) : (<>
      <BotaoEspecial variant="ranking" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? (isPt ? 'Esconder ranking' : 'Hide ranking') : (isPt ? (period === 'monthly' ? 'Ver ranking do mês' : 'Ver ranking da semana') : (period === 'monthly' ? 'See monthly ranking' : 'See weekly ranking'))}
      </BotaoEspecial>
      <RankingModal
        open={open} onClose={() => setOpen(false)} language={language}
        title={period === 'monthly' ? (isPt ? 'Ranking do mês' : 'Monthly ranking') : (isPt ? 'Ranking da semana' : 'Weekly ranking')}
      >
        <RankingList rows={board.top} meRank={board.me?.rank ?? null} meScore={board.me?.score ?? null} language={language} format={fmt} />
      </RankingModal>
      </>)}
    </div>
  );
}
