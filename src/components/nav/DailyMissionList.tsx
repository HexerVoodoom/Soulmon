import type { Language } from '../../utils/i18n';
import { dailyCount, dailyMissionsFor, dailyStatus, type DailyMissionsState } from '../../utils/dailyMissions';
import { sm2Button } from '../form/FormKit';
import { MissionMark } from '../play/MissionMark';

export interface DailyMissionsProps {
  state: DailyMissionsState | undefined;
  /** Dia do JOGADOR (`playerDayKey`). */
  day: string;
  bondLevel: number;
  onClaim: (id: string) => void;
}

/**
 * As missões do dia dos OUTROS RECURSOS (minijogos, foco, cuidado... — `utils/dailyMissions.ts`, REGISTRO §51). Convite, nunca
 * cobrança: a linha só diz o que fazer; quando o evento real acontece fica "pronta" e o "Resgatar" paga. SEM lista de materiais
 * (nenhuma tela de missão os mostra). Quem não fez não perde nada — amanhã a lista é outra.
 */
export function DailyMissionList({ language, state, day, bondLevel, onClaim }: DailyMissionsProps & { language: Language }) {
  const isPt = language === 'pt-BR';
  const list = dailyMissionsFor(day, bondLevel);
  if (list.length === 0) return null;
  return (
    <ul data-daily-missions style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {list.map(m => {
        const st = dailyStatus(state, day, m);
        const n = dailyCount(state, day, m);
        return (
          <li key={m.id} data-daily-mission={m.id} data-status={st} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
            <span className="sm2-title" style={{ flex: 1, minWidth: 0, fontSize: 'var(--sm2-text-md)', color: st === 'claimed' ? 'var(--sm2-muted)' : undefined }}>
              {isPt ? m.descPt : m.descEn}
              {st === 'available' && m.target > 1 && n > 0 && <span className="sm2-num" style={{ marginLeft: 6, color: 'var(--sm2-muted)' }}>{n}/{m.target}</span>}
            </span>
            {(st === 'available' || st === 'ready') && <MissionMark kind={st === 'ready' ? 'ready' : 'available'} size={24} isPt={isPt} />}
            {st === 'ready' && (
              <button type="button" style={sm2Button('primary', false, 'sm')} data-claim-daily={m.id} onClick={() => onClaim(m.id)}>
                {isPt ? 'Resgatar' : 'Claim'}
              </button>
            )}
            {st === 'claimed' && <span style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-muted)' }}>{isPt ? 'Resgatada' : 'Claimed'}</span>}
          </li>
        );
      })}
    </ul>
  );
}
