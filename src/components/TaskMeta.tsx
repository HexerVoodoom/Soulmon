import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';
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

/**
 * O chip do assombro (canvas Home, `PetAssombrado` / F1 / X9, 16/09/2026):
 * "haunted · +relief" em `--sm2-gold-ink` sobre `--sm2-surface-2`, 24px de
 * altura — CONVITE com prêmio, na cor do convite (âmbar), nunca vermelho e
 * nunca opacidade (a linha inteira a `.55` dava 2,31:1 no claro). Medido:
 * 7,49:1 escuro / 5,15:1 claro. A LINHA (título + ícone) fica na tinta
 * própria `--sm2-haunted` (P5), pelo `RitualRow`; a aura roxa
 * (`--sm-haunt-ink`/`-veil`, tokens da era `--sm-*`) saiu daqui.
 */

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

  /**
   * ONDA 2 — a faixa perdeu as CAIXAS.
   *
   * Cada metadado era um chip com fundo e borda de cobre. Três caixinhas
   * empilhadas debaixo de CADA tarefa da lista é a maior fonte de ruído da
   * superfície mais vista do app, e nenhuma delas carregava informação que a
   * moldura acrescentasse: o dado é o texto. Sobrou texto pelado em `--sm2-muted`
   * separado por espaço. O único que continua com superfície própria é o
   * assombrado — ali o véu É a informação ("esta está esmaecida").
   */
  const meta: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-xs)',
    fontWeight: 500,
    lineHeight: 'var(--sm2-leading-body)',
    color: 'var(--sm2-muted)',
  };

  const effortText = isPt ? EFFORT_LABEL[effort].pt : EFFORT_LABEL[effort].en;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        /* NÃO volte a pôr `opacity` aqui. Esmaecida nunca quis dizer ilegível —
           e opacidade no contêiner é a única coisa nesta faixa capaz de
           reprovar AA em TODOS os chips de uma vez, inclusive os que não têm
           nada a ver com o assombro. Ver a nota do chip, acima. */
      }}
    >
      {/* NÃO volte a pôr `opacity` neste contêiner nem aura por cima dele:
          esmaecida nunca quis dizer ilegível — a linha assombrada esmaece pela
          TINTA (`--sm2-haunted`, no `RitualRow`), e o chip abaixo é o convite. */}
      {/* Esforço. Os três pontinhos SAÍRAM: eles codificavam 1/2/3 ao lado da
          palavra que já diz 1/2/3 ("rápida/média/projeto") — duas leituras do
          mesmo dado, uma delas cifrada. A palavra fica, os pontos vão embora.
          A recompensa escala com ISTO, nunca com a contagem de tarefas. */}
      <span
        style={{ ...meta, position: 'relative' }}
        title={isPt ? `Esforço ${effort} de 3` : `Effort ${effort} of 3`}
        aria-label={isPt ? `Esforço ${effort} de 3, ${effortText}` : `Effort ${effort} of 3, ${effortText}`}
      >
        {effortText}
      </span>

      {/* Contador de adiamentos (Sunsama). Torna evitação crônica um DADO em
          vez de um sentimento — e dado tem botão, sentimento não. */}
      {postponed >= 1 && (
        <button
          type="button"
          disabled={!onPostponeNudge}
          onClick={onPostponeNudge ? () => onPostponeNudge(task.id) : undefined}
          /* O chip tem ~23px de altura — abaixo até do mínimo de 24px do
             2.5.8. `.sm-tap-44` estica só a ÁREA DE TOQUE por pseudo-elemento
             (index.css): o alvo passa a 44px sem a faixa de metadados virar
             uma barra alta. */
          className={onPostponeNudge ? 'sm-tap-44' : undefined}
          style={{
            ...meta,
            position: 'relative',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: onPostponeNudge ? 'pointer' : 'default',
            // O destaque do limite de adiamentos deixou de ser uma borda ciano
            // e virou a TINTA do próprio dado: mais forte, e sem caixa.
            color: nudge ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)',
            textDecoration: nudge ? 'underline' : 'none',
            textUnderlineOffset: 3,
          }}
          title={
            nudge
              ? isPt
                ? 'Quer decompor, encolher ou deixar pra lá?'
                : 'Want to split it, shrink it, or let it go?'
              : undefined
          }
        >
          {/* `schedule` (relógio) no lugar de nada: o contador precisava do
              rótulo inteiro para dizer que falava de tempo. Decorativo — o
              texto ao lado diz a mesma coisa. */}
          <Icon name="schedule" size={20} fill={nudge ? 1 : 0} />
          {isPt ? 'adiada ' : 'postponed '}
          <span className="sm2-num">{postponed}</span>
          {isPt
            ? (postponed === 1 ? ' vez' : ' vezes')
            : (postponed === 1 ? ' time' : ' times')}
        </button>
      )}

      {/* O assombrado. Convite com recompensa anunciada — o único jeito de a
          pilha de culpa virar conteúdo de jogo em vez de motivo pra fechar o app. */}
      {haunted && (
        <span
          data-haunted-chip
          style={{
            ...meta,
            position: 'relative',
            // A ÚNICA superfície que sobrou na faixa, e ela é informação: o
            // chip de etiqueta 24 (SIS-03) — `gold-ink` sobre `surface-2`,
            // tinta cheia, nunca `opacity`, que derruba o contraste de tudo.
            minHeight: 24,
            padding: '0 8px',
            borderRadius: 12,
            color: 'var(--sm2-gold-ink)',
            backgroundColor: 'var(--sm2-surface-2)',
            fontWeight: 500,
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
          {/* `auto_awesome` diz "tem prêmio aqui" — a metade da mensagem que
              importa. Sem ícone de ALERTA, em âmbar: isto é convite, não erro. */}
          <Icon name="auto_awesome" size={20} fill={1} tone="gold" />
          {isPt ? 'assombrada · +alívio' : 'haunted · +relief'}
        </span>
      )}
    </div>
  );
}

export default TaskMeta;
