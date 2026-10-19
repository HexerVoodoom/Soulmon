import { Icon } from './Icon';
import { BitsAmount } from './BitsAmount';
import type { Language } from '../../utils/i18n';

/**
 * `RewardLine` — recompensa em ÍCONES, não em texto (D-71, 19/10/2026): `+4 [Bits] +1 [energia]
 * +1 [coração]`. Só desenha o que for > 0. Cada parte leva o nome em texto para leitor de tela
 * (`sm2-sr-only`); o ícone de energia é o mesmo `bolt` do HP/EN da Home e o de vida é `favorite`.
 * Bits vêm do `BitsAmount` (único ponto de exibição da moeda).
 */
export function RewardLine({ bits = 0, energy = 0, hearts = 0, language, size = 20 }: {
  bits?: number; energy?: number; hearts?: number; language: Language; size?: number;
}) {
  const isPt = language === 'pt-BR';
  const part = { display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' } as const;
  return (
    <span data-reward-line className="sm2-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {bits > 0 && <BitsAmount value={bits} sign="+" size={size} />}
      {energy > 0 && (
        <span data-reward="energy" style={part}>
          <Icon name="bolt" size={20} fill={1} tone="gold" />
          <span>+{energy}</span>
          <span className="sm2-sr-only">{isPt ? 'energia' : 'energy'}</span>
        </span>
      )}
      {hearts > 0 && (
        <span data-reward="hearts" style={part}>
          <Icon name="favorite" size={20} fill={1} tone="danger" />
          <span>+{hearts}</span>
          <span className="sm2-sr-only">{isPt ? 'coração' : 'heart'}</span>
        </span>
      )}
    </span>
  );
}
