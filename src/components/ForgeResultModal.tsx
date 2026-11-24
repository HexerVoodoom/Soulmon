import type { ReactNode } from 'react';
import { ModalSheet, sm2Button } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * MODAL DE RESULTADO DE FORJA (23/11/2026): popup central (título inline, ✕ redondo à direita) que mostra arte + nome + efeito do que
 * acabou de ser criado (HEX da Hexsmith; poção da Vesca). Só apresenta: quem o monta decide QUANDO abrir (só depois da confirmação do
 * servidor/do saldo e uma vez por forja) e o que a ação primária faz (ex.: "Equipar agora").
 */
export interface ForgeResultModalProps {
  language: Language;
  /** Título do popup (ex.: "HEX forjado"). */
  title: string;
  /** Nome do item criado. */
  name: string;
  /** Efeito/descrição curta; ausente = não mostra a linha. */
  effect?: string | null;
  /** Arte do item (img/ícone), já dimensionada por quem chama. */
  art: ReactNode;
  onClose: () => void;
  /** Ação primária opcional ("Equipar agora"). */
  primary?: { label: string; onClick: () => void };
  closeLabel: string;
}

export function ForgeResultModal({ language, title, name, effect, art, onClose, primary, closeLabel }: ForgeResultModalProps) {
  return (
    <ModalSheet open placement="center" titulo="inline" sobreTelas title={title} onClose={onClose} language={language} maxWidth={328}
      footer={(
        <div className="sm2-forja-resultado-acoes">
          {primary && <button type="button" data-forge-result-primary style={sm2Button('primary', false, 'md')} onClick={primary.onClick}>{primary.label}</button>}
          <button type="button" data-forge-result-close style={sm2Button('outline', false, 'md')} onClick={onClose}>{closeLabel}</button>
        </div>
      )}>
      <div data-forge-result className="sm2-forja-resultado" role="status">
        <span className="sm2-forja-resultado-arte" aria-hidden="true">{art}</span>
        <strong data-forge-result-name className="sm2-forja-resultado-nome">{name}</strong>
        {effect && <p data-forge-result-effect className="sm2-forja-resultado-efeito">{effect}</p>}
      </div>
    </ModalSheet>
  );
}
