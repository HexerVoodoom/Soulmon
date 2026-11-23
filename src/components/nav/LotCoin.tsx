import { ENERGY_ICON } from '../../utils/rewardIcons';
import { LOT_MARK_SIZE } from '../../utils/areaLotGeometry';

/**
 * A MOEDA DE RECURSO sobre o prédio (dono, 04/11/2026): o raio da energia em AMARELO dentro de um círculo escuro de fio de cobre
 * (contraste com o cenário). Só indica que há um recurso a pegar ali; parada, sem número nem som; some quando usado ou no limite
 * (a regra mora em `utils/lotMarks.ts`). Mesmo lado das marcas "!"/"?" (`LOT_MARK_SIZE`).
 */
const BOLT_YELLOW = '#FFD23F';

export function LotCoin({ isPt, size = LOT_MARK_SIZE }: { isPt: boolean; size?: number }) {
  const m = `url("${ENERGY_ICON}") center / contain no-repeat`;
  return (
    <span
      data-lot-coin="energy"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
        width: size, height: size, borderRadius: '50%', flex: 'none',
        background: 'color-mix(in srgb, #06171A 92%, transparent)', border: '2px solid rgba(200, 150, 80, .9)',
        boxShadow: '0 1px 3px rgba(0,0,0,.6)',
      }}
    >
      <span
        role="img"
        aria-label={isPt ? 'Energia disponível aqui' : 'Energy available here'}
        style={{ display: 'block', width: size * 0.62, height: size * 0.62, background: BOLT_YELLOW, WebkitMask: m, mask: m, imageRendering: 'pixelated' }}
      />
    </span>
  );
}
