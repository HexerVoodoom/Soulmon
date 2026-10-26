import { Fragment } from 'react';
import type { Language } from '../../utils/i18n';
import { sm2Hint } from '../form/FormKit';
import { SPECIAL_MISSION_GAUGE_WEIGHT, type SpecialMissionKind, type SpecialMissionState } from '../../utils/specialMissions';
import { MissionCard, type MissionEntry } from './MissionCard';

/**
 * MISSÃO ESPECIAL DO DIA (REGISTRO §106) — apresentação pura. Superfície nova nasce MUDA (nenhum som), sem Resgatar (o gauge é
 * creditado sozinho na virada), tom calmo: sem cobrança, sem "!" de pendência, sem contagem regressiva.
 */
export function specialMissionCopy(kind: SpecialMissionKind, done: boolean, language: Language, goal: number, stepsToday?: number): { title: string; desc: string } {
  const pt = language === 'pt-BR';
  const g = goal.toLocaleString(pt ? 'pt-BR' : 'en-US');
  const turn = pt ? 'Conta na virada do dia.' : 'It counts at the turn of the day.';
  if (kind === 'steps') {
    // Rodada 5: o andamento do dia em tempo real ("N of M steps today"), sem frase de cobrança.
    const n = Math.max(0, Math.floor(stepsToday ?? 0)).toLocaleString(pt ? 'pt-BR' : 'en-US');
    const live = stepsToday === undefined ? undefined : pt ? `${n} de ${g} passos hoje.` : `${n} of ${g} steps today.`;
    return done
      ? { title: pt ? `Você caminhou ${g} passos hoje` : `You walked ${g} steps today`, desc: turn }
      : {
          title: pt ? `Caminhe ${g} passos hoje` : `Walk ${g} steps today`,
          desc: live ?? (pt ? 'Conta para a barra de evolução na virada do dia. Deixar para lá não custa nada.' : 'Counts toward your evolution bar at the turn of the day. Skipping it costs nothing.'),
        };
  }
  return done
    ? { title: pt ? 'Você deitou dentro da sua janela' : 'You lay down within your window', desc: turn }
    : {
        title: pt ? 'Deite dentro da sua janela de descanso' : 'Lie down within your rest window',
        desc: pt ? 'Vale a noite que termina na manhã de hoje. Noite sem registro não tira nada.' : 'The night that ends this morning is the one that counts. A night with no record takes nothing away.',
      };
}

export interface SpecialMissionProps {
  language: Language;
  state: SpecialMissionState | undefined;
  stepsToday: number;
  stepGoal: number;
  tomorrowKind: SpecialMissionKind;
}

/** A dica de amanhã (calma: sem número, sem cobrança). Só `rest` (sempre) e `steps` (só com sensor, `tomorrowKind` já vem filtrado). */
function tomorrowHint(tomorrowKind: SpecialMissionKind, pt: boolean): string {
  if (tomorrowKind === 'steps') return pt ? 'A especial de amanhã é de passos.' : "Tomorrow's special is a steps goal.";
  return pt ? 'Hoje à noite, deite na sua janela: conta para amanhã.' : 'Tonight, lie down within your window: it counts for tomorrow.';
}

/**
 * A entrada da missão especial para o quadro da aba Diárias: o `<li>` do cartão (mudo, sem Resgatar) + o `<li>` da dica de amanhã
 * colado a ele. Concluída = `claimed` (o quadro a manda para o fim, entre as concluídas).
 */
export function specialMissionEntries({ language, state, stepsToday, stepGoal, tomorrowKind }: SpecialMissionProps): MissionEntry[] {
  if (!state) return [];
  const pt = language === 'pt-BR';
  const { title, desc } = specialMissionCopy(state.kind, state.done, language, stepGoal, stepsToday);
  const reward = pt ? `Vale ${SPECIAL_MISSION_GAUGE_WEIGHT} hábito diário` : `Like ${SPECIAL_MISSION_GAUGE_WEIGHT} daily habit`;
  const status = state.done ? 'claimed' : 'open';
  return [{
    key: 'special',
    state: status,
    node: (
      <Fragment key="special">
        <MissionCard
          language={language}
          attrs={{ 'data-special-mission': state.kind }}
          status={status}
          title={title}
          desc={desc}
          progress={state.kind === 'steps' && !state.done ? { cur: Math.min(stepsToday, stepGoal), target: stepGoal } : null}
          reward={reward}
          quiet
        />
        <li data-special-tomorrow={tomorrowKind} style={{ ...sm2Hint, listStyle: 'none', margin: '-4px 0 0', padding: 0 }}>
          {tomorrowHint(tomorrowKind, pt)}
        </li>
      </Fragment>
    ),
  }];
}

export function SpecialMissionCard(props: SpecialMissionProps) {
  const entries = specialMissionEntries(props);
  if (entries.length === 0) return null;
  return (
    <div data-special-mission-wrap="">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>{entries.map(e => e.node)}</ul>
    </div>
  );
}
