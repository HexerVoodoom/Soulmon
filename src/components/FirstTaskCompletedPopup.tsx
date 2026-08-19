import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';

interface FirstTaskCompletedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'pt-BR' | 'en-US';
}

/**
 * Aparece na PRIMEIRA tarefa concluída na vida do jogador — o maior momento de
 * reforço positivo do produto.
 *
 * Uma frase e UM botão. O que foi cortado: a segunda frase explicativa (a
 * pessoa acabou de fazer a coisa; explicar a mecânica agora é roubar a
 * comemoração dela) e o X próprio (o `ModalSheet` já traz um, acessível).
 */
export function FirstTaskCompletedPopup({
  isOpen,
  onClose,
  language = 'en-US',
}: FirstTaskCompletedPopupProps) {
  const isPt = language === 'pt-BR';

  return (
    <ModalSheet
      open={isOpen}
      onClose={onClose}
      language={language}
      title={isPt ? 'Primeira tarefa feita!' : 'First task done!'}
      maxWidth={420}
      footer={
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Entendi' : 'Got it'}
        </button>
      }
    >
      <div style={{ textAlign: 'center', fontSize: 56, lineHeight: 1 }} aria-hidden="true">🌱</div>
      <p style={{ ...sm2Text, textAlign: 'center', margin: 0 }}>
        {isPt
          ? 'Ele cresceu um pouquinho agora. Uma coisa de cada vez, no seu ritmo.'
          : 'It grew a little just now. One thing at a time, at your pace.'}
      </p>
    </ModalSheet>
  );
}
