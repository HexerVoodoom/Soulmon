import { useState } from 'react';
import type { Language } from '../utils/i18n';
import { dayPlanFocusIds, type DayPlanCandidate, type DayPlanFocusSource } from '../utils/dayPlan';
import { MAX_DAILY_FOCUS } from '../types/taskModel';
import type { CatalogItem } from '../types/activityCatalog';
import { CheckRow, ModalSheet, sm2Button, sm2Hint } from './form/FormKit';

/**
 * REAFIRMAR O DIA (15/10/2026, pedido do dono; REGISTRO §66) — a lista de caixas de marcar com o que a pessoa JÁ cadastrou
 * (hábitos, tarefas, agendadas que caem hoje). Todo dia ela diz o que quer fazer: as caixas nascem DESMARCADAS (isto
 * substitui o "todas marcadas" do 7.3) e só o que ela marcar aparece no Hoje. O que ficar de fora não cobra nada.
 *
 * Modal CENTRALIZADO como os outros do começo do dia, na fila central (`dayGoals`). Fechar sem confirmar é permitido
 * (sem cobrança): a lista fica vazia com um convite discreto. A caixa é a `CheckRow` do kit (rótulo inteiro = alvo de 44,
 * contorno bronze, check turquesa). Apresentacional: quem grava é o pai.
 *
 * "HOJE" = metas + compromisso NUMA tela só (19/10/2026, dono — REGISTRO §111, D-64). Com `fuse`, este modal é o "Hoje" do início
 * de dia: o `checkIn` (compromisso com o foco) deixa de ser um modal à parte. As TAREFAS marcadas viram o foco do dia (até
 * `MAX_DAILY_FOCUS`, as pendências de ontem primeiro — `dayPlanFocusIds`), a oferta reduzida do "nunca falte duas vezes" (5 minutos)
 * continua aqui, e o `onConfirm` devolve também os ids do foco. Sem `fuse`, nada muda.
 */
export interface DayGoalsModalProps {
  candidates: readonly DayPlanCandidate[];
  language: Language;
  /** Já marcadas (reabrir o modal no mesmo dia, antes de confirmar). */
  initiallyPicked?: readonly string[];
  /** `focusIds` só vem preenchido com `fuse` (as tarefas marcadas, até 3). */
  onConfirm: (pickedIds: string[], focusIds: string[]) => void;
  onClose: () => void;
  /** DEMO: atividades do catálogo oferecidas pré-preenchidas (desmarcadas). Nada é criado sem o toque; as marcadas viram atividade via `onAcceptSuggestions`, que devolve os ids criados. */
  suggestions?: readonly CatalogItem[];
  onAcceptSuggestions?: (items: CatalogItem[]) => string[];
  /** "Comprometer-me com uma tarefa" (menu do +): o MESMO modal, mas o pai já filtrou só o que NÃO foi comprometido. Confirmar só ACRESCENTA; sem oferta reduzida, sem sugestões, sem "Hoje não". */
  mode?: 'add';
  /** Modo "Hoje" (metas + compromisso). */
  fuse?: {
    /** O que o motor do check-in sabe: ordem do foco (ontem primeiro) e a oferta reduzida. */
    plan: DayPlanFocusSource & { tinyOffer?: readonly string[] };
    /** Ids das TAREFAS do save (só elas viram foco; atividade agendada não). */
    taskIds: ReadonlySet<string>;
    /** Marcar a versão bufada (reduzida) a registra como tarefa bônus do dia (acumula: várias bufadas valem todas). */
    onTinyHabit?: (activityId: string) => void;
    /** O "o que costuma atrapalhar?" do onboarding, para a oferta reduzida reconhecê-lo. */
    soulStruggle?: string;
  };
}

