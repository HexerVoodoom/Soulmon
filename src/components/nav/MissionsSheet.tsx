import { Suspense, lazy } from 'react';
import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { ModalSheet } from '../form/FormKit';
import type { WeeklyMission, WeeklyMissionId } from '../../utils/weeklyMissions';
import type { BuildingQuestsProps } from './BuildingQuestList';
import { questMarkLabel, type QuestMark } from '../../utils/questMarks';
import { MissionMark } from '../play/MissionMark';
import { StrollQuestLine } from './StrollQuestLine';
import { FirstDayCard } from '../FirstDayCard';
import type { FirstDayProgress } from '../../utils/firstDay';

const WeeklyMissionList = lazy(() => import('../mercado/ShopShelf').then(m => ({ default: m.WeeklyMissionList })));
const ConquistasSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.ConquistasSheet })));
const BuildingQuestList = lazy(() => import('./BuildingQuestList').then(m => ({ default: m.BuildingQuestList })));

/**
 * A LISTA DE MISSÕES, aberta pelos ícones da Home. O Passeio é a EXCEÇÃO (07/10/2026,
 * "Stroll fica com o NPC"): a experiência inteira vive no lote dele; aqui só há a linha
 * "Take a stroll" (`StrollQuestLine`) — aponta, fica pronta quando o NPC concluiu, resgata.
 */
export function MissionsSheet({ kind, open, onClose, language, crossings, onClaimStroll, todayKey, weekly, onClaimWeekly, missionProgress, marks, buildings, firstDay }: {
  /** Qual acesso abriu esta folha (07/10/2026): `daily` = Primeiro dia + Hoje; `weekly` = Esta semana + Conquistas. */
  kind: 'daily' | 'weekly';
  open: boolean;
  onClose: () => void;
  language: Language;
  crossings: CrossingsState;
  /** O Resgatar da linha do passeio (só o recibo do dia; o pagamento é do "Concluir" no NPC). */
  onClaimStroll: () => void;
  todayKey: string;
  /** As missões da semana e o resgate dos Emblemas (o mesmo do Torneio). */
  weekly: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  onClaimWeekly: (id: WeeklyMissionId) => void;
  /** Permanentes (`getMissionProgress`). */
  missionProgress: Record<string, number>;
  /** A marca de cada seção (`questMarks`). */
  marks: { daily: QuestMark; torneio: QuestMark; conquistas: QuestMark; firstDay?: QuestMark };
  /** O cartão do primeiro dia (os três gestos) — uma MISSÃO, por isso mora aqui e não na Home. `null`/ausente = não há (cumpriu ou o dia virou). */
  firstDay?: FirstDayProgress | null;
  /** As missões de prédio listadas no menu (`utils/buildingQuests.ts`). Fazem parte de "Hoje". */
  buildings?: BuildingQuestsProps;
}) {
  const isPt = language === 'pt-BR';
  const daily = kind === 'daily';
  return (
    <ModalSheet open={open} title={daily ? (isPt ? 'Missões diárias' : 'Daily missions') : (isPt ? 'Missões semanais' : 'Weekly missions')} onClose={onClose} language={language}>
      <div data-missions-sheet={kind}>
        <Suspense fallback={null}>
          {daily && firstDay && (
            <Section title={isPt ? 'Primeiro dia' : 'First day'} mark={marks.firstDay ?? null} isPt={isPt} id="first-day">
              <FirstDayCard progress={firstDay} language={language} />
            </Section>
          )}
          {daily && <Section title={isPt ? 'Hoje' : 'Today'} mark={marks.daily} isPt={isPt} id="daily">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StrollQuestLine language={language} crossings={crossings} todayKey={todayKey} onClaim={onClaimStroll} />
              {buildings && <BuildingQuestList language={language} {...buildings} />}
            </div>
          </Section>}
          {!daily && (
            <Section title={isPt ? 'Esta semana' : 'This week'} mark={marks.torneio} tone="blue" isPt={isPt} id="weekly">
              <WeeklyMissionList language={language} weeklyMissions={weekly} onClaimWeekly={onClaimWeekly} />
            </Section>
          )}
          {/* Conquistas (permanentes) moram na folha SEMANAL: são o "longo prazo" das missões e não pertencem ao dia. */}
          {!daily && (
            <Section title={isPt ? 'Conquistas' : 'Achievements'} mark={marks.conquistas} isPt={isPt} id="achievements">
              <ConquistasSheet language={language} missionProgress={missionProgress} />
            </Section>
          )}
        </Suspense>
      </div>
    </ModalSheet>
  );
}

/** Uma seção da lista, com a marca do lugar ao lado do título (`!` / `?`). */
function Section({ title, mark, tone = 'gold', isPt, id, children }: { id?: string; title: string; mark: QuestMark; tone?: 'blue' | 'gold'; isPt: boolean; children: React.ReactNode }) {
  return (
    <section data-missions-section={id ?? 'other'} data-quest-mark={mark ?? 'none'} aria-label={title} style={{ marginBottom: 20 }}>
      <h3 className="sm2-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px', fontSize: 'var(--sm2-text-md)' }}>
        <span style={{ flex: 1 }}>{title}</span>
        {mark && <MissionMark kind={mark} tone={tone} size={24} isPt={isPt} />}
        {mark && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{questMarkLabel(mark, isPt)}</span>}
      </h3>
      {children}
    </section>
  );
}
