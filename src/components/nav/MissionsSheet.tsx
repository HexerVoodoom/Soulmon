import { Suspense, lazy, useRef, useState } from 'react';
import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { ModalSheet } from '../form/FormKit';
import type { WeeklyMission, WeeklyMissionId } from '../../utils/weeklyMissions';
import type { BuildingQuestsProps } from './BuildingQuestList';
import { questMarkLabel, strongestMark, type QuestMark } from '../../utils/questMarks';
import { MissionMark } from '../play/MissionMark';
import { PixelTabs } from '../pixel/PixelKit';
import { StrollQuestLine } from './StrollQuestLine';
import { DailyMissionList, type DailyMissionsProps } from './DailyMissionList';
import { FirstTimesList, allFirstTimesClaimed, type FirstTimesProps } from './FirstTimesList';
import type { GoTarget } from '../../utils/missionTargets';
import type { MissionNav } from './MissionCard';
import { FirstDayCard } from '../FirstDayCard';
import type { FirstDayProgress } from '../../utils/firstDay';

const WeeklyMissionList = lazy(() => import('../mercado/ShopShelf').then(m => ({ default: m.WeeklyMissionList })));
const ConquistasSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.ConquistasSheet })));
const BuildingQuestList = lazy(() => import('./BuildingQuestList').then(m => ({ default: m.BuildingQuestList })));

export type MissionsTab = 'daily' | 'weekly' | 'achievements';

const ORDER: readonly MissionsTab[] = ['daily', 'weekly', 'achievements'];

/**
 * A LISTA DE MISSÕES, aberta pelo ÚNICO ícone de missões da Home (14/10/2026, pedido do dono: "coloque tudo dentro do mesmo ícone de
 * missão com tab para dailies, semanal, achievements"). UMA folha, três ABAS COMPACTAS (`PixelTabs variant="compact"`, o mesmo
 * componente do Centro de Evolução, 10.3): Diárias | Semanal | Conquistas. Toque OU deslize para o lado troca de aba. As abas já
 * visitadas ficam montadas (`hidden`), então trocar de aba não perde estado nem refaz a carga.
 * O Passeio é a EXCEÇÃO (07/10/2026, "Stroll fica com o NPC"): a experiência inteira vive no lote dele; aqui só há a linha
 * "Take a stroll" (`StrollQuestLine`) — aponta, fica pronta quando o NPC concluiu, resgata.
 */
