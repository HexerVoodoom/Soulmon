import type { Language } from '../../utils/i18n';
import { sm2Hint } from '../form/FormKit';
import { SPECIAL_MISSION_GAUGE_WEIGHT, type SpecialMissionKind, type SpecialMissionState } from '../../utils/specialMissions';
import { MissionCard } from './MissionCard';

/**
 * MISSÃO ESPECIAL DO DIA (REGISTRO §106) — apresentação pura. Superfície nova nasce MUDA (nenhum som), sem Resgatar (o gauge é
 * creditado sozinho na virada), tom calmo: sem cobrança, sem "!" de pendência, sem contagem regressiva.
 */
export function specialMissionCopy(kind: SpecialMissionKind, done: boolean, language: Language, goal: number): { title: string; desc: string } {
  const pt = language === 'pt-BR';
  const g = goal.toLocaleString(pt ? 'pt-BR' : 'en-US');
  const turn = pt ? 'Conta na virada do dia.' : 'It counts at the turn of the day.';
  if (kind === 'steps') {
    return done
      ? { title: pt ? `Você caminhou ${g} passos hoje` : `You walked ${g} steps today`, desc: turn }
      : {
          title: pt ? `Caminhe ${g} passos hoje` : `Walk ${g} steps today`,
          desc: pt ? 'Conta para a barra de evolução na virada do dia. Deixar para lá não custa nada.' : 'Counts toward your evolution bar at the turn of the day. Skipping it costs nothing.',
        };
  }
  return done
    ? { title: pt ? 'Você deitou dentro da sua janela' : 'You lay down within your window', desc: turn }
    : {
        title: pt ? 'Deite dentro da sua janela de descanso' : 'Lie down within your rest window',
        desc: pt ? 'Vale a noite que termina na manhã de hoje. Noite sem registro não tira nada.' : 'The night that ends this morning is the one that counts. A night with no record takes nothing away.',
      };
}

export function SpecialMissionCard({ language, state, stepsToday, stepGoal, tomorrowKind }: {
  language: Language;
  state: SpecialMissionState | undefined;
  stepsToday: number;
  stepGoal: number;
  tomorrowKind: SpecialMissionKind;
}) {
  if (!state) return null;
  const pt = language === 'pt-BR';
  const { title, desc } = specialMissionCopy(state.kind, state.done, language, stepGoal);
  const reward = pt ? `Vale ${SPECIAL_MISSION_GAUGE_WEIGHT} hábito diário` : `Like ${SPECIAL_MISSION_GAUGE_WEIGHT} daily habit`;
  return (
    <div data-special-mission-wrap="">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <MissionCard
          language={language}
          attrs={{ 'data-special-mission': state.kind }}
          status={state.done ? 'claimed' : 'open'}
          title={title}
          desc={desc}
          progress={state.kind === 'steps' && !state.done ? { cur: Math.min(stepsToday, stepGoal), target: stepGoal } : null}
          reward={reward}
          quiet
        />
      </ul>
      {tomorrowKind === 'rest' && (
        <p data-special-tomorrow="" style={{ ...sm2Hint, margin: '6px 0 0' }}>
          {pt ? 'Hoje à noite, deite na sua janela: conta para amanhã.' : 'Tonight, lie down within your window: it counts for tomorrow.'}
        </p>
      )}
    </div>
  );
}
