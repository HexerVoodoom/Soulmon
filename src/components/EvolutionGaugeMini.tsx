import type { CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import { gaugeView } from '../utils/evolutionGauge';

/**
 * 🧬 O GAUGE DE EVOLUÇÃO, compacto, na Home (decisão do dono, 11/10/2026).
 *
 * Só DESCREVE: quanto do caminho até a próxima forma já está andado, e a
 * prévia de hoje (mais clara) que entra na próxima virada. Sem "só faltam",
 * sem prazo, sem vermelho — o gauge nunca desce, então não há o que temer.
 * A regra é de `utils/evolutionGauge.ts`; aqui não se decide nada.
 * Carregado por `lazy` (orçamento do chunk de entrada).
 */
export function EvolutionGaugeMini({
  language,
  evolutionPoints,
  evolutionStage,
  unlockedEvolutions,
  todayWeight,
}: {
  language: Language;
  evolutionPoints: number;
  evolutionStage: string;
  unlockedEvolutions?: readonly string[];
  todayWeight: number;
}) {
  const isPt = language === 'pt-BR';
  const v = gaugeView({ evolutionPoints, evolutionStage, unlockedEvolutions, todayWeight });
  if (v.top) return null;
  const pct = Math.round(v.pct * 100);
  const pctHoje = Math.round(v.pctWithToday * 100);
  const trilho: CSSProperties = {
    position: 'relative', height: 8, borderRadius: 4, overflow: 'hidden',
    background: 'var(--sm2-surface-2)', border: '1px solid var(--sm2-line)',
  };
  const rotulo = v.full
    ? (isPt ? 'A próxima forma está pronta' : 'The next form is ready')
    : (isPt ? 'Caminho até a próxima forma' : 'Path to the next form');
  return (
    <section data-evo-gauge-mini style={{ display: 'grid', gap: 4, padding: '0 2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 'var(--sm2-text-xs, 12px)', color: 'var(--sm2-muted)' }}>
        <span>{rotulo}</span>
        <span data-evo-gauge-mini-count>
          {`${Math.min(v.points, v.goal)}/${v.goal}`}
          {v.today > 0 && !v.full ? ` · +${v.today} ${isPt ? 'hoje' : 'today'}` : ''}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={v.goal}
        aria-valuenow={Math.min(v.points, v.goal)}
        style={trilho}
      >
        {pctHoje > pct && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, width: `${pctHoje}%`, background: 'var(--sm2-primary-soft)' }} />
        )}
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, background: 'var(--sm2-primary-fill)' }} />
      </div>
    </section>
  );
}
