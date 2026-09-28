import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { crisisLineText } from '../../utils/chatSafety';
import type { CatalogItem } from '../../types/activityCatalog';

/**
 * A1 da revisão de psicologia (`docs/reviews/2026-09-28-catalogo-psicologia.md`):
 * cartão fixo de aviso para itens `optInOnly` da área "mente" (protocolos de
 * TCC — registro de pensamentos, exposição gradual leve). Mostrado ANTES de
 * "Adicionar", com as `contraindications` do item listadas, e a linha de
 * crise reaproveitada de `chatSafety.ts` (nunca uma segunda versão do
 * texto). Só libera o botão "Adicionar" depois de um toque em "Entendi" —
 * este componente é intencionalmente MODAL para essa decisão (não é um
 * banner que se dispensa para sempre e não volta).
 */
interface CatalogMindNoticeProps {
  item: CatalogItem;
  language?: 'pt-BR' | 'en-US';
  onCancel: () => void;
  onConfirm: () => void;
}

export function CatalogMindNotice({ item, language = 'en-US', onCancel, onConfirm }: CatalogMindNoticeProps) {
  const isPt = language === 'pt-BR';
  const [understood, setUnderstood] = useState(false);

  const disclaimer = isPt
    ? 'Isto é uma prática de autocuidado, não tratamento. Não substitui psicólogo ou psiquiatra.'
    : 'This is a self-care practice, not treatment. It does not replace a psychologist or psychiatrist.';

  const contraindicacoes = item.contraindications ?? [];

  return (
    <div role="dialog" aria-modal="true" aria-label={isPt ? 'Aviso importante' : 'Important notice'}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="health_and_safety" size={24} fill={1} tone="primary" />
        <h3 style={{ ...sm2Text, fontWeight: 600, margin: 0 }}>
          {isPt ? 'Antes de adicionar' : 'Before you add this'}
        </h3>
      </div>

      <div className="sm2-conta-card" style={{ padding: 12 }}>
        <p style={{ ...sm2Text, margin: 0 }}>{disclaimer}</p>
        <p style={{ ...sm2Text, margin: '8px 0 0' }}>{crisisLineText(language)}</p>
      </div>

      {contraindicacoes.length > 0 && (
        <div>
          <p style={{ ...sm2Hint, margin: '0 0 4px', fontWeight: 600 }}>
            {isPt ? 'Quando NÃO usar' : 'When NOT to use this'}
          </p>
          <ul style={{ ...sm2Hint, margin: 0, paddingLeft: 18 }}>
            {contraindicacoes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span style={sm2Text}>
          {isPt ? 'Entendi — quero adicionar mesmo assim.' : 'I understand — I still want to add this.'}
        </span>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          disabled={!understood}
          onClick={onConfirm}
          style={{ ...sm2Button('primary', !understood), width: '100%' }}
        >
          {isPt ? 'Adicionar' : 'Add'}
        </button>
        <button type="button" onClick={onCancel} style={{ ...sm2Button('outline'), width: '100%' }}>
          {isPt ? 'Cancelar' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
