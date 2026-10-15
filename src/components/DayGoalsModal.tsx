import { useState } from 'react';
import type { Language } from '../utils/i18n';
import type { DayPlanCandidate } from '../utils/dayPlan';
import { CheckRow, ModalSheet, sm2Button, sm2Hint } from './form/FormKit';

/**
 * REAFIRMAR O DIA (15/10/2026, pedido do dono; REGISTRO §64) — a lista de caixas de marcar com o que a pessoa JÁ cadastrou
 * (hábitos, tarefas, agendadas que caem hoje). Todo dia ela diz o que quer fazer: as caixas nascem DESMARCADAS (isto
 * substitui o "todas marcadas" do 7.3) e só o que ela marcar aparece no Hoje. O que ficar de fora não cobra nada.
 *
 * Modal CENTRALIZADO como os outros do começo do dia, na fila central (`dayGoals`). Fechar sem confirmar é permitido
 * (sem cobrança): a lista fica vazia com um convite discreto. A caixa é a `CheckRow` do kit (rótulo inteiro = alvo de 44,
 * contorno bronze, check turquesa). Apresentacional: quem grava é o pai.
 */
export interface DayGoalsModalProps {
  candidates: readonly DayPlanCandidate[];
  language: Language;
  /** Já marcadas (reabrir o modal no mesmo dia, antes de confirmar). */
  initiallyPicked?: readonly string[];
  onConfirm: (pickedIds: string[]) => void;
  onClose: () => void;
}

export function DayGoalsModal({ candidates, language, initiallyPicked = [], onConfirm, onClose }: DayGoalsModalProps) {
  const isPt = language === 'pt-BR';
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(initiallyPicked));
  const toggle = (id: string, on: boolean) => setPicked(prev => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  });
  const habits = candidates.filter(c => c.kind === 'habit');
  const tasks = candidates.filter(c => c.kind === 'task');
  const count = candidates.filter(c => picked.has(c.id)).length;

  const group = (key: string, label: string, items: readonly DayPlanCandidate[]) => items.length === 0 ? null : (
    <section key={key} data-day-goals-group={key} aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h3 style={{ ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</h3>
      {items.map(c => (
        <div key={c.id} className="sm2-conta-card" data-day-goal={c.id} style={{ padding: '2px 12px' }}>
          <CheckRow checked={picked.has(c.id)} onChange={on => toggle(c.id, on)}>
            <span style={{ fontWeight: 600 }}>{c.name || (isPt ? 'Sem nome' : 'Unnamed')}</span>
          </CheckRow>
        </div>
      ))}
    </section>
  );

  return (
    <ModalSheet
      open
      title={isPt ? 'Metas de hoje' : "Today's goals"}
      onClose={onClose}
      dismissOnBackdrop={false}
      placement="center"
      language={language}
      maxWidth={420}
      footer={(
        <button type="button" data-day-goals-confirm onClick={() => onConfirm(candidates.filter(c => picked.has(c.id)).map(c => c.id))} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Confirmar' : 'Confirm'}
        </button>
      )}
    >
      <p style={sm2Hint}>
        {isPt
          ? 'Marque o que você quer fazer hoje. O que ficar de fora não aparece na lista e não cobra nada.'
          : 'Check what you want to do today. What stays out is not on your list and costs nothing.'}
      </p>
      {group('habits', isPt ? 'Hábitos' : 'Habits', habits)}
      {group('tasks', isPt ? 'Tarefas' : 'Tasks', tasks)}
      <p role="status" aria-live="polite" data-day-goals-count style={sm2Hint}>
        {isPt ? `${count} marcadas` : `${count} checked`}
      </p>
    </ModalSheet>
  );
}
