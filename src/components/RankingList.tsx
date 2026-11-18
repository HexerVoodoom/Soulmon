import type { Language } from '../utils/i18n';
import type { RankingRow } from '../utils/rankings';
import { PlayerName } from './ui/PlayerName';
import { RankingPodium } from './RankingPodium';

/** Quantas posições o ranking mostra (igual ao `TOP_MAX` do servidor). */
export const RANKING_LIST_SIZE = 50;

/**
 * Lista ÚNICA de ranking do Soulmon (30/10/2026, pedido do dono): pódio de ouro/prata/bronze (`RankingPodium`, §326), top 50,
 * a linha do jogador destacada no lugar; fora do top 50, a linha dele fixa no FIM, depois de "…", com a posição real.
 * Só tokens `--sm2-*` (ouro = `gold`, prata = `silver`, bronze = `bronze`). A animação do pódio só roda sem
 * `prefers-reduced-motion`. Semântica: `<ol>` de verdade; a linha do jogador leva `aria-current`.
 */
export function RankingList({ rows, meRank, meScore, language, format = String, size = RANKING_LIST_SIZE }: {
  rows: RankingRow[];
  /** Posição real do jogador (do servidor); `null` quando passou da janela varrida. */
  meRank?: number | null;
  meScore?: number | null;
  language: Language;
  format?: (n: number) => string;
  size?: number;
}) {
  const isPt = language === 'pt-BR';
  const shown = rows.slice(0, size);
  if (shown.length === 0) {
    return <p data-ranking-empty style={{ margin: 0, textAlign: 'center', color: 'var(--sm2-muted)' }}>{isPt ? 'Ninguém pontuou ainda.' : 'No scores yet.'}</p>;
  }
  const podium = shown.slice(0, 3);
  const rest = shown.slice(3);
  const pinned = !shown.some(r => r.me) && meScore !== null && meScore !== undefined;
  const youLabel = isPt ? 'Você' : 'You';
  const youTag = ` (${youLabel.toLowerCase()})`;
  const prize = (r: RankingRow) => (r.prizePlace ? ` · ${isPt ? `prêmio ${r.prizePlace}º` : `prize #${r.prizePlace}`}` : '');

  const row = (r: { rank: number | string; name: string; guildName?: string; score: number; me: boolean; prizePlace?: number }, pinnedRow = false) => (
    <li
      key={String(r.rank)}
      value={typeof r.rank === 'number' ? r.rank : undefined}
      data-ranking-row
      data-ranking-me={r.me ? 'true' : undefined}
      data-ranking-pinned={pinnedRow ? 'true' : undefined}
      aria-current={r.me ? 'true' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, padding: '0 8px', listStyle: 'none',
        borderRadius: 'var(--sm2-radius-sm)',
        backgroundColor: r.me ? 'var(--sm2-primary-soft)' : undefined,
        boxShadow: r.me ? 'inset 0 0 0 2px var(--sm2-primary-ink)' : undefined,
        color: r.me ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
      }}
    >
      <span className="sm2-num" style={{ width: 32, flexShrink: 0, textAlign: 'right', color: r.me ? 'var(--sm2-primary-ink)' : (typeof r.rank === 'number' && r.rank <= 10 ? 'var(--sm2-gold-ink)' : 'var(--sm2-muted)'), fontWeight: typeof r.rank === 'number' && r.rank <= 10 ? 700 : undefined }}>{r.rank}</span>
      {/* §321: o clã embaixo do nome (a própria linha também: é o que os outros veem). */}
      <span style={{ flex: 1, minWidth: 0 }}>
        <PlayerName name={r.name} suffix={r.me && r.name !== youLabel ? youTag : ''} guildName={r.guildName} isPt={isPt} nameStyle={{ fontWeight: r.me ? 700 : 400 }} />
      </span>
      <span className="sm2-num" style={{ flexShrink: 0 }}>{format(r.score)}{prize(r as RankingRow)}</span>
    </li>
  );

  return (
    <div data-ranking-list style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <RankingPodium rows={podium} language={language} format={format} />
      {rest.length > 0 && (
        <ol data-ranking-rest start={4} style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rest.map(r => row(r))}
        </ol>
      )}
      {pinned && (
        <>
          <div data-ranking-gap aria-hidden="true" style={{ textAlign: 'center', color: 'var(--sm2-muted)', letterSpacing: '.3em' }}>…</div>
          <ol data-ranking-pinned-list start={meRank ?? undefined} style={{ margin: 0, padding: 0 }}>
            {row({ rank: meRank ?? '—', name: youLabel, score: meScore as number, me: true }, true)}
          </ol>
        </>
      )}
    </div>
  );
}
