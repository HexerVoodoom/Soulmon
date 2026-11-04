import type { CSSProperties } from 'react';
import { ENERGY_ICON } from '../../utils/rewardIcons';

/**
 * CUSTO DE ENERGIA (pedido do dono, 04/11/2026): tudo o que gasta energia mostra o ícone da energia no botão/cartão.
 * Decorativo (`aria-hidden`): o nome acessível do botão não muda; o texto do custo já mora numa linha ao lado
 * (`FunSessionLine`, dica da Masmorra). `data-energy-cost` é o gancho dos testes e do contrato.
 */
export function EnergyCost({ amount = 1, size = 18, style }: { amount?: number; size?: number; style?: CSSProperties }) {
  return (
    <span aria-hidden="true" data-energy-cost={amount} className="sm2-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginInlineStart: 8, fontWeight: 600, ...style }}>
      <img src={ENERGY_ICON} alt="" width={size} height={size} style={{ width: size, height: size, imageRendering: 'pixelated' }} />
      {amount}
    </span>
  );
}
