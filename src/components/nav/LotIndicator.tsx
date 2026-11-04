import { Icon } from '../ui/Icon';
import type { LotIndicatorId } from '../../utils/lotIndicators';

/**
 * O INDICADOR DE "HÁ O QUE GASTAR" sobre o prédio (dono, 04/11/2026): um disco escuro de fio de cobre com um ícone dourado, no canto de cima
 * à DIREITA da arte (a marca "!"/"?" e a moeda de recurso ficam no centro, então as três convivem). Parado, sem número nem som; some quando não
 * há mais o que gastar (a regra mora em `utils/lotIndicators.ts`). É só visual: não intercepta o toque do prédio.
 */
const COPY: Record<LotIndicatorId, { icon: string; pt: string; en: string }> = {
  forge: { icon: 'trending_up', pt: 'Há um equipamento para aprimorar aqui', en: 'An equipment piece can be upgraded here' },
  talent: { icon: 'auto_awesome', pt: 'Há pontos de talento para gastar aqui', en: 'There are talent points to spend here' },
};

export function LotIndicator({ kind, isPt, size = 28 }: { kind: LotIndicatorId; isPt: boolean; size?: number }) {
  const c = COPY[kind];
  return (
    <span
      data-lot-indicator={kind}
      role="img"
      aria-label={isPt ? c.pt : c.en}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', width: size, height: size, borderRadius: '50%',
        background: 'color-mix(in srgb, #06171A 92%, transparent)', border: '2px solid rgba(200, 150, 80, .9)', boxShadow: '0 1px 3px rgba(0,0,0,.6)',
      }}
    >
      <Icon name={c.icon} size={Math.round(size * 0.64)} tone="gold" fill={1} />
    </span>
  );
}
