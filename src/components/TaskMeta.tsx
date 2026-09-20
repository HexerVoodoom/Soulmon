import type { CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';
import {
  effortOf,
  isHaunted,
  daysStale,
  isOverdue,
  deadlineAt,
  needsPostponeNudge,
  type TriageTask,
} from '../utils/taskTriage';

/**
 * A FAIXA DE METADADOS DE UMA TAREFA
 * ==================================
 *
 * Puramente apresentacional: recebe a tarefa e o relógio, não toca em
 * GameState, não grava nada, não decide regra nenhuma — quem decide é
 * `utils/taskTriage.ts`.
 *
 * O ponto inteiro deste componente é a diferença entre um ALERTA e um CONVITE.
 * A tarefa assombrada (`isHaunted`) é o oposto do vermelho de atraso do
 * mercado: a linha muda de MATIZ (`--sm2-haunted`, no `RitualRow`) e o chip
 * anuncia que concluí-la dá BÔNUS DE ALÍVIO — o pet comemora mais alto. É um
 * mini-chefe a derrotar, não uma acusação. Nenhum vermelho de erro entra aqui.
 *
 * Canvas ATIVIDADES (`LinhaTarefaEstados`, D-A4): tudo é CHIP DE ETIQUETA 24
 * (SIS-03 — `surface-2`, `muted` 12/500, sem borda): prazo (a data, nunca "N
 * days late"), esforço em palavra, e o contador de adiamentos com o MESMO
 * desenho de 24 dentro de um alvo 44 invisível (X2: o alvo cresce, o desenho
 * não). O contador é `muted` — nunca âmbar/vermelho (X10 do Sistema) — e só
 * ganha sublinhado em `POSTPONE_NUDGE_AT`, quando abre o nudge. O chip
 * assombrado é o único em `gold-ink` (convite, âmbar), com `visibility` — o
 * pet OLHA a tarefa (D-A8). Nada aqui carrega `opacity`.
 */

const EFFORT_LABEL: Record<number, { pt: string; en: string }> = {
  1: { pt: 'rápida', en: 'quick' },
  2: { pt: 'média', en: 'medium' },
  3: { pt: 'projeto', en: 'project' },
};

/** O chip de etiqueta 24 (SIS-03): `surface-2`, sem borda, Rubik 12/500. */
export const sm2Tag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  minHeight: 24,
  padding: '0 8px',
  borderRadius: 12,
  boxSizing: 'border-box',
  backgroundColor: 'var(--sm2-surface-2)',
  color: 'var(--sm2-muted)',
  fontFamily: 'var(--sm2-font-text)',
  fontSize: 'var(--sm2-text-xs)',
  fontWeight: 500,
  lineHeight: 'var(--sm2-leading-body)',
  whiteSpace: 'nowrap',
};

export interface TaskMetaProps {
  task: TriageTask;
  now: Date;
  language: Language;
  /**
   * Chamado quando a tarefa passou do limite de adiamentos e o usuário toca no
   * contador — quem abre o menu de decompor/encolher/deixar pra lá é o pai.
   * Sem handler, o contador continua visível (é dado honesto), só não é clicável.
   */
  onPostponeNudge?: (taskId: string) => void;
}

export function TaskMeta({ task, now, language, onPostponeNudge }: TaskMetaProps) {
  const isPt = language === 'pt-BR';
  const effort = effortOf(task);
  const postponed = task.postponedCount ?? 0;
  const haunted = isHaunted(task, now);
  const overdue = isOverdue(task, now);
  const stale = daysStale(task, now);
  const nudge = needsPostponeNudge(task);
  const due = deadlineAt(task);

  const effortText = isPt ? EFFORT_LABEL[effort].pt : EFFORT_LABEL[effort].en;
  const postponedText = isPt
    ? `adiada ${postponed} ${postponed === 1 ? 'vez' : 'vezes'}`
    : `postponed ${postponed} ${postponed === 1 ? 'time' : 'times'}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        /* NÃO volte a pôr `opacity` aqui: esmaecida nunca quis dizer ilegível,
           e alfa no contêiner derruba o contraste de TODOS os chips de uma vez. */
      }}
    >
      {/* O prazo: a DATA, sempre — vencida ou não. "N days late" não existe
          aqui (R3): a data é dado, o atraso é veredito. */}
      {due && (
        <span
          style={sm2Tag}
          title={isPt ? `Prazo: ${due.toLocaleDateString('pt-BR')}` : `Deadline: ${due.toLocaleDateString('en-US')}`}
        >
          {due.toLocaleDateString(isPt ? 'pt-BR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Esforço em palavra. Os três pontinhos SAÍRAM: codificavam 1/2/3 ao
          lado da palavra que já diz 1/2/3. A recompensa escala com ISTO,
          nunca com a contagem de tarefas. */}
      <span
        style={sm2Tag}
        title={isPt ? `Esforço ${effort} de 3` : `Effort ${effort} of 3`}
        aria-label={isPt ? `Esforço ${effort} de 3, ${effortText}` : `Effort ${effort} of 3, ${effortText}`}
      >
        {effortText}
      </span>

      {/* Contador de adiamentos (Sunsama). Torna evitação crônica um DADO em
          vez de um sentimento — e dado tem botão, sentimento não. O ALVO é 44
          e invisível; o DESENHO é a etiqueta 24 (X2). */}
      {postponed >= 1 && (
        <button
          type="button"
          disabled={!onPostponeNudge}
          onClick={onPostponeNudge ? () => onPostponeNudge(task.id) : undefined}
          aria-label={nudge
            ? (isPt ? `${postponedText} — toque para uma saída` : `${postponedText} — tap for a way out`)
            : postponedText}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            padding: 0,
            background: 'none',
            border: 'none',
            cursor: onPostponeNudge ? 'pointer' : 'default',
          }}
          title={
            nudge
              ? isPt
                ? 'Quer decompor, encolher ou deixar pra lá?'
                : 'Want to split it, shrink it, or let it go?'
              : undefined
          }
        >
          <span
            style={{
              ...sm2Tag,
              // O limite de adiamentos é SUBLINHADO, nunca outra cor: o
              // contador fica em `muted` (X10) — âmbar é o convite, vermelho
              // não existe.
              textDecoration: nudge ? 'underline' : 'none',
              textUnderlineOffset: 3,
            }}
          >
            <Icon name="schedule" size={20} fill={nudge ? 1 : 0} />
            {postponedText}
          </span>
        </button>
      )}

      {/* O assombrado. Convite com recompensa anunciada — o único jeito de a
          pilha de culpa virar conteúdo de jogo em vez de motivo pra fechar o
          app. `visibility`: o pet OLHA (WP3.2), sem ícone de alerta. */}
      {haunted && (
        <span
          data-haunted-chip
          style={{ ...sm2Tag, color: 'var(--sm2-gold-ink)' }}
          title={
            overdue
              ? isPt
                ? 'Venceu e continua aqui. Concluir dá bônus de alívio.'
                : 'Past due and still here. Finishing it gives a relief bonus.'
              : isPt
                ? `Parada há ${stale} dias. Concluir dá bônus de alívio.`
                : `Idle for ${stale} days. Finishing it gives a relief bonus.`
          }
        >
          <Icon name="visibility" size={20} fill={1} tone="gold" />
          {isPt ? 'assombrada · +alívio' : 'haunted · +relief'}
        </span>
      )}
    </div>
  );
}

export default TaskMeta;
