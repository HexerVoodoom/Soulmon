import type { ReactNode } from 'react';
import { PixelIcon } from '../ui/PixelIcon';

/**
 * CARTA DE JOGO (04/11/2026, pedido do dono): nos menus do Ateliê da Mente, do
 * Salão de Jogos e do Refúgio cada entrada deixa de ser só um nome e vira uma
 * carta colecionável em retrato (3:4): ilustração sangrando no topo, nome em
 * Cinzel numa faixa, uma linha de descrição e uma moldura arcana discreta.
 *
 * A arte vive em `src/assets/soulmon/cards/<id>.webp` (600×800). Enquanto o
 * arquivo não existe a carta mostra um placeholder procedural (degradê nos
 * tokens + o ícone/glifo que o jogo já tinha) — o build nunca depende da arte.
 * Lista de ids e conceito de cada ilustração: `docs/CARDS-JOGOS.md`.
 */

export const CARD_IDS = [
  // Salão de Jogos (diversão)
  'dino', 'ppt', 'match3', 'barrage',
  // Ateliê da Mente (Selo Faltante substitui a Colcha/Patchwork)
  'eco', 'zip', 'selo',
  // Refúgio (respiração/meditação)
  'respiracao', 'bolhas-calmas', 'chama',
] as const;
export type CardId = (typeof CARD_IDS)[number];

const ART = import.meta.glob('../../assets/soulmon/cards/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** URL da ilustração da carta, ou `undefined` se a arte ainda não foi gerada. */
export function cardArt(id: string): string | undefined {
  return ART[`../../assets/soulmon/cards/${id}.webp`];
}

export function GameCard({ id, title, description, icon, badges, onPress, dataAttrs, art }: {
  /** Id da carta (`CARD_IDS`) — escolhe a ilustração. */
  id: string;
  title: string;
  /** Uma linha curta. */
  description: string;
  /** Ícone/glifo do placeholder (quando não há arte). Sem ele, a inicial do nome. */
  icon?: string;
  /** Linha pequena de selos sob a carta (Bits, custo de energia…). */
  badges?: ReactNode;
  onPress: () => void;
  /** Atributos `data-*` do botão (os testes e o resto do app acham o jogo por eles). */
  dataAttrs?: Record<string, string>;
  /** Força a URL da arte (testes); o padrão é `cardArt(id)`. */
  art?: string | null;
}) {
  const src = art === undefined ? cardArt(id) : art ?? undefined;
  return (
    <li className="sm-game-card" data-game-card={id}>
      <button type="button" className="sm-game-card__btn" onClick={onPress} {...dataAttrs}>
        <span className="sm-game-card__art" aria-hidden="true">
          {src ? (
            <img src={src} alt="" loading="lazy" decoding="async" data-game-card-art />
          ) : (
            <span className="sm-game-card__placeholder" data-game-card-placeholder>
              {icon
                ? <PixelIcon src={icon} size={32} style={{ transform: 'scale(1.5)' }} />
                : <span className="sm-game-card__initial">{title.charAt(0)}</span>}
            </span>
          )}
        </span>
        <span className="sm-game-card__banner">{title}</span>
        <span className="sm-game-card__desc">{description}</span>
      </button>
      {badges !== undefined && <div className="sm-game-card__badges" data-game-card-badges>{badges}</div>}
    </li>
  );
}

/** Grade de 2 colunas (cabe em 360px). */
export function GameCardGrid({ children, ...rest }: { children: ReactNode } & Record<`data-${string}`, string | boolean>) {
  return <ul className="sm-game-card-grid" {...rest}>{children}</ul>;
}
