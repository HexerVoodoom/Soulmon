import { SwitchRow, sm2Hint } from './form/FormKit';
import type { Language } from '../utils/i18n';
import {
  MEAL_KEYS, normalizeMealTimes, sanitizeMealRhythm,
  type MealKey, type MealRhythmSettings,
} from '../utils/mealRhythm';
import { MEAL_RANGE_MIN, MEAL_STEP_MIN, formatHHMM } from '../../functions/api/_mealRhythm.js';

/**
 * As linhas do RITMO DAS REFEIÇÕES nas Configurações (grupo "O que o Soulmon te
 * manda"). Um interruptor só — "Meal check-ins" (D-20, 19/10/2026) — liga ou
 * desliga juntos o convite no app e o push das três janelas (`inApp` + `push`);
 * o push ainda depende das notificações ligadas e a linha diz isso. Mais três
 * horários, em grade de 30 min dentro da faixa de cada refeição (normalização em
 * `_mealRhythm.js`; o `<select>` só oferece o que ele aceita).
 */
const LABEL: Record<MealKey, { en: string; pt: string }> = {
  breakfast: { en: 'Breakfast', pt: 'Café da manhã' },
  lunch: { en: 'Lunch', pt: 'Almoço' },
  dinner: { en: 'Dinner', pt: 'Jantar' },
};

function optionsFor(meal: MealKey): string[] {
  const [lo, hi] = MEAL_RANGE_MIN[meal] as [number, number];
  const out: string[] = [];
  for (let m = lo; m <= hi; m += MEAL_STEP_MIN) out.push(formatHHMM(m));
  return out;
}

export function MealRhythmRows({ language, settings, notificationsEnabled, onChange }: {
  language: Language;
  settings: MealRhythmSettings | undefined;
  notificationsEnabled: boolean;
  onChange: (next: MealRhythmSettings) => void;
}) {
  const isPt = language === 'pt-BR';
  const s = sanitizeMealRhythm(settings);
  const times = normalizeMealTimes(s.times);
  const on = s.inApp || s.push;
  const pushWaits = on && !notificationsEnabled;
  return (
    <>
      <SwitchRow
        checked={on}
        onToggle={() => onChange({ ...s, inApp: !on, push: !on })}
        label={isPt ? 'Check-ins das refeições' : 'Meal check-ins'}
        hint={isPt
          ? (pushWaits ? 'Convite no app. Para receber também por notificação, ligue as notificações.' : 'Café, almoço e jantar: convite no app e notificação.')
          : (pushWaits ? 'In-app invite. To get it as a notification too, turn notifications on.' : 'Breakfast, lunch and dinner: in-app invite and notification.')}
        language={language}
        infoLabel={isPt ? 'Sobre os check-ins das refeições' : 'About meal check-ins'}
        info={isPt
          ? 'Depois do café, do almoço e do jantar, o Soulmon pede algo pequeno: carinho, banho ou comida. Até 3 por dia, fora da janela de descanso. Pular não custa nada. ' + 'Com a notificação ligada, fuso e horários vão ao servidor só para isso; ao desligar, deixam de ir.'
          : 'After breakfast, lunch and dinner, Soulmon asks for one small thing: a pat, a rinse or a snack. Up to 3 a day, outside your rest window. Skipping costs nothing. ' + 'With notifications on, your time zone and times go to the server for this only; turn it off and they stop.'}
      />
      {on && (
        <div role="group" aria-label={isPt ? 'Horários das refeições' : 'Meal times'} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
          {MEAL_KEYS.map(meal => (
            <label key={meal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 }}>
              <span style={sm2Hint}>{isPt ? LABEL[meal].pt : LABEL[meal].en}</span>
              <select
                value={times[meal]}
                aria-label={`${isPt ? LABEL[meal].pt : LABEL[meal].en} — ${isPt ? 'horário' : 'time'}`}
                onChange={e => onChange({ ...s, times: normalizeMealTimes({ ...times, [meal]: e.target.value }) })}
                style={{ minHeight: 44, minWidth: 96, fontFamily: 'var(--sm2-font-num, monospace)', fontSize: 16, padding: '0 10px', borderRadius: 10, border: '1px solid var(--sm2-line)', background: 'var(--sm2-surface)', color: 'var(--sm2-ink)' }}
              >
                {optionsFor(meal).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
    </>
  );
}
