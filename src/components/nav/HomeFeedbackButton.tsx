import { useState } from 'react';
import { homeFeedbackLabel } from '../FeedbackLink';
import { FeedbackModal, type FeedbackStatus } from '../FeedbackModal';
import { sendFeedback, type FeedbackType } from '../../utils/feedbackClient';
import type { Language } from '../../utils/i18n';
import { CORNER_INK, CORNER_RING_STYLE } from './cornerAnchor';

/**
 * FEEDBACK NA HOME (dono, 04/11/2026): logo ABAIXO do avatar do perfil (slot `leading`
 * do `HomeHud`), só o besourinho `bug_report` do Material em CONTORNO (Material Symbols Outlined; SVG inline: fora do subset da fonte) dentro do círculo `CORNER_RING_STYLE` (o mesmo anel dos ícones de canto), sem rótulo
 * visível — o nome mora no `aria-label`. Abre o `FeedbackModal` (tipo + mensagem + Enviar,
 * via `/api/feedback`, sem abrir o app de e-mail; o `mailto:` saiu SÓ daqui). O rascunho
 * mora neste componente: falha de envio mantém o texto. Alvo de toque 44.
 */
export function HomeFeedbackButton({ language }: { language: Language }) {
  const label = homeFeedbackLabel(language);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('idle');

  const close = () => {
    setOpen(false);
    if (status === 'sent') { setMessage(''); setType('feedback'); setStatus('idle'); }
  };
  const send = async () => {
    if (status === 'sending' || !message.trim()) return;
    setStatus('sending');
    const r = await sendFeedback(type, message, language);
    if (r.ok) setStatus('sent');
    else setStatus(r.reason === 'rate' ? 'error-rate' : r.reason === 'network' ? 'error-network' : 'error-server');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        data-home-feedback
        className="sm2-corner-link"
        style={{
          ...CORNER_RING_STYLE,
          position: 'absolute', top: '100%', left: 0, marginTop: 16, color: CORNER_INK,
          // 6, não 5: a cena do pet (`sm-pet-sticky`, z 5) vem depois no DOM e cobria o ícone e o toque.
          zIndex: 6,
        }}
      >
        <svg width={24} height={24} viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" data-bug-outline>
          <path d="M480-120q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120Zm0-80q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Z" />
        </svg>
      </button>
      <FeedbackModal
        open={open}
        onClose={close}
        language={language}
        type={type}
        onType={setType}
        message={message}
        onMessage={m => { setMessage(m); if (status !== 'sending') setStatus('idle'); }}
        status={status}
        onSend={send}
      />
    </>
  );
}
