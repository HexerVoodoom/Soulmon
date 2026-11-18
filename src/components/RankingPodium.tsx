import type { Language } from '../utils/i18n';
import type { RankingRow } from '../utils/rankings';
import { resolvePodiumArt, type PodiumArt, type PodiumPlace } from '../assets/soulmon/ranking';
import { PlayerName } from './ui/PlayerName';
import { Icon } from './ui/Icon';

/** A linha do pódio. `guildName` chega pelo §319 (o clã embaixo do nome); ausente = sem clã. */
export type PodiumRow = RankingRow & { guildName?: string | null };

const PLACES: readonly PodiumPlace[] = [1, 2, 3];

/**
 * PÓDIO do ranking (REGISTRO §326, 13/11/2026, pedido do dono: "o pódio do rank está muito feio").
 *
 * Hierarquia: o 1º no CENTRO, coluna mais larga, pedestal mais alto, coroa, medalha maior, nome e pontos maiores e o pontos em
 * `gold-ink`; 2º à esquerda e 3º à direita (CSS grid), mas no DOM e para o leitor de tela a ordem é 1 · 2 · 3.
 * Cada lugar: [coroa só no 1º] · medalha · nome com o clã embaixo (`ui/PlayerName`) · pontos (`sm2-num`, algarismos tabulares) ·
 * pedestal. O pedestal leva o `role="img"` com o rótulo da posição ("1º lugar"); medalha e coroa são decorativas.
 *
 * ARTE POR SLOT: cada peça (pedestal, medalha, coroa) vem de `resolvePodiumArt` (`assets/soulmon/ranking`); sem o PNG, a versão em
 * CSS (`.sm-rank-podium*` em `index.css`, só tokens). Soltar o PNG na pasta basta. `art` é injetável só para teste.
 *
 * Lugar sem ninguém (placar com 1 ou 2 pessoas): o pedestal da posição aparece APAGADO e fora da árvore de acessibilidade, para o
 * 1º continuar no centro (antes, com 1 pessoa, um bloco de ouro ocupava a largura toda; com 2, o 1º ia para a direita).
 */
export function RankingPodium({ rows, language, format = String, art = resolvePodiumArt }: {
  /** As até 3 primeiras linhas do placar (o resto é ignorado). */
  rows: PodiumRow[];
  language: Language;
  format?: (n: number) => string;
  art?: (place: PodiumPlace) => PodiumArt;
}) {
  const isPt = language === 'pt-BR';
  const youTag = ` (${isPt ? 'você' : 'you'})`;
  const posLabel = (n: number) => (isPt ? `${n}º lugar` : `Rank ${n}`);
  const prize = (r: PodiumRow) => (r.prizePlace ? (isPt ? `prêmio ${r.prizePlace}º` : `prize #${r.prizePlace}`) : null);
  const byPlace = new Map<PodiumPlace, PodiumRow>();
  for (const r of rows.slice(0, 3)) byPlace.set(Math.min(3, Math.max(1, r.rank)) as PodiumPlace, r);

  return (
    <ol data-ranking-podium className="sm-rank-podium" aria-label={isPt ? 'Pódio' : 'Podium'}>
      {PLACES.map(place => {
        const r = byPlace.get(place);
        const a = art(place);
        const pedestal = (label?: string) => (
          <span
            className="sm-rank-podium__pedestal"
            data-podium-pedestal={a.pedestal ? 'art' : 'css'}
            role={label ? 'img' : undefined}
            aria-label={label}
          >
            {a.pedestal && <img src={a.pedestal} alt="" draggable={false} />}
          </span>
        );
        const medal = (
          <span className="sm-rank-podium__medal sm2-num" data-podium-medal={a.medal ? 'art' : 'css'} aria-hidden="true">
            {a.medal ? <><img src={a.medal} alt="" draggable={false} /><span className="sm-rank-podium__num">{place}</span></> : place}
          </span>
        );

        if (!r) {
          return (
            <li key={place} className="sm-rank-podium__slot" data-podium-place={place} data-place={place} data-podium-empty aria-hidden="true">
              <span className="sm-rank-podium__head">
                {medal}
                <span className="sm-rank-podium__name">—</span>
              </span>
              {pedestal()}
            </li>
          );
        }

        const p = prize(r);
        return (
          <li
            key={place} value={r.rank}
            className="sm-rank-podium__slot"
            data-podium-place={place} data-place={place}
            data-ranking-me={r.me ? 'true' : undefined}
            aria-current={r.me ? 'true' : undefined}
          >
            <span className="sm-rank-podium__head">
              {place === 1 && (
                <span className="sm-rank-podium__crown" data-podium-crown={a.crown ? 'art' : 'css'} aria-hidden="true">
                  {a.crown ? <img src={a.crown} alt="" draggable={false} /> : <Icon name="emoji_events" size={24} fill={1} tone="gold" />}
                </span>
              )}
              {medal}
              <span className="sm-rank-podium__name">
                <PlayerName name={r.name} suffix={r.me ? youTag : ''} guildName={r.guildName} isPt={isPt} align="center" />
              </span>
              <span className="sm-rank-podium__score sm2-num" data-podium-score>{format(r.score)}</span>
              {p && <span className="sm-rank-podium__prize">{p}</span>}
            </span>
            {pedestal(posLabel(r.rank))}
          </li>
        );
      })}
    </ol>
  );
}