export function MissionsSheet({ initialTab = 'daily', open, onClose, language, crossings, onClaimStroll, onGoStroll, todayKey, weekly, onClaimWeekly, missionProgress, marks, buildings, dailies, firsts, missionsClaimed, onClaimMission, bondLevel = 1, onGoBuilding, firstDay }: {
  /** A aba que abre primeiro (o "Ir lá" de uma missão de prédio abre `daily`). */
  initialTab?: MissionsTab;
  open: boolean;
  onClose: () => void;
  language: Language;
  crossings: CrossingsState;
  /** O Resgatar da linha do passeio (só o recibo do dia; o pagamento é do "Concluir" no NPC). */
  onClaimStroll: () => void;
  /** Leva ao prédio do Passeio (a folha do lote aberta). */
  onGoStroll?: () => void;
  todayKey: string;
  /** As missões da semana e o resgate dos Emblemas (o mesmo do Torneio). */
  weekly: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  onClaimWeekly: (id: WeeklyMissionId) => void;
  /** Permanentes (`getMissionProgress`). */
  missionProgress: Record<string, number>;
  /** A marca de cada seção (`questMarks`). */
  marks: { daily: QuestMark; torneio: QuestMark; conquistas: QuestMark; firstDay?: QuestMark; firsts?: QuestMark };
  /** O cartão do primeiro dia (os três gestos) — uma MISSÃO, por isso mora aqui e não na Home. `null`/ausente = não há (cumpriu ou o dia virou). */
  firstDay?: FirstDayProgress | null;
  /** As missões de prédio listadas no menu (`utils/buildingQuests.ts`). Fazem parte de "Hoje". */
  buildings?: BuildingQuestsProps;
  /** As missões do dia dos outros recursos (`utils/dailyMissions.ts`). Fazem parte de "Hoje". */
  dailies?: DailyMissionsProps;
  /** As primeiras vezes (missões únicas, `utils/dailyMissions.ts`): seção própria na aba Diárias. */
  firsts?: FirstTimesProps;
  /** Conquistas já resgatadas e o Resgatar (REGISTRO §56). `missionsClaimed` ausente = save não migrado. */
  missionsClaimed?: readonly string[];
  onClaimMission?: (id: string) => void;
  /** O Vínculo (decide quais prédios abrem) e a navegação: toda missão com lugar LEVA até ele (REGISTRO §62). Sem `onGoBuilding`, nenhum cartão navega. */
  bondLevel?: number;
  onGoBuilding?: (target: Exclude<GoTarget, null>) => void;
}) {
  const isPt = language === 'pt-BR';
  const [tab, setTab] = useState<MissionsTab>(initialTab);
  const [seen, setSeen] = useState<ReadonlySet<MissionsTab>>(() => new Set([initialTab]));
  const nav: MissionNav | undefined = onGoBuilding ? { bondLevel, onGo: onGoBuilding } : undefined;
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const go = (t: MissionsTab) => { setTab(t); setSeen(prev => (prev.has(t) ? prev : new Set(prev).add(t))); };
  const tabMarks: Record<MissionsTab, QuestMark> = {
    daily: strongestMark([marks.daily, marks.firstDay ?? null, marks.firsts ?? null]),
    weekly: marks.torneio,
    achievements: marks.conquistas,
  };
  const names: Record<MissionsTab, string> = {
    daily: isPt ? 'Diárias' : 'Dailies',
    weekly: isPt ? 'Semanal' : 'Weekly',
    achievements: isPt ? 'Conquistas' : 'Achievements',
  };
  return (
    <ModalSheet open={open} title={isPt ? 'Missões' : 'Missions'} onClose={onClose} language={language}>
      <div data-missions-sheet={tab}>
        <PixelTabs
          variant="compact"
          ariaLabel={isPt ? 'Tipos de missão' : 'Mission types'}
          value={tab}
          onChange={go}
          style={{ marginBottom: 12 }}
          items={ORDER.map(t => ({
            key: t,
            label: names[t],
            glyph: tabMarks[t] ? (
              <>
                <span aria-hidden="true" data-tab-dot={tabMarks[t]} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sm2-viewport-warn, #EBBE84)', flex: 'none' }} />
                <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{questMarkLabel(tabMarks[t], isPt)}</span>
              </>
            ) : undefined,
          }))}
        />
        <div
          data-missions-swipe
          style={{ touchAction: 'pan-y' }}
          onPointerDown={e => { swipeRef.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={e => {
            const o = swipeRef.current; swipeRef.current = null;
            if (!o) return;
            const dx = e.clientX - o.x; const dy = e.clientY - o.y;
            if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            const next = ORDER[ORDER.indexOf(tab) + (dx < 0 ? 1 : -1)];
            if (next) go(next);
          }}
          onPointerCancel={() => { swipeRef.current = null; }}
        >
          <Suspense fallback={null}>
            {seen.has('daily') && (
              <div role="tabpanel" hidden={tab !== 'daily'} data-missions-panel="daily">
                {firstDay && (
                  <Section title={isPt ? 'Primeiro dia' : 'First day'} mark={marks.firstDay ?? null} isPt={isPt} id="first-day">
                    <FirstDayCard progress={firstDay} language={language} />
                  </Section>
                )}
                <Section title={isPt ? 'Hoje' : 'Today'} mark={marks.daily} glyph={false} isPt={isPt} id="daily">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <StrollQuestLine language={language} crossings={crossings} todayKey={todayKey} onClaim={onClaimStroll} onGo={onGoStroll} />
                    {buildings && <BuildingQuestList language={language} {...buildings} />}
                    {dailies && <DailyMissionList language={language} {...dailies} nav={nav} />}
                  </div>
                </Section>
                {firsts && !allFirstTimesClaimed(firsts.state, firsts.bondLevel) && (
                  <Section title={isPt ? 'Primeiras vezes' : 'First times'} mark={marks.firsts ?? null} glyph={false} isPt={isPt} id="first-times">
                    <FirstTimesList language={language} {...firsts} nav={nav} />
                  </Section>
                )}
              </div>
            )}
            {seen.has('weekly') && (
              <div role="tabpanel" hidden={tab !== 'weekly'} data-missions-panel="weekly">
                <Section title={isPt ? 'Esta semana' : 'This week'} mark={marks.torneio} glyph={false} isPt={isPt} id="weekly">
                  <WeeklyMissionList language={language} weeklyMissions={weekly} onClaimWeekly={onClaimWeekly} nav={nav} />
                </Section>
              </div>
            )}
            {seen.has('achievements') && (
              <div role="tabpanel" hidden={tab !== 'achievements'} data-missions-panel="achievements">
                <Section title={isPt ? 'Conquistas' : 'Achievements'} mark={marks.conquistas} isPt={isPt} id="achievements">
                  <p data-achievements-hint style={{ margin: '0 0 8px', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-muted)' }}>
                    {isPt ? 'Cumpra, resgate aqui e compre o item no Mercado, prédio Conquistas. Resgatar só libera a compra.' : 'Complete it, claim it here, then buy the item at the Market, Achievements building. Claiming only unlocks buying.'}
                  </p>
                  <ConquistasSheet language={language} missionProgress={missionProgress} claimed={missionsClaimed} onClaim={onClaimMission} nav={nav} />
                </Section>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </ModalSheet>
  );
}

/** Uma seção da lista, com a marca do lugar ao lado do título (`!` / `?`). */
/* `glyph={false}`: o "!" não vai na frente do título ("Hoje") — fica só na linha da missão (pedido do dono, 11/10/2026). */
function Section({ title, mark, glyph = true, tone = 'gold', isPt, id, children }: { id?: string; glyph?: boolean; title: string; mark: QuestMark; tone?: 'blue' | 'gold'; isPt: boolean; children: React.ReactNode }) {
  return (
    <section data-missions-section={id ?? 'other'} data-quest-mark={mark ?? 'none'} aria-label={title} style={{ marginBottom: 20 }}>
      <h3 className="sm2-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px', fontSize: 'var(--sm2-text-md)' }}>
        <span style={{ flex: 1 }}>{title}</span>
        {mark && glyph && <MissionMark kind={mark} tone={tone} size={24} isPt={isPt} />}
        {mark && glyph && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{questMarkLabel(mark, isPt)}</span>}
      </h3>
      {children}
    </section>
  );
}
