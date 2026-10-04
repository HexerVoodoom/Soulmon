import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import { MiniGlass } from './MiniGlass';
import { FRAMES, frameAvailable, type AvatarFrame as FrameDef, type FrameContext } from '../../utils/frames';
import { sm2Hint, sm2Text } from '../form/FormKit';

/**
 * MOLDURAS DE AVATAR (R8, 04/10/2026) — o desenho e o seletor. O catálogo e as regras moram em
 * `utils/frames.ts`; aqui só se pinta.
 *
 * ⚠️ PLACEHOLDER: ainda não há arte. A moldura é um anel de CSS (`outline` + `box-shadow`, que seguem o
 * `border-radius` do vidro) com a cor e o traço do `look` de cada uma. Quando a arte chegar (blocos de
 * moldura em `PROMPTS-PARA-O-DONO.md`, entrega em `E:/Soulmon-assets/entrada-dono/molduras/`), entra um
 * mapa `id → PNG` e este componente passa a desenhar a imagem por cima do avatar; nenhum chamador muda.
 *
 * Moldura de avatar é PEÇA PRÓPRIA, não "ícone dentro de box": ela envolve a CRIATURA. Os glifos de UI
 * continuam pelados (regra do dono). É cosmética — não toca em luta, ganho nem economia.
 */
export function AvatarFrame({ frame, children, style }: { frame: FrameDef | null; children: ReactNode; style?: CSSProperties }) {
  if (!frame) return <>{children}</>;
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
            {!ok && <Icon name="lock" size={20} tone="muted" />}
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
