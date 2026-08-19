import type { Language } from '../utils/i18n';
import {
  effortOf,
  isHaunted,
  daysStale,
  isOverdue,
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
 * mercado: ela esmaece, ganha uma aura escura e anuncia que concluí-la dá
 * BÔNUS DE ALÍVIO — o pet comemora mais alto. É um mini-chefe a derrotar, não
 * uma acusação. Nenhum vermelho de erro entra aqui de propósito: vermelho é a
 * cor da cobrança, e a pilha de atrasadas é a causa nº1 de abandono da
 * categoria justamente porque todo mundo a pinta assim.
 */

/** Roxo do assombro. NÃO é vermelho, e isso é a mecânica, não estética. */
const HAUNT_INK = '#7c5cbf';

const EFFORT_LABEL: Record<number, { pt: string; en: string }> = {
  1: { pt: 'rápida', en: 'quick' },
  2: { pt: 'média', en: 'medium' },
  3: { pt: 'projeto', en: 'project' },
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

  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 7px',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.5,
    color: 'var(--sm-muted)',
    backgroundColor: 'var(--sm-surface)',
    border: '1px solid color-mix(in srgb, var(--sm-px-copper) 35%, transparent)',
  };

  const effortText = isPt ? EFFORT_LABEL[effort].pt : EFFORT_LABEL[effort].en;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        // Esmaecida, nunca apagada: ainda tem que dar pra ler quem é ela.
        opacity: haunted ? 0.72 : 1,
      }}
    >
      {/* Aura escura — sem contorno, sem ícone de alerta. Só uma sombra que
          sugere que tem alguma coisa ali pra enfrentar. */}
      {haunted && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-8px -12px',
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at 18% 50%, color-mix(in srgb, ' +
              HAUNT_INK +
              ' 26%, transparent) 0%, transparent 68%)',
          }}
        />
      )}

      {/* Selo de esforço — pontinhos, porque "1/2/3" sozinho não diz nada.
          A recompensa escala com ISTO, nunca com a contagem de tarefas. */}
      <span
        style={{ ...chip, position: 'relative' }}
        title={isPt ? `Esforço ${effort} — ${effortText}` : `Effort ${effort} — ${effortText}`}
        aria-label={isPt ? `Esforço ${effort} de 3, ${effortText}` : `Effort ${effort} of 3, ${effortText}`}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex', gap: 2 }}>
          {[1, 2, 3].map(n => (
            <span
              key={n}
              style={{
                width: 5,
                height: 5,
                backgroundColor: n <= effort ? 'var(--sm-px-cyan)' : 'var(--sm-line)',
              }}
            />
          ))}
        </span>
        {effortText}
      </span>

      {/* Contador de adiamentos (Sunsama). Torna evitação crônica um DADO em
          vez de um sentimento — e dado tem botão, sentimento não. */}
      {postponed >= 1 && (
        <button
          type="button"
          disabled={!onPostponeNudge}
          onClick={onPostponeNudge ? () => onPostponeNudge(task.id) : undefined}
          style={{
            ...chip,
            position: 'relative',
            cursor: onPostponeNudge ? 'pointer' : 'default',
            color: nudge ? 'var(--sm-ink)' : 'var(--sm-muted)',
            borderColor: nudge
              ? 'color-mix(in srgb, var(--sm-px-cyan) 70%, transparent)'
              : 'color-mix(in srgb, var(--sm-px-copper) 35%, transparent)',
          }}
          title={
            nudge
              ? isPt
                ? 'Quer decompor, encolher ou deixar pra lá?'
                : 'Want to split it, shrink it, or let it go?'
              : undefined
          }
        >
          {isPt
            ? `adiada ${postponed} ${postponed === 1 ? 'vez' : 'vezes'}`
            : `postponed ${postponed}${postponed === 1 ? ' time' : ' times'}`}
        </button>
      )}

      {/* O assombrado. Convite com recompensa anunciada — o único jeito de a
          pilha de culpa virar conteúdo de jogo em vez de motivo pra fechar o app. */}
      {haunted && (
        <span
          style={{
            ...chip,
            position: 'relative',
            color: HAUNT_INK,
            borderColor: `color-mix(in srgb, ${HAUNT_INK} 55%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${HAUNT_INK} 12%, var(--sm-surface))`,
          }}
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
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              backgroundColor: HAUNT_INK,
              animation: 'sm-ambient-float 3.6s ease-in-out infinite',
            }}
          />
          {isPt ? 'assombrada · +alívio' : 'haunted · +relief'}
        </span>
      )}
    </div>
  );
}

export default TaskMeta;
