import { useState } from 'react';
import { AISettingsModal, SwitchRow, ActionRow, type AISettings } from './AISettingsModal';
import { ModalSheet } from './form/FormKit';
import { resolveLanguage, type Language } from '../utils/i18n';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

/**
 * O painel rápido do menu. Três linhas, e o alvo é a LINHA inteira.
 *
 * Saíram daqui: `lucide-react`, `bg-black/60 backdrop-blur-sm`,
 * `rounded-lg shadow-2xl`, os dois interruptores iOS (`h-6 w-11` com bolinha
 * `bg-white`), `fontFamily: monospace` em todo texto, a caixa de "💡 Tip" (uma
 * dica de duas linhas que ninguém lê duas vezes) e o botão "✅ Close" — fechar
 * já é o X e o Escape do `ModalSheet`, com foco preso e devolvido.
 *
 * Também era a única superfície de configuração 100% em inglês; o par PT/EN é
 * obrigatório. O App não passa idioma, então o padrão lê a preferência salva.
 */
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  useAI: boolean;
  onToggleAI: () => void;
  soundMuted?: boolean;
  onToggleSound?: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  language?: Language;
}

export function SettingsModal({
  isOpen,
  onClose,
  useAI,
  onToggleAI,
  soundMuted = false,
  onToggleSound,
  aiSettings,
  onSaveAISettings,
  language = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)),
}: SettingsModalProps) {
  const [showAISettings, setShowAISettings] = useState(false);
  const isPt = language === 'pt-BR';

  return (
    <>
      <ModalSheet
        open={isOpen}
        onClose={onClose}
        language={language}
        title={isPt ? 'Ajustes rápidos' : 'Quick settings'}
      >
        <div>
          <SwitchRow
            checked={!soundMuted}
            onToggle={() => onToggleSound?.()}
            label={isPt ? 'Sons' : 'Sound'}
          />
          <SwitchRow
            checked={useAI}
            onToggle={onToggleAI}
            label={isPt ? 'Conversa com IA' : 'AI chat'}
            hint={isPt
              ? 'Desligado, seu Soulmon responde por palavras-chave.'
              : 'Off, it answers from keywords.'}
          />
          <ActionRow
            label={isPt ? 'Personalidade' : 'Personality'}
            onClick={() => setShowAISettings(true)}
          />
        </div>
      </ModalSheet>

      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        currentSettings={aiSettings}
        onSave={onSaveAISettings}
        language={language}
      />
    </>
  );
}
