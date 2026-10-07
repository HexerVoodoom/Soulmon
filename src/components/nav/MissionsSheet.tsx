import { Suspense, lazy } from 'react';
import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { ModalSheet } from '../form/FormKit';
import type { WeeklyMission, WeeklyMissionId } from '../../utils/weeklyMissions';
import { questMarkLabel, type QuestMark } from '../../utils/questMarks';
import { MissionMark } from '../play/MissionMark';

const WeeklyMissionList = lazy(() => import('../mercado/ShopShelf').then(m => ({ default: m.WeeklyMissionList })));
const ConquistasSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.ConquistasSheet })));
const PasseioSheet = lazy(() => import('../play/PasseioSheet').then(m => ({ default: m.PasseioSheet })));

/**
 * A LISTA DE MISSÕES, aberta pelo ícone da Home (rodada 7, M8): a MESMA folha do
 * Passeio (as três do dia, a escolhida com o relógio de 24 h, o registro das
 * feitas) dentro de uma folha modal. Uma regra só, dois lugares — nada daqui
 * escreve estado que o Passeio não escreva.
 */
export function MissionsSheet({ open, onClose, language, crossings, onChange, todayKey, seed, weekly, onClaimWeekly, missionProgress, marks }: {
  open: boolean;
  onClose: () => void;
  language: Language;
  crossings: CrossingsState;
  onChange: (f: (c: CrossingsState) => CrossingsState) => void;
  todayKey: string;
  seed: string;
  /** As missões da semana e o resgate dos Emblemas (o mesmo do Torneio). */
  weekly: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  onClaimWeekly: (id: WeeklyMissionId) => void;
  /** Permanentes (`getMissionProgress`). */
  missionProgress: Record<string, number>;
  /** A marca de cada seção (`questMarks`). */
  marks: { passeio: QuestMark; torneio: QuestMark; conquistas: QuestMark };
}) {
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet open={open} title={isPt ? 'Missões' : 'Missions'} onClose={onClose} language={language}>
      <div data-missions-sheet>
        <Suspense fallback={null}>
          <Section title={isPt ? 'Do dia' : 'Today'} mark={marks.passeio} isPt={isPt}>
            <PasseioSheet language={language} crossings={crossings} onChange={onChange} todayKey={todayKey} seed={seed} />
          </Section>
          <Section title={isPt ? 'Da semana (Torneio)' : 'This week (Tournament)'} mark={marks.torneio} isPt={isPt}>
            <WeeklyMissionList language={language} weeklyMissions={weekly} onClaimWeekly={onClaimWeekly} />
          </Section>
          <Section title={isPt ? 'Conquistas' : 'Achievements'} mark={marks.conquistas} isPt={isPt}>
            <ConquistasSheet language={language} missionProgress={missionProgress} />
          </Section>
        </Suspense>
      </div>
    </ModalSheet>
  );
}

/** Uma seção da lista, com a marca do lugar ao lado do título (`!` / `?`). */
function Section({ title, mark, isPt, children }: { title: string; mark: QuestMark; isPt: boolean; children: React.ReactNode }) {
  return (
    <section data-missions-section data-quest-mark={mark ?? 'none'} aria-label={title} style={{ marginBottom: 20 }}>
      <h3 className="sm2-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px', fontSize: 'var(--sm2-text-md)' }}>
        <span style={{ flex: 1 }}>{title}</span>
        {mark && <MissionMark kind={mark} size={24} isPt={isPt} />}
        {mark && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{questMarkLabel(mark, isPt)}</span>}
      </h3>
      {children}
    </section>
  );
}
