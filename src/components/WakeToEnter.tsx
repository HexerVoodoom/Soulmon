/**
 * A pergunta "Seu Soulmon está dormindo. Quer acordá-lo?" — o portão ÚNICO das atividades com o Soulmon dormindo (REGISTRO §329).
 *
 * Quem tem uma entrada de atividade chama `useRequireAwake()(entrada, seguir)`: acordado (ou entrada livre) segue na hora;
 * dormindo, abre esta pergunta. "Acordar" roda o gesto de acordar de sempre (`onWake`, o `handleSleep` do `App`) e SÓ ENTÃO segue
 * para a atividade escolhida; "Agora não", o fechar, o Esc e o toque fora fecham e deixam a pessoa onde estava.
 * A regra (o que pergunta, o texto) é PURA e mora em `utils/wakeToEnter.ts`.
 *
 * Visual: o modalzinho simples do app (`ModalSheet` centralizado em portal, foco preso, Esc, véu) com os botões do kit
 * (`sm2-kit-btn`, 48 px), igual ao `BlockedActionModal`. Sem `CtaButton` aqui (o dono não o quer em modal pequeno).
 * Sem provedor (testes de tela isolada, o Vite de prévia), o gancho segue direto: nunca trava uma tela que não sabe do sono.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { ModalSheet } from './form/FormKit';
import { needsWakeToEnter, wakePromptCopy, type SleepSignals, type WakeEntry } from '../utils/wakeToEnter';
import type { Language } from '../utils/i18n';

/** `true` = ficou segurado (a pergunta abriu); `false` = seguiu na hora. */
export type RequireAwake = (entry: WakeEntry, proceed: () => void) => boolean;

export interface WakeGate {
  /** Entra se puder; senão, pergunta. */
  require: RequireAwake;
  /** Leitura síncrona: esta entrada perguntaria AGORA? (o `AreaView` decide a folha inicial sem piscar). */
  held: (entry: WakeEntry) => boolean;
}

const LIVRE: WakeGate = { require: (_entry, proceed) => { proceed(); return false; }, held: () => false };
const WakeToEnterContext = createContext<WakeGate>(LIVRE);

/** O portão das atividades. Sem provedor: tudo segue direto. */
export function useWakeGate(): WakeGate {
  return useContext(WakeToEnterContext);
}

/** Atalho: `useRequireAwake()(entrada, seguir)`. */
export function useRequireAwake(): RequireAwake {
  return useContext(WakeToEnterContext).require;
}

export interface WakeToEnterPromptProps {
  open: boolean;
  language: Language;
  /** Sono real: a pergunta diz o que acordar muda. */
  realSleep: boolean;
  onWake: () => void;
  onLater: () => void;
}

export function WakeToEnterPrompt({ open, language, realSleep, onWake, onLater }: WakeToEnterPromptProps) {
  const c = wakePromptCopy(language === 'pt-BR', realSleep);
  return (
    <ModalSheet open={open} title={c.title} onClose={onLater} language={language} placement="center" sobreTelas maxWidth={380}
      footer={(
        <div data-wake-actions style={{ display: 'grid', gap: 8 }}>
          <button type="button" className="sm2-kit-btn sm2-kit-btn-primary" style={{ width: '100%', minHeight: 48 }} data-wake-yes onClick={onWake}>{c.wake}</button>
          <button type="button" className="sm2-kit-btn sm2-kit-btn-quiet" style={{ width: '100%', minHeight: 48 }} data-wake-later onClick={onLater}>{c.later}</button>
        </div>
      )}>
      <div data-wake-to-enter={realSleep ? 'sono' : 'dia'} style={{ display: 'grid', gap: 8 }}>
        <p className="sm2-stats-s" style={{ margin: 0 }} data-wake-question>{c.question}</p>
        {c.effect && <p className="sm2-stats-s" style={{ margin: 0, color: 'var(--sm2-muted)' }} data-wake-effect>{c.effect}</p>}
      </div>
    </ModalSheet>
  );
}

export interface WakeToEnterProviderProps extends SleepSignals {
  language: Language;
  /** O gesto de acordar de sempre (o `handleSleep` do `App`, só chamado com o Soulmon dormindo). */
  onWake: () => void;
  children: ReactNode;
}

export function WakeToEnterProvider({ isSleeping, dayWakePending, language, onWake, children }: WakeToEnterProviderProps) {
  const [pending, setPending] = useState<{ entry: WakeEntry; proceed: () => void } | null>(null);
  const sinais = useRef<SleepSignals>({ isSleeping, dayWakePending });
  sinais.current = { isSleeping, dayWakePending };
  const require = useCallback<RequireAwake>((entry, proceed) => {
    if (!needsWakeToEnter(entry, sinais.current)) { proceed(); return false; }
    setPending({ entry, proceed });
    return true;
  }, []);
  const later = useCallback(() => setPending(null), []);
  const wake = useCallback(() => {
    const p = pending;
    setPending(null);
    if (sinais.current.isSleeping || sinais.current.dayWakePending) onWake();
    p?.proceed();
  }, [pending, onWake]);
  const held = useCallback((entry: WakeEntry) => needsWakeToEnter(entry, sinais.current), []);
  const value = useMemo<WakeGate>(() => ({ require, held }), [require, held]);
  return (
    <WakeToEnterContext.Provider value={value}>
      {children}
      <WakeToEnterPrompt open={!!pending} language={language} realSleep={isSleeping} onWake={wake} onLater={later} />
    </WakeToEnterContext.Provider>
  );
}
