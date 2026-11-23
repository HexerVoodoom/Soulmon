import { useState } from 'react';
import { ActionRow, ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import type { ReviewMotivo, ReviewReport } from '../utils/reviewSoulmon';
import type { ReviewRequestError } from '../hooks/useReviewWatcher';

/**
 * "Pedir revisao do meu Soulmon" (Ajuda): o jogador acha que o desenho do Soulmon esta com problema (recorte ruim, estilo destoante).
 * UM toque manda o pedido; o botao fica INATIVO e embaixo aparece "Seu Soulmon esta em revisao" ate o servidor concluir (avalia com o
 * Claude e conserta sozinho). O estado vive no servidor, por forma: sobrevive a fechar o app. Quando conclui, o app avisa (modal) e o
 * botao volta. Sem upload, sem escolha tecnica: o mesmo fluxo para todas as contas.
 */
export function reviewCopy(language: Language) {
  const pt = language === 'pt-BR';
  return {
    label: pt ? 'Pedir revisão do meu Soulmon' : 'Request a review of my Soulmon',
    hint: pt ? 'Se o desenho tiver um problema, nos avise. Vamos verificar para você.' : "If the drawing has a problem, let us know. We'll check it for you.",
    inReview: pt ? 'Seu Soulmon está em revisão' : 'Your Soulmon is under review',
    sentToTeam: pt ? 'Enviamos para a nossa equipe olhar' : 'We sent it to our team to take a look',
    motivoTitle: pt ? 'O que há de errado com o desenho?' : 'What is wrong with the drawing?',
    motivoEstilo: pt ? 'Estilo inconsistente' : 'Inconsistent style',
    motivoRecorte: pt ? 'Recorte com falhas' : 'Cutout has flaws',
    cancel: pt ? 'Cancelar' : 'Cancel',
    sending: pt ? 'Enviando…' : 'Sending…',
    noSprite: pt ? 'Seu Soulmon ainda não tem um desenho próprio para revisar.' : 'Your Soulmon has no drawing of its own to review yet.',
    error: (e: Exclude<ReviewRequestError, null>) => ({
      network: pt ? 'Sem conexão. Tente de novo.' : 'No connection. Try again.',
      cooldown: pt ? 'Você já pediu revisão deste Soulmon hoje. Tente amanhã.' : 'You already requested a review of this Soulmon today. Try again tomorrow.',
      limit: pt ? 'Você já fez 3 pedidos para este Soulmon hoje. Tente amanhã.' : 'You already made 3 requests for this Soulmon today. Try again tomorrow.',
      server: pt ? 'Não deu para enviar agora. Tente de novo.' : 'Could not send right now. Try again.',
      'no-sprite': pt ? 'Seu Soulmon ainda não tem um desenho próprio para revisar.' : 'Your Soulmon has no drawing of its own to review yet.',
    }[e]),
    doneTitle: pt ? 'Revisão concluída' : 'Review finished',
    fixed: pt ? 'Revisão concluída — seu Soulmon foi atualizado.' : 'Review finished — your Soulmon was updated.',
    allGood: pt ? 'Revisamos e está tudo certo com o desenho do seu Soulmon.' : 'We reviewed it and your Soulmon\'s drawing looks right.',
    notFixed: pt ? 'Revisamos, mas ainda não conseguimos consertar o desenho. Vamos olhar com carinho; você pode pedir de novo amanhã.' : 'We reviewed it but could not fix the drawing yet. We will take a closer look; you can ask again tomorrow.',
    ok: pt ? 'Ok' : 'OK',
  };
}

/** O texto do aviso de conclusão para o conjunto de pedidos concluídos (o conserto vence). */
export function reviewResultMessage(language: Language, finished: Pick<ReviewReport, 'status'>[]): string {
  const t = reviewCopy(language);
  if (finished.some(r => r.status === 'consertado')) return t.fixed;
  if (finished.some(r => r.status === 'sem-problema')) return t.allGood;
  return t.notFixed;
}

export interface ReviewRowState {
  active: boolean;
  /** O pedido ativo foi para a equipe (e-mail), não para a IA. */
  team?: boolean;
  sending: boolean;
  error: ReviewRequestError;
  /** `false` = a forma equipada ainda não tem um desenho do nosso servidor para revisar. */
  reviewable: boolean;
  onRequest: (motivo?: ReviewMotivo) => void;
}

export function ReviewSoulmonRow({ language, review }: { language: Language; review?: ReviewRowState }) {
  const [escolhendo, setEscolhendo] = useState(false);
  if (!review) return null;
  const t = reviewCopy(language);
  const erro = review.error ? t.error(review.error) : !review.reviewable ? t.noSprite : null;
  return (
    <>
      <ActionRow
        label={t.label}
        hint={review.sending ? t.sending : t.hint}
        onClick={() => setEscolhendo(true)}
        disabled={review.active || !review.reviewable}
      />
      {/* `role="status"`: o leitor de tela anuncia a mudança de estado. */}
      <p role="status" aria-live="polite" data-review-state={review.active ? 'active' : 'idle'} style={{ ...sm2Text, margin: '0 0 0 16px', minHeight: 0, fontSize: 'var(--sm2-text-sm)' }}>
        {review.active && !review.sending ? (review.team ? t.sentToTeam : t.inReview) : erro}
      </p>
      <ModalSheet
        open={escolhendo}
        title={t.motivoTitle}
        onClose={() => setEscolhendo(false)}
        language={language}
        sobreTelas
        footer={<button type="button" onClick={() => setEscolhendo(false)} style={{ ...sm2Button('outline'), width: '100%' }}>{t.cancel}</button>}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          {(['estilo', 'recorte'] as const).map(m => (
            <button key={m} type="button" data-review-motivo={m} style={{ ...sm2Button('primary'), width: '100%' }}
              onClick={() => { setEscolhendo(false); review.onRequest(m); }}>
              {m === 'estilo' ? t.motivoEstilo : t.motivoRecorte}
            </button>
          ))}
        </div>
      </ModalSheet>
    </>
  );
}

/** O aviso de conclusão a partir do resultado bruto (o `App` o carrega por `import()`: a mensagem e o modal vivem juntos). */
export function ReviewResultFromReport({ language, finished, onClose }: { language: Language; finished: Pick<ReviewReport, 'status'>[]; onClose: () => void }) {
  return <ReviewResultModal language={language} message={reviewResultMessage(language, finished)} onClose={onClose} />;
}

/** O aviso de conclusão (uma vez por conclusão). */
export function ReviewResultModal({ language, message, onClose }: { language: Language; message: string | null; onClose: () => void }) {
  const t = reviewCopy(language);
  return (
    <ModalSheet
      open={message !== null}
      title={t.doneTitle}
      onClose={onClose}
      language={language}
      sobreTelas
      footer={<button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }} data-review-ok>{t.ok}</button>}
    >
      <p style={{ ...sm2Text, margin: 0 }} data-review-result>{message}</p>
    </ModalSheet>
  );
}
