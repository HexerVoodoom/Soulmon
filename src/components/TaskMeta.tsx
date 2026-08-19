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
 * Roxo do assombro. NÃO é vermelho, e isso é a mecânica, não estética.
 *
 * Era o hex cru `#7c5cbf`, sem par por tema — e o contêiner inteiro esmaecia
 * com `opacity: 0.72`, que é a parte que estragava tudo: opacidade global
 * mistura TODO o conteúdo com o fundo e derruba a razão de contraste de coisas
 * que não têm nada a ver com o esmaecimento. Os chips caíam para 2,94:1 (claro)
 * e 3,71:1 (escuro) no `--sm-muted`, e este roxo para 2,76:1 e **1,92:1**.
 * Reprovava AA nos dois temas, justamente no item que o app quer que a pessoa
 * consiga ler para enfrentar.
 *
 * A correção é a mesma que o `.sm-px-btn:disabled` já tinha adotado: esmaecer
 * com COR dedicada por tema (`--sm-haunt-ink` para o que é lido, e um véu de
 * superfície `--sm-haunt-veil` para o "esmaecido"), nunca com opacidade.
 *
 * ONDA 2 (`--sm2-*`): o roxo continua vindo de `--sm-haunt-ink`/`--sm-haunt-veil`
 * porque a fundação nova NÃO tem par de assombro — e inventar um hex aqui é
 * exatamente o que este bloco documenta como o erro. Os dois tokens já existem
 * nos DOIS temas e já foram medidos (6,79:1 no claro, 7,63:1 no escuro). Quando
 * a fundação ganhar `--sm2-haunt-*`, esta é a única linha a trocar.
 */
const HAUNT_INK = 'var(--sm-haunt-ink)';
const HAUNT_VEIL = 'var(--sm-haunt-veil)';

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
           nada a ver com o assombro. Ver a nota em HAUNT_INK. */
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
              `radial-gradient(ellipse at 18% 50%, color-mix(in srgb, ${HAUNT_INK} 26%, transparent) 0%, transparent 68%)`,
          }}
        />
      )}

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
          style={{
            ...meta,
            position: 'relative',
            // A ÚNICA superfície que sobrou na faixa, e ela é informação: o véu
            // roxo é o "esmaecido" da tarefa assombrada. Fill de véu + tinta
            // cheia por cima — nunca `opacity`, que derruba o contraste de tudo.
            padding: '2px 8px',
            color: HAUNT_INK,
            backgroundColor: HAUNT_VEIL,
            fontWeight: 600,
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
          {/* A partícula quadrada pulsante (`sm-haunt-particle`) virou o glifo:
              `auto_awesome` diz "tem prêmio aqui" — que é a metade da mensagem
              que importa. Continua sem ícone de ALERTA, e continua roxo: isto é
              convite, não erro. A classe da animação sai junto, e com ela a
              única peça desta faixa que dependia de `prefers-reduced-motion`. */}
          <Icon name="auto_awesome" size={20} fill={1} />
          {isPt ? 'assombrada · +alívio' : 'haunted · +relief'}
        </span>
      )}
    </div>
  );
}

export default TaskMeta;
