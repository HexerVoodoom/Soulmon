import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import { resolveLanguage, type Language } from '../utils/i18n';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Rótulos dos botões. Sem eles o diálogo saía em inglês fixo. */
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Idioma do chrome do diálogo (o "Fechar" do sheet). Opcional porque o
   * único call-site passa os rótulos já traduzidos; o padrão lê o idioma
   * escolhido, e não um inglês fixo.
   */
  language?: Language;
  /**
   * `true` só quando a ação DESTRÓI algo de verdade (apagar save, perder
   * progresso). Canvas Conta D-K6: perda irreversível vai em `outline` —
   * nunca em primário, nunca no acento de perigo (o gerador reprova). O
   * call-site de hoje ("refazer o ritual") preserva tudo, então é primário
   * (X4, decisão do lead).
   */
  destructive?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel,
  language, destructive = false,
}: ConfirmDialogProps) {
  const lang = language ?? resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE));
  const isPt = lang === 'pt-BR';

  const confirmStyle = sm2Button(destructive ? 'outline' : 'primary');

  return (
    <ModalSheet open={isOpen} onClose={onClose} language={lang} title={title} maxWidth={420}
      footer={
        /* "Cancel" `outline` + "Redo" `primary`, lado a lado, MESMA largura
           (canvas Conta `RefazerRitual`): cancelar é saída, nunca `quiet`. */
        <div className="sm2-conta-two">
          <button type="button" onClick={onClose} style={sm2Button('outline')}>
            {cancelLabel ?? (isPt ? 'Cancelar' : 'Cancel')}
          </button>
          <button type="button" onClick={onConfirm} style={confirmStyle}>
            {confirmLabel ?? (isPt ? 'Confirmar' : 'Confirm')}
          </button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }}>{message}</p>
    </ModalSheet>
  );
}
