import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { layoutMissionBoard } from '../../utils/missionOrder';
import { sm2Hint } from '../form/FormKit';
import { MissionCardList, type MissionEntry, type MissionNav } from './MissionCard';
import { strollEntries } from './StrollQuestLine';
import { buildingQuestEntries, type BuildingQuestsProps } from './BuildingQuestList';
import { dailyMissionEntries, type DailyMissionsProps } from './DailyMissionList';
import { specialMissionEntries, type SpecialMissionProps } from './SpecialMissionCard';

/**
 * O QUADRO DA ABA DIÁRIAS (revisão do dono, 20/10/2026): UM `<ul>` com tudo de "Hoje". Ordem (`layoutMissionBoard`):
 * especial ainda aberta no topo, com o rótulo "Missão especial", depois uma LINHA FINA, depois as normais — prontas ("?"),
 * abertas e, no fim, as resgatadas/entregues (a especial concluída desce junto, sem rótulo nem linha). Superfície muda (sem som).
 */
export function DailyMissionBoard({ language, special, crossings, todayKey, onClaimStroll, onGoStroll, buildings, dailies, nav }: {
  language: Language;
  special?: Omit<SpecialMissionProps, 'language'>;
  crossings: CrossingsState;
  todayKey: string;
  onClaimStroll: () => void;
  onGoStroll?: () => void;
  buildings?: BuildingQuestsProps;
  dailies?: DailyMissionsProps;
  nav?: MissionNav;
}) {
  const isPt = language === 'pt-BR';
  const items: (MissionEntry & { special: boolean })[] = [
    ...(special ? specialMissionEntries({ language, ...special }) : []).map(e => ({ ...e, special: true })),
    ...strollEntries({ language, crossings, todayKey, onClaim: onClaimStroll, onGo: onGoStroll }).map(e => ({ ...e, special: false })),
    ...(buildings ? buildingQuestEntries({ language, ...buildings }) : []).map(e => ({ ...e, special: false })),
    ...(dailies ? dailyMissionEntries({ language, ...dailies, nav }) : []).map(e => ({ ...e, special: false })),
  ];
  const { top, rest, divider } = layoutMissionBoard(items, e => e.state, e => e.special);
  return (
    <MissionCardList attrs={{ 'data-daily-board': '' }}>
      {top.length > 0 && (
        <li data-special-label="" style={{ ...sm2Hint, listStyle: 'none', margin: 0, padding: 0 }}>
          {isPt ? 'Missão especial' : 'Special mission'}
        </li>
      )}
      {top.map(e => e.node)}
      {divider && <li role="separator" data-mission-divider="" style={{ listStyle: 'none', margin: 0, padding: 0, height: 0, borderTop: '1px solid var(--sm2-line)' }} />}
      {rest.map(e => e.node)}
    </MissionCardList>
  );
}
