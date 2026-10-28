import type { CSSProperties } from 'react';
import { bitsStyle } from '../../utils/currencies';
import { BitsIcon } from './BitsIcon';
import { RollingCount } from './RewardPop';

/**
 * `BitsAmount` — o ÚNICO jeito de mostrar um valor em Bits (D-62, 19/10/2026; revoga a D-L11
 * "Bits sem ícone", REGISTRO-DE-DECISOES §105). Ícone da moeda + número em fonte de calculadora; a
 * palavra "Bits" não aparece na tela, só para leitor de tela (`sm2-sr-only`).
 *
 * A regra "as três moedas nunca se misturam visualmente" continua: Bits = moeda `BitsIcon` + mono
 * `primary-ink`; Honra = medalha dourada em serifa; Créditos = diamante roxo.
 */
export function BitsAmount({ value, sign = '', size = 16, dim = false, style, unit, roll }: {
  value: number | string;
  /** Prefixo do número ("+", "−"). */
  sign?: string;
  /** Lado do ícone em px (12–20). */
  size?: number;
  /** Esmaecido (não dá para pagar). */
  dim?: boolean;
  style?: CSSProperties;
  /** Texto de leitor de tela no lugar de "Bits" (ex.: "Bits por rodada"). */
  unit?: string;
  /** Revelação de recompensa: o número ROLA de 0 ao valor (odômetro). Só funciona com `value` numérico; o valor final fica no DOM. */
  roll?: { run: boolean; still: boolean };
}) {
  return (
    <span
      className="sm2-num"
      data-bits-amount
      style={{
        ...bitsStyle, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
        ...(dim ? { color: 'var(--sm2-muted)' } : null), ...style,
      }}
    >
      <BitsIcon size={size} />
      <span>{roll && typeof value === 'number' ? <RollingCount value={value} sign={sign} run={roll.run} still={roll.still} /> : <>{sign}{value}</>}</span>
      <span className="sm2-sr-only">{' '}{unit ?? 'Bits'}</span>
    </span>
  );
}
