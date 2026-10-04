/**
 * O CONVITE DO SONO — sono automático + Janela de Descanso, no 2º dia (G8).
 *
 * Quando aparece é regra de `utils/restSetup.ts` (`shouldShowRestSetup`);
 * aqui só a tela. É INTERSTICIAL (`const interstitial` no App, posição
 * declarada) e aparece UMA vez: fechar, por qualquer saída, grava a flag.
 *
 * As mesmas duas preferências que moram em Configurações, com as mesmas
 * fontes — nenhuma cópia de regra:
 *  · a Janela é do SAVE (`rest.window`), e quem grava é o App
 *    (`onChangeWindow` = `handleChangeRestWindow`);
 *  · o sono automático é do APARELHO (`STORAGE_KEYS.AUTO_SLEEP_*`), lido e
 *    gravado como a `SettingsPage` faz — o efeito do App pega no tique seguinte.
 *
 * O que esta tela NUNCA diz (regra do `RestWindowCard`): nota de sono,
 * duração ideal, "8 horas", julgamento da noite. A janela é da pessoa; o app
 * não sugere nenhuma.
 */
import { useState } from 'react';
import type { Language } from '../utils/i18n';
import type { RestWindow } from '../utils/restWindow';
import { readFlag, readLocal, writeFlag, writeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { isMorning } from '../utils/restSetup';
import { SwitchRow, TimeField, sm2Button, sm2Text } from './form/FormKit';
import { RitualDialog, ritualTitle } from './ritual/RitualKit';
import { InfoTip } from './ui/InfoTip';

export interface RestSetupModalProps {
  language: Language;
  now: Date;
  window: RestWindow;
  onChangeWindow: (w: RestWindow) => void;
  onClose: () => void;
}

export function RestSetupModal({ language, now, window: restWindow, onChangeWindow, onClose }: RestSetupModalProps) {
  const isPt = language === 'pt-BR';
  const [autoOn, setAutoOn] = useState(() => readFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED));
  const [autoStart, setAutoStart] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_START) || restWindow.start);
  const [autoEnd, setAutoEnd] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_END) || restWindow.end);

  const title = isMorning(now)
    ? (isPt ? 'Bom dia! Vamos falar das noites?' : 'Good morning! A word about nights')
    : (isPt ? 'Vamos falar das noites?' : 'A word about nights');

  const setAuto = (next: boolean) => {
    // Gravar FORA de updater (footgun 6). Ao ligar, as horas mostradas viram
    // as gravadas — senão o efeito do App leria o padrão, não o que a pessoa vê.
    writeFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED, next, { silent: true });
    if (next) {
      writeLocal(STORAGE_KEYS.AUTO_SLEEP_START, autoStart, { silent: true });
      writeLocal(STORAGE_KEYS.AUTO_SLEEP_END, autoEnd, { silent: true });
    }
    setAutoOn(next);
  };

  return (
    <RitualDialog label={title} onClose={onClose} maxWidth={360} closeLabel={isPt ? 'Fechar' : 'Close'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 36px 0 0' }}>
        <p style={{ ...ritualTitle, margin: 0, flex: 1, minWidth: 0 }}>{title}</p>
        {/* I13 (02/10/2026): a legenda mora atrás do "?". */}
        <InfoTip language={language} label={isPt ? 'Sobre este ajuste' : 'About this setup'} align="right">
          {isPt
            ? 'Duas coisas que você pode ajustar agora — ou depois, em Configurações.'
            : 'Two things you can set now — or later, in Settings.'}
        </InfoTip>
      </div>

      <section data-rest-setup="window" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{isPt ? 'Janela de descanso' : 'Rest window'}</p>
          <InfoTip language={language} label={isPt ? 'O que é a janela de descanso' : 'What the rest window is'} align="right" style={{ minHeight: 28 }}>
            {isPt
              ? 'As horas em que você gosta de desacelerar. Pondo seu Soulmon para dormir dentro delas, ele volta de manhã com um sonho.'
              : 'The hours you like to wind down. Put your Soulmon to bed inside them and it comes back with a dream in the morning.'}
          </InfoTip>
        </div>
        <div className="sm2-conta-times">
          <TimeField
            ariaLabel={isPt ? 'Começa' : 'Starts'}
            value={restWindow.start}
            onChange={(v) => onChangeWindow({ ...restWindow, start: v })}
          />
          <TimeField
            ariaLabel={isPt ? 'Termina' : 'Ends'}
            value={restWindow.end}
            onChange={(v) => onChangeWindow({ ...restWindow, end: v })}
          />
        </div>
      </section>

      <section data-rest-setup="auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SwitchRow
          checked={autoOn}
          onToggle={() => setAuto(!autoOn)}
          label={isPt ? 'Sono automático' : 'Auto sleep'}
          language={language}
          infoLabel={isPt ? 'Sobre o sono automático' : 'About auto sleep'}
          info={isPt
            ? 'Seu Soulmon dorme e acorda sozinho nestas horas. Dormindo, não faz cocô.'
            : 'Your Soulmon sleeps and wakes on its own at these hours. Asleep, it never poops.'}
        />
        {autoOn && (
          <div className="sm2-conta-times">
            <TimeField
              ariaLabel={isPt ? 'Dorme' : 'Sleeps'}
              value={autoStart}
              onChange={(v) => { setAutoStart(v); writeLocal(STORAGE_KEYS.AUTO_SLEEP_START, v, { silent: true }); }}
            />
            <TimeField
              ariaLabel={isPt ? 'Acorda' : 'Wakes'}
              value={autoEnd}
              onChange={(v) => { setAutoEnd(v); writeLocal(STORAGE_KEYS.AUTO_SLEEP_END, v, { silent: true }); }}
            />
          </div>
        )}
      </section>

      <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Pronto' : 'Done'}
      </button>
    </RitualDialog>
  );
}

export default RestSetupModal;
