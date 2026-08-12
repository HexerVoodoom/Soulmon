import { useState } from 'react';
import { CloudUpload, X } from 'lucide-react';
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
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
        background: 'rgba(42,36,64,0.45)',
      }}
      onClick={onDismiss}
    >
      <div
        className="sm-card"
        style={{ width: '100%', maxWidth: 380, padding: 22, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          aria-label={isPt ? 'Fechar' : 'Close'}
          style={{
            position: 'absolute', top: 12, right: 12, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'var(--sm-muted)', padding: 6,
          }}
        >
          <X size={18} strokeWidth={2.4} />
        </button>

        <div style={{
          width: 52, height: 52, borderRadius: 18, marginBottom: 14,
          background: 'var(--sm-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CloudUpload size={26} color="var(--sm-primary)" strokeWidth={2} />
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--sm-ink)' }}>
          {motivo}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'var(--sm-muted)' }}>
          {isPt
            ? 'Seu progresso está só neste aparelho. Deixe um e-mail para não perder o seu Soulmon se trocar de celular ou reinstalar o app.'
            : 'Your progress lives only on this device. Leave an email so you don’t lose your Soulmon if you switch phones or reinstall.'}
        </p>

        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="voce@exemplo.com"
          style={{
            width: '100%', boxSizing: 'border-box', background: 'var(--sm-surface)', color: 'var(--sm-ink)',
            border: '2px solid var(--sm-line)', borderRadius: 14, padding: '13px 15px',
            // 16px evita o zoom automático do Safari em iOS ao focar o campo.
            fontSize: 16, outline: 'none',
          }}
        />
        {error && (
          <p style={{ fontSize: 12, color: '#e0483e', margin: '8px 0 0' }}>{error}</p>
        )}

        <button
          className="sm-btn"
          style={{ width: '100%', marginTop: 14, opacity: valid && !saving ? 1 : 0.55 }}
          disabled={!valid || saving}
          onClick={submit}
        >
          {saving
            ? (isPt ? 'Salvando…' : 'Saving…')
            : (isPt ? 'Salvar meu progresso' : 'Save my progress')}
        </button>
        <button
          onClick={onDismiss}
          style={{
            width: '100%', marginTop: 8, background: 'transparent', border: 'none',
            color: 'var(--sm-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 8,
          }}
        >
          {isPt ? 'Agora não' : 'Not now'}
        </button>
      </div>
    </div>
  );
}
