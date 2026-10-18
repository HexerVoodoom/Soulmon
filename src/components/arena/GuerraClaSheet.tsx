import { sm2Button, sm2Hint } from '../form/FormKit';
import type { Language } from '../../utils/i18n';

/**
 * GUERRA DE CLÃS (Arena, 3º prédio) — a folha do NPC da guerra. A guerra em si
 * (4×4, servidor decide) mora no Salão do Clã, no Hall; aqui só se explica onde
 * ela acontece e se leva o jogador até lá. Sem regra nova, sem cobrança.
 */
interface Props {
  language: Language;
  /** Leva ao mapa (Hall). Sem ele o botão não aparece. */
  onGoToClan?: () => void;
}

export function GuerraClaSheet({ language, onGoToClan }: Props) {
  const isPt = language === 'pt-BR';
  return (
    <div data-guerra-cla style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ ...sm2Hint, margin: 0 }}>
        {isPt
          ? 'A Guerra de Clãs se luta junto do seu clã. Reúna o esquadrão no Salão do Clã, no Hall, e entrem na roda.'
          : 'The Clan War is fought with your clan. Gather your squad at the Clan Hall and join the round.'}
      </p>
      {onGoToClan && (
        <button type="button" onClick={onGoToClan} style={sm2Button('primary')}>
          {isPt ? 'Ir ao Salão do Clã' : 'Go to the Clan Hall'}
        </button>
      )}
    </div>
  );
}
