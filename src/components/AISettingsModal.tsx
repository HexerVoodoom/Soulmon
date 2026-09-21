import { useState, useEffect, type ReactNode } from 'react';
import { ModalSheet, Chip, Disclosure, SwitchRow, ActionRow, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { resolveLanguage, type Language } from '../utils/i18n';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

/**
 * PERSONALIDADE DO COMPANHEIRO — revamp minimalista.
 *
 * O que saiu: `lucide-react`, `bg-black/50`, `rounded-xl shadow-2xl`,
 * `fontFamily: monospace` em TODO texto, `bg-teal-*` fora da paleta, os
 * tokens `--sm-*` e o slider de temperatura com o número `0.85` ao lado.
 * Número que o usuário não usa para decidir vira PALAVRA (Previsível /
 * Equilibrado / Criativo) — a régua nº 2.
 *
 * O que virou revelação: instruções livres e criatividade são configuração
 * avançada e vivem atrás de "Mais opções" (régua nº 3). Uma ação dominante:
 * Salvar.
 */

interface AISettings {
  tone: 'casual' | 'energetic' | 'calm' | 'playful';
  emojiIntensity: 'none' | 'low' | 'medium' | 'high';
  motivationStyle: 'encouraging' | 'challenging' | 'supportive' | 'balanced';
  customKeywords: string;
  temperature: number;
}

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AISettings;
  onSave: (settings: AISettings) => void;
  /** O App não passa idioma para este modal; o padrão lê a preferência salva. */
  language?: Language;
}

const defaultSettings: AISettings = {
  tone: 'casual',
  emojiIntensity: 'medium',
  motivationStyle: 'balanced',
  customKeywords: '',
  temperature: 0.85,
};

/** Os três degraus de criatividade. O usuário escolhe a PALAVRA. */
const CREATIVITY = [0.6, 0.85, 1.0] as const;
const nearestCreativity = (t: number) =>
  CREATIVITY.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));

/**
 * `Disclosure`, `SwitchRow` e `ActionRow` moravam aqui; com o canvas Conta
 * (D-K1) a `RestWindowCard` e o `StepsCard` passaram a desenhar as mesmas
 * linhas, então elas foram para o `FormKit`. Re-exportadas para quem ainda
 * importa daqui (`SettingsModal`).
 */
export { Disclosure, SwitchRow, ActionRow };

/** Grupo de escolha: rótulo do grupo + chips. Sem borda, sem card. */
function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p style={{ ...sm2Hint, marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  );
}

export function AISettingsModal({
  isOpen, onClose, currentSettings, onSave,
  language = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)),
}: AISettingsModalProps) {
  const [s, setS] = useState<AISettings>(currentSettings || defaultSettings);
  const isPt = language === 'pt-BR';

  useEffect(() => { setS(currentSettings || defaultSettings); }, [currentSettings, isOpen]);

  const tones = [
    { v: 'casual', pt: 'Tranquilo', en: 'Relaxed' },
    { v: 'energetic', pt: 'Elétrico', en: 'Energetic' },
    { v: 'calm', pt: 'Sereno', en: 'Calm' },
    { v: 'playful', pt: 'Brincalhão', en: 'Playful' },
  ] as const;
  const emojis = [
    { v: 'none', pt: 'Nenhum', en: 'None' },
    { v: 'low', pt: 'Poucos', en: 'Few' },
    { v: 'medium', pt: 'Alguns', en: 'Some' },
    { v: 'high', pt: 'Muitos', en: 'Lots' },
  ] as const;
  const motivations = [
    { v: 'encouraging', pt: 'Anima', en: 'Cheers you on' },
    { v: 'challenging', pt: 'Provoca', en: 'Challenges you' },
    { v: 'supportive', pt: 'Acolhe', en: 'Holds space' },
    { v: 'balanced', pt: 'Equilibrado', en: 'Balanced' },
  ] as const;
  const creativity = [
    { v: CREATIVITY[0], pt: 'Previsível', en: 'Predictable' },
    { v: CREATIVITY[1], pt: 'Equilibrado', en: 'Balanced' },
    { v: CREATIVITY[2], pt: 'Criativo', en: 'Creative' },
  ] as const;
  const picked = nearestCreativity(s.temperature);

  return (
    <ModalSheet
      open={isOpen}
      onClose={onClose}
      language={language}
      title={isPt ? 'Personalidade' : 'Personality'}
      footer={
        /* "Default" `quiet` + "Save" `primary`, lado a lado, MESMA largura
           (canvas Conta, Personalidade). */
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => setS(defaultSettings)} style={{ ...sm2Button('quiet'), flex: 1 }}>
            {isPt ? 'Padrão' : 'Default'}
          </button>
          <button
            type="button"
            onClick={() => { onSave(s); onClose(); }}
            style={{ ...sm2Button('primary'), flex: 1 }}
          >
            {isPt ? 'Salvar' : 'Save'}
          </button>
        </div>
      }
    >
      <ChipGroup label={isPt ? 'Como seu Soulmon fala' : 'How it talks'}>
        {tones.map(o => (
          <Chip key={o.v} selected={s.tone === o.v} onToggle={() => setS({ ...s, tone: o.v })}>
            {isPt ? o.pt : o.en}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label={isPt ? 'Emojis' : 'Emojis'}>
        {emojis.map(o => (
          <Chip key={o.v} selected={s.emojiIntensity === o.v} onToggle={() => setS({ ...s, emojiIntensity: o.v })}>
            {isPt ? o.pt : o.en}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label={isPt ? 'Como seu Soulmon te incentiva' : 'How it encourages you'}>
        {motivations.map(o => (
          <Chip key={o.v} selected={s.motivationStyle === o.v} onToggle={() => setS({ ...s, motivationStyle: o.v })}>
            {isPt ? o.pt : o.en}
          </Chip>
        ))}
      </ChipGroup>

      <Disclosure label={isPt ? 'Mais opções' : 'More options'}>
        <ChipGroup label={isPt ? 'Criatividade' : 'Creativity'}>
          {creativity.map(o => (
            <Chip key={o.v} selected={picked === o.v} onToggle={() => setS({ ...s, temperature: o.v })}>
              {isPt ? o.pt : o.en}
            </Chip>
          ))}
        </ChipGroup>

        <div>
          <label htmlFor="ai-custom" style={{ ...sm2Hint, display: 'block', marginBottom: 8 }}>
            {isPt ? 'Instruções suas' : 'Your instructions'}
          </label>
          <textarea
            id="ai-custom"
            value={s.customKeywords}
            onChange={(e) => setS({ ...s, customKeywords: e.target.value })}
            maxLength={500}
            rows={3}
            autoComplete="off"
            spellCheck={false}
            placeholder={isPt ? 'ex.: me chame de parceiro' : 'e.g. always call me partner'}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'none', outline: 'none',
              padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface-2)',
              fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
              lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-ink)',
            }}
          />
          {/* O contador só existe quando começa a importar — antes disso é um
              número que ninguém usa para decidir (régua nº 2). */}
          {s.customKeywords.length > 400 && (
            <p className="sm2-num" style={{ ...sm2Hint, marginTop: 6, textAlign: 'right' }} aria-live="polite">
              {500 - s.customKeywords.length}
            </p>
          )}
        </div>
      </Disclosure>

      <p style={{ ...sm2Text, color: 'var(--sm2-muted)', fontSize: 'var(--sm2-text-xs)' }}>
        {isPt
          ? 'Vale para o chat e para as falas do seu Soulmon.'
          : 'Applies to chat and to your Soulmon’s lines.'}
      </p>
    </ModalSheet>
  );
}

export type { AISettings };
