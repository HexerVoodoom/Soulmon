/**
 * O HORÁRIO DE DORMIR — obrigatório (D-24, dono, 18/10/2026).
 *
 * Aparece sempre que `rest.windowConfirmed` não é `true` (regra em
 * `utils/restSetup.ts`): jogador novo, logo depois do tour, e save antigo que
 * nunca confirmou. É INTERSTICIAL (`const interstitial` no App) e **só fecha
 * confirmando** — sem X, sem "depois", sem fechar por Esc/voltar. O sono
 * automático não tem mais interruptor (D-25/D-26): o que se escolhe aqui são
 * só as duas horas, que seguem editáveis depois em Configurações.
 *
 *  · a Janela é do SAVE (`rest.window`), e quem grava é o App
 *    (`onConfirm` = `handleConfirmRestWindow`);
 *  · as horas também vão para `STORAGE_KEYS.AUTO_SLEEP_*`, as fontes do sono
 *    automático — o efeito do App pega no tique seguinte.
 *
 * O que esta tela NUNCA diz (regra do `RestWindowCard`): nota de sono,
 * duração ideal, "8 horas", julgamento da noite. A janela é da pessoa; o app
 * não sugere nenhuma. Pode-se apenas confirmar a que já está escolhida.
 */
import { useState } from 'react';
import type { Language } from '../utils/i18n';
import type { RestWindow } from '../utils/restWindow';
import { readLocal, writeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { isMorning } from '../utils/restSetup';
import { TimeField, sm2Button } from './form/FormKit';
import { RitualDialog, ritualTitle } from './ritual/RitualKit';
import { InfoTip, InfoTipSection } from './ui/InfoTip';

export interface RestSetupModalProps {
  language: Language;
  now: Date;
  window: RestWindow;
  /** Grava as horas e marca o horário como confirmado. É a ÚNICA saída da tela. */
  onConfirm: (w: RestWindow) => void;
}

const noop = () => {};

export function RestSetupModal({ language, now, window: current, onConfirm }: RestSetupModalProps) {
  const isPt = language === 'pt-BR';
  const [autoStart, setAutoStart] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_START) || current.start || '23:00');
  const [autoEnd, setAutoEnd] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_END) || current.end || '07:00');

  const title = isMorning(now)
    ? (isPt ? 'Bom dia! A que horas seu Soulmon dorme?' : 'Good morning! When does your Soulmon sleep?')
    : (isPt ? 'A que horas seu Soulmon dorme?' : 'When does your Soulmon sleep?');

  const confirm = () => {
    writeLocal(STORAGE_KEYS.AUTO_SLEEP_START, autoStart, { silent: true });
    writeLocal(STORAGE_KEYS.AUTO_SLEEP_END, autoEnd, { silent: true });
    onConfirm({ start: autoStart, end: autoEnd });
  };

  return (
    <RitualDialog label={title} onClose={noop} maxWidth={360}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
        <p style={{ ...ritualTitle, margin: 0, flex: 1, minWidth: 0 }}>{title}</p>
        <InfoTip language={language} label={isPt ? 'Sobre este ajuste' : 'About this setup'} align="right">
          <InfoTipSection title={isPt ? 'Por que escolher' : 'Why choose'} last>
            {isPt
              ? 'Seu Soulmon dorme e acorda sozinho nestas horas, e as noites no horário rendem um sonho de manhã. Você muda quando quiser em Configurações.'
              : 'Your Soulmon sleeps and wakes on its own at these hours, and nights on time bring a dream in the morning. You can change it anytime in Settings.'}
          </InfoTipSection>
        </InfoTip>
      </div>

      <p style={{ margin: 0, fontSize: 14 }}>
        {isPt
          ? 'Escolha a hora de dormir e a de acordar. Dormindo, ele não faz cocô.'
          : 'Pick a bedtime and a wake-up time. Asleep, it never poops.'}
      </p>

      <section data-rest-setup="auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="sm2-conta-times">
          <TimeField ariaLabel={isPt ? 'Dorme' : 'Sleeps'} value={autoStart} onChange={setAutoStart} />
          <TimeField ariaLabel={isPt ? 'Acorda' : 'Wakes'} value={autoEnd} onChange={setAutoEnd} />
        </div>
      </section>

      <button type="button" onClick={confirm} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Confirmar' : 'Confirm'}
      </button>
    </RitualDialog>
  );
}

export default RestSetupModal;
