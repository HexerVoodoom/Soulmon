import { Icon } from './Icon';
import { BitsAmount } from './BitsAmount';
import { RewardIcon } from './RewardPop';
import { ENERGY_ICON, rewardItemLabel, useRewardItemIcon, type RewardItemKind } from '../../utils/rewardIcons';
import { emblemStyle } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';

/**
 * `RewardPreview` — a linha ÚNICA de recompensas, ANTES e DEPOIS de uma ação (pedido do dono, 29/10/2026).
 *
 * `mode="before"` (CTA/entrada): valor fixo = `+20`; faixa = `até N` / `up to N` (o máximo); sem número = só o ícone.
 * `mode="after"` (resultado/toast): sempre o valor realmente concedido (`amount`), só o que for > 0.
 * Quem chama deriva os números das MESMAS funções que concedem (`bondXP`, `*Bits`, `nightmareRewards`…); aqui não
 * mora nenhuma regra. Bits vêm do `BitsAmount`; XP é o texto "EXP" depois do número (dono, 29/10/2026); materiais usam o resolvedor `rewardIcons`.
 */
export type PreviewItem =
  | { kind: 'bits'; amount?: number; max?: number }
  | { kind: 'xp'; amount?: number; max?: number }
  | { kind: 'honor'; amount?: number; max?: number }
  | { kind: 'energy'; amount?: number; max?: number }
  | { kind: 'item'; item: RewardItemKind; amount?: number; max?: number }
  /** Material avulso já existente no jogo (emoji da própria tabela de origem). */
  | { kind: 'custom'; emoji: string; label: string; amount?: number; max?: number };


function MaterialIcon({ item }: { item: RewardItemKind }) {
  const src = useRewardItemIcon(item);
  return <RewardIcon src={src} size={18} on still />;
}

export function RewardPreview({ items, mode, language, size = 20 }: {
  items: readonly PreviewItem[]; mode: 'before' | 'after'; language: Language; size?: number;
}) {
  const isPt = language === 'pt-BR';
  const upTo = isPt ? 'até' : 'up to';
  const part = { display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' } as const;
  // Texto do número: depois = valor exato (some se 0); antes = exato, "até máx" ou vazio.
  const label = (it: PreviewItem): { text: string; sr: string } | null => {
    if (mode === 'after') {
      const n = it.amount ?? 0;
      return n > 0 ? { text: `+${n}`, sr: `+${n}` } : null;
    }
    if (it.amount !== undefined) return it.amount > 0 ? { text: `+${it.amount}`, sr: `+${it.amount}` } : null;
    if (it.max !== undefined) return it.max > 0 ? { text: `${upTo} ${it.max}`, sr: `${upTo} ${it.max}` } : null;
    return { text: '', sr: isPt ? 'valor variável' : 'varies' };
  };
  const name = (it: PreviewItem): string => {
    switch (it.kind) {
      case 'bits': return 'Bits';
      case 'xp': return 'XP';
      case 'honor': return isPt ? 'Honra' : 'Honor';
      case 'energy': return isPt ? 'energia' : 'energy';
      case 'item': return rewardItemLabel(it.item, isPt);
      case 'custom': return it.label;
    }
  };
  const nodes = items.map((it, i) => {
    const l = label(it);
    if (!l) return null;
    const key = `${it.kind}-${i}`;
    if (it.kind === 'bits') {
      const n = mode === 'after' ? it.amount : it.amount ?? it.max;
      if (n !== undefined && mode === 'before' && it.amount === undefined) {
        return <span key={key} data-reward-preview="bits" style={part}>{upTo}<BitsAmount value={n} size={size} /></span>;
      }
      if (n === undefined) return <span key={key} data-reward-preview="bits" style={part}><BitsAmount value="" size={size} /></span>;
      return <span key={key} data-reward-preview="bits" style={part}><BitsAmount value={n} sign="+" size={size} /></span>;
    }
    // 29/10/2026 (dono): XP é escrito "EXP" depois do número, sem estrelinha.
    const icon = it.kind === 'xp' ? null
      : it.kind === 'energy' ? <img src={ENERGY_ICON} alt="" width={size} height={size} />
      : it.kind === 'honor' ? <Icon name="military_tech" size={size} fill={1} />
      : it.kind === 'custom' ? <span aria-hidden="true" style={{ fontSize: size }}>{it.emoji}</span>
      : <MaterialIcon item={it.item} />;
    return (
      <span key={key} data-reward-preview={it.kind} style={{ ...part, ...(it.kind === 'honor' ? emblemStyle : null) }}>
        {icon}
        {l.text && <span className="sm2-num">{l.text}</span>}
        {it.kind === 'xp' && <span aria-hidden="true" className="sm2-num" style={{ fontWeight: 800 }}>EXP</span>}
        <span className="sm2-sr-only">{' '}{name(it)} {l.text || l.sr}</span>
      </span>
    );
  }).filter(Boolean);
  if (!nodes.length) return null;
  return (
    <span data-reward-preview-row={mode} role="group" aria-label={mode === 'before' ? (isPt ? 'Você pode ganhar' : 'You can earn') : (isPt ? 'Você ganhou' : 'You earned')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {nodes}
    </span>
  );
}
