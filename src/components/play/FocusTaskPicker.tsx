/**
 * ESCOLHER A TAREFA (§300, 12/11/2026, pedido do dono): ao começar uma sessão de foco abre este modal. SEMPRE se escolhe uma tarefa
 * (não existe sessão livre); sem tarefas abertas, o modal oferece criar uma na hora. A escolhida liga à sessão e aparece no dock.
 * É um `ModalSheet`: cuida de modalDepth (a tela de trás esmaece) e do Voltar.
 */
import { useEffect, useRef, useState } from 'react';
import { Field, ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { checkBoxStyle, CheckMark, pickRowStyle } from '../pixel/RitualPanel';
import type { Language } from '../../utils/i18n';
import type { DockTask } from './FocusTaskDock';

export function FocusTaskPicker({ language, tasks, initialId, busy, onClose, onPick, onCreate }: {
  language: Language; tasks: readonly DockTask[]; initialId?: string | null; busy?: boolean;
  onClose: () => void;
  /** Confirma a tarefa que vira a da sessão. */
  onPick: (task: DockTask) => void;
  /** Cria uma tarefa na hora (devolve `false` se não coube). A nova aparece em `tasks` e é escolhida sozinha. */
  onCreate?: (name: string) => boolean;
}) {
  const isPt = language === 'pt-BR';
  const open = tasks.filter(t => !t.completed);
  const [sel, setSel] = useState<string | null>(initialId && open.some(t => t.id === initialId) ? initialId : (open.length === 1 ? open[0].id : null));
  const [name, setName] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const chosen = open.find(t => t.id === sel) ?? null;
  const create = () => {
    const n = name.trim();
    if (!n || !onCreate) return;
    if (onCreate(n)) { setName(''); setNote(null); } else setNote(isPt ? 'Não coube mais uma tarefa agora.' : "There's no room for another task right now.");
  };
  const prevCount = useRef(open.length);
  const lastId = open.length ? open[open.length - 1].id : null;
  useEffect(() => {
    // Tarefa recém-criada entra no fim da lista: escolhe-a.
    if (open.length > prevCount.current && lastId) setSel(lastId);
    prevCount.current = open.length;
  }, [open.length, lastId]);

  return (
    <ModalSheet open moldura="dono" fundoVazio title={isPt ? 'Qual tarefa você vai fazer?' : 'Which task will you do?'} onClose={onClose} language={language}
      footer={<div className="sm2-hex-footer">
        <button type="button" data-focus-pick-go disabled={!chosen || busy} style={{ ...sm2Button('primary', !chosen || !!busy), minHeight: 48 }} onClick={() => chosen && onPick(chosen)}>{isPt ? 'Começar' : 'Start'}</button>
      </div>}>
      <div data-focus-picker className="sm2-nova-corpo" style={{ display: 'grid', gap: 8 }}>
        <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Cada sessão tem uma tarefa. Ela fica na lista durante o foco.' : 'Every session has one task. It stays on the list while you focus.'}</p>
        {open.length === 0 && <p data-focus-picker-empty style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Você não tem tarefas abertas. Crie uma agora.' : "You have no open tasks. Create one now."}</p>}
        {open.length > 0 && <div role="radiogroup" aria-label={isPt ? 'Tarefas' : 'Tasks'} style={{ display: 'grid', gap: 6 }}>
          {open.map(t => {
            const on = t.id === sel;
            return <button key={t.id} type="button" role="radio" aria-checked={on} data-focus-pick={t.id} onClick={() => setSel(t.id)}
              style={{ ...pickRowStyle(sm2Button('outline'), on), justifyContent: 'flex-start', gap: 8, minHeight: 48, textAlign: 'left' }}>
              <span aria-hidden="true" className={on ? 'sm2-check-halo' : undefined} style={checkBoxStyle({ checked: on })}>{on && <CheckMark />}</span>
              <span style={{ overflowWrap: 'anywhere', flex: 1 }}>{t.name}</span>
              {t.kind === 'habit' && <span style={sm2Hint}>{isPt ? 'Hábito' : 'Habit'}</span>}
            </button>;
          })}
        </div>}
        {onCreate && <form data-focus-pick-new style={{ display: 'flex', gap: 8, alignItems: 'center' }} onSubmit={e => { e.preventDefault(); create(); }}>
          <Field aria-label={isPt ? 'Nova tarefa' : 'New task'} value={name} maxLength={120} placeholder={isPt ? 'Nova tarefa' : 'New task'} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" data-focus-pick-add disabled={!name.trim()} style={{ ...sm2Button('outline', !name.trim()), minHeight: 44 }}>{isPt ? 'Criar' : 'Add'}</button>
        </form>}
        {note && <p role="status" style={{ ...sm2Hint, margin: 0 }}>{note}</p>}
      </div>
    </ModalSheet>
  );
}
