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
   * progresso). O vermelho de perigo é a coisa mais barulhenta da paleta e
   * gasta a própria força quando enfeita uma confirmação inofensiva — o
   * call-site de hoje ("refazer o ritual") preserva tudo, então é primário.
   */
  destructive?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel,
  language, destructive = false,
}: ConfirmDialogProps) {
  const lang = language ?? resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE));
  const isPt = lang === 'pt-BR';

  const primary = sm2Button('primary');
  const confirmStyle = destructive
    ? { ...primary, backgroundColor: 'var(--sm2-danger-fill)', color: 'var(--sm2-on-danger)' }
    : primary;

  return (
    <ModalSheet open={isOpen} onClose={onClose} language={lang} title={title} maxWidth={420}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Uma ação domina; a saída sussurra logo abaixo, em `quiet`. */}
          <button type="button" onClick={onConfirm} style={{ ...confirmStyle, width: '100%' }}>
            {confirmLabel ?? (isPt ? 'Confirmar' : 'Confirm')}
          </button>
          <button type="button" onClick={onClose} style={{ ...sm2Button('quiet'), width: '100%' }}>
            {cancelLabel ?? (isPt ? 'Cancelar' : 'Cancel')}
          </button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }}>{message}</p>
    </ModalSheet>
  );
}
