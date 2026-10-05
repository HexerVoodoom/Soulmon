import type { Language } from '../../utils/i18n';
import { homeMissions, type HomeMission } from '../../utils/homeMissions';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';

/** Entrada CRUA, montada aqui: o card é `lazy` no `App` (orçamento do JS de entrada). */
export default function HomeMissions({ language, input, onOpen }: {
  language: Language;
  input: Parameters<typeof homeMissions>[0];
  onOpen: (m: HomeMission) => void;
}) {
  const { daily, weekly } = homeMissions(input);
  return <HomeMissionsCard language={language} daily={daily} weekly={weekly} onOpen={onOpen} />;
}

/**
 * O CARD DE MISSÕES no topo da Home (ajuste do dono, 05/10/2026). Diárias
 * primeiro (até 3), semanais do Torneio depois, numa linha compacta cada. Tocar
 * leva DIRETO ao lugar da missão (`onOpen`). Sem cobrança: missão feita ganha
 * um ✓ e nada pisca ou conta regressivo.
 */
export function HomeMissionsCard({ language, daily, weekly, onOpen }: {
  language: Language;
  daily: readonly HomeMission[];
  weekly: readonly HomeMission[];
  onOpen: (m: HomeMission) => void;
}) {
  const isPt = language === 'pt-BR';
  if (!daily.length && !weekly.length) return null;
  const row = (m: HomeMission, compact: boolean) => (
    <li key={m.key}>
      <button
        type="button"
        data-home-mission={m.kind}
        data-done={m.done ? 'true' : 'false'}
        onClick={() => onOpen(m)}
        style={{
          width: '100%', minHeight: compact ? 40 : 44, display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          color: m.done ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
          fontFamily: 'var(--sm2-font-text)', fontSize: compact ? 'var(--sm2-text-sm)' : 15,
        }}
      >
        <Icon name={m.done ? 'check' : 'chevron_right'} size={20} tone={m.done ? 'muted' : 'inherit'} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isPt ? m.textPt : m.textEn}
        </span>
        {m.target !== undefined && (
          <span style={{ color: 'var(--sm2-muted)', fontVariantNumeric: 'tabular-nums' }}>{m.count}/{m.target}</span>
        )}
      </button>
    </li>
  );
  const list = { listStyle: 'none', margin: 0, padding: 0 } as const;
  return (
    <section
      data-home-missions
      aria-label={isPt ? 'Missões' : 'Missions'}
      style={{
        border: '1px solid var(--sm2-line)', borderRadius: 12, padding: '4px 12px 8px',
        backgroundColor: 'var(--sm2-surface)', marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 className="sm2-title" style={{ flex: 1, margin: 0, fontSize: 'var(--sm2-text-md)' }}>{isPt ? 'Missões' : 'Missions'}</h2>
        <InfoTip language={language} label={isPt ? 'Sobre as missões' : 'About missions'} align="right">
          {isPt
            ? 'Toque numa missão para ir direto até ela. Destravar uma tarefa parada dá o mesmo alívio de sempre, não importa há quanto tempo ela esperava. As semanais são do Torneio.'
            : 'Tap a mission to go straight to it. Getting a stuck task moving gives the usual relief, no matter how long it waited. Weekly ones belong to the Tournament.'}
        </InfoTip>
      </div>
      {daily.length > 0 && <ul style={list}>{daily.map(m => row(m, false))}</ul>}
      {weekly.length > 0 && (
        <>
          <p style={{ margin: '6px 0 0', color: 'var(--sm2-muted)', fontSize: 'var(--sm2-text-sm)' }}>{isPt ? 'Da semana' : 'This week'}</p>
          <ul style={list}>{weekly.map(m => row(m, true))}</ul>
        </>
      )}
    </section>
  );
}
