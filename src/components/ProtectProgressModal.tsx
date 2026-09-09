import { useState } from 'react';
import { Icon } from './ui/Icon';
import { Field, ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

// Pedido de e-mail DEPOIS do onboarding.
//
// Por que existe: o e-mail deixou de ser obrigatório para começar (pedir dado
// de contato antes de a pessoa ver o pet andar é o maior ponto de abandono de
// um onboarding). Mas sem e-mail o save é só local — trocar de aparelho ou
// desinstalar perde tudo. Então o app pede quando passa a existir algo que
// doeria perder, e aí o pedido se justifica sozinho.
//
// Nunca bloqueia: dá para fechar e continuar jogando.

interface ProtectProgressModalProps {
  language: Language;
  /** Motivo concreto para pedir agora — vira a frase principal. */
  reason: 'evolution' | 'streak';
  onDismiss: () => void;
  /** Recebe o e-mail já validado; quem chama migra o save. */
  onConfirm: (email: string) => Promise<void>;
}

export function ProtectProgressModal({ language, reason, onDismiss, onConfirm }: ProtectProgressModalProps) {
  const isPt = language === 'pt-BR';
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const motivo = reason === 'evolution'
    ? (isPt ? 'Seu Soulmon evoluiu!' : 'Your Soulmon evolved!')
    : (isPt ? 'Você está numa sequência boa!' : "You're on a good streak!");

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(email.trim().toLowerCase());
    } catch {
      setSaving(false);
      setError(isPt ? 'Não deu para salvar agora. Tente de novo.' : "Couldn't save right now. Try again.");
    }
  };

  return (
    <ModalSheet
      open
      onClose={onDismiss}
      language={language}
      title={motivo}
      maxWidth={420}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || saving}
            style={{ ...sm2Button('primary', !valid || saving), width: '100%' }}
          >
            {saving && <Icon name="sync" size={20} className="animate-spin" />}
            {saving
              ? (isPt ? 'Salvando…' : 'Saving…')
              : (isPt ? 'Salvar meu progresso' : 'Save my progress')}
          </button>
          <button type="button" onClick={onDismiss} style={{ ...sm2Button('quiet'), width: '100%' }}>
            {isPt ? 'Agora não' : 'Not now'}
          </button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'Seu progresso está só neste aparelho. Deixe um e-mail para não perder o seu Soulmon se trocar de celular.'
          : 'Your progress lives only on this device. Leave an email so you don’t lose your Soulmon if you switch phones.'}
      </p>

      <div>
        <label htmlFor="protect-email" style={{ ...sm2Hint, display: 'block', marginBottom: 6, fontWeight: 500 }}>
          {isPt ? 'Seu e-mail' : 'Your email'}
        </label>
        <Field
          id="protect-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
          placeholder={isPt ? 'voce@exemplo.com' : 'you@example.com'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'protect-email-error' : undefined}
          // 16px evita o zoom automático do Safari em iOS ao focar o campo.
          style={{ fontSize: 16 }}
        />
        {/* Estado de erro: falha de rede é o caso comum aqui, e ele fala em
            tom de "tente de novo", não de alarme. `danger-ink` é TINTA. */}
        {error && (
          <p id="protect-email-error" role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)', marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>
    </ModalSheet>
  );
}
