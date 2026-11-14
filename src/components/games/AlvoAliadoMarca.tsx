/**
 * MARCA DE ALVO ALIADO (§327, dono 13/11/2026): o botão sobre um ALIADO na luta em grupo. Tocar liga a mira de apoio
 * (o próximo escudo/cura/reforço do jogador vai nele, `combate/alvoAliado.ts`); tocar de novo desliga.
 *
 * É de propósito DIFERENTE da mira no inimigo (`BattleStage`, anel dourado tracejado que pisca 1 s): aqui é um LOSANGO
 * turquesa contínuo (`--sm2-primary-fill`, o turquesa do tema) com o "+" de apoio, e fica aceso enquanto a mira vale —
 * o especial pode demorar a sair. Só aparece quando o especial do jogador aceita aliado (quem chama decide com
 * `aceitaAliado`). Movimento reduzido: sem o pulso.
 */
import type { CSSProperties } from 'react';

export interface AlvoAliadoMarcaProps {
  /** Centro do corpo do aliado e o tamanho dele na cena (px), o mesmo `bodyCenter`/`size` do `BattleStage`. */
  x: number;
  y: number;
  size: number;
  name: string;
  /** A mira de apoio está neste aliado. */
  on: boolean;
  isPt: boolean;
  reduced: boolean;
  onPick: () => void;
}

/** Alvo de toque mínimo (px), o mesmo piso da mira no inimigo. */
const TOQUE_MIN = 44;

export function AlvoAliadoMarca({ x, y, size, name, on, isPt, reduced, onPick }: AlvoAliadoMarcaProps) {
  const d = Math.max(TOQUE_MIN, Math.round(size * 0.9));
  const lado = Math.round(d * 0.72); // o losango inscrito no botão
  const marca: CSSProperties = {
    position: 'absolute', left: (d - lado) / 2, top: (d - lado) / 2, width: lado, height: lado, boxSizing: 'border-box',
    transform: 'rotate(45deg)', borderRadius: 6, pointerEvents: 'none',
    border: '3px solid var(--sm2-primary-fill)',
    boxShadow: '0 0 10px var(--sm2-primary-fill), inset 0 0 6px var(--sm2-primary-soft)',
    animation: reduced ? undefined : 'sm-alvo-aliado-pulso 1.2s ease-in-out infinite alternate',
  };
  return (
    <button
      type="button"
      data-stage-ally-target
      data-stage-ally-target-on={on ? '1' : '0'}
      aria-pressed={on}
      aria-label={isPt ? `Apoiar ${name}` : `Support ${name}`}
      onClick={onPick}
      className="sm-alvo-aliado"
      style={{
        position: 'absolute', left: x - d / 2, top: y - d / 2, width: d, height: d, zIndex: 3,
        padding: 0, margin: 0, background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer',
      }}
    >
      {on && (
        <>
          <span aria-hidden="true" data-stage-ally-mark style={marca} />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', left: d / 2 - 9, top: -6, width: 18, height: 18, borderRadius: '50%', pointerEvents: 'none',
              background: 'var(--sm2-primary-fill)', color: 'var(--sm2-bg)', font: '700 14px/18px var(--sm2-font-text)', textAlign: 'center',
            }}
          >
            +
          </span>
        </>
      )}
    </button>
  );
}
