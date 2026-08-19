import { useState, useEffect, type ReactNode } from 'react';
import { ModalSheet, Chip, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { Icon } from './ui/Icon';
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
 * Revelação — o que é avançado não fica empilhado (régua nº 3). O botão é a
 * linha inteira, com 44px de alvo, e o chevron gira com a curva do sistema.
 */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%', minHeight: 44,
          padding: 0, background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
          fontWeight: 500, color: 'var(--sm2-muted)', textAlign: 'left',
        }}
      >
        {label}
        <Icon name={open ? 'expand_less' : 'expand_more'} size={20} tone="muted" />
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>}
    </div>
  );
}

/**
 * A LINHA DE CONFIGURAÇÃO — o alvo é a linha inteira, nunca só o controle
 * (régua nº 6). Mora aqui porque é o módulo-folha que `SettingsPage` e
 * `SettingsModal` já importam; um segundo desenho divergiria em silêncio.
 *
 * O interruptor iOS (pill + bolinha branca) morreu: o estado é o eixo
 * `FILL 0→1` do mesmo glifo, que é o sistema de estado do design system.
 */
export function SwitchRow({
  checked, onToggle, label, hint, ariaLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        minHeight: 56, padding: '8px 0', textAlign: 'left',
        background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...sm2Text, display: 'block', fontSize: 'var(--sm2-text-md)' }}>{label}</span>
        {hint && <span style={{ ...sm2Hint, display: 'block' }}>{hint}</span>}
      </span>
      <Icon name="check_circle" size={28} fill={checked ? 1 : 0} tone={checked ? 'primary' : 'muted'} />
    </button>
  );
}

/** Linha que LEVA a algum lugar (outro painel, o guia, a política). */
export function ActionRow({
  label, hint, onClick, href,
}: {
  label: string;
  hint?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...sm2Text, display: 'block', fontSize: 'var(--sm2-text-md)' }}>{label}</span>
        {hint && <span style={{ ...sm2Hint, display: 'block' }}>{hint}</span>}
      </span>
      {/* `chevron_right` nos dois casos: `open_in_new` NÃO está no inventário
          da fonte subsetada, e nome fora dele não renderiza glifo nenhum e
          não dá erro (o pior modo de falha que existe). */}
      <Icon name="chevron_right" size={24} tone="muted" />
    </>
  );
  const style = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
    minHeight: 56, padding: '8px 0', textAlign: 'left' as const,
    background: 'none', border: 'none', cursor: 'pointer',
    textDecoration: 'none', boxSizing: 'border-box' as const,
  };
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>;
  }
  return <button type="button" onClick={onClick} style={style}>{inner}</button>;
}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => setS(defaultSettings)} style={sm2Button('quiet')}>
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
      <ChipGroup label={isPt ? 'Como ele fala' : 'How it talks'}>
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

      <ChipGroup label={isPt ? 'Como ele te incentiva' : 'How it encourages you'}>
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
