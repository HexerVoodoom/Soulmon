import { SwitchRow, sm2Hint } from './form/FormKit';
import type { Language } from '../utils/i18n';
import {
  MEAL_KEYS, normalizeMealTimes, sanitizeMealRhythm,
  type MealKey, type MealRhythmSettings,
} from '../utils/mealRhythm';
import { MEAL_RANGE_MIN, MEAL_STEP_MIN, formatHHMM } from '../../functions/api/_mealRhythm.js';

/**
 * As linhas do RITMO DAS REFEIÇÕES nas Configurações (grupo "O que o Soulmon te
 * manda"). Dois interruptores independentes e três horários:
 *
 *  · **Convites no app** — vem LIGADO; só aparece com o app já aberto.
 *  · **Lembretes** (push/alarme) — vem DESLIGADO: opt-in, além da permissão do
 *    sistema. Não liga sem as notificações ligadas, e a linha diz por quê em
 *    vez de falhar calada.
 *  · **Horários** — grade de 30 min, dentro da faixa de cada refeição (a
 *    normalização é do dono, `_mealRhythm.js`; o `<select>` só oferece o que
 *    ele aceita, então não existe valor inválido para "voltar ao padrão" em
 *    silêncio).
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
  const pushOn = s.push && notificationsEnabled;
  return (
    <>
      <SwitchRow
        checked={s.inApp}
        onToggle={() => onChange({ ...s, inApp: !s.inApp })}
        label={isPt ? 'Convites das refeições' : 'Meal check-ins'}
        hint={isPt ? 'Três janelas curtas por dia, no app. Sem pressão.' : 'Three short windows a day, in the app. No pressure.'}
        language={language}
        infoLabel={isPt ? 'Sobre os convites das refeições' : 'About meal check-ins'}
        info={isPt
          ? 'Depois do café, do almoço e do jantar, seu Soulmon pode pedir uma coisa pequena: um carinho, um banho, uma comidinha. Não conta nada e não vale nada se você pular.'
          : 'After breakfast, lunch and dinner, your Soulmon may ask for one small thing: a pat, a rinse, a snack. Nothing is counted, and skipping costs nothing.'}
      />
      <SwitchRow
        checked={pushOn}
        onToggle={() => { if (notificationsEnabled) onChange({ ...s, push: !s.push }); }}
        label={isPt ? 'Lembretes das refeições' : 'Meal reminders'}
        hint={notificationsEnabled
          ? (isPt ? 'Um toque leve depois de cada refeição. Troca os lembretes de 10h e 16h.' : 'A light tap after each meal. Replaces the 10:00 and 16:00 reminders.')
          : (isPt ? 'Ligue as notificações primeiro.' : 'Turn notifications on first.')}
        language={language}
        infoLabel={isPt ? 'Sobre os lembretes das refeições' : 'About meal reminders'}
        info={isPt
          ? 'Até 3 por dia, na sua hora local, nunca dentro da janela de descanso. Ao ligar, o fuso e os horários vão ao servidor só para isso; ao desligar, deixam de ir.'
          : 'Up to 3 a day, at your local time, never inside your rest window. While on, your time zone and times go to the server for this only; turn off and they stop.'}
      />
      {(s.inApp || pushOn) && (
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