export function DayGoalsModal({ candidates, language, initiallyPicked = [], onConfirm, onClose, fuse, suggestions = [], onAcceptSuggestions, mode }: DayGoalsModalProps) {
  const isPt = language === 'pt-BR';
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(initiallyPicked));
  const toggle = (id: string, on: boolean) => setPicked(prev => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  });
  const buffedIds: ReadonlySet<string> = new Set(fuse && mode !== 'add' && fuse.onTinyHabit ? candidates.filter(c => c.kind === 'habit' && (fuse.plan.tinyOffer ?? []).includes(c.id)).map(c => c.id) : []);
  const habits = candidates.filter(c => c.kind === 'habit' && !buffedIds.has(c.id));
  const tasks = candidates.filter(c => c.kind === 'task');
  const count = candidates.filter(c => picked.has(c.id)).length + suggestions.filter(i => picked.has(`sug:${i.id}`)).length;
  const confirm = () => {
    const chosen = suggestions.filter(i => picked.has(`sug:${i.id}`));
    const created = chosen.length > 0 && onAcceptSuggestions ? onAcceptSuggestions([...chosen]) : [];
    const ids = [...candidates.filter(c => picked.has(c.id)).map(c => c.id), ...created];
    // Marcar a versão bufada (hábito com oferta de 5 min) É aceitar: vira a tarefa bônus de hoje, na MESMA linha — sem duplicata
    // da original e sem segunda ação (REGISTRO §474). Cada bufada marcada vira bônus; nenhuma sobrescreve a outra.
    for (const id of ids) if (tinyIds.has(id)) fuse?.onTinyHabit?.(id);
    onConfirm(ids, fuse ? dayPlanFocusIds(ids, fuse.taskIds, fuse.plan, MAX_DAILY_FOCUS) : []);
  };
  const adding = mode === 'add';
  const tinyIds = buffedIds;
  const buffed = candidates.filter(c => buffedIds.has(c.id));

  const row = (c: DayPlanCandidate) => (
      <div key={c.id} className="sm2-conta-card" data-day-goal={c.id} style={{ padding: '2px 12px' }}>
        <CheckRow checked={picked.has(c.id)} onChange={on => toggle(c.id, on)}>
          {tinyIds.has(c.id)
            /* A bufada: MESMA linha, caixa e cartão das demais; só o texto muda — negrito e dourado (`gold-ink`, AA nos dois temas). */
            ? <span data-day-goals-bonus style={{ fontWeight: 700, color: 'var(--sm2-gold-ink)' }}>{`${c.name || (isPt ? 'Esse hábito' : 'This habit')} · ${isPt ? 'bônus de 5 min' : '5-min bonus'}`}</span>
            : <span style={{ fontWeight: 600 }}>{c.name || (isPt ? 'Sem nome' : 'Unnamed')}</span>}
        </CheckRow>
      </div>
  );

  const group = (key: string, label: string, items: readonly DayPlanCandidate[]) => items.length === 0 ? null : (
    <section key={key} data-day-goals-group={key} aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h3 style={{ ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</h3>
      {items.map(c => row(c))}
    </section>
  );

  return (
    <ModalSheet
      open
      title={adding ? (isPt ? 'Comprometer-me com uma tarefa' : 'Commit to a task') : fuse ? (isPt ? 'Hoje' : 'Today') : (isPt ? 'Metas de hoje' : "Today's goals")}
      onClose={onClose}
      dismissOnBackdrop={false}
      placement="center"
      language={language}
      maxWidth={420}
      footer={(
        <>
          <button type="button" data-day-goals-confirm onClick={confirm} style={{ ...sm2Button('primary'), width: '100%' }}>
            {isPt ? 'Confirmar' : 'Confirm'}
          </button>
          {fuse && !adding && (
            <button type="button" data-day-goals-skip onClick={onClose} style={{ ...sm2Button('outline'), width: '100%', marginTop: 8 }}>
              {isPt ? 'Hoje não, obrigado' : 'Not today, thanks'}
            </button>
          )}
        </>
      )}
    >
      <p style={sm2Hint}>
        {adding
          ? (isPt
            ? 'Marque o que você quer fazer hoje. O que já está no seu compromisso não aparece aqui e não sai de lá.'
            : "Check what you want to do today. What you already committed to isn't listed here and stays committed.")
          : fuse
          ? (isPt
            ? `Marque o que você quer fazer hoje. As tarefas marcadas viram seu foco (até ${MAX_DAILY_FOCUS}).`
            : `Check what you want to do today. Checked tasks become your focus (up to ${MAX_DAILY_FOCUS}).`)
          : (isPt
            ? 'Marque o que você quer fazer hoje. O que ficar de fora não aparece na lista e não cobra nada.'
            : 'Check what you want to do today. What stays out is not on your list and costs nothing.')}
      </p>
      {group('habits', isPt ? 'Hábitos' : 'Habits', habits)}
      {group('tasks', isPt ? 'Tarefas' : 'Tasks', tasks)}
      {!adding && suggestions.length > 0 && (
        <section data-day-goals-group="suggestions" aria-label={isPt ? 'Sugestões' : 'Suggestions'} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 style={{ ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{isPt ? 'Sugestões' : 'Suggestions'}</h3>
          {suggestions.map(i => (
            <div key={i.id} className="sm2-conta-card" data-day-suggestion={i.id} style={{ padding: '2px 12px' }}>
              <CheckRow checked={picked.has(`sug:${i.id}`)} onChange={on => toggle(`sug:${i.id}`, on)}>
                <span style={{ fontWeight: 600 }}>
                  <span aria-hidden="true" data-day-suggestion-icon style={{ marginRight: 8 }}>{i.emoji}</span>
                  {isPt ? i.name.pt : i.name.en}
                </span>
              </CheckRow>
            </div>
          ))}
        </section>
      )}
      {/* A oferta reduzida (nunca falte duas vezes): a linha do hábito vira a tarefa BÔNUS do dia ao marcar (`utils/bonusTask.ts`); sem botão de recusar — desmarcada, não cobra nada. */}
      {buffed.length > 0 && (
        <section role="group" aria-labelledby="day-goals-buff-txt" data-day-goals-group="buffed" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <hr aria-hidden="true" data-day-goals-buff-sep style={{ border: 0, borderTop: '1px solid var(--sm2-line)', margin: '8px 0 4px', width: '100%' }} />
          <p id="day-goals-buff-txt" data-day-goals-tiny style={sm2Hint}>
            {isPt ? 'Você está com dificuldade de cumprir estas tarefas. Elas receberam um buff, espero que ajude.' : "You've been struggling to complete these tasks. They got a buff — hope it helps."}
          </p>
          {buffed.map(c => row(c))}
        </section>
      )}
      <p role="status" aria-live="polite" data-day-goals-count style={sm2Hint}>
        {isPt ? `${count} marcadas` : `${count} checked`}
      </p>
    </ModalSheet>
  );
}
