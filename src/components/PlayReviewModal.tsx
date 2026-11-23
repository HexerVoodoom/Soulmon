import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

/** "Quer avaliar o Soulmon na Play?" — depois de evoluir. Dois botões de peso claro; fechar = "Agora não". */
export function PlayReviewModal({ language, onAccept, onLater }: { language: Language; onAccept: () => void; onLater: () => void }) {
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet
      open
      placement="center"
      onClose={onLater}
      language={language}
      title={isPt ? 'Seu Soulmon evoluiu!' : 'Your Soulmon evolved!'}
      maxWidth={340}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button type="button" onClick={onLater} style={{ ...sm2Button('outline'), flex: 1 }} data-play-review-later>{isPt ? 'Agora não' : 'Not now'}</button>
          <button type="button" onClick={onAccept} style={{ ...sm2Button('primary'), flex: 1 }} data-play-review-ok>{isPt ? 'Avaliar' : 'Rate'}</button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }} data-play-review>
        {isPt
          ? 'Está gostando do Soulmon? Uma avaliação na Play ajuda muito o jogo a crescer.'
          : 'Enjoying Soulmon? A rating on Google Play helps the game grow a lot.'}
      </p>
    </ModalSheet>
  );
}
