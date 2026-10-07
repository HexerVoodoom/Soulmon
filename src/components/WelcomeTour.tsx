import { useCallback, useState } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import { RitualDialog, ritualLabel, ritualTitle } from './ritual/RitualKit';
import { sm2Button, sm2Text } from './form/FormKit';
import { NpcSpeech } from './nav/NpcSpeech';
import { TOUR_GUIDE_NAME, TOUR_STEPS, tourText } from '../utils/welcomeTour';
import type { Language } from '../utils/i18n';

/**
 * O TOUR DE BOAS-VINDAS DO CORVO (07/10/2026, pedido do dono).
 *
 * Oito cartões: o básico (tarefas → evolução) e o mapa (a função de cada área).
 * É um INTERSTICIAL (`const interstitial` do `App.tsx`, PRIMEIRO da fila: vem
 * antes do check-in e do priming; z-200 do `RitualDialog`). Regras:
 *  · "Skip" fica visível em todo passo e o Escape faz o mesmo — pular NUNCA
 *    cobra nem repete: `onDone('skipped')` e `onDone('finished')` gravam a mesma
 *    marca de "visto" (quem decide é o chamador);
 *  · nenhum som (R-NOVA: superfície nova nasce muda), nenhuma recompensa, nenhum
 *    XP — por isso roda igual na demo e no replay;
 *  · não navega o app à força: o mapa é descrito em cartões;
 *  · movimento reduzido reduz o balanço do corvo (classe no bloco canônico do
 *    `index.css`) e MANTÉM a pausa — os passos esperam o toque;
 *  · texto em EN por enquanto, por chave `{ en }` (`utils/welcomeTour.ts`).
 */
export type WelcomeTourEnd = 'finished' | 'skipped';

export function WelcomeTour({ language, onDone }: { language: Language; onDone: (how: WelcomeTourEnd) => void }) {
  const [i, setI] = useState(0);
  const last = TOUR_STEPS.length - 1;
  const step = TOUR_STEPS[i];

  const skip = useCallback(() => onDone('skipped'), [onDone]);
  const next = useCallback(() => {
    if (i >= last) onDone('finished'); else setI(n => n + 1);
  }, [i, last, onDone]);
  const back = useCallback(() => setI(n => Math.max(0, n - 1)), []);

  const t = (x: { en: string; pt?: string }) => tourText(x, language);

  return (
    <RitualDialog labelledBy="wt-title" onClose={skip} zIndex={200} maxWidth={380}>
      <div data-welcome-tour data-step={step.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={ritualLabel} data-wt-progress>
            {step.part === 1 ? 'The basics' : 'The map'} · {i + 1} / {TOUR_STEPS.length}
          </p>
          <button type="button" onClick={skip} data-wt-skip style={sm2Button('quiet', false, 'sm')}>
            Skip
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <img
            src={ravenMascot}
            alt=""
            width={72}
            height={72}
            draggable={false}
            className="sm-corvo-bob"
            data-wt-raven
            style={{ flex: 'none', objectFit: 'contain', display: 'block' }}
          />
          <NpcSpeech name={TOUR_GUIDE_NAME} line={t(step.speech)} speakerKey={`tour:${step.id}`} />
        </div>

        <p id="wt-title" style={ritualTitle}>{t(step.title)}</p>

        {step.areas && (
          <ul data-wt-areas style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {step.areas.map(a => (
              <li
                key={a.name.en}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--sm2-line, var(--sm2-muted))',
                  borderRadius: 'var(--sm2-radius-md)',
                }}
              >
                <b style={{ ...sm2Text, display: 'block', margin: 0, color: 'var(--sm2-primary-ink)' }}>{t(a.name)}</b>
                <span style={{ ...sm2Text, margin: 0 }}>{t(a.line)}</span>
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          {i > 0 && (
            <button type="button" onClick={back} data-wt-back style={sm2Button('ghost', false, 'sm')}>
              Back
            </button>
          )}
          <button type="button" onClick={next} data-wt-next style={{ ...sm2Button('primary'), flex: 1 }}>
            {i === last ? "Let's go" : 'Next'}
          </button>
        </div>
      </div>
    </RitualDialog>
  );
}

export default WelcomeTour;
