import type { Language } from '../utils/i18n';
import { PixelIcon } from './ui/PixelIcon';

/**
 * A CARTINHA da Home (D-13, REGISTRO §115): ícone pelado (sem box; regra visual) do glifo `enviar` do app,
 * à esquerda, abaixo do retrato. Quem a monta só a renderiza COM carta não lida — sem carta, ela não existe no DOM.
 * Parada: sem pulso, sem som, sem número (nunca cobra). Alvo de toque de 44.
 */
export function NpcLetterButton({ language, onOpen }: { language: Language; onOpen: () => void }) {
  const label = language === 'pt-BR' ? 'Você tem uma carta' : 'You have a letter';
  return (
    <button
      type="button"
      data-npc-letter-btn
      aria-label={label}
      title={label}
      onClick={onOpen}
      style={{
        width: 44, height: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <PixelIcon name="enviar" size={32} />
    </button>
  );
}

export default NpcLetterButton;
