import type { Language } from '../utils/i18n';
import type { RankingRow } from '../utils/rankings';

/** Quantas posições o ranking mostra (igual ao `TOP_MAX` do servidor). */
export const RANKING_LIST_SIZE = 50;

const RISE_CSS = '@media (prefers-reduced-motion: no-preference){.sm-rank-podium li{animation:sm-rank-rise .4s ease-out both}'
  + '.sm-rank-podium li[data-place="1"]{animation-delay:.12s}.sm-rank-podium li[data-place="3"]{animation-delay:.2s}}'
  + '@keyframes sm-rank-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';

/**
 * Lista ÚNICA de ranking do Soulmon (30/10/2026, pedido do dono): pódio de ouro/prata/bronze, top 50,
 * a linha do jogador destacada no lugar; fora do top 50, a linha dele fixa no FIM, depois de "…", com a posição real.
 * Só tokens `--sm2-*` (ouro = `gold`, prata = `muted`, bronze = `wood`). A animação do pódio só roda sem
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
  const posLabel = (n: number) => (isPt ? `${n}º lugar` : `Rank ${n}`);

  const METAL: Record<number, { fill: string; ink: string; h: number }> = {
    1: { fill: 'var(--sm2-gold-fill)', ink: 'var(--sm2-on-gold)', h: 64 },
    2: { fill: 'var(--sm2-muted)', ink: 'var(--sm2-surface)', h: 48 },
    3: { fill: 'var(--sm2-wood)', ink: 'var(--sm2-wood-ink)', h: 36 },
  };
  // Visualmente 2º · 1º · 3º (CSS `order`); no DOM e para o leitor de tela, 1º · 2º · 3º.
  const visualOrder = (place: number) => (place === 2 ? 0 : place === 1 ? 1 : 2);

  const row = (r: { rank: number | string; name: string; score: number; me: boolean; prizePlace?: number }, pinnedRow = false) => (
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
      <span className="sm2-num" style={{ width: 32, flexShrink: 0, textAlign: 'right', color: r.me ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>{r.rank}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: r.me ? 700 : 400 }}>
        {r.name}{r.me && r.name !== youLabel ? youTag : ''}
      </span>
      <span className="sm2-num" style={{ flexShrink: 0 }}>{format(r.score)}{prize(r as RankingRow)}</span>
    </li>
  );

  return (
    <div data-ranking-list style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{RISE_CSS}</style>
      <ol
        data-ranking-podium className="sm-rank-podium"
        aria-label={isPt ? 'Pódio' : 'Podium'}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}
      >
        {podium.map(r => {
          const place = Math.min(3, Math.max(1, r.rank));
          const m = METAL[place];
          return (
            <li
              key={r.rank} value={r.rank}
              data-podium-place={place} data-place={place}
              data-ranking-me={r.me ? 'true' : undefined}
              aria-current={r.me ? 'true' : undefined}
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, listStyle: 'none', order: visualOrder(place) }}
            >
              <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: r.me ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)' }}>
                {r.name}{r.me ? youTag : ''}
              </span>
              <span className="sm2-num" style={{ color: 'var(--sm2-muted)' }}>{format(r.score)}{prize(r)}</span>
              <span
                role="img" aria-label={posLabel(r.rank)} className="sm2-num"
                style={{
                  width: '100%', height: m.h, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--sm2-text-lg)', fontWeight: 700, backgroundColor: m.fill, color: m.ink,
                  borderRadius: 'var(--sm2-radius-sm) var(--sm2-radius-sm) 0 0',
                  boxShadow: r.me ? '0 0 0 2px var(--sm2-primary-ink)' : 'inset 0 -3px 0 rgba(0,0,0,.18)',
                }}
              >{r.rank}</span>
            </li>
          );
        })}
      </ol>
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
