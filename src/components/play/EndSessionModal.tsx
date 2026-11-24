import { ModalSheet } from '../form/FormKit';
import type { Language } from '../../utils/i18n';

/**
 * Aviso Sim/Não "Deseja encerrar a sessão?" (15.3, dono, opção A): aparece ao tocar em Encerrar (jornada) ou Concluir a missão (descanso).
 * Sim encerra; Não, o ✕ e o Esc mantêm a sessão como está. Marcar a tarefa como concluída segue pela lista (`onCompleteTask`), fora daqui.
 */
export function EndSessionModal({ language, onYes, onNo }: { language: Language; onYes: () => void; onNo: () => void }) {
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet open placement="center" titulo="inline" sobreTelas title={isPt ? 'Deseja encerrar a sessão?' : 'Do you want to end the session?'} onClose={onNo} language={language} maxWidth={328}
      footer={(
        <div className="sm2-encerrar-acoes">
          <button type="button" data-end-session-no className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline" onClick={onNo}>{isPt ? 'Não' : 'No'}</button>
          <button type="button" data-end-session-yes className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary" onClick={onYes}>{isPt ? 'Sim' : 'Yes'}</button>
        </div>
      )}>
      <p data-end-session className="sm2-encerrar-texto">{isPt ? 'O que o Soulmon achou pelo caminho já é seu.' : 'What your Soulmon found on the way is yours.'}</p>
    </ModalSheet>
  );
}
