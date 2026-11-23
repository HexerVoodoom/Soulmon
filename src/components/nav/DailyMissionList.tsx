import type { Language } from '../../utils/i18n';
import { dailyCount, dailyMissionsFor, dailyStatus, type DailyMissionsState } from '../../utils/dailyMissions';
import { dailyTarget } from '../../utils/missionTargets';
import { MATERIALS } from '../../utils/buildingQuestsCopy';
import { ClaimButton, MissionCard, resolveGo, type MissionEntry, type MissionNav } from './MissionCard';
import { RewardChip } from './RewardChip';
import { giverOf, npcKeyOfBuilding } from './npcGiver';

export interface DailyMissionsProps {
  state: DailyMissionsState | undefined;
  /** Dia do JOGADOR (`playerDayKey`). */
  day: string;
  bondLevel: number;
  onClaim: (id: string) => void;
  /** Para onde a missão leva (REGISTRO §62). */
  nav?: MissionNav;
}

/**
 * As missões do dia dos OUTROS RECURSOS (minijogos, foco, cuidado... — `utils/dailyMissions.ts`, REGISTRO §52/§54). Convite, nunca
 * cobrança: o cartão diz o que fazer e LEVA até lá; quando o evento real acontece fica "pronto" e o "Resgatar" paga 1 material.
 * Quem não fez não perde nada — amanhã a lista é outra. Um CARTÃO por missão (REGISTRO §62).
 */
export function dailyMissionEntries({ language, state, day, bondLevel, onClaim, nav }: DailyMissionsProps & { language: Language }): MissionEntry[] {
  const isPt = language === 'pt-BR';
  return dailyMissionsFor(day, bondLevel).map(m => {
    const st = dailyStatus(state, day, m);
    const status = st === 'available' ? 'open' : st;
    const go = resolveGo(nav, dailyTarget(m), language);
    // 12/11/2026 (pedido do dono): cada cartão diz NOME, o que fazer, RECOMPENSA (sempre) e QUEM passa. Missão de NPC tem nome e NPC próprios;
    // as demais diárias têm o anfitrião do prédio delas e o nome é a própria descrição.
    const nome = isPt ? m.namePt : m.nameEn;
    const mat = MATERIALS.find(x => x.id === m.material);
    const premio = mat ? <RewardChip kind="material" materialId={mat.id} name={isPt ? mat.namePt : mat.nameEn} isPt={isPt} /> : '+1 material';
    return {
      key: `daily:${m.id}`,
      state: status,
      node: (
        <MissionCard
          key={`daily:${m.id}`}
          language={language}
          attrs={{ 'data-daily-mission': m.id, 'data-status': st }}
          status={status}
          title={nome ?? (isPt ? m.descPt : m.descEn)}
          desc={nome ? (isPt ? m.descPt : m.descEn) : undefined}
          giver={giverOf(m.npc ?? npcKeyOfBuilding(m.building), language)}
          rewardAlways
          progress={m.target > 1 ? { cur: dailyCount(state, day, m), target: m.target } : null}
          reward={premio}
          onGo={go.onGo}
          lockNote={go.lockNote}
          action={<ClaimButton language={language} attrs={{ 'data-claim-daily': m.id }} onClick={() => onClaim(m.id)} />}
        />
      ),
    };
  });
}
