import { ModalSheet, Segment, sm2Button, sm2Hint, sm2Label, sm2Text } from './form/FormKit';
import { FEEDBACK_MAX, FEEDBACK_TYPES, type FeedbackType } from '../utils/feedbackClient';
import type { Language } from '../utils/i18n';

/**
 * MODAL DE FEEDBACK (dono, 04/11/2026): a pessoa marca Feedback, Sugestão ou Bug,
 * escreve e toca Enviar; a mensagem vai ao servidor (`/api/feedback`) e daí à caixa
 * de revisão, sem abrir o app de e-mail. Estado controlado pelo pai: o texto NUNCA
 * se perde (falha mantém o rascunho e oferece tentar de novo).
 */
export type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'error-network' | 'error-server' | 'error-rate';

export function feedbackCopy(language: Language) {
  const pt = language === 'pt-BR';
  return {
    title: pt ? 'Falar com o Soulmon' : 'Talk to Soulmon',
    types: {
      feedback: 'Feedback',
      suggestion: pt ? 'Sugestão' : 'Suggestion',
      bug: 'Bug',
    } as Record<FeedbackType, string>,
    typeGroup: pt ? 'Tipo da mensagem' : 'Message type',
    label: pt ? 'Sua mensagem' : 'Your message',
    placeholder: pt ? 'Conte o que aconteceu ou o que você pensa…' : 'Tell us what happened or what you think…',
    send: pt ? 'Enviar' : 'Send',
    sending: pt ? 'Enviando…' : 'Sending…',
    retry: pt ? 'Tentar de novo' : 'Try again',
    close: pt ? 'Fechar' : 'Close',
    privacy: pt
      ? 'Vai só o texto, o tipo, a versão do app e a plataforma. Nada da sua conta.'
      : 'Only your text, the type, the app version and the platform are sent. Nothing from your account.',
    sentTitle: pt ? 'Mensagem enviada' : 'Message sent',
    sentBody: pt ? 'Obrigado! Quem faz o Soulmon vai ler.' : 'Thank you! The people who make Soulmon will read it.',
    errNetwork: pt ? 'Sem conexão. Seu texto continua aqui; tente de novo.' : 'No connection. Your text is still here; try again.',
    errServer: pt ? 'Não deu para enviar agora. Seu texto continua aqui; tente de novo.' : 'Could not send right now. Your text is still here; try again.',
    errRate: pt ? 'Muitas mensagens seguidas. Seu texto continua aqui; tente daqui a pouco.' : 'Too many messages in a row. Your text is still here; try again in a moment.',
  };
}

export function FeedbackModal({
  open, onClose, language, type, onType, message, onMessage, status, onSend,
}: {
  open: boolean;
  onClose: () => void;
  language: Language;
  type: FeedbackType;
  onType: (t: FeedbackType) => void;
  message: string;
  onMessage: (m: string) => void;
  status: FeedbackStatus;
  onSend: () => void;
}) {
  const t = feedbackCopy(language);
  const sending = status === 'sending';
  const sent = status === 'sent';
  const empty = message.trim().length === 0;
  const err = status === 'error-network' ? t.errNetwork : status === 'error-server' ? t.errServer : status === 'error-rate' ? t.errRate : null;
  const isError = err !== null;

  return (
    <ModalSheet
      open={open}
      title={sent ? t.sentTitle : t.title}
      onClose={onClose}
      language={language}
      sobreTelas
      dismissOnBackdrop={sent || (empty && !sending)}
      footer={sent ? (
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }} data-feedback-close>{t.close}</button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={empty || sending}
          style={{ ...sm2Button('primary', empty || sending), width: '100%' }}
          data-feedback-send
        >
          {sending ? t.sending : isError ? t.retry : t.send}
        </button>
      )}
    >
      {sent ? (
        <p style={{ ...sm2Text, margin: 0 }} data-feedback-sent>{t.sentBody}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div role="radiogroup" aria-label={t.typeGroup} style={{ display: 'flex', gap: 8 }}>
            {FEEDBACK_TYPES.map((k) => (
              <Segment key={k} selected={type === k} onSelect={() => !sending && onType(k)} label={t.types[k]} />
            ))}
          </div>
          <div>
            <label htmlFor="sm-feedback-text" style={sm2Label}>{t.label}</label>
            <textarea
              id="sm-feedback-text"
              value={message}
              maxLength={FEEDBACK_MAX}
              rows={6}
              readOnly={sending}
              placeholder={t.placeholder}
              onChange={(e) => onMessage(e.target.value)}
              aria-invalid={isError}
              data-feedback-text
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 140, resize: 'vertical',
                padding: '10px 12px', borderRadius: 'var(--sm2-radius-md)',
                border: '1px solid var(--sm2-muted)', backgroundColor: 'var(--sm2-surface-2)',
                fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-md)',
                lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-ink)',
              }}
            />
            <p style={{ ...sm2Hint, textAlign: 'right', marginTop: 4 }}>{message.length}/{FEEDBACK_MAX}</p>
          </div>
          {err && <p role="alert" data-feedback-error style={{ ...sm2Text, margin: 0, color: 'var(--sm2-gold-ink)' }}>{err}</p>}
          <p style={sm2Hint}>{t.privacy}</p>
        </div>
      )}
    </ModalSheet>
  );
}
