import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import { Icon } from './ui/Icon';
import { formatDelta, type EvoStatId, type EvoStatsDelta } from '../utils/evolutionStatsDelta';
import { soulLevelLabel } from '../utils/soulXP';
import type { Language } from '../utils/i18n';

/**
 * O MODALZINHO DEPOIS DA EVOLUÇÃO (05/11/2026, pedido do dono): quanto subiu cada atributo do Soulmon, "antes → depois (+N)".
 * Os números vêm de `utils/evolutionStatsDelta.ts` (a derivação do combate); aqui só se desenha. Entra na fila central como
 * `evoStats`, depois da cerimônia. Sem animação própria: o fade do `ModalSheet` já respeita `prefers-reduced-motion`.
 * Delta 0 aparece como "+0" e delta negativo como "−N", ambos em peso 400 e sem vermelho (descrição, nunca veredito).
 */
const STATS: Record<EvoStatId, { icon: string; pt: string; en: string }> = {
  hp: { icon: 'favorite', pt: 'Vida', en: 'HP' },
  atk: { icon: 'swords', pt: 'Ataque', en: 'Attack' },
  def: { icon: 'military_tech', pt: 'Defesa', en: 'Defense' },
  spd: { icon: 'bolt', pt: 'Velocidade', en: 'Speed' },
};

export function EvolutionStatsModal({ delta, stageName, language, onClose }: { delta: EvoStatsDelta; stageName: string; language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const title = isPt ? 'Seus atributos' : 'Your stats';
  return (
    <ModalSheet
      open
      placement="center"
      onClose={onClose}
      language={language}
      title={title}
      maxWidth={340}
      footer={<button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }} data-evo-stats-ok>{isPt ? 'Ótimo' : 'Great'}</button>}
    >
      <div data-evo-stats-modal>
        <p style={{ ...sm2Text, margin: '0 0 8px' }}>
          {isPt ? `${stageName} chegou a ${soulLevelLabel(delta.levelAfter)}.` : `${stageName} reached ${soulLevelLabel(delta.levelAfter)}.`}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {delta.rows.map(r => {
            const s = STATS[r.id];
            const label = isPt ? s.pt : s.en;
            const subiu = r.delta > 0;
            return (
              <li
                key={r.id}
                data-evo-stat={r.id}
                data-evo-delta={r.delta}
                style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}
              >
                <Icon name={s.icon} size={20} fill={subiu ? 1 : 0} tone={subiu ? 'primary' : 'muted'} />
                <span style={{ ...sm2Text, flex: 1, margin: 0 }}>{label}</span>
                <span className="sm2-num" style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>
                  <span style={{ color: 'var(--sm2-muted)', fontWeight: 400 }}>{r.before}</span>
                  <span aria-hidden="true">{' \u2192 '}</span>
                  <span className="sm2-sr-only">{isPt ? ' para ' : ' to '}</span>
                  {r.after}
                  {' '}
                  <span style={{ color: subiu ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)', fontWeight: subiu ? 500 : 400 }}>({formatDelta(r.delta)})</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ModalSheet>
  );
}
