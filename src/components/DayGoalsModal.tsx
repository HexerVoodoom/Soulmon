import { useState } from 'react';
import type { Language } from '../utils/i18n';
import { dayPlanFocusIds, type DayPlanCandidate, type DayPlanFocusSource } from '../utils/dayPlan';
import { MAX_DAILY_FOCUS } from '../types/taskModel';
import { tinyOfferIntro } from '../utils/tinyOffer';
import type { CatalogItem } from '../types/activityCatalog';
import { Icon } from './ui/Icon';
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
  /** Modo "Hoje" (metas + compromisso). */
  fuse?: {
    /** O que o motor do check-in sabe: ordem do foco (ontem primeiro) e a oferta reduzida. */
    plan: DayPlanFocusSource & { tinyOffer?: readonly string[] };
    /** Ids das TAREFAS do save (só elas viram foco; atividade agendada não). */
    taskIds: ReadonlySet<string>;
    /** Aceitar a versão reduzida conta como FEITO, pelo mesmo caminho de sempre. */
    onTinyHabit?: (activityId: string) => void;
    /** O "o que costuma atrapalhar?" do onboarding, para a oferta reduzida reconhecê-lo. */
    soulStruggle?: string;
  };
}

export function DayGoalsModal({ candidates, language, initiallyPicked = [], onConfirm, onClose, fuse, suggestions = [], onAcceptSuggestions }: DayGoalsModalProps) {
  const isPt = language === 'pt-BR';
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(initiallyPicked));
  const [accepted, setAccepted] = useState<readonly string[]>([]);
  const toggle = (id: string, on: boolean) => setPicked(prev => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  });
  const habits = candidates.filter(c => c.kind === 'habit');
  const tasks = candidates.filter(c => c.kind === 'task');
  const count = candidates.filter(c => picked.has(c.id)).length + suggestions.filter(i => picked.has(`sug:${i.id}`)).length;
  const confirm = () => {
    const chosen = suggestions.filter(i => picked.has(`sug:${i.id}`));
    const created = chosen.length > 0 && onAcceptSuggestions ? onAcceptSuggestions([...chosen]) : [];
    const ids = [...candidates.filter(c => picked.has(c.id)).map(c => c.id), ...created];
    onConfirm(ids, fuse ? dayPlanFocusIds(ids, fuse.taskIds, fuse.plan, MAX_DAILY_FOCUS) : []);
  };
  const tiny = fuse ? habits.filter(h => (fuse.plan.tinyOffer ?? []).includes(h.id)) : [];
  const struggle = fuse ? tinyOfferIntro(fuse.soulStruggle, isPt) : null;

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
      title={fuse ? (isPt ? 'Hoje' : 'Today') : (isPt ? 'Metas de hoje' : "Today's goals")}
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
          {fuse && (
            <button type="button" data-day-goals-skip onClick={onClose} style={{ ...sm2Button('outline'), width: '100%', marginTop: 8 }}>
              {isPt ? 'Hoje não, obrigado' : 'Not today, thanks'}
            </button>
          )}
        </>
      )}
    >
      <p style={sm2Hint}>
        {fuse
          ? (isPt
            ? `Marque o que você quer fazer hoje. As tarefas marcadas viram seu foco (até ${MAX_DAILY_FOCUS}).`
            : `Check what you want to do today. Checked tasks become your focus (up to ${MAX_DAILY_FOCUS}).`)
          : (isPt
            ? 'Marque o que você quer fazer hoje. O que ficar de fora não aparece na lista e não cobra nada.'
            : 'Check what you want to do today. What stays out is not on your list and costs nothing.')}
      </p>
      {group('habits', isPt ? 'Hábitos' : 'Habits', habits)}
      {group('tasks', isPt ? 'Tarefas' : 'Tasks', tasks)}
      {suggestions.length > 0 && (
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
      {/* A oferta reduzida (nunca falte duas vezes): aceitar conta como FEITO; não há botão de recusar — ignorar é a recusa. */}
      {fuse?.onTinyHabit && tiny.length > 0 && (
        <section data-day-goals-tiny style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {struggle && <p style={sm2Hint}>{struggle}</p>}
          {tiny.map(h => {
            const name = h.name || (isPt ? 'Esse hábito' : 'This habit');
            if (accepted.includes(h.id)) {
              return (
                <span key={h.id} aria-disabled="true" data-day-goals-tiny-accepted style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, color: 'var(--sm2-primary-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500 }}>
                  <Icon name="check" size={20} fill={1} tone="inherit" />
                  {isPt ? `${name} · contou` : `${name} · counted`}
                </span>
              );
            }
            return (
              <button
                key={h.id}
                type="button"
                data-day-goals-tiny-offer={h.id}
                onClick={() => { fuse.onTinyHabit?.(h.id); setAccepted(prev => [...prev, h.id]); }}
                style={{ ...sm2Button('outline'), width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                {isPt ? `${name}: hoje, só 5 minutos?` : `${name}: just 5 minutes today?`}
              </button>
            );
          })}
          <p style={sm2Hint}>{isPt ? 'Aceitar já conta como feito.' : 'Saying yes already counts as done.'}</p>
        </section>
      )}
      <p role="status" aria-live="polite" data-day-goals-count style={sm2Hint}>
        {isPt ? `${count} marcadas` : `${count} checked`}
      </p>
    </ModalSheet>
  );
}
