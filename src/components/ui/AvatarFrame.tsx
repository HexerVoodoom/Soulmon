import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import { MiniGlass } from './MiniGlass';
import { FRAMES, FRAME_ART_CANVAS, FRAME_ART_OPENING, frameArt, frameAvailable, type AvatarFrame as FrameDef, type FrameContext } from '../../utils/frames';
import { PixelIcon } from './PixelIcon';
import { STATUS_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import { sm2Hint, sm2Text } from '../form/FormKit';

/**
 * MOLDURAS DE AVATAR (R8, 04/10/2026) — o desenho e o seletor. O catálogo e as regras moram em
 * `utils/frames.ts`; aqui só se pinta.
 *
 * ARTE (04/10/2026): as 14 molduras do dono (`FRAME_ART`, `utils/frames.ts`). Todas vêm normalizadas
 * (canvas 192², abertura de 96 centrada), então a conta é uma só: a imagem é desenhada POR CIMA do avatar
 * com a abertura em 94% do lado dele (a moldura morde 3% de cada borda — sem fresta entre arte e vidro) e a
 * ornamentação transborda; a `margin` reserva esse transbordo para não invadir o vizinho. Id sem arte cai no
 * anel de CSS do `look` (o placeholder de antes). Mestre e Grão-Mestre trazem a plaquinha lisa embaixo: o
 * "#N" (`plaque`, o mesmo número do `TierMark`) é TEXTO vivo por cima dela, nunca desenhado na arte.
 *
 * Moldura de avatar é PEÇA PRÓPRIA, não "ícone dentro de box": ela envolve a CRIATURA. Os glifos de UI
 * continuam pelados (regra do dono). É cosmética — não toca em luta, ganho nem economia.
 */
export function AvatarFrame({ frame, children, style, size = 32, plaque }: {
  frame: FrameDef | null;
  children: ReactNode;
  style?: CSSProperties;
  /** Lado do avatar em CSS px (os dois chamadores usam 32). */
  size?: number;
  /** Mestre/Grão-Mestre: o "#N" escrito na plaquinha da arte. Ignorado nas outras molduras. */
  plaque?: number | null;
}) {
  if (!frame) return <>{children}</>;
  const art = frameArt(frame.id);
  if (art) {
    const F = Math.round(size * (FRAME_ART_CANVAS / FRAME_ART_OPENING) * 0.94);
    const off = Math.round((size - F) / 2);
    const comPlaca = plaque && (frame.tierId === 'mestre' || frame.tierId === 'grao-mestre');
    return (
      <span
        data-avatar-frame={frame.id}
        data-avatar-frame-art
        style={{ position: 'relative', display: 'inline-flex', flex: 'none', margin: -off, ...style }}
      >
        {children}
        <img
          src={art}
          alt=""
          aria-hidden="true"
          draggable={false}
          width={F}
          height={F}
          style={{ position: 'absolute', left: off, top: off, width: F, height: F, maxWidth: 'none', imageRendering: 'pixelated', pointerEvents: 'none' }}
        />
        {comPlaca && (
          <span
            className="sm2-num"
            data-avatar-frame-plaque={plaque}
            style={{
              position: 'absolute', left: '50%', top: Math.round(F * 0.82) + off, transform: 'translate(-50%, -50%)',
              fontSize: 'var(--sm2-text-xs)', fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
              color: 'var(--sm2-viewport-ink)', textShadow: '0 0 2px #000, 0 1px 1px #000', pointerEvents: 'none',
            }}
          >
            #{plaque}
          </span>
        )}
      </span>
    );
  }
  const { ring, accent, line, width } = frame.look;
  return (
    <span
      data-avatar-frame={frame.id}
      style={{
        display: 'inline-flex', flex: 'none',
        borderRadius: 'var(--sm2-radius-sm)',
        outline: `${width}px ${line === 'double' ? 'solid' : line} ${ring}`,
        outlineOffset: 1,
        boxShadow: accent ? `0 0 0 1px ${accent}` : undefined,
        margin: width + 2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** O que a linha mostra sobre COMO se consegue a moldura (quando está trancada). */
function howText(f: FrameDef, isPt: boolean): string {
  if (f.origin === 'rank') return isPt ? 'Pela faixa do Torneio' : 'From your Tournament tier';
  if (f.origin === 'shop') return isPt ? `Loja · ${f.price} Bits` : `Shop · ${f.price} Bits`;
  return (isPt ? f.howPt : f.howEn) ?? '';
}

/**
 * O seletor: "Sem moldura" + o catálogo inteiro. As que o jogador pode usar são botões; as trancadas
 * aparecem com o jeito de conseguir (tracejado, `aria-disabled`, fora do Tab — nunca opacidade, D-J14).
 * `previewSrc` é a criatura do jogador (a mesma que aparece no ranking).
 */
export function FrameSelector({ ctx, equipped, onEquip, previewSrc, isPt }: {
  ctx: FrameContext;
  /** Id da moldura em uso (já resolvido: `null` = sem moldura). */
  equipped: string | null;
  onEquip: (id: string | null) => void;
  previewSrc: string;
  isPt: boolean;
}) {
  const preview = (f: FrameDef | null) => (
    <AvatarFrame frame={f}>
      <MiniGlass size={32}>
        <img src={previewSrc} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: 'pixelated', display: 'block' }} />
      </MiniGlass>
    </AvatarFrame>
  );
  const rowStyle = (on: boolean, locked: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 56, padding: '4px 8px',
    borderRadius: 'var(--sm2-radius-sm)', textAlign: 'left', cursor: locked ? 'default' : 'pointer',
    background: on ? 'var(--sm2-primary-soft)' : 'none',
    border: locked ? '1px dashed var(--sm2-line)' : on ? '1px solid var(--sm2-primary-ink)' : '1px solid var(--sm2-line)',
    color: 'var(--sm2-ink)',
  });
  return (
    <ul data-frame-selector style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <li>
        <button type="button" data-frame-option="none" aria-pressed={equipped === null} onClick={() => onEquip(null)} style={rowStyle(equipped === null, false)}>
          {preview(null)}
          <span style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{isPt ? 'Sem moldura' : 'No frame'}</span>
          {equipped === null && <Icon name="check" size={20} tone="primary" />}
        </button>
      </li>
      {FRAMES.map(f => {
        const ok = frameAvailable(f, ctx);
        const on = ok && equipped === f.id;
        const name = isPt ? f.namePt : f.nameEn;
        const body = (
          <>
            {preview(f)}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ ...sm2Text, fontWeight: on ? 500 : 400 }}>{name}</span>
              {!ok && <span style={{ ...sm2Hint, margin: 0 }}>{howText(f, isPt)}</span>}
            </span>
            {on && <Icon name="check" size={20} tone="primary" />}
            {/* 04/10/2026: o cadeado é a arte de status do dono (`ui-status`). */}
            {!ok && <PixelIcon src={STATUS_ICON_ART.cadeado} size={20} />}
          </>
        );
        return (
          <li key={f.id}>
            {ok ? (
              <button type="button" data-frame-option={f.id} aria-pressed={on} onClick={() => onEquip(f.id)} style={rowStyle(on, false)}>{body}</button>
            ) : (
              <div data-frame-option={f.id} data-frame-locked aria-disabled="true" style={rowStyle(false, true)}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
