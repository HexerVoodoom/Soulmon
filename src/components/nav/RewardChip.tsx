import type { ReactNode } from 'react';
import { BitsIcon } from '../ui/BitsIcon';
import { Icon } from '../ui/Icon';
import { MaterialIcon } from '../MaterialIcon';
import { MATERIALS } from '../../utils/buildingQuestsCopy';

/** O que uma missão paga. `material` leva o id do material; os demais não têm id. */
export type RewardKind = 'bits' | 'xp' | 'credits' | 'material';

/**
 * `rewardIcon` — o ponto ÚNICO que escolhe o ícone de uma recompensa (12/11/2026, pedido do dono: "usa os ícones").
 * REAIS: Bits (`BitsIcon`) e os 16 materiais (`MaterialIcon`, arte pixel de `assets/soulmon/materiais`).
 * FALLBACK (ainda sem arte própria): XP e Créditos viram uma pílula com um glifo existente do app. Quando a arte chegar, é só trocar aqui.
 */
const ICON_ACTION = 20;
export function rewardIcon(kind: RewardKind, materialId?: string, size = 20): ReactNode {
  if (kind === 'bits') return <BitsIcon size={size} />;
  if (kind === 'material') {
    const mat = MATERIALS.find(x => x.id === materialId);
    if (mat) return <MaterialIcon id={mat.id} emoji={mat.icon} size={size} />;
  }
  const glyph = kind === 'xp' ? 'bolt' : kind === 'credits' ? 'diamond' : 'inventory_2';
  return (
    <span aria-hidden="true" data-reward-fallback style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: 999, border: '1px solid var(--sm2-line)', flex: 'none' }}>
      <Icon name={glyph} size={ICON_ACTION} fill={1} tone="gold" />
    </span>
  );
}

/** Recompensa em ícone + quantidade (`+1 [ícone] Tinta`); o nome também fica em `aria-label` para leitor de tela. */
export function RewardChip({ kind, materialId, amount = 1, name, isPt }: { kind: RewardKind; materialId?: string; amount?: number; name: string; isPt: boolean }) {
  return (
    <span data-reward-chip={kind} role="img" aria-label={`${isPt ? 'Recompensa' : 'Reward'}: +${amount} ${name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {rewardIcon(kind, materialId)}
      <span aria-hidden="true">+{amount} {name}</span>
    </span>
  );
}
