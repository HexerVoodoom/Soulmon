import { sm2Hint } from '../form/FormKit';
import type { Language } from '../../utils/i18n';

/**
 * Nome do especial do Soulmon, SÓ LEITURA (11/11/2026): a troca mudou para a Hexsmith (chama, custa Bits; `HexRenameModal`).
 * O campo que o servidor/duelo/exibição leem segue sendo `especialNome`; aqui só mostramos e apontamos para a Hexsmith.
 */
export function EspecialNomeLeitura({ language, nome }: { language: Language; nome: string }) {
  const isPt = language === 'pt-BR';
  return (
    <div data-especial-nome-leitura style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
      <span style={{ ...sm2Hint, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
        {isPt ? 'Nome do seu especial' : 'Your special’s name'}
      </span>
      <strong data-especial-nome-valor>{nome || (isPt ? 'Padrão' : 'Default')}</strong>
      <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Troque na Hexsmith.' : 'Change it at the Hexsmith.'}</p>
    </div>
  );
}
