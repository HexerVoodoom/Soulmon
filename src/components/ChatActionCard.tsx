import { useState } from 'react';
import { describeAction, renameAction, type CreateAction } from '../utils/chatActions';

/**
 * O CARTÃO DE CONFIRMAÇÃO das ações propostas pelo chat.
 *
 * É a trava de produto: o modelo PROPÕE, a pessoa decide. Nada é gravado até o
 * toque em "Criar", e quem grava é o dono único de criação (`commitHabitCreate`
 * / `commitTaskCreate`, via `onConfirm`) — com os tetos de sempre. "Editar" troca
 * só o NOME, na hora, antes de criar; o resto da proposta fica como o modelo
 * montou (cadência e horário se ajustam depois, no editor normal).
 *
 * Tom: pergunta curta, botões neutros, "Agora não" sem culpa.
 */
export function ChatActionCard({
  action, isPt, onConfirm, onDismiss,
}: {
  action: CreateAction;
  isPt: boolean;
  onConfirm: (a: CreateAction) => void;
  onDismiss: () => void;
}) {
  const [current, setCurrent] = useState<CreateAction>(action);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(action.type === 'create_habit' ? action.habit.name : action.task.name);
  const nameNow = current.type === 'create_habit' ? current.habit.name : current.task.name;

  const applyEdit = () => {
    const renamed = renameAction(current, draft);
    if (renamed) setCurrent(renamed);
    setEditing(false);
  };

  return (
    <div
      role="group"
      aria-label={isPt ? 'Confirmar criação' : 'Confirm creation'}
      data-chat-action-card
      className="sm2-chat-action-card"
      style={{
        position: 'absolute', left: 8, right: 8, bottom: '100%', marginBottom: 8, zIndex: 5,
        padding: '10px 12px', borderRadius: 12, display: 'grid', gap: 8,
        border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface-2)',
        color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
      }}
    >
      {editing ? (
        <input
          aria-label={isPt ? 'Nome' : 'Name'}
          value={draft}
          maxLength={60}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyEdit(); } }}
          autoFocus
          style={{ font: 'inherit', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--sm2-line)', background: 'transparent', color: 'inherit' }}
        />
      ) : (
        <p style={{ margin: 0 }} aria-live="polite">{describeAction(current, isPt)}</p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" onClick={onDismiss} className="sm2-chat-action-btn">
          {isPt ? 'Agora não' : 'Not now'}
        </button>
        {editing ? (
          <button type="button" onClick={applyEdit} className="sm2-chat-action-btn">
            {isPt ? 'Salvar nome' : 'Save name'}
          </button>
        ) : (
          <button type="button" onClick={() => { setDraft(nameNow); setEditing(true); }} className="sm2-chat-action-btn">
            {isPt ? 'Editar' : 'Edit'}
          </button>
        )}
        <button type="button" onClick={() => onConfirm(current)} disabled={editing} className="sm2-chat-action-btn sm2-chat-action-primary">
          {isPt ? 'Criar' : 'Create'}
        </button>
      </div>
    </div>
  );
}
