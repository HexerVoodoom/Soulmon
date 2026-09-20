import { Icon } from './ui/Icon';
import { sm2Button, sm2Text } from './form/FormKit';
import { RitualDialog, SpriteGlass, ritualTitle } from './ritual/RitualKit';

interface FirstTaskCompletedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'pt-BR' | 'en-US';
  /** Sprite atual do pet — a criatura NA peça (R8). Sem ele, só a semente. */
  spriteUrl?: string | null;
}

/**
 * Aparece na PRIMEIRA tarefa concluída na vida do jogador — o maior momento de
 * reforço positivo do produto.
 *
 * Uma frase e UM botão. O que foi cortado: a segunda frase explicativa (a
 * pessoa acabou de fazer a coisa; explicar a mecânica agora é roubar a
 * comemoração dela).
 *
 * R8 / S8 (DECISÕES §7, canvas Rituais §21): a peça mudou de CLASSE. Era uma
 * `ModalSheet` em z-120 — sob os intersticiais (z-200), invisível quando o
 * gatilho era o "just 5 minutes today?" do próprio check-in, e com um trap
 * próprio disputando o foco. Agora é a classe da cerimônia do marco: fora das
 * filas de propósito, **z-300, espera o gesto**, o sprite num vidro 96² ao
 * lado do `eco` 32 FILL 0 (a semente). O × fica por fidelidade ao artboard
 * `PrimeiraTarefa` (RIT-26) — a tensão com V1 está registrada para o lead.
 */
export function FirstTaskCompletedPopup({
  isOpen,
  onClose,
  language = 'en-US',
  spriteUrl,
}: FirstTaskCompletedPopupProps) {
  const isPt = language === 'pt-BR';
  if (!isOpen) return null;

  return (
    <RitualDialog
      label={isPt ? 'Primeira tarefa feita!' : 'First task done!'}
      onClose={onClose}
      zIndex={300}
      maxWidth={340}
      closeLabel={isPt ? 'Fechar' : 'Close'}
      closeLast
      style={{ textAlign: 'center', alignItems: 'center' }}
    >
      <p style={{ ...ritualTitle, padding: '0 36px' }}>{isPt ? 'Primeira tarefa feita!' : 'First task done!'}</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        {spriteUrl && <SpriteGlass spriteUrl={spriteUrl} />}
        {/* A semente: o mesmo glifo de maturidade da lista, FILL 0. */}
        <Icon name="eco" size={32} fill={0} tone="primary" />
      </div>
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'Seu Soulmon cresceu um pouquinho agora. Uma coisa de cada vez, no seu ritmo.'
          : 'It grew a little just now. One thing at a time, at your pace.'}
      </p>
      <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Entendi' : 'Got it'}
      </button>
    </RitualDialog>
  );
}
