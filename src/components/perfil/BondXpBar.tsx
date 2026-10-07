import { bondProgress, BOND_MAX_LEVEL } from '../../utils/bond';
import type { Language } from '../../utils/i18n';

/**
 * Barra de XP do Vínculo (o level do usuário): progresso dentro do nível atual até o próximo.
 * Tudo DERIVADO de `bondProgress(totalXP)` (nunca persistido). Só descreve — sem meta, sem cobrança.
 * No nível máximo a barra fica cheia e diz "Max".
 */
export function BondXpBar({ totalXP, language }: { totalXP: number; language: Language }) {
  const isPt = language === 'pt-BR';
  const p = bondProgress(totalXP);
  const max = p.level >= BOND_MAX_LEVEL;
  const pct = max ? 100 : Math.round(p.ratio * 100);
  const label = isPt ? `Experiência do nível ${p.level}` : `Level ${p.level} experience`;
  const valueText = max ? (isPt ? 'Nível máximo' : 'Max level') : `${p.into} / ${p.need} XP`;
  return (
    <div data-bond-xp style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-ink)' }}>
        <span>{isPt ? `Nível ${p.level}` : `Level ${p.level}`}</span>
        <span data-bond-xp-text style={{ color: 'var(--sm2-ink-muted, var(--sm2-ink))' }}>{max ? 'Max' : `${p.into} / ${p.need} XP`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={valueText}
        style={{ height: 8, borderRadius: 4, background: 'var(--sm2-surface-2)', overflow: 'hidden', boxShadow: '0 0 0 1px var(--sm2-line)' }}
      >
        <div data-bond-xp-fill style={{ width: `${pct}%`, height: '100%', background: 'var(--sm2-primary-ink)' }} />
      </div>
    </div>
  );
}
